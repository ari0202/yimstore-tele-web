-- supabase/migrations/20260622140000_fix_warranty_claim_rpc.sql

-- 1. Drop the vulnerable RPC overload
DROP FUNCTION IF EXISTS public.process_warranty_claim(uuid, uuid, text, uuid);

-- 2. Drop the existing string-based process_warranty_claim
DROP FUNCTION IF EXISTS public.process_warranty_claim(uuid);

-- 3. Create the unified, secure, atomic RPC returning JSONB
CREATE OR REPLACE FUNCTION public.process_warranty_claim(p_order_item_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
AS $function$
DECLARE
    v_item RECORD;
    v_new_inv_id UUID;
    v_valid_cooldown BOOLEAN;
    v_maintenance BOOLEAN;
    v_pending_claim_exists BOOLEAN;
    v_new_credential TEXT;
BEGIN
    -- Cek Global Kill-Switch
    SELECT (value = 'true') INTO v_maintenance FROM public.system_settings WHERE key = 'maintenance_mode';
    IF v_maintenance THEN 
        RETURN jsonb_build_object('status', 'MAINTENANCE_MODE'); 
    END IF;

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
    IF v_item.warranty_end_date < NOW() AND NOT v_pending_claim_exists THEN 
        RETURN jsonb_build_object('status', 'WARRANTY_EXPIRED'); 
    END IF;
    IF v_item.current_claim_count >= v_item.max_claim_limit AND NOT v_pending_claim_exists THEN 
        RETURN jsonb_build_object('status', 'LIMIT_EXCEEDED'); 
    END IF;

    -- Validasi Cooldown & Manual Override
    IF NOT v_pending_claim_exists THEN
        IF v_item.cooldown_bypass_active THEN
            -- Bypass aktif! Izinkan klaim dan segera matikan flag bypass-nya
            UPDATE public.order_items SET cooldown_bypass_active = false WHERE id = p_order_item_id;
        ELSE
            SELECT public.check_cooldown_validity(p_order_item_id) INTO v_valid_cooldown;
            IF NOT v_valid_cooldown THEN 
                RETURN jsonb_build_object('status', 'COOLDOWN_ACTIVE'); 
            END IF;
        END IF;
    END IF;

    -- Coba tarik stok baru (Skip Locked mencegah Race Condition!)
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
        RETURN jsonb_build_object('status', 'WAITLISTED'); 
    END IF;

    IF v_pending_claim_exists THEN
        UPDATE public.pending_claims SET status = 'fulfilled' WHERE order_item_id = p_order_item_id AND status = 'pending';
    ELSE
        UPDATE public.order_items SET current_claim_count = current_claim_count + 1 WHERE id = p_order_item_id;
    END IF;

    -- Cabut stok lama & pasang stok baru
    UPDATE public.inventory SET status = 'Revoked' WHERE id = v_item.inventory_id;
    UPDATE public.order_items SET inventory_id = v_new_inv_id WHERE id = p_order_item_id;
    
    INSERT INTO public.warranty_logs (order_item_id, old_inventory_id, new_inventory_id, delivery_status)
    VALUES (p_order_item_id, v_item.inventory_id, v_new_inv_id, 'completed');

    INSERT INTO public.outbox_events (event_type, payload, status)
    VALUES ('DELIVER_WARRANTY_CREDENTIAL', jsonb_build_object('order_item_id', p_order_item_id), 'pending');

    -- Ambil kredensial baru untuk real-time update
    SELECT credential_data INTO v_new_credential FROM public.inventory WHERE id = v_new_inv_id;

    RETURN jsonb_build_object('status', 'SUCCESS', 'new_credential', v_new_credential);
END;
$function$;
