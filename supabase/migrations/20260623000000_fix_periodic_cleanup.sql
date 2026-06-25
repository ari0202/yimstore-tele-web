-- supabase/migrations/20260623000000_fix_periodic_cleanup.sql

-- 1. Schema Expansion & Constraints
ALTER TABLE public.order_items ALTER COLUMN inventory_id DROP NOT NULL;
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id);
UPDATE public.order_items oi SET product_id = i.product_id FROM public.inventory i WHERE oi.inventory_id = i.id AND oi.product_id IS NULL;
-- Handle cases where product_id is still NULL (e.g. bad data) before setting NOT NULL
DELETE FROM public.order_items WHERE product_id IS NULL;
ALTER TABLE public.order_items ALTER COLUMN product_id SET NOT NULL;

ALTER TABLE public.outbox_events ADD COLUMN IF NOT EXISTS next_retry_at TIMESTAMPTZ DEFAULT NOW();
CREATE INDEX IF NOT EXISTS idx_outbox_queue ON public.outbox_events (next_retry_at) WHERE status IN ('pending', 'processing');

-- 2. Safe Periodic Cleanup (Freeing Abandoned Holds & Poison Pill Sweeper)
CREATE OR REPLACE FUNCTION system_periodic_cleanup()
RETURNS VOID AS $$
BEGIN
    -- Cancel pending orders older than 15 minutes that have held inventory
    UPDATE public.orders o
    SET payment_status = 'expired'
    WHERE payment_status = 'pending' AND id IN (
        SELECT o2.id FROM public.orders o2
        JOIN public.order_items oi ON o2.id = oi.order_id
        JOIN public.inventory i ON oi.inventory_id = i.id
        WHERE i.status = 'Hold' AND i.reserved_until < NOW()
        FOR UPDATE OF o2 SKIP LOCKED
    );

    -- Nullify inventory_id in order_items for expired orders to prevent data leaks
    UPDATE public.order_items
    SET inventory_id = NULL
    WHERE inventory_id IS NOT NULL AND order_id IN (
        SELECT id FROM public.orders WHERE payment_status = 'expired' FOR UPDATE SKIP LOCKED
    );

    -- Release the actual inventory holds
    UPDATE public.inventory
    SET status = 'Available', reserved_until = NULL
    WHERE status = 'Hold' AND reserved_until < NOW()
    AND id IN (
        SELECT id FROM public.inventory WHERE status = 'Hold' AND reserved_until < NOW() FOR UPDATE SKIP LOCKED
    );

    -- Sweep ALL poison pills directly into DLQ via SQL with formatted payloads
    WITH dead_letters AS (
        UPDATE public.outbox_events 
        SET status = 'failed', updated_at = NOW()
        WHERE status = 'processing' 
          AND updated_at < NOW() - INTERVAL '5 minutes' 
          AND retry_count >= 3
        RETURNING id, event_type, payload
    )
    -- Only inject alerts for standard events, ignore cascading alert failures
    INSERT INTO public.outbox_events (event_type, payload, status)
    SELECT 
        'ADMIN_ALERT_FAILED_DELIVERY', 
        jsonb_build_object(
            'error_reason', 'Poison pill delivery crashed', 
            'original_event', event_type, 
            'original_payload', payload
        ), 
        'pending' 
    FROM dead_letters
    WHERE event_type != 'ADMIN_ALERT_FAILED_DELIVERY';

    -- Delete old webhook logs (keep last 7 days)
    DELETE FROM public.webhook_logs WHERE created_at < NOW() - INTERVAL '7 days';

    -- Clear rate limits older than 1 day
    DELETE FROM public.login_attempts WHERE last_attempt < NOW() - INTERVAL '1 day';

    -- Clear expired sessions
    DELETE FROM public.admin_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Queue Poller for healthy & recoverable events
CREATE OR REPLACE FUNCTION get_pending_outbox_events(batch_size INTEGER) 
RETURNS SETOF public.outbox_events AS $$
BEGIN
    RETURN QUERY UPDATE public.outbox_events 
    SET status = 'processing', 
        updated_at = NOW(),
        retry_count = CASE WHEN status = 'processing' THEN retry_count + 1 ELSE retry_count END
    WHERE id IN (
        SELECT id FROM public.outbox_events
        WHERE retry_count < 3 AND (
            (status = 'pending' AND next_retry_at <= NOW()) 
            OR (status = 'processing' AND updated_at < NOW() - INTERVAL '5 minutes')
        )
        ORDER BY next_retry_at ASC FOR UPDATE SKIP LOCKED LIMIT batch_size
    ) RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Process Payment Fulfillment with Late Webhook Resilience
CREATE OR REPLACE FUNCTION process_payment_fulfillment(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_inventory_id UUID;
    v_fulfilled_count INT := 0;
    v_out_of_stock BOOLEAN := FALSE;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    -- Block duplicates
    IF v_order.payment_status = 'paid' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Order already processed');
    END IF;

    -- Update order status strictly to 'paid' for idempotency
    UPDATE public.orders SET payment_status = 'paid' WHERE id = p_order_id;

    -- Process each item (now relying on product_id)
    FOR v_item IN SELECT * FROM public.order_items WHERE order_id = p_order_id LOOP
        -- Attempt to lock and assign available inventory (SKIP LOCKED for concurrent flash sales)
        SELECT id INTO v_inventory_id 
        FROM public.inventory 
        WHERE product_id = v_item.product_id AND status = 'Available' 
        LIMIT 1 FOR UPDATE SKIP LOCKED;

        IF FOUND THEN
            -- Assign inventory
            UPDATE public.inventory SET status = 'Used' WHERE id = v_inventory_id;
            UPDATE public.order_items SET inventory_id = v_inventory_id WHERE id = v_item.id;
            v_fulfilled_count := v_fulfilled_count + 1;
        ELSE
            -- Out of stock for this item!
            v_out_of_stock := TRUE;
        END IF;
    END LOOP;

    IF v_out_of_stock THEN
        -- Strictly update delivery_status to standardized enum
        UPDATE public.orders SET delivery_status = 'needs_manual_refund' WHERE id = p_order_id;
        
        -- Inject an admin alert into the outbox
        INSERT INTO public.outbox_events (event_type, payload, status)
        VALUES (
            'ADMIN_ALERT_NEEDS_REFUND',
            jsonb_build_object('order_id', p_order_id, 'reason', 'Late payment arrived but stock is depleted.'),
            'pending'
        );
        
        RETURN jsonb_build_object('success', false, 'error', 'NEEDS_REFUND', 'fulfilled_items', v_fulfilled_count);
    END IF;

    -- Also, we need to ensure outbox events for delivery are triggered just like phase 2
    -- Let's inject them here or relies on the API?
    -- Wait, the original Phase 2 process_payment_fulfillment did:
    -- INSERT INTO public.outbox_events (event_type, payload, status) VALUES 
    -- ('DELIVER_CREDENTIALS', jsonb_build_object('order_id', p_order_id), 'pending'),
    -- ('BROADCAST_TESTIMONIAL', jsonb_build_object('order_id', p_order_id), 'pending');
    
    INSERT INTO public.outbox_events (event_type, payload, status) VALUES 
        ('DELIVER_CREDENTIALS', jsonb_build_object('order_id', p_order_id), 'pending'),
        ('BROADCAST_TESTIMONIAL', jsonb_build_object('order_id', p_order_id), 'pending');

    RETURN jsonb_build_object('success', true, 'fulfilled_items', v_fulfilled_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
