CREATE OR REPLACE FUNCTION public.process_payment_fulfillment(p_order_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_inventory_id UUID;
    v_fulfilled_count INT := 0;
    v_out_of_stock BOOLEAN := FALSE;
    v_parent_id UUID;
    v_w_days INT;
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

        -- Check if it already has a held inventory
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
            SELECT warranty_days INTO v_w_days FROM public.products WHERE id = v_item.product_id;
            UPDATE public.inventory SET status = 'Used', reserved_until = NULL WHERE id = v_inventory_id;
            UPDATE public.order_items 
            SET inventory_id = v_inventory_id,
                warranty_end_date = NOW() + (v_w_days || ' days')::INTERVAL
            WHERE id = v_item.id;
            
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
$function$;
