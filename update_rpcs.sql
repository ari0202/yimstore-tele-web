CREATE OR REPLACE FUNCTION public.hold_inventory(p_product_id uuid)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_inv_id UUID;
    v_category_id UUID;
    v_is_sync_stock BOOLEAN;
BEGIN
    SELECT category_id, is_sync_stock INTO v_category_id, v_is_sync_stock FROM public.products WHERE id = p_product_id;

    IF v_is_sync_stock THEN
        SELECT id INTO v_inv_id FROM public.inventory
        WHERE category_id = v_category_id AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1;
    ELSE
        SELECT id INTO v_inv_id FROM public.inventory
        WHERE product_id = p_product_id AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1;
    END IF;

    IF v_inv_id IS NOT NULL THEN
        UPDATE public.inventory SET status = 'Hold', reserved_until = NOW() + INTERVAL '15 minutes' WHERE id = v_inv_id;
    END IF;

    RETURN v_inv_id;
END;
$function$;


CREATE OR REPLACE FUNCTION public.rpc_process_warranty_claim(p_order_item_id uuid, p_reason text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_order_item RECORD;
    v_product RECORD;
    v_new_inventory RECORD;
    v_last_claim_time TIMESTAMP;
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

    -- C. Fetch product details for cooldown rules
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
            RAISE EXCEPTION 'Cooldown active';
        END IF;
    END IF;

    -- F. Allocate new inventory securely (Updated to support sync_stock)
    IF v_product.is_sync_stock THEN
        SELECT * INTO v_new_inventory
        FROM public.inventory
        WHERE category_id = v_product.category_id AND status = 'Available'
        LIMIT 1 FOR UPDATE SKIP LOCKED;
    ELSE
        SELECT * INTO v_new_inventory
        FROM public.inventory
        WHERE product_id = v_order_item.product_id AND status = 'Available'
        LIMIT 1 FOR UPDATE SKIP LOCKED;
    END IF;

    IF NOT FOUND THEN
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
$function$;
