CREATE OR REPLACE FUNCTION public.rpc_process_warranty_claim(
    p_order_item_id UUID,
    p_reason TEXT
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_item RECORD;
    v_product RECORD;
    v_new_inventory RECORD;
    v_last_claim_time TIMESTAMP WITH TIME ZONE;
    v_cooldown_interval INTERVAL;
BEGIN
    -- A. Lock the specific order item and fetch details
    SELECT oi.*, i.product_id 
    INTO v_order_item
    FROM public.order_items oi
    JOIN public.inventory i ON oi.inventory_id = i.id
    WHERE oi.id = p_order_item_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order item not found';
    END IF;

    -- B. Verify active warranty duration
    IF NOW() > v_order_item.warranty_end_date THEN
        RAISE EXCEPTION 'Warranty expired';
    END IF;

    -- C. Fetch product details for cooldown rules and sync_stock
    SELECT * INTO v_product
    FROM public.products
    WHERE id = v_order_item.product_id;

    -- D. Check claim limit atomically against snapshotted column
    IF v_order_item.current_claim_count >= v_order_item.max_claim_limit THEN
        RAISE EXCEPTION 'Claim limit reached';
    END IF;

    -- E. Check Cooldown atomically using warranty_logs
    SELECT claimed_at INTO v_last_claim_time
    FROM public.warranty_logs
    WHERE order_item_id = p_order_item_id
    ORDER BY claimed_at DESC LIMIT 1;

    IF v_last_claim_time IS NOT NULL AND v_product.cooldown_value > 0 THEN
        v_cooldown_interval := (v_product.cooldown_value || ' ' || v_product.cooldown_unit)::INTERVAL;
        IF NOW() < (v_last_claim_time + v_cooldown_interval) THEN
            RAISE EXCEPTION 'Cooldown active|%', (v_last_claim_time + v_cooldown_interval);
        END IF;
    END IF;

    -- F. Allocate new inventory securely (support is_sync_stock and parent fallback)
    -- 1. Attempt category sync stock first if enabled
    IF v_product.is_sync_stock AND v_product.category_id IS NOT NULL THEN
        SELECT * INTO v_new_inventory FROM public.inventory 
        WHERE category_id = v_product.category_id AND product_id IS NULL AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1;
    END IF;

    -- 2. Attempt exact variation stock if not found
    IF v_new_inventory IS NULL THEN
        SELECT * INTO v_new_inventory FROM public.inventory 
        WHERE product_id = v_order_item.product_id AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1;
    END IF;

    -- 3. Fallback to parent stock if not found
    IF v_new_inventory IS NULL AND v_product.parent_id IS NOT NULL THEN
        SELECT * INTO v_new_inventory FROM public.inventory 
        WHERE product_id = v_product.parent_id AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1;
    END IF;

    IF v_new_inventory IS NULL THEN
        RAISE EXCEPTION 'No replacement inventory available';
    END IF;

    -- G. Revoke old inventory
    UPDATE public.inventory SET status = 'Revoked' WHERE id = v_order_item.inventory_id;

    -- H. Mark new inventory as used
    UPDATE public.inventory SET status = 'Used' WHERE id = v_new_inventory.id;

    -- I. Update order item
    UPDATE public.order_items 
    SET inventory_id = v_new_inventory.id,
        current_claim_count = current_claim_count + 1
    WHERE id = v_order_item.id;

    -- J. Log claim correctly in warranty_logs with reason
    INSERT INTO public.warranty_logs (order_item_id, old_inventory_id, new_inventory_id, reason)
    VALUES (p_order_item_id, v_order_item.inventory_id, v_new_inventory.id, p_reason);

    RETURN json_build_object(
        'success', true,
        'new_credential', v_new_inventory.credential_data
    );
END;
$$;
