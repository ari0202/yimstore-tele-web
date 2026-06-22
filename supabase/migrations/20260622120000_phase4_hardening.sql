-- 1. Create Admins Table
CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.admins(id),
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create Login Attempts (Rate Limiting)
CREATE TABLE IF NOT EXISTS public.login_attempts (
    ip_address TEXT PRIMARY KEY,
    attempts INTEGER DEFAULT 1,
    last_attempt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create Admin Sessions (Stateful JWT Revocation)
CREATE TABLE IF NOT EXISTS public.admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.admins(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 5. Soft Deletion for Products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- 6. Partial Unique Index for Inventory (Prevents double Active stock, allows Restock)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_credential 
ON public.inventory (credential_data) 
WHERE status IN ('Available', 'Hold');

-- 7. Atomic RPC: Bulk Insert Inventory with Restock Logging
CREATE OR REPLACE FUNCTION rpc_bulk_insert_inventory(
    p_admin_id UUID,
    p_product_id UUID,
    p_credentials_array TEXT[]
) RETURNS INTEGER AS $$
DECLARE
    v_inserted_count INTEGER;
BEGIN
    WITH inserted AS (
        INSERT INTO public.inventory (product_id, credential_data, status)
        SELECT p_product_id, cred, 'Available'
        FROM unnest(p_credentials_array) AS cred
        ON CONFLICT (credential_data) WHERE status IN ('Available', 'Hold') DO NOTHING
        RETURNING 1
    )
    SELECT count(*) INTO v_inserted_count FROM inserted;

    -- Audit Log
    INSERT INTO public.audit_logs (admin_id, action, details)
    VALUES (
        p_admin_id, 
        'bulk_upload_inventory', 
        jsonb_build_object('product_id', p_product_id, 'inserted_count', v_inserted_count)
    );

    RETURN v_inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Atomic RPC: Archive Product
CREATE OR REPLACE FUNCTION rpc_archive_product(
    p_admin_id UUID,
    p_product_id UUID
) RETURNS VOID AS $$
BEGIN
    UPDATE public.products SET is_archived = true WHERE id = p_product_id;
    
    INSERT INTO public.audit_logs (admin_id, action, details)
    VALUES (p_admin_id, 'archive_product', jsonb_build_object('product_id', p_product_id));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Atomic RPC: Update System Settings
CREATE OR REPLACE FUNCTION rpc_update_system_settings(
    p_admin_id UUID,
    p_settings JSONB
) RETURNS VOID AS $$
DECLARE
    v_key TEXT;
    v_val TEXT;
BEGIN
    FOR v_key, v_val IN SELECT * FROM jsonb_each_text(p_settings)
    LOOP
        INSERT INTO public.system_settings (key, value)
        VALUES (v_key, v_val)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
    END LOOP;

    INSERT INTO public.audit_logs (admin_id, action, details)
    VALUES (p_admin_id, 'update_settings', p_settings);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Update system_periodic_cleanup to handle new security tables
DROP FUNCTION IF EXISTS system_periodic_cleanup();
CREATE OR REPLACE FUNCTION system_periodic_cleanup()
RETURNS VOID AS $$
BEGIN
    -- Cancel pending orders older than 1 day
    UPDATE orders 
    SET status = 'Expired'
    WHERE status = 'Pending' AND created_at < NOW() - INTERVAL '1 day';

    -- Delete old webhook logs (keep last 7 days)
    DELETE FROM webhook_logs WHERE created_at < NOW() - INTERVAL '7 days';

    -- Clear rate limits older than 1 day
    DELETE FROM public.login_attempts WHERE last_attempt < NOW() - INTERVAL '1 day';

    -- Clear expired sessions
    DELETE FROM public.admin_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. HARDENING UPDATE 1: FOR UPDATE SKIP LOCKED
CREATE OR REPLACE FUNCTION process_payment_fulfillment(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_order RECORD;
    v_item RECORD;
    v_inventory_id UUID;
    v_fulfilled_count INT := 0;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Order not found');
    END IF;

    IF v_order.status != 'Pending' THEN
        RETURN jsonb_build_object('success', true, 'message', 'Order already processed');
    END IF;

    -- Update order status
    UPDATE public.orders SET status = 'Paid' WHERE id = p_order_id;

    -- Process each item
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
        END IF;
    END LOOP;

    RETURN jsonb_build_object('success', true, 'fulfilled_items', v_fulfilled_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. HARDENING UPDATE 2: Atomic Warranty Guard (Awaiting Restock)
CREATE OR REPLACE FUNCTION process_warranty_claim(
    p_order_id UUID,
    p_order_item_id UUID,
    p_reason TEXT,
    p_user_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_order_item RECORD;
    v_product RECORD;
    v_new_inventory_id UUID;
    v_claim_id UUID;
BEGIN
    -- Verify ownership and get item
    SELECT oi.* INTO v_order_item
    FROM public.order_items oi
    JOIN public.orders o ON o.id = oi.order_id
    WHERE oi.id = p_order_item_id AND o.id = p_order_id AND o.user_id = p_user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Item not found or unauthorized');
    END IF;

    -- Check warranty validity
    SELECT * INTO v_product FROM public.products WHERE id = v_order_item.product_id;
    IF v_order_item.created_at + (v_product.warranty_hours || ' hours')::INTERVAL < NOW() THEN
        RETURN jsonb_build_object('success', false, 'error', 'Warranty expired');
    END IF;

    -- Attempt to get replacement stock instantly (SKIP LOCKED)
    SELECT id INTO v_new_inventory_id
    FROM public.inventory
    WHERE product_id = v_order_item.product_id AND status = 'Available'
    LIMIT 1 FOR UPDATE SKIP LOCKED;

    IF FOUND THEN
        -- Replacement found! Revoke old, assign new
        UPDATE public.inventory SET status = 'Revoked' WHERE id = v_order_item.inventory_id;
        UPDATE public.inventory SET status = 'Used' WHERE id = v_new_inventory_id;
        UPDATE public.order_items SET inventory_id = v_new_inventory_id WHERE id = p_order_item_id;

        -- Log claim as Approved
        INSERT INTO public.warranty_claims (order_item_id, old_inventory_id, new_inventory_id, reason, status)
        VALUES (p_order_item_id, v_order_item.inventory_id, v_new_inventory_id, p_reason, 'Approved');

        RETURN jsonb_build_object('success', true, 'message', 'Replacement assigned instantly');
    ELSE
        -- No stock! Queue the claim. DO NOT REVOKE the old stock yet.
        INSERT INTO public.warranty_claims (order_item_id, old_inventory_id, reason, status)
        VALUES (p_order_item_id, v_order_item.inventory_id, p_reason, 'Pending')
        RETURNING id INTO v_claim_id;

        INSERT INTO public.pending_claims (claim_id, product_id)
        VALUES (v_claim_id, v_order_item.product_id);

        RETURN jsonb_build_object('success', true, 'message', 'Awaiting Restock', 'queued', true);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
