-- supabase/migrations/20260624000001_inventory_hierarchy_rpcs.sql

-- 1. Update hold_inventory to use PL/pgSQL dual queries for fallback to parent inventory
CREATE OR REPLACE FUNCTION hold_inventory(p_product_id UUID) RETURNS UUID AS $$
DECLARE 
    v_inv_id UUID;
    v_parent_id UUID;
BEGIN
    -- Attempt exact variation stock first
    SELECT id INTO v_inv_id FROM public.inventory 
    WHERE product_id = p_product_id AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1;

    -- Fallback to parent stock if not found
    IF v_inv_id IS NULL THEN
        SELECT parent_id INTO v_parent_id FROM public.products WHERE id = p_product_id;
        IF v_parent_id IS NOT NULL THEN
            SELECT id INTO v_inv_id FROM public.inventory 
            WHERE product_id = v_parent_id AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1;
        END IF;
    END IF;

    IF v_inv_id IS NOT NULL THEN
        UPDATE public.inventory SET status = 'Hold', reserved_until = NOW() + INTERVAL '15 minutes' WHERE id = v_inv_id;
    END IF;

    RETURN v_inv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Update process_payment_fulfillment to use dual queries
CREATE OR REPLACE FUNCTION process_payment_fulfillment(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_inventory_id UUID;
    v_fulfilled_count INT := 0;
    v_out_of_stock BOOLEAN := FALSE;
    v_parent_id UUID;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- Block duplicates
    IF v_order.payment_status = 'paid' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Order already processed');
    END IF;

    UPDATE public.orders SET payment_status = 'paid' WHERE id = p_order_id;

    FOR v_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id LOOP
        v_inventory_id := NULL;

        -- Check if it already has a held inventory (idempotency/hold consumption)
        -- In our new flow, order_items.inventory_id might be set during checkout (hold).
        IF v_item.inventory_id IS NOT NULL THEN
            SELECT id INTO v_inventory_id FROM public.inventory 
            WHERE id = v_item.inventory_id AND status = 'Hold' FOR UPDATE SKIP LOCKED;
        END IF;

        IF v_inventory_id IS NULL THEN
            -- Attempt exact variation stock first
            SELECT id INTO v_inventory_id FROM public.inventory 
            WHERE product_id = v_item.product_id AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1;

            -- Fallback to parent stock if not found
            IF v_inventory_id IS NULL THEN
                SELECT parent_id INTO v_parent_id FROM public.products WHERE id = v_item.product_id;
                IF v_parent_id IS NOT NULL THEN
                    SELECT id INTO v_inventory_id FROM public.inventory 
                    WHERE product_id = v_parent_id AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1;
                END IF;
            END IF;
        END IF;

        IF v_inventory_id IS NOT NULL THEN
            UPDATE public.inventory SET status = 'Used', reserved_until = NULL WHERE id = v_inventory_id;
            UPDATE public.order_items SET inventory_id = v_inventory_id WHERE id = v_item.id;
            v_fulfilled_count := v_fulfilled_count + 1;
        ELSE
            v_out_of_stock := TRUE;
        END IF;
    END LOOP;

    IF v_out_of_stock THEN
        UPDATE public.orders SET delivery_status = 'needs_manual_refund' WHERE id = p_order_id;
        
        INSERT INTO public.outbox_events (event_type, payload, status)
        VALUES (
            'ADMIN_ALERT_NEEDS_REFUND',
            jsonb_build_object('order_id', p_order_id, 'reason', 'Late payment arrived but stock is depleted.'),
            'pending'
        );
        
        RETURN jsonb_build_object('success', false, 'error', 'NEEDS_REFUND', 'fulfilled_items', v_fulfilled_count);
    END IF;

    INSERT INTO public.outbox_events (event_type, payload, status) VALUES 
        ('DELIVER_CREDENTIALS', jsonb_build_object('order_id', p_order_id), 'pending'),
        ('BROADCAST_TESTIMONIAL', jsonb_build_object('order_id', p_order_id), 'pending');

    RETURN jsonb_build_object('success', true, 'fulfilled_items', v_fulfilled_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Update rpc_claim_inventory to use dual queries
CREATE OR REPLACE FUNCTION rpc_claim_inventory(p_order_item_id UUID) RETURNS JSONB AS $$
DECLARE 
    v_item RECORD;
    v_new_inv_id UUID;
    v_pending_claim_exists BOOLEAN;
    v_parent_id UUID;
BEGIN
    SELECT oi.id, oi.inventory_id, oi.current_claim_count, oi.warranty_end_date, oi.order_id, oi.product_id,
           COALESCE(p.max_claim_limit, 0) as max_claim_limit, 
           COALESCE(p.cooldown_value, 0) as cooldown_value, 
           p.cooldown_unit, 
           i.status as inv_status
    INTO v_item
    FROM public.order_items oi
    JOIN public.products p ON oi.product_id = p.id
    JOIN public.inventory i ON oi.inventory_id = i.id
    WHERE oi.id = p_order_item_id FOR UPDATE OF oi;

    IF NOT FOUND THEN RETURN jsonb_build_object('status', 'ERROR', 'message', 'Order item not found'); END IF;
    IF v_item.warranty_end_date < NOW() THEN RETURN jsonb_build_object('status', 'REJECTED', 'reason', 'Warranty expired'); END IF;
    IF v_item.max_claim_limit > 0 AND v_item.current_claim_count >= v_item.max_claim_limit THEN RETURN jsonb_build_object('status', 'REJECTED', 'reason', 'Claim limit reached'); END IF;
    IF v_item.inv_status = 'Revoked' THEN RETURN jsonb_build_object('status', 'REJECTED', 'reason', 'Inventory already revoked'); END IF;

    -- Attempt exact variation stock first
    SELECT id INTO v_new_inv_id FROM public.inventory 
    WHERE product_id = v_item.product_id AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1;

    -- Fallback to parent stock if not found
    IF v_new_inv_id IS NULL THEN
        SELECT parent_id INTO v_parent_id FROM public.products WHERE id = v_item.product_id;
        IF v_parent_id IS NOT NULL THEN
            SELECT id INTO v_new_inv_id FROM public.inventory 
            WHERE product_id = v_parent_id AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1;
        END IF;
    END IF;

    SELECT EXISTS (SELECT 1 FROM public.pending_claims WHERE order_item_id = p_order_item_id) INTO v_pending_claim_exists;

    IF v_new_inv_id IS NULL THEN 
        IF NOT v_pending_claim_exists THEN
            INSERT INTO public.pending_claims (order_item_id) VALUES (p_order_item_id);
            UPDATE public.order_items SET current_claim_count = current_claim_count + 1 WHERE id = p_order_item_id;
        END IF;
        INSERT INTO public.outbox_events (event_type, payload, status) VALUES ('ADMIN_ALERT', jsonb_build_object('message', 'Stock empty for claim', 'order_item_id', p_order_item_id), 'pending');
        RETURN jsonb_build_object('status', 'WAITLISTED');
    END IF;

    UPDATE public.inventory SET status = 'Used', reserved_until = NULL WHERE id = v_new_inv_id;
    UPDATE public.inventory SET status = 'Revoked' WHERE id = v_item.inventory_id;
    UPDATE public.order_items SET inventory_id = v_new_inv_id WHERE id = p_order_item_id;

    IF NOT v_pending_claim_exists THEN
        UPDATE public.order_items SET current_claim_count = current_claim_count + 1 WHERE id = p_order_item_id;
    ELSE
        DELETE FROM public.pending_claims WHERE order_item_id = p_order_item_id;
    END IF;

    INSERT INTO public.warranty_logs (order_item_id, old_inventory_id, new_inventory_id, delivery_status)
    VALUES (p_order_item_id, v_item.inventory_id, v_new_inv_id, 'completed');

    RETURN jsonb_build_object('status', 'SUCCESS', 'new_inventory_id', v_new_inv_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Create RPC to calculate variation stock properly
CREATE OR REPLACE FUNCTION rpc_get_variation_stock(p_variation_id UUID) RETURNS INTEGER AS $$
DECLARE
    v_variation_stock INTEGER;
    v_parent_id UUID;
    v_parent_stock INTEGER := 0;
BEGIN
    SELECT count(*) INTO v_variation_stock FROM public.inventory WHERE product_id = p_variation_id AND status = 'Available';
    
    SELECT parent_id INTO v_parent_id FROM public.products WHERE id = p_variation_id;
    IF v_parent_id IS NOT NULL THEN
        SELECT count(*) INTO v_parent_stock FROM public.inventory WHERE product_id = v_parent_id AND status = 'Available';
    END IF;
    
    RETURN v_variation_stock + v_parent_stock;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
