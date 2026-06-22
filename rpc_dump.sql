CREATE OR REPLACE FUNCTION public.process_warranty_claim(p_order_item_id uuid)
 RETURNS character varying
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_item RECORD;
    v_new_inv_id UUID;
    v_valid_cooldown BOOLEAN;
    v_maintenance BOOLEAN;
    v_pending_claim_exists BOOLEAN;
BEGIN
    -- Cek Global Kill-Switch
    SELECT (value = 'true') INTO v_maintenance FROM public.system_settings WHERE key = 'maintenance_mode';
    IF v_maintenance THEN RETURN 'MAINTENANCE_MODE'; END IF;

    -- Lock order_item
    SELECT oi.id, oi.inventory_id, oi.current_claim_count, oi.warranty_end_date, oi.order_id, oi.cooldown_bypass_active,
           i.product_id, p.max_claim_limit
    INTO v_item
    FROM public.order_items oi
    JOIN public.inventory i ON oi.inventory_id = i.id
    JOIN public.products p ON i.product_id = p.id
    WHERE oi.id = p_order_item_id FOR UPDATE OF oi;

    -- Cek status antrean pending
    SELECT EXISTS(SELECT 1 FROM public.pending_claims WHERE order_item_id = p_order_item_id AND status = 'pending') INTO v_pending_claim_exists;
    
    -- Validasi Garansi (bypass jika sudah masuk daftar antrean pending)
    IF v_item.warranty_end_date < NOW() AND NOT v_pending_claim_exists THEN RETURN 'WARRANTY_EXPIRED'; END IF;
    IF v_item.current_claim_count >= v_item.max_claim_limit AND NOT v_pending_claim_exists THEN RETURN 'LIMIT_REACHED'; END IF;

    -- Validasi Cooldown & Manual Override
    IF NOT v_pending_claim_exists THEN
        IF v_item.cooldown_bypass_active THEN
            -- Bypass aktif! Izinkan klaim dan segera matikan flag bypass-nya
            UPDATE public.order_items SET cooldown_bypass_active = false WHERE id = p_order_item_id;
        ELSE
            SELECT public.check_cooldown_validity(p_order_item_id) INTO v_valid_cooldown;
            IF NOT v_valid_cooldown THEN RETURN 'COOLDOWN_ACTIVE'; END IF;
        END IF;
    END IF;

    -- Coba tarik stok baru
    UPDATE public.inventory SET status = 'Used', reserved_until = NULL 
    WHERE id = (SELECT id FROM public.inventory WHERE product_id = v_item.product_id AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1) 
    RETURNING id INTO v_new_inv_id;

    IF v_new_inv_id IS NULL THEN 
        -- Jika stok kosong, buat antrean pending untuk membekukan waktu garansi
        IF NOT v_pending_claim_exists THEN
            INSERT INTO public.pending_claims (order_item_id) VALUES (p_order_item_id);
            UPDATE public.order_items SET current_claim_count = current_claim_count + 1 WHERE id = p_order_item_id;
        END IF;

        -- Injeksi Admin Alert dengan Debouncing
        INSERT INTO public.outbox_events (event_type, payload, status)
        SELECT 'ADMIN_ALERT_OUT_OF_STOCK', jsonb_build_object('product_id', v_item.product_id), 'pending'
        WHERE NOT EXISTS (
            SELECT 1 FROM public.outbox_events 
            WHERE event_type = 'ADMIN_ALERT_OUT_OF_STOCK' 
              AND payload->>'product_id' = v_item.product_id::text 
              AND status = 'pending'
        );
        RETURN 'OUT_OF_STOCK'; 
    END IF;

    IF v_pending_claim_exists THEN
        UPDATE public.pending_claims SET status = 'fulfilled' WHERE order_item_id = p_order_item_id AND status = 'pending';
    ELSE
        UPDATE public.order_items SET current_claim_count = current_claim_count + 1 WHERE id = p_order_item_id;
    END IF;

    -- Cabut stok lama & pasang stok baru
    UPDATE public.inventory SET status = 'Revoked' WHERE id = v_item.inventory_id;
    UPDATE public.order_items SET inventory_id = v_new_inv_id WHERE id = p_order_item_id;
    
    INSERT INTO public.warranty_logs (order_item_id, old_inventory_id, new_inventory_id)
    VALUES (p_order_item_id, v_item.inventory_id, v_new_inv_id);

    INSERT INTO public.outbox_events (event_type, payload, status)
    VALUES ('DELIVER_WARRANTY_CREDENTIAL', jsonb_build_object('order_item_id', p_order_item_id), 'pending');

    RETURN 'SUCCESS';
END;
$function$;

CREATE OR REPLACE FUNCTION public.process_warranty_claim(p_order_id uuid, p_order_item_id uuid, p_reason text, p_user_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_order_item RECORD;
    v_product RECORD;
    v_new_inventory_id UUID;
    v_claim_id UUID;
BEGIN
    -- Verify ownership and get item
    SELECT oi.* INTO v_order_item
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = p_order_item_id AND o.id = p_order_id AND o.user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Item not found or unauthorized');
    END IF;

    -- Check warranty validity
    SELECT * INTO v_product FROM public.products WHERE id = v_order_item.product_id;
    IF v_order_item.created_at + (v_product.warranty_hours || ' hours')::INTERVAL < NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Warranty expired');
    END IF;

    -- Attempt to get replacement stock instantly (SKIP LOCKED)
    SELECT id INTO v_new_inventory_id
    FROM public.inventory
    WHERE product_id = v_order_item.product_id AND status = 'Available'
    LIMIT 1 FOR UPDATE SKIP LOCKED;

    IF FOUND THEN
        -- Replacement found! Revoke old, assign new
        UPDATE public.inventory SET status = 'Revoked' WHERE id = v_order_item.inventory_id;
        UPDATE public.inventory SET status = 'Used' WHERE id = v_new_inventory_id;
        UPDATE public.order_items SET inventory_id = v_new_inventory_id WHERE id = p_order_item_id;

        -- Log claim as Approved
        INSERT INTO public.warranty_claims (order_item_id, old_inventory_id, new_inventory_id, reason, status)
        VALUES (p_order_item_id, v_order_item.inventory_id, v_new_inventory_id, p_reason, 'Approved');

        RETURN jsonb_build_object('success', true, 'message', 'Replacement assigned instantly');
    ELSE
        -- No stock! Queue the claim. DO NOT REVOKE the old stock yet.
        INSERT INTO public.warranty_claims (order_item_id, old_inventory_id, reason, status)
        VALUES (p_order_item_id, v_order_item.inventory_id, p_reason, 'Pending')
        RETURNING id INTO v_claim_id;

        INSERT INTO public.pending_claims (claim_id, product_id)
        VALUES (v_claim_id, v_order_item.product_id);

        RETURN jsonb_build_object('success', true, 'message', 'Awaiting Restock', 'queued', true);
    END IF;
END;
$function$

