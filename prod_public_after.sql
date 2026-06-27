--
-- PostgreSQL database dump
--

\restrict NZjPt3zvi5fcE81nAfvTaTMpWxPfsiz4ioP5aU3rCgIrzRlA0EXpA9FJWYnUVV8

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.4 (Ubuntu 18.4-0ubuntu0.26.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- Name: cooldown_unit_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.cooldown_unit_enum AS ENUM (
    'hours',
    'days',
    'months'
);


ALTER TYPE public.cooldown_unit_enum OWNER TO postgres;

--
-- Name: inventory_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.inventory_status_enum AS ENUM (
    'Available',
    'Hold',
    'Used',
    'Revoked',
    'Needs Manual Refund'
);


ALTER TYPE public.inventory_status_enum OWNER TO postgres;

--
-- Name: check_cooldown_validity(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_cooldown_validity(p_order_item_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_last_claim TIMESTAMP WITH TIME ZONE;
    v_cooldown_val INTEGER;
    v_cooldown_unit TEXT;
BEGIN
    SELECT claimed_at INTO v_last_claim
    FROM public.warranty_logs
    WHERE order_item_id = p_order_item_id
    ORDER BY claimed_at DESC
    LIMIT 1;

    IF v_last_claim IS NULL THEN
        RETURN TRUE;
    END IF;

    SELECT p.cooldown_value, p.cooldown_unit::TEXT INTO v_cooldown_val, v_cooldown_unit
    FROM public.order_items oi
    JOIN public.inventory i ON oi.inventory_id = i.id
    JOIN public.products p ON i.product_id = p.id
    WHERE oi.id = p_order_item_id;

    IF v_cooldown_val IS NULL OR v_cooldown_val = 0 THEN
        RETURN TRUE;
    END IF;

    RETURN NOW() >= (v_last_claim + (v_cooldown_val || ' ' || v_cooldown_unit)::INTERVAL);
END;
$$;


ALTER FUNCTION public.check_cooldown_validity(p_order_item_id uuid) OWNER TO postgres;

--
-- Name: check_cooldown_validity(timestamp with time zone, integer, public.cooldown_unit_enum); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.check_cooldown_validity(last_claim_time timestamp with time zone, cooldown_val integer, cooldown_unit public.cooldown_unit_enum) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    interval_str TEXT;
    cooldown_passed BOOLEAN;
BEGIN
    interval_str := cooldown_val || ' ' || cooldown_unit;
    cooldown_passed := (NOW() >= (last_claim_time + interval_str::INTERVAL));
    RETURN cooldown_passed;
END;
$$;


ALTER FUNCTION public.check_cooldown_validity(last_claim_time timestamp with time zone, cooldown_val integer, cooldown_unit public.cooldown_unit_enum) OWNER TO postgres;

--
-- Name: get_order_by_short_id(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_order_by_short_id(p_short_id text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_order_id UUID;
BEGIN
    SELECT id INTO v_order_id
    FROM public.orders
    WHERE id::text ILIKE p_short_id || '%'
    LIMIT 1;
    
    RETURN v_order_id;
END;
$$;


ALTER FUNCTION public.get_order_by_short_id(p_short_id text) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: outbox_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.outbox_events (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    event_type character varying(100) NOT NULL,
    payload jsonb NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    error_message text,
    retry_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    transaction_id character varying(255),
    next_retry_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.outbox_events OWNER TO postgres;

--
-- Name: get_pending_outbox_events(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_pending_outbox_events(batch_size integer) RETURNS SETOF public.outbox_events
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION public.get_pending_outbox_events(batch_size integer) OWNER TO postgres;

--
-- Name: hold_inventory(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.hold_inventory(p_product_id uuid) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION public.hold_inventory(p_product_id uuid) OWNER TO postgres;

--
-- Name: process_payment_fulfillment(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_payment_fulfillment(p_order_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION public.process_payment_fulfillment(p_order_id uuid) OWNER TO postgres;

--
-- Name: process_payment_fulfillment(uuid, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_payment_fulfillment(p_order_id uuid, p_amount numeric) RETURNS character varying
    LANGUAGE plpgsql
    AS $$
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
$$;


ALTER FUNCTION public.process_payment_fulfillment(p_order_id uuid, p_amount numeric) OWNER TO postgres;

--
-- Name: process_warranty_claim(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.process_warranty_claim(p_order_item_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_item RECORD;
    v_new_inv_id UUID;
    v_valid_cooldown BOOLEAN;
    v_maintenance BOOLEAN;
    v_pending_claim_exists BOOLEAN;
    v_new_credential TEXT;
BEGIN
    -- Cek Global Kill-Switch
    SELECT (value = 'true') INTO v_maintenance FROM public.system_settings WHERE key = 'maintenance_mode';
    IF v_maintenance THEN 
        RETURN jsonb_build_object('status', 'MAINTENANCE_MODE'); 
    END IF;

    -- Lock order_item
    SELECT oi.id, oi.inventory_id, oi.current_claim_count, oi.warranty_end_date, oi.order_id, oi.cooldown_bypass_active,
           i.product_id, p.max_claim_limit
    INTO v_item
    FROM public.order_items oi
    JOIN public.inventory i ON oi.inventory_id = i.id
    JOIN public.products p ON i.product_id = p.id
    WHERE oi.id = p_order_item_id FOR UPDATE OF oi;

    -- Defense in Depth: Prevent processing warranty claims for parent container products
    IF EXISTS (SELECT 1 FROM public.products WHERE parent_id = v_item.product_id) THEN
        RAISE EXCEPTION 'Cannot process warranty for a parent container product (product_id: %)', v_item.product_id;
    END IF;

    -- Cek status antrean pending
    SELECT EXISTS(SELECT 1 FROM public.pending_claims WHERE order_item_id = p_order_item_id AND status = 'pending') INTO v_pending_claim_exists;
    
    -- Validasi Garansi (bypass jika sudah masuk daftar antrean pending)
    IF v_item.warranty_end_date < NOW() AND NOT v_pending_claim_exists THEN 
        RETURN jsonb_build_object('status', 'WARRANTY_EXPIRED'); 
    END IF;
    IF v_item.current_claim_count >= v_item.max_claim_limit AND NOT v_pending_claim_exists THEN 
        RETURN jsonb_build_object('status', 'LIMIT_EXCEEDED'); 
    END IF;

    -- Validasi Cooldown & Manual Override
    IF NOT v_pending_claim_exists THEN
        IF v_item.cooldown_bypass_active THEN
            -- Bypass aktif! Izinkan klaim dan segera matikan flag bypass-nya
            UPDATE public.order_items SET cooldown_bypass_active = false WHERE id = p_order_item_id;
        ELSE
            SELECT public.check_cooldown_validity(p_order_item_id) INTO v_valid_cooldown;
            IF NOT v_valid_cooldown THEN 
                RETURN jsonb_build_object('status', 'COOLDOWN_ACTIVE'); 
            END IF;
        END IF;
    END IF;

    -- Coba tarik stok baru (Skip Locked mencegah Race Condition!)
    UPDATE public.inventory SET status = 'Used', reserved_until = NULL 
    WHERE id = (SELECT id FROM public.inventory WHERE product_id = v_item.product_id AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1) 
    RETURNING id INTO v_new_inv_id;

    IF v_new_inv_id IS NULL THEN 
        -- Jika stok kosong, buat antrean pending untuk membekukan waktu garansi
        IF NOT v_pending_claim_exists THEN
            INSERT INTO public.pending_claims (order_item_id) VALUES (p_order_item_id);
            UPDATE public.order_items SET current_claim_count = current_claim_count + 1 WHERE id = p_order_item_id;
        END IF;

        -- Injeksi Admin Alert dengan Debouncing
        INSERT INTO public.outbox_events (event_type, payload, status)
        SELECT 'ADMIN_ALERT_OUT_OF_STOCK', jsonb_build_object('product_id', v_item.product_id), 'pending'
        WHERE NOT EXISTS (
            SELECT 1 FROM public.outbox_events 
            WHERE event_type = 'ADMIN_ALERT_OUT_OF_STOCK' 
              AND payload->>'product_id' = v_item.product_id::text 
              AND status = 'pending'
        );
        RETURN jsonb_build_object('status', 'WAITLISTED'); 
    END IF;

    IF v_pending_claim_exists THEN
        UPDATE public.pending_claims SET status = 'fulfilled' WHERE order_item_id = p_order_item_id AND status = 'pending';
    ELSE
        UPDATE public.order_items SET current_claim_count = current_claim_count + 1 WHERE id = p_order_item_id;
    END IF;

    -- Cabut stok lama & pasang stok baru
    UPDATE public.inventory SET status = 'Revoked' WHERE id = v_item.inventory_id;
    UPDATE public.order_items SET inventory_id = v_new_inv_id WHERE id = p_order_item_id;
    
    INSERT INTO public.warranty_logs (order_item_id, old_inventory_id, new_inventory_id, delivery_status)
    VALUES (p_order_item_id, v_item.inventory_id, v_new_inv_id, 'completed');

    INSERT INTO public.outbox_events (event_type, payload, status)
    VALUES ('DELIVER_WARRANTY_CREDENTIAL', jsonb_build_object('order_item_id', p_order_item_id), 'pending');

    -- Ambil kredensial baru untuk real-time update
    SELECT credential_data INTO v_new_credential FROM public.inventory WHERE id = v_new_inv_id;

    RETURN jsonb_build_object('status', 'SUCCESS', 'new_credential', v_new_credential);
END;
$$;


ALTER FUNCTION public.process_warranty_claim(p_order_item_id uuid) OWNER TO postgres;

--
-- Name: rpc_archive_product(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.rpc_archive_product(p_admin_id uuid, p_product_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.products SET is_archived = true WHERE id = p_product_id;
    
    INSERT INTO public.audit_logs (admin_id, action, details)
    VALUES (p_admin_id, 'archive_product', jsonb_build_object('product_id', p_product_id));
END;
$$;


ALTER FUNCTION public.rpc_archive_product(p_admin_id uuid, p_product_id uuid) OWNER TO postgres;

--
-- Name: rpc_bulk_insert_inventory(uuid, uuid, text, text[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.rpc_bulk_insert_inventory(p_admin_id uuid, p_target_id uuid, p_target_type text, p_credentials_array text[]) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$ DECLARE v_inserted_count INTEGER; BEGIN IF p_target_type = 'category' THEN WITH inserted AS ( INSERT INTO public.inventory (category_id, credential_data, status) SELECT p_target_id, cred, 'Available' FROM unnest(p_credentials_array) AS cred RETURNING 1 ) SELECT count(*) INTO v_inserted_count FROM inserted; ELSE WITH inserted AS ( INSERT INTO public.inventory (product_id, credential_data, status) SELECT p_target_id, cred, 'Available' FROM unnest(p_credentials_array) AS cred RETURNING 1 ) SELECT count(*) INTO v_inserted_count FROM inserted; END IF; INSERT INTO public.audit_logs (admin_id, action, details) VALUES ( p_admin_id, 'BULK_INSERT_INVENTORY', jsonb_build_object( 'target_id', p_target_id, 'target_type', p_target_type, 'inserted_count', v_inserted_count ) ); RETURN v_inserted_count; END; $$;


ALTER FUNCTION public.rpc_bulk_insert_inventory(p_admin_id uuid, p_target_id uuid, p_target_type text, p_credentials_array text[]) OWNER TO postgres;

--
-- Name: rpc_claim_inventory(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.rpc_claim_inventory(p_order_item_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION public.rpc_claim_inventory(p_order_item_id uuid) OWNER TO postgres;

--
-- Name: rpc_delete_product_permanently(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.rpc_delete_product_permanently(p_product_id uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM public.inventory 
    WHERE status = 'Available' 
      AND (product_id = p_product_id OR product_id IN (SELECT id FROM public.products WHERE parent_id = p_product_id));

    DELETE FROM public.products WHERE id = p_product_id;
END;
$$;


ALTER FUNCTION public.rpc_delete_product_permanently(p_product_id uuid) OWNER TO postgres;

--
-- Name: rpc_get_variation_stock(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.rpc_get_variation_stock(p_variation_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION public.rpc_get_variation_stock(p_variation_id uuid) OWNER TO postgres;

--
-- Name: rpc_process_warranty_claim(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.rpc_process_warranty_claim(p_order_item_id uuid, p_reason text) RETURNS json
    LANGUAGE plpgsql SECURITY DEFINER
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
            RAISE EXCEPTION 'Cooldown active|%', (v_last_claim_time + v_cooldown_interval);
        END IF;
    END IF;

    -- F. Allocate new inventory securely
    SELECT * INTO v_new_inventory
    FROM public.inventory
    WHERE product_id = v_order_item.product_id AND status = 'Available'
    LIMIT 1 FOR UPDATE SKIP LOCKED;

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
$$;


ALTER FUNCTION public.rpc_process_warranty_claim(p_order_item_id uuid, p_reason text) OWNER TO postgres;

--
-- Name: rpc_update_system_settings(uuid, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.rpc_update_system_settings(p_admin_id uuid, p_settings jsonb) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION public.rpc_update_system_settings(p_admin_id uuid, p_settings jsonb) OWNER TO postgres;

--
-- Name: system_periodic_cleanup(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.system_periodic_cleanup() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION public.system_periodic_cleanup() OWNER TO postgres;

--
-- Name: trigger_fulfill_pending_claims(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.trigger_fulfill_pending_claims() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_pending_claim RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'maintenance_mode' AND value = 'true') THEN 
        RETURN NEW; 
    END IF;

    IF NEW.status = 'Available' THEN
        SELECT pc.id, pc.order_item_id, oi.inventory_id AS old_inventory_id
        INTO v_pending_claim
        FROM public.pending_claims pc
        JOIN public.order_items oi ON pc.order_item_id = oi.id
        JOIN public.inventory old_inv ON oi.inventory_id = old_inv.id
        WHERE pc.status = 'pending' AND old_inv.product_id = NEW.product_id
        ORDER BY pc.created_at ASC
        LIMIT 1 FOR UPDATE OF pc, oi SKIP LOCKED;

        IF FOUND THEN
            -- Update status inventory ini menjadi Used (safe because trigger is AFTER)
            UPDATE public.inventory SET status = 'Used' WHERE id = NEW.id;
            
            UPDATE public.pending_claims SET status = 'fulfilled' WHERE id = v_pending_claim.id;
            UPDATE public.order_items SET inventory_id = NEW.id WHERE id = v_pending_claim.order_item_id;
            UPDATE public.inventory SET status = 'Revoked' WHERE id = v_pending_claim.old_inventory_id;

            INSERT INTO public.warranty_logs (order_item_id, old_inventory_id, new_inventory_id, delivery_status)
            VALUES (v_pending_claim.order_item_id, v_pending_claim.old_inventory_id, NEW.id, 'completed');
            
            INSERT INTO public.outbox_events (event_type, payload, status)
            VALUES ('DELIVER_WARRANTY_CREDENTIAL', jsonb_build_object('order_item_id', v_pending_claim.order_item_id), 'pending');
        END IF;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.trigger_fulfill_pending_claims() OWNER TO postgres;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(255) NOT NULL,
    slug character varying(255) NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    thumbnail_url text,
    description text
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: inventory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.inventory (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    product_id uuid,
    credential_data text NOT NULL,
    status public.inventory_status_enum DEFAULT 'Available'::public.inventory_status_enum,
    reserved_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    category_id uuid
);


ALTER TABLE public.inventory OWNER TO postgres;

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid,
    name character varying(255) NOT NULL,
    price numeric(10,2) NOT NULL,
    description text,
    warranty_days integer DEFAULT 0,
    max_claim_limit integer DEFAULT 0,
    cooldown_value integer DEFAULT 0,
    cooldown_unit public.cooldown_unit_enum DEFAULT 'hours'::public.cooldown_unit_enum,
    created_at timestamp with time zone DEFAULT now(),
    is_archived boolean DEFAULT false,
    thumbnail_url character varying(1000),
    parent_id uuid,
    is_sync_stock boolean DEFAULT false
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: admin_product_summary_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW public.admin_product_summary_view AS
 SELECT p.id,
    p.name,
    p.description,
    p.thumbnail_url,
    p.category_id,
    c.name AS category_name,
    p.price AS base_price,
    p.warranty_days,
    p.max_claim_limit,
    p.cooldown_value,
    p.cooldown_unit,
    p.is_archived,
    p.created_at,
    p.is_sync_stock,
    ( SELECT count(*) AS count
           FROM public.inventory i
          WHERE ((i.product_id = p.id) AND (i.status = 'Available'::public.inventory_status_enum))) AS available_stock,
    ( SELECT count(*) AS count
           FROM public.inventory i
          WHERE ((i.product_id = p.id) AND (i.status = 'Used'::public.inventory_status_enum))) AS sold_stock,
    ( SELECT count(*) AS count
           FROM public.inventory i
          WHERE ((i.product_id = p.id) AND (i.status <> 'Revoked'::public.inventory_status_enum))) AS total_stock
   FROM (public.products p
     LEFT JOIN public.categories c ON ((p.category_id = c.id)))
  WHERE (p.parent_id IS NULL);


ALTER VIEW public.admin_product_summary_view OWNER TO postgres;

--
-- Name: admin_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admin_sessions (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    admin_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    expires_at timestamp with time zone NOT NULL
);


ALTER TABLE public.admin_sessions OWNER TO postgres;

--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.admins (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    username text NOT NULL,
    password_hash text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.admins OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id uuid DEFAULT extensions.uuid_generate_v4() NOT NULL,
    admin_id uuid,
    action text NOT NULL,
    details jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: bot_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bot_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    key character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    content_html text NOT NULL,
    variables_hint text,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.bot_templates OWNER TO postgres;

--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.login_attempts (
    ip_address text NOT NULL,
    attempts integer DEFAULT 1,
    last_attempt timestamp with time zone DEFAULT now()
);


ALTER TABLE public.login_attempts OWNER TO postgres;

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    inventory_id uuid,
    warranty_end_date timestamp with time zone,
    current_claim_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    cooldown_bypass_active boolean DEFAULT false,
    product_id uuid NOT NULL,
    max_claim_limit integer DEFAULT 1 NOT NULL
);


ALTER TABLE public.order_items OWNER TO postgres;

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    total_amount numeric(10,2) NOT NULL,
    payment_status character varying(50) DEFAULT 'pending'::character varying,
    delivery_status character varying(50) DEFAULT 'pending'::character varying,
    platform_source character varying(50),
    created_at timestamp with time zone DEFAULT now(),
    access_token uuid DEFAULT gen_random_uuid(),
    email character varying(255),
    qris_string text,
    payment_expired_at timestamp with time zone
);


ALTER TABLE public.orders OWNER TO postgres;

--
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.otp_codes (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    email character varying(255) NOT NULL,
    code character varying(6) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    used_at timestamp with time zone
);


ALTER TABLE public.otp_codes OWNER TO postgres;

--
-- Name: pending_claims; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pending_claims (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_item_id uuid NOT NULL,
    status character varying(50) DEFAULT 'pending'::character varying,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.pending_claims OWNER TO postgres;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email character varying(255),
    telegram_chat_id character varying(255),
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: warranty_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.warranty_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_item_id uuid,
    old_inventory_id uuid,
    new_inventory_id uuid,
    delivery_status character varying(50) DEFAULT 'pending'::character varying,
    claimed_at timestamp with time zone DEFAULT now(),
    reason text
);


ALTER TABLE public.warranty_logs OWNER TO postgres;

--
-- Name: admin_sessions admin_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_pkey PRIMARY KEY (id);


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_pkey PRIMARY KEY (id);


--
-- Name: admins admins_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admins
    ADD CONSTRAINT admins_username_key UNIQUE (username);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: bot_templates bot_templates_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bot_templates
    ADD CONSTRAINT bot_templates_key_key UNIQUE (key);


--
-- Name: bot_templates bot_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bot_templates
    ADD CONSTRAINT bot_templates_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_slug_key UNIQUE (slug);


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_pkey PRIMARY KEY (id);


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.login_attempts
    ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (ip_address);


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);


--
-- Name: orders orders_access_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_access_token_key UNIQUE (access_token);


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_pkey PRIMARY KEY (id);


--
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_pkey PRIMARY KEY (id);


--
-- Name: outbox_events outbox_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outbox_events
    ADD CONSTRAINT outbox_events_pkey PRIMARY KEY (id);


--
-- Name: outbox_events outbox_events_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.outbox_events
    ADD CONSTRAINT outbox_events_transaction_id_key UNIQUE (transaction_id);


--
-- Name: pending_claims pending_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_claims
    ADD CONSTRAINT pending_claims_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (key);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_telegram_chat_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_telegram_chat_id_key UNIQUE (telegram_chat_id);


--
-- Name: warranty_logs warranty_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warranty_logs
    ADD CONSTRAINT warranty_logs_pkey PRIMARY KEY (id);


--
-- Name: idx_admin_sessions_admin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_admin_sessions_admin_id ON public.admin_sessions USING btree (admin_id);


--
-- Name: idx_audit_logs_admin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_audit_logs_admin_id ON public.audit_logs USING btree (admin_id);


--
-- Name: idx_inventory_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_category_id ON public.inventory USING btree (category_id);


--
-- Name: idx_inventory_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_inventory_product_id ON public.inventory USING btree (product_id);


--
-- Name: idx_order_items_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_created_at ON public.order_items USING btree (created_at);


--
-- Name: idx_order_items_inventory_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_inventory_id ON public.order_items USING btree (inventory_id);


--
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);


--
-- Name: idx_order_items_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_order_items_product_id ON public.order_items USING btree (product_id);


--
-- Name: idx_orders_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at);


--
-- Name: idx_orders_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_orders_user_id ON public.orders USING btree (user_id);


--
-- Name: idx_otp_codes_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_otp_codes_order_id ON public.otp_codes USING btree (order_id);


--
-- Name: idx_outbox_events_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_outbox_events_status ON public.outbox_events USING btree (status);


--
-- Name: idx_outbox_queue; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_outbox_queue ON public.outbox_events USING btree (next_retry_at) WHERE ((status)::text = ANY (ARRAY[('pending'::character varying)::text, ('processing'::character varying)::text]));


--
-- Name: idx_pending_claims_order_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_pending_claims_order_item_id ON public.pending_claims USING btree (order_item_id);


--
-- Name: idx_products_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_category_id ON public.products USING btree (category_id);


--
-- Name: idx_products_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_products_parent_id ON public.products USING btree (parent_id);


--
-- Name: idx_warranty_logs_new_inv_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_warranty_logs_new_inv_id ON public.warranty_logs USING btree (new_inventory_id);


--
-- Name: idx_warranty_logs_old_inv_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_warranty_logs_old_inv_id ON public.warranty_logs USING btree (old_inventory_id);


--
-- Name: idx_warranty_logs_order_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_warranty_logs_order_item_id ON public.warranty_logs USING btree (order_item_id);


--
-- Name: inventory fulfill_pending_claims_on_restock; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER fulfill_pending_claims_on_restock AFTER INSERT OR UPDATE OF status ON public.inventory FOR EACH ROW WHEN (((new.status = 'Available'::public.inventory_status_enum) AND (pg_trigger_depth() < 1))) EXECUTE FUNCTION public.trigger_fulfill_pending_claims();


--
-- Name: admin_sessions admin_sessions_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.admin_sessions
    ADD CONSTRAINT admin_sessions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id) ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admins(id);


--
-- Name: inventory inventory_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: inventory inventory_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.inventory
    ADD CONSTRAINT inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventory(id);


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.order_items
    ADD CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.orders
    ADD CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: otp_codes otp_codes_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.otp_codes
    ADD CONSTRAINT otp_codes_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;


--
-- Name: pending_claims pending_claims_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pending_claims
    ADD CONSTRAINT pending_claims_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id);


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE CASCADE;


--
-- Name: products products_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.products(id) ON DELETE CASCADE;


--
-- Name: warranty_logs warranty_logs_new_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warranty_logs
    ADD CONSTRAINT warranty_logs_new_inventory_id_fkey FOREIGN KEY (new_inventory_id) REFERENCES public.inventory(id);


--
-- Name: warranty_logs warranty_logs_old_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warranty_logs
    ADD CONSTRAINT warranty_logs_old_inventory_id_fkey FOREIGN KEY (old_inventory_id) REFERENCES public.inventory(id);


--
-- Name: warranty_logs warranty_logs_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.warranty_logs
    ADD CONSTRAINT warranty_logs_order_item_id_fkey FOREIGN KEY (order_item_id) REFERENCES public.order_items(id);


--
-- Name: inventory Admins manage inventory; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage inventory" ON public.inventory USING ((EXISTS ( SELECT 1
   FROM public.admins
  WHERE (admins.id = (((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))::uuid))));


--
-- Name: orders Admins manage orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage orders" ON public.orders USING ((EXISTS ( SELECT 1
   FROM public.admins
  WHERE (admins.id = (((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))::uuid))));


--
-- Name: products Admins manage products; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage products" ON public.products USING ((EXISTS ( SELECT 1
   FROM public.admins
  WHERE (admins.id = (((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))::uuid))));


--
-- Name: admins Admins read own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins read own" ON public.admins FOR SELECT USING ((id = (((current_setting('request.jwt.claims'::text, true))::json ->> 'sub'::text))::uuid));


--
-- Name: categories Allow public read on categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read on categories" ON public.categories FOR SELECT USING (true);


--
-- Name: bot_templates Enable all for admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable all for admin" ON public.bot_templates TO authenticated USING (true) WITH CHECK (true);


--
-- Name: bot_templates Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable read access for all users" ON public.bot_templates FOR SELECT USING (true);


--
-- Name: categories Public Read Categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public Read Categories" ON public.categories FOR SELECT USING (true);


--
-- Name: products Public Read Products; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public Read Products" ON public.products FOR SELECT USING (true);


--
-- Name: products Public products viewable; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public products viewable" ON public.products FOR SELECT USING (true);


--
-- Name: otp_codes Service role can manage otp_codes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service role can manage otp_codes" ON public.otp_codes USING (true) WITH CHECK (true);


--
-- Name: inventory Users read own inventory; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users read own inventory" ON public.inventory FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.order_items oi
     JOIN public.orders o ON ((oi.order_id = o.id)))
  WHERE ((oi.inventory_id = inventory.id) AND (o.user_id = auth.uid())))));


--
-- Name: order_items Users read own order items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users read own order items" ON public.order_items FOR SELECT USING ((EXISTS ( SELECT 1
   FROM public.orders
  WHERE ((orders.id = order_items.order_id) AND (orders.user_id = auth.uid())))));


--
-- Name: orders Users read own orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users read own orders" ON public.orders FOR SELECT USING ((user_id = auth.uid()));


--
-- Name: users Users read own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users read own profile" ON public.users FOR SELECT USING ((id = auth.uid()));


--
-- Name: warranty_logs Users read own warranty logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users read own warranty logs" ON public.warranty_logs FOR SELECT USING ((EXISTS ( SELECT 1
   FROM (public.order_items oi
     JOIN public.orders o ON ((oi.order_id = o.id)))
  WHERE ((oi.id = warranty_logs.order_item_id) AND (o.user_id = auth.uid())))));


--
-- Name: admin_sessions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: admins; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: bot_templates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.bot_templates ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

--
-- Name: login_attempts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

--
-- Name: otp_codes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

--
-- Name: outbox_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;

--
-- Name: pending_claims; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.pending_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

--
-- Name: system_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

--
-- Name: warranty_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE public.warranty_logs ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;


--
-- Name: FUNCTION check_cooldown_validity(p_order_item_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.check_cooldown_validity(p_order_item_id uuid) TO anon;
GRANT ALL ON FUNCTION public.check_cooldown_validity(p_order_item_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.check_cooldown_validity(p_order_item_id uuid) TO service_role;


--
-- Name: FUNCTION check_cooldown_validity(last_claim_time timestamp with time zone, cooldown_val integer, cooldown_unit public.cooldown_unit_enum); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.check_cooldown_validity(last_claim_time timestamp with time zone, cooldown_val integer, cooldown_unit public.cooldown_unit_enum) TO anon;
GRANT ALL ON FUNCTION public.check_cooldown_validity(last_claim_time timestamp with time zone, cooldown_val integer, cooldown_unit public.cooldown_unit_enum) TO authenticated;
GRANT ALL ON FUNCTION public.check_cooldown_validity(last_claim_time timestamp with time zone, cooldown_val integer, cooldown_unit public.cooldown_unit_enum) TO service_role;


--
-- Name: FUNCTION get_order_by_short_id(p_short_id text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_order_by_short_id(p_short_id text) TO anon;
GRANT ALL ON FUNCTION public.get_order_by_short_id(p_short_id text) TO authenticated;
GRANT ALL ON FUNCTION public.get_order_by_short_id(p_short_id text) TO service_role;


--
-- Name: TABLE outbox_events; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.outbox_events TO anon;
GRANT ALL ON TABLE public.outbox_events TO authenticated;
GRANT ALL ON TABLE public.outbox_events TO service_role;


--
-- Name: FUNCTION get_pending_outbox_events(batch_size integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.get_pending_outbox_events(batch_size integer) TO anon;
GRANT ALL ON FUNCTION public.get_pending_outbox_events(batch_size integer) TO authenticated;
GRANT ALL ON FUNCTION public.get_pending_outbox_events(batch_size integer) TO service_role;


--
-- Name: FUNCTION hold_inventory(p_product_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.hold_inventory(p_product_id uuid) TO anon;
GRANT ALL ON FUNCTION public.hold_inventory(p_product_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.hold_inventory(p_product_id uuid) TO service_role;


--
-- Name: FUNCTION process_payment_fulfillment(p_order_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.process_payment_fulfillment(p_order_id uuid) TO anon;
GRANT ALL ON FUNCTION public.process_payment_fulfillment(p_order_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.process_payment_fulfillment(p_order_id uuid) TO service_role;


--
-- Name: FUNCTION process_payment_fulfillment(p_order_id uuid, p_amount numeric); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.process_payment_fulfillment(p_order_id uuid, p_amount numeric) TO anon;
GRANT ALL ON FUNCTION public.process_payment_fulfillment(p_order_id uuid, p_amount numeric) TO authenticated;
GRANT ALL ON FUNCTION public.process_payment_fulfillment(p_order_id uuid, p_amount numeric) TO service_role;


--
-- Name: FUNCTION process_warranty_claim(p_order_item_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.process_warranty_claim(p_order_item_id uuid) TO anon;
GRANT ALL ON FUNCTION public.process_warranty_claim(p_order_item_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.process_warranty_claim(p_order_item_id uuid) TO service_role;


--
-- Name: FUNCTION rpc_archive_product(p_admin_id uuid, p_product_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.rpc_archive_product(p_admin_id uuid, p_product_id uuid) TO anon;
GRANT ALL ON FUNCTION public.rpc_archive_product(p_admin_id uuid, p_product_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.rpc_archive_product(p_admin_id uuid, p_product_id uuid) TO service_role;


--
-- Name: FUNCTION rpc_bulk_insert_inventory(p_admin_id uuid, p_target_id uuid, p_target_type text, p_credentials_array text[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.rpc_bulk_insert_inventory(p_admin_id uuid, p_target_id uuid, p_target_type text, p_credentials_array text[]) TO anon;
GRANT ALL ON FUNCTION public.rpc_bulk_insert_inventory(p_admin_id uuid, p_target_id uuid, p_target_type text, p_credentials_array text[]) TO authenticated;
GRANT ALL ON FUNCTION public.rpc_bulk_insert_inventory(p_admin_id uuid, p_target_id uuid, p_target_type text, p_credentials_array text[]) TO service_role;


--
-- Name: FUNCTION rpc_claim_inventory(p_order_item_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.rpc_claim_inventory(p_order_item_id uuid) TO anon;
GRANT ALL ON FUNCTION public.rpc_claim_inventory(p_order_item_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.rpc_claim_inventory(p_order_item_id uuid) TO service_role;


--
-- Name: FUNCTION rpc_delete_product_permanently(p_product_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.rpc_delete_product_permanently(p_product_id uuid) TO anon;
GRANT ALL ON FUNCTION public.rpc_delete_product_permanently(p_product_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.rpc_delete_product_permanently(p_product_id uuid) TO service_role;


--
-- Name: FUNCTION rpc_get_variation_stock(p_variation_id uuid); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.rpc_get_variation_stock(p_variation_id uuid) TO anon;
GRANT ALL ON FUNCTION public.rpc_get_variation_stock(p_variation_id uuid) TO authenticated;
GRANT ALL ON FUNCTION public.rpc_get_variation_stock(p_variation_id uuid) TO service_role;


--
-- Name: FUNCTION rpc_process_warranty_claim(p_order_item_id uuid, p_reason text); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.rpc_process_warranty_claim(p_order_item_id uuid, p_reason text) TO anon;
GRANT ALL ON FUNCTION public.rpc_process_warranty_claim(p_order_item_id uuid, p_reason text) TO authenticated;
GRANT ALL ON FUNCTION public.rpc_process_warranty_claim(p_order_item_id uuid, p_reason text) TO service_role;


--
-- Name: FUNCTION rpc_update_system_settings(p_admin_id uuid, p_settings jsonb); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.rpc_update_system_settings(p_admin_id uuid, p_settings jsonb) TO anon;
GRANT ALL ON FUNCTION public.rpc_update_system_settings(p_admin_id uuid, p_settings jsonb) TO authenticated;
GRANT ALL ON FUNCTION public.rpc_update_system_settings(p_admin_id uuid, p_settings jsonb) TO service_role;


--
-- Name: FUNCTION system_periodic_cleanup(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.system_periodic_cleanup() TO anon;
GRANT ALL ON FUNCTION public.system_periodic_cleanup() TO authenticated;
GRANT ALL ON FUNCTION public.system_periodic_cleanup() TO service_role;


--
-- Name: FUNCTION trigger_fulfill_pending_claims(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION public.trigger_fulfill_pending_claims() TO anon;
GRANT ALL ON FUNCTION public.trigger_fulfill_pending_claims() TO authenticated;
GRANT ALL ON FUNCTION public.trigger_fulfill_pending_claims() TO service_role;


--
-- Name: TABLE categories; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.categories TO anon;
GRANT ALL ON TABLE public.categories TO authenticated;
GRANT ALL ON TABLE public.categories TO service_role;


--
-- Name: TABLE inventory; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.inventory TO anon;
GRANT ALL ON TABLE public.inventory TO authenticated;
GRANT ALL ON TABLE public.inventory TO service_role;


--
-- Name: TABLE products; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.products TO anon;
GRANT ALL ON TABLE public.products TO authenticated;
GRANT ALL ON TABLE public.products TO service_role;


--
-- Name: TABLE admin_product_summary_view; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.admin_product_summary_view TO anon;
GRANT ALL ON TABLE public.admin_product_summary_view TO authenticated;
GRANT ALL ON TABLE public.admin_product_summary_view TO service_role;


--
-- Name: TABLE admin_sessions; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.admin_sessions TO anon;
GRANT ALL ON TABLE public.admin_sessions TO authenticated;
GRANT ALL ON TABLE public.admin_sessions TO service_role;


--
-- Name: TABLE admins; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.admins TO anon;
GRANT ALL ON TABLE public.admins TO authenticated;
GRANT ALL ON TABLE public.admins TO service_role;


--
-- Name: TABLE audit_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.audit_logs TO anon;
GRANT ALL ON TABLE public.audit_logs TO authenticated;
GRANT ALL ON TABLE public.audit_logs TO service_role;


--
-- Name: TABLE bot_templates; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.bot_templates TO anon;
GRANT ALL ON TABLE public.bot_templates TO authenticated;
GRANT ALL ON TABLE public.bot_templates TO service_role;


--
-- Name: TABLE login_attempts; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.login_attempts TO anon;
GRANT ALL ON TABLE public.login_attempts TO authenticated;
GRANT ALL ON TABLE public.login_attempts TO service_role;


--
-- Name: TABLE order_items; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.order_items TO anon;
GRANT ALL ON TABLE public.order_items TO authenticated;
GRANT ALL ON TABLE public.order_items TO service_role;


--
-- Name: TABLE orders; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.orders TO anon;
GRANT ALL ON TABLE public.orders TO authenticated;
GRANT ALL ON TABLE public.orders TO service_role;


--
-- Name: TABLE otp_codes; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.otp_codes TO anon;
GRANT ALL ON TABLE public.otp_codes TO authenticated;
GRANT ALL ON TABLE public.otp_codes TO service_role;


--
-- Name: TABLE pending_claims; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.pending_claims TO anon;
GRANT ALL ON TABLE public.pending_claims TO authenticated;
GRANT ALL ON TABLE public.pending_claims TO service_role;


--
-- Name: TABLE system_settings; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.system_settings TO anon;
GRANT ALL ON TABLE public.system_settings TO authenticated;
GRANT ALL ON TABLE public.system_settings TO service_role;


--
-- Name: TABLE users; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.users TO anon;
GRANT ALL ON TABLE public.users TO authenticated;
GRANT ALL ON TABLE public.users TO service_role;


--
-- Name: TABLE warranty_logs; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE public.warranty_logs TO anon;
GRANT ALL ON TABLE public.warranty_logs TO authenticated;
GRANT ALL ON TABLE public.warranty_logs TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON SEQUENCES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON FUNCTIONS TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE postgres IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO postgres;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES FOR ROLE supabase_admin IN SCHEMA public GRANT ALL ON TABLES TO service_role;


--
-- PostgreSQL database dump complete
--

\unrestrict NZjPt3zvi5fcE81nAfvTaTMpWxPfsiz4ioP5aU3rCgIrzRlA0EXpA9FJWYnUVV8

