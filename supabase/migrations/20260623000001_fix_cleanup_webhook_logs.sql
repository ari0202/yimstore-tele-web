-- supabase/migrations/20260623000001_fix_cleanup_webhook_logs.sql

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

    -- Clear rate limits older than 1 day
    DELETE FROM public.login_attempts WHERE last_attempt < NOW() - INTERVAL '1 day';

    -- Clear expired sessions
    DELETE FROM public.admin_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
