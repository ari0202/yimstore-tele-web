-- supabase/migrations/20260625000002_fix_sync_stock_rpcs.sql

-- 1. Update hold_inventory to support category sync stock
CREATE OR REPLACE FUNCTION hold_inventory(p_product_id UUID) RETURNS UUID AS $$
DECLARE 
    v_inv_id UUID;
    v_parent_id UUID;
    v_category_id UUID;
    v_is_sync_stock BOOLEAN;
BEGIN
    SELECT category_id, is_sync_stock INTO v_category_id, v_is_sync_stock FROM public.products WHERE id = p_product_id;

    -- Attempt category sync stock first if enabled
    IF v_is_sync_stock AND v_category_id IS NOT NULL THEN
        SELECT id INTO v_inv_id FROM public.inventory 
        WHERE category_id = v_category_id AND product_id IS NULL AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1;
    END IF;

    -- Attempt exact variation stock if not found or not synced
    IF v_inv_id IS NULL THEN
        SELECT id INTO v_inv_id FROM public.inventory 
        WHERE product_id = p_product_id AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1;
    END IF;

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


-- 2. Update process_payment_fulfillment to support category sync stock
CREATE OR REPLACE FUNCTION process_payment_fulfillment(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_inventory_id UUID;
    v_fulfilled_count INT := 0;
    v_out_of_stock BOOLEAN := FALSE;
    v_parent_id UUID;
    v_category_id UUID;
    v_is_sync_stock BOOLEAN;
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
        IF v_item.inventory_id IS NOT NULL THEN
            SELECT id INTO v_inventory_id FROM public.inventory 
            WHERE id = v_item.inventory_id AND status = 'Hold' FOR UPDATE SKIP LOCKED;
        END IF;

        IF v_inventory_id IS NULL THEN
            SELECT category_id, is_sync_stock INTO v_category_id, v_is_sync_stock FROM public.products WHERE id = v_item.product_id;
            
            -- Attempt category sync stock first if enabled
            IF v_is_sync_stock AND v_category_id IS NOT NULL THEN
                SELECT id INTO v_inventory_id FROM public.inventory 
                WHERE category_id = v_category_id AND product_id IS NULL AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1;
            END IF;

            -- Attempt exact variation stock if not found
            IF v_inventory_id IS NULL THEN
                SELECT id INTO v_inventory_id FROM public.inventory 
                WHERE product_id = v_item.product_id AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1;
            END IF;

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

    UPDATE public.orders SET delivery_status = 'delivered' WHERE id = p_order_id;

    INSERT INTO public.outbox_events (event_type, payload, status)
    VALUES (
        'TELEGRAM_SEND_CREDENTIALS',
        jsonb_build_object('order_id', p_order_id, 'telegram_chat_id', v_order.telegram_chat_id),
        'pending'
    );

    RETURN jsonb_build_object('success', true, 'fulfilled_items', v_fulfilled_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
