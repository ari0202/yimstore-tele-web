-- supabase/migrations/20260622120001_atomic_claim_rpc.sql
DROP FUNCTION IF EXISTS process_warranty_claim(uuid);

CREATE OR REPLACE FUNCTION process_warranty_claim(p_order_item_id UUID) 
RETURNS JSONB AS $$
DECLARE
    v_item RECORD;
    v_new_inv_id UUID;
    v_last_claim TIMESTAMPTZ;
    v_credential TEXT;
BEGIN
    SELECT oi.*, p.cooldown_value, p.cooldown_unit, p.max_claim_limit, i.product_id, i.id as old_inv_id
    INTO v_item 
    FROM public.order_items oi
    JOIN public.inventory i ON oi.inventory_id = i.id
    JOIN public.products p ON i.product_id = p.id
    WHERE oi.id = p_order_item_id FOR UPDATE;

    IF v_item.current_claim_count >= v_item.max_claim_limit THEN RETURN jsonb_build_object('status', 'LIMIT_EXCEEDED'); END IF;

    SELECT claimed_at INTO v_last_claim FROM public.warranty_logs 
    WHERE order_item_id = p_order_item_id ORDER BY claimed_at DESC LIMIT 1;

    IF v_last_claim IS NOT NULL AND v_last_claim + (v_item.cooldown_value || ' ' || v_item.cooldown_unit)::INTERVAL > NOW() THEN
        RETURN jsonb_build_object('status', 'COOLDOWN_ACTIVE');
    END IF;

    -- Fetch replacement stock
    UPDATE public.inventory SET status = 'Used' 
    WHERE id = (SELECT id FROM public.inventory WHERE product_id = v_item.product_id AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1)
    RETURNING id INTO v_new_inv_id;

    IF v_new_inv_id IS NULL THEN
        INSERT INTO public.warranty_logs (order_item_id, delivery_status) VALUES (p_order_item_id, 'needs_manual_fulfillment');
        INSERT INTO public.outbox_events (event_type, payload, status) VALUES ('ADMIN_ALERT', jsonb_build_object('message', 'Stock empty for claim', 'order_item_id', p_order_item_id), 'pending');
        RETURN jsonb_build_object('status', 'WAITLISTED');
    END IF;

    -- Revoke old inventory
    UPDATE public.inventory SET status = 'Revoked' WHERE id = v_item.old_inv_id;
    
    UPDATE public.order_items SET inventory_id = v_new_inv_id, current_claim_count = current_claim_count + 1 WHERE id = p_order_item_id;
    INSERT INTO public.warranty_logs (order_item_id, old_inventory_id, new_inventory_id, delivery_status) 
    VALUES (p_order_item_id, v_item.old_inv_id, v_new_inv_id, 'completed');

    -- Get credential data
    SELECT credential_data INTO v_credential FROM public.inventory WHERE id = v_new_inv_id;

    RETURN jsonb_build_object('status', 'SUCCESS', 'new_credential', v_credential);
END;
$$ LANGUAGE plpgsql;
