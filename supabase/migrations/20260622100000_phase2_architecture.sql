-- 1. Tambahkan Constraint & Status
ALTER TABLE public.outbox_events ADD COLUMN IF NOT EXISTS transaction_id VARCHAR(255) UNIQUE;
ALTER TABLE public.outbox_events ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0;
ALTER TYPE inventory_status_enum ADD VALUE IF NOT EXISTS 'Needs Manual Refund';

-- 2. RPC: Lock and Get Pending Outbox Events
CREATE OR REPLACE FUNCTION get_pending_outbox_events(batch_size INTEGER) RETURNS SETOF public.outbox_events AS $$
BEGIN
    RETURN QUERY UPDATE public.outbox_events SET status = 'processing', updated_at = NOW()
    WHERE id IN (
        SELECT id FROM public.outbox_events
        WHERE status = 'pending' OR (status = 'processing' AND updated_at < NOW() - INTERVAL '5 minutes')
        ORDER BY created_at ASC FOR UPDATE SKIP LOCKED LIMIT batch_size
    ) RETURNING *;
END;
$$ LANGUAGE plpgsql;

-- 3. RPC: System Cleanup (Deadlock-Free & Dead Letter Queue Preservation)
CREATE OR REPLACE FUNCTION system_periodic_cleanup() RETURNS INTEGER AS $$
DECLARE released_count INTEGER;
BEGIN
    -- Expire pesanan aman dari Deadlock (Lock Orders First)
    UPDATE public.orders SET payment_status = 'EXPIRED'
    WHERE id IN (
        SELECT o.id FROM public.orders o
        JOIN public.order_items oi ON o.id = oi.order_id
        JOIN public.inventory i ON oi.inventory_id = i.id
        WHERE i.status = 'Hold' AND i.reserved_until < NOW() AND o.payment_status = 'pending'
        FOR UPDATE OF o SKIP LOCKED
    );

    -- Release inventory
    WITH released AS (
        UPDATE public.inventory SET status = 'Available', reserved_until = NULL 
        WHERE id IN (
            SELECT id FROM public.inventory WHERE status = 'Hold' AND reserved_until < NOW() FOR UPDATE SKIP LOCKED
        ) RETURNING id
    ) SELECT count(*) INTO released_count FROM released;

    -- Prune Outbox events (HANYA 'completed'. Biarkan 'failed' sebagai Log Audit Ops)
    DELETE FROM public.outbox_events WHERE status = 'completed' AND updated_at < NOW() - INTERVAL '7 days';

    RETURN released_count;
END;
$$ LANGUAGE plpgsql;

-- 4. RPC: Atomically Hold Inventory
CREATE OR REPLACE FUNCTION hold_inventory(p_product_id UUID) RETURNS UUID AS $$
DECLARE v_inv_id UUID;
BEGIN
    UPDATE public.inventory SET status = 'Hold', reserved_until = NOW() + INTERVAL '15 minutes' WHERE id = (SELECT id FROM public.inventory WHERE product_id = p_product_id AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1) RETURNING id INTO v_inv_id;
    RETURN v_inv_id;
END;
$$ LANGUAGE plpgsql;

-- 5. RPC: All-Or-Nothing Payment Fulfillment (Multi-Item Cart & State Machine Fixes)
CREATE OR REPLACE FUNCTION process_payment_fulfillment(p_order_id UUID, p_amount DECIMAL) RETURNS VARCHAR AS $$
DECLARE 
    v_total_amount DECIMAL; v_status VARCHAR; v_item RECORD; v_new_inv_id UUID;
BEGIN
    -- Verifikasi Order (Mengizinkan pemulihan dari 'Amount Mismatch')
    SELECT total_amount, payment_status INTO v_total_amount, v_status FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF v_status NOT IN ('pending', 'EXPIRED', 'Amount Mismatch') THEN 
        RETURN 'DUPLICATE'; 
    END IF;
    IF v_total_amount <> p_amount THEN
        UPDATE public.orders SET payment_status = 'Amount Mismatch' WHERE id = p_order_id;
        RETURN 'AMOUNT_MISMATCH';
    END IF;

    -- Iterasi Seluruh Item di Keranjang (Mendukung Multi-Item Checkout)
    FOR v_item IN (
        SELECT oi.id as order_item_id, oi.inventory_id, i.status as inv_status, i.product_id, p.warranty_days 
        FROM public.order_items oi 
        JOIN public.inventory i ON oi.inventory_id = i.id 
        JOIN public.products p ON i.product_id = p.id
        WHERE oi.order_id = p_order_id FOR UPDATE OF i
    ) LOOP
        -- Fallback & Eksekusi Per Item
        IF v_item.inv_status <> 'Hold' THEN
            UPDATE public.inventory SET status = 'Used', reserved_until = NULL 
            WHERE id = (SELECT id FROM public.inventory WHERE product_id = v_item.product_id AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1) 
            RETURNING id INTO v_new_inv_id;
            
            IF v_new_inv_id IS NULL THEN
                -- Jika salah satu item kehabisan stok
                UPDATE public.orders SET payment_status = 'PAID', delivery_status = 'Needs Manual Refund' WHERE id = p_order_id;
                RETURN 'NEEDS_REFUND';
            END IF;
            
            UPDATE public.order_items SET inventory_id = v_new_inv_id, warranty_end_date = NOW() + (v_item.warranty_days || ' days')::INTERVAL WHERE id = v_item.order_item_id;
        ELSE
            UPDATE public.inventory SET status = 'Used', reserved_until = NULL WHERE id = v_item.inventory_id;
            UPDATE public.order_items SET warranty_end_date = NOW() + (v_item.warranty_days || ' days')::INTERVAL WHERE id = v_item.order_item_id;
        END IF;
    END LOOP;

    -- Update Order Status Keseluruhan
    UPDATE public.orders SET payment_status = 'PAID' WHERE id = p_order_id;

    -- Atomic Outbox Injection
    INSERT INTO public.outbox_events (event_type, payload, status) VALUES 
        ('DELIVER_CREDENTIALS', jsonb_build_object('order_id', p_order_id), 'pending'),
        ('BROADCAST_TESTIMONIAL', jsonb_build_object('order_id', p_order_id), 'pending');

    RETURN 'SUCCESS';
END;
$$ LANGUAGE plpgsql;
