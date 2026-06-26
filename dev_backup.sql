--
-- PostgreSQL database dump
--

\restrict Sh38YjzYAU4hQncXtBenfx1yBxHJ8Dw1DFfZJy6vCeGtLugRDKkLDoHDAafSObG

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

DROP POLICY IF EXISTS "Users read own warranty logs" ON "public"."warranty_logs";
DROP POLICY IF EXISTS "Users read own profile" ON "public"."users";
DROP POLICY IF EXISTS "Users read own orders" ON "public"."orders";
DROP POLICY IF EXISTS "Users read own order items" ON "public"."order_items";
DROP POLICY IF EXISTS "Users read own inventory" ON "public"."inventory";
DROP POLICY IF EXISTS "Service role can manage otp_codes" ON "public"."otp_codes";
DROP POLICY IF EXISTS "Public products viewable" ON "public"."products";
DROP POLICY IF EXISTS "Public Read Products" ON "public"."products";
DROP POLICY IF EXISTS "Public Read Categories" ON "public"."categories";
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."bot_templates";
DROP POLICY IF EXISTS "Enable all for admin" ON "public"."bot_templates";
DROP POLICY IF EXISTS "Allow public read on categories" ON "public"."categories";
DROP POLICY IF EXISTS "Admins read own" ON "public"."admins";
DROP POLICY IF EXISTS "Admins manage products" ON "public"."products";
DROP POLICY IF EXISTS "Admins manage orders" ON "public"."orders";
DROP POLICY IF EXISTS "Admins manage inventory" ON "public"."inventory";
ALTER TABLE IF EXISTS ONLY "public"."warranty_logs" DROP CONSTRAINT IF EXISTS "warranty_logs_order_item_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."warranty_logs" DROP CONSTRAINT IF EXISTS "warranty_logs_old_inventory_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."warranty_logs" DROP CONSTRAINT IF EXISTS "warranty_logs_new_inventory_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."products" DROP CONSTRAINT IF EXISTS "products_parent_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."products" DROP CONSTRAINT IF EXISTS "products_category_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."pending_claims" DROP CONSTRAINT IF EXISTS "pending_claims_order_item_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."otp_codes" DROP CONSTRAINT IF EXISTS "otp_codes_order_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."orders" DROP CONSTRAINT IF EXISTS "orders_user_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."order_items" DROP CONSTRAINT IF EXISTS "order_items_product_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."order_items" DROP CONSTRAINT IF EXISTS "order_items_order_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."order_items" DROP CONSTRAINT IF EXISTS "order_items_inventory_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."inventory" DROP CONSTRAINT IF EXISTS "inventory_product_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."inventory" DROP CONSTRAINT IF EXISTS "inventory_category_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_admin_id_fkey";
ALTER TABLE IF EXISTS ONLY "public"."admin_sessions" DROP CONSTRAINT IF EXISTS "admin_sessions_admin_id_fkey";
DROP TRIGGER IF EXISTS "fulfill_pending_claims_on_restock" ON "public"."inventory";
DROP INDEX IF EXISTS "public"."idx_warranty_logs_order_item_id";
DROP INDEX IF EXISTS "public"."idx_warranty_logs_old_inv_id";
DROP INDEX IF EXISTS "public"."idx_warranty_logs_new_inv_id";
DROP INDEX IF EXISTS "public"."idx_products_parent_id";
DROP INDEX IF EXISTS "public"."idx_products_category_id";
DROP INDEX IF EXISTS "public"."idx_pending_claims_order_item_id";
DROP INDEX IF EXISTS "public"."idx_outbox_queue";
DROP INDEX IF EXISTS "public"."idx_outbox_events_status";
DROP INDEX IF EXISTS "public"."idx_otp_codes_order_id";
DROP INDEX IF EXISTS "public"."idx_orders_user_id";
DROP INDEX IF EXISTS "public"."idx_orders_created_at";
DROP INDEX IF EXISTS "public"."idx_order_items_product_id";
DROP INDEX IF EXISTS "public"."idx_order_items_order_id";
DROP INDEX IF EXISTS "public"."idx_order_items_inventory_id";
DROP INDEX IF EXISTS "public"."idx_order_items_created_at";
DROP INDEX IF EXISTS "public"."idx_inventory_product_id";
DROP INDEX IF EXISTS "public"."idx_inventory_category_id";
DROP INDEX IF EXISTS "public"."idx_audit_logs_admin_id";
DROP INDEX IF EXISTS "public"."idx_admin_sessions_admin_id";
ALTER TABLE IF EXISTS ONLY "public"."warranty_logs" DROP CONSTRAINT IF EXISTS "warranty_logs_pkey";
ALTER TABLE IF EXISTS ONLY "public"."users" DROP CONSTRAINT IF EXISTS "users_telegram_chat_id_key";
ALTER TABLE IF EXISTS ONLY "public"."users" DROP CONSTRAINT IF EXISTS "users_pkey";
ALTER TABLE IF EXISTS ONLY "public"."users" DROP CONSTRAINT IF EXISTS "users_email_key";
ALTER TABLE IF EXISTS ONLY "public"."system_settings" DROP CONSTRAINT IF EXISTS "system_settings_pkey";
ALTER TABLE IF EXISTS ONLY "public"."products" DROP CONSTRAINT IF EXISTS "products_pkey";
ALTER TABLE IF EXISTS ONLY "public"."pending_claims" DROP CONSTRAINT IF EXISTS "pending_claims_pkey";
ALTER TABLE IF EXISTS ONLY "public"."outbox_events" DROP CONSTRAINT IF EXISTS "outbox_events_transaction_id_key";
ALTER TABLE IF EXISTS ONLY "public"."outbox_events" DROP CONSTRAINT IF EXISTS "outbox_events_pkey";
ALTER TABLE IF EXISTS ONLY "public"."otp_codes" DROP CONSTRAINT IF EXISTS "otp_codes_pkey";
ALTER TABLE IF EXISTS ONLY "public"."orders" DROP CONSTRAINT IF EXISTS "orders_pkey";
ALTER TABLE IF EXISTS ONLY "public"."orders" DROP CONSTRAINT IF EXISTS "orders_access_token_key";
ALTER TABLE IF EXISTS ONLY "public"."order_items" DROP CONSTRAINT IF EXISTS "order_items_pkey";
ALTER TABLE IF EXISTS ONLY "public"."login_attempts" DROP CONSTRAINT IF EXISTS "login_attempts_pkey";
ALTER TABLE IF EXISTS ONLY "public"."inventory" DROP CONSTRAINT IF EXISTS "inventory_pkey";
ALTER TABLE IF EXISTS ONLY "public"."categories" DROP CONSTRAINT IF EXISTS "categories_slug_key";
ALTER TABLE IF EXISTS ONLY "public"."categories" DROP CONSTRAINT IF EXISTS "categories_pkey";
ALTER TABLE IF EXISTS ONLY "public"."bot_templates" DROP CONSTRAINT IF EXISTS "bot_templates_pkey";
ALTER TABLE IF EXISTS ONLY "public"."bot_templates" DROP CONSTRAINT IF EXISTS "bot_templates_key_key";
ALTER TABLE IF EXISTS ONLY "public"."audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_pkey";
ALTER TABLE IF EXISTS ONLY "public"."admins" DROP CONSTRAINT IF EXISTS "admins_username_key";
ALTER TABLE IF EXISTS ONLY "public"."admins" DROP CONSTRAINT IF EXISTS "admins_pkey";
ALTER TABLE IF EXISTS ONLY "public"."admin_sessions" DROP CONSTRAINT IF EXISTS "admin_sessions_pkey";
DROP TABLE IF EXISTS "public"."warranty_logs";
DROP TABLE IF EXISTS "public"."users";
DROP TABLE IF EXISTS "public"."system_settings";
DROP TABLE IF EXISTS "public"."pending_claims";
DROP TABLE IF EXISTS "public"."otp_codes";
DROP TABLE IF EXISTS "public"."orders";
DROP TABLE IF EXISTS "public"."order_items";
DROP TABLE IF EXISTS "public"."login_attempts";
DROP TABLE IF EXISTS "public"."bot_templates";
DROP TABLE IF EXISTS "public"."audit_logs";
DROP TABLE IF EXISTS "public"."admins";
DROP TABLE IF EXISTS "public"."admin_sessions";
DROP VIEW IF EXISTS "public"."admin_product_summary_view";
DROP TABLE IF EXISTS "public"."products";
DROP TABLE IF EXISTS "public"."inventory";
DROP TABLE IF EXISTS "public"."categories";
DROP FUNCTION IF EXISTS "public"."trigger_fulfill_pending_claims"();
DROP FUNCTION IF EXISTS "public"."system_periodic_cleanup"();
DROP FUNCTION IF EXISTS "public"."rpc_update_system_settings"("p_admin_id" "uuid", "p_settings" "jsonb");
DROP FUNCTION IF EXISTS "public"."rpc_process_warranty_claim"("p_order_item_id" "uuid", "p_reason" "text");
DROP FUNCTION IF EXISTS "public"."rpc_get_variation_stock"("p_variation_id" "uuid");
DROP FUNCTION IF EXISTS "public"."rpc_delete_product_permanently"("p_product_id" "uuid");
DROP FUNCTION IF EXISTS "public"."rpc_claim_inventory"("p_order_item_id" "uuid");
DROP FUNCTION IF EXISTS "public"."rpc_bulk_insert_inventory"("p_admin_id" "uuid", "p_target_id" "uuid", "p_target_type" "text", "p_credentials_array" "text"[]);
DROP FUNCTION IF EXISTS "public"."rpc_archive_product"("p_admin_id" "uuid", "p_product_id" "uuid");
DROP FUNCTION IF EXISTS "public"."process_warranty_claim"("p_order_item_id" "uuid");
DROP FUNCTION IF EXISTS "public"."process_payment_fulfillment"("p_order_id" "uuid", "p_amount" numeric);
DROP FUNCTION IF EXISTS "public"."process_payment_fulfillment"("p_order_id" "uuid");
DROP FUNCTION IF EXISTS "public"."hold_inventory"("p_product_id" "uuid");
DROP FUNCTION IF EXISTS "public"."get_pending_outbox_events"("batch_size" integer);
DROP TABLE IF EXISTS "public"."outbox_events";
DROP FUNCTION IF EXISTS "public"."check_cooldown_validity"("last_claim_time" timestamp with time zone, "cooldown_val" integer, "cooldown_unit" "public"."cooldown_unit_enum");
DROP FUNCTION IF EXISTS "public"."check_cooldown_validity"("p_order_item_id" "uuid");
DROP TYPE IF EXISTS "public"."inventory_status_enum";
DROP TYPE IF EXISTS "public"."cooldown_unit_enum";
DROP SCHEMA IF EXISTS "public";
--
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA "public";


ALTER SCHEMA "public" OWNER TO "pg_database_owner";

--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: cooldown_unit_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."cooldown_unit_enum" AS ENUM (
    'hours',
    'days',
    'months'
);


ALTER TYPE "public"."cooldown_unit_enum" OWNER TO "postgres";

--
-- Name: inventory_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE "public"."inventory_status_enum" AS ENUM (
    'Available',
    'Hold',
    'Used',
    'Revoked',
    'Needs Manual Refund'
);


ALTER TYPE "public"."inventory_status_enum" OWNER TO "postgres";

--
-- Name: check_cooldown_validity("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."check_cooldown_validity"("p_order_item_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."check_cooldown_validity"("p_order_item_id" "uuid") OWNER TO "postgres";

--
-- Name: check_cooldown_validity(timestamp with time zone, integer, "public"."cooldown_unit_enum"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."check_cooldown_validity"("last_claim_time" timestamp with time zone, "cooldown_val" integer, "cooldown_unit" "public"."cooldown_unit_enum") RETURNS boolean
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."check_cooldown_validity"("last_claim_time" timestamp with time zone, "cooldown_val" integer, "cooldown_unit" "public"."cooldown_unit_enum") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: outbox_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."outbox_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_type" character varying(100) NOT NULL,
    "payload" "jsonb" NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "error_message" "text",
    "retry_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "transaction_id" character varying(255),
    "next_retry_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."outbox_events" OWNER TO "postgres";

--
-- Name: get_pending_outbox_events(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."get_pending_outbox_events"("batch_size" integer) RETURNS SETOF "public"."outbox_events"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."get_pending_outbox_events"("batch_size" integer) OWNER TO "postgres";

--
-- Name: hold_inventory("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."hold_inventory"("p_product_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."hold_inventory"("p_product_id" "uuid") OWNER TO "postgres";

--
-- Name: process_payment_fulfillment("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."process_payment_fulfillment"("p_order_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."process_payment_fulfillment"("p_order_id" "uuid") OWNER TO "postgres";

--
-- Name: process_payment_fulfillment("uuid", numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."process_payment_fulfillment"("p_order_id" "uuid", "p_amount" numeric) RETURNS character varying
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."process_payment_fulfillment"("p_order_id" "uuid", "p_amount" numeric) OWNER TO "postgres";

--
-- Name: process_warranty_claim("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."process_warranty_claim"("p_order_item_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."process_warranty_claim"("p_order_item_id" "uuid") OWNER TO "postgres";

--
-- Name: rpc_archive_product("uuid", "uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."rpc_archive_product"("p_admin_id" "uuid", "p_product_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.products SET is_archived = true WHERE id = p_product_id;
    
    INSERT INTO public.audit_logs (admin_id, action, details)
    VALUES (p_admin_id, 'archive_product', jsonb_build_object('product_id', p_product_id));
END;
$$;


ALTER FUNCTION "public"."rpc_archive_product"("p_admin_id" "uuid", "p_product_id" "uuid") OWNER TO "postgres";

--
-- Name: rpc_bulk_insert_inventory("uuid", "uuid", "text", "text"[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."rpc_bulk_insert_inventory"("p_admin_id" "uuid", "p_target_id" "uuid", "p_target_type" "text", "p_credentials_array" "text"[]) RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$ DECLARE v_inserted_count INTEGER; BEGIN IF p_target_type = 'category' THEN WITH inserted AS ( INSERT INTO public.inventory (category_id, credential_data, status) SELECT p_target_id, cred, 'Available' FROM unnest(p_credentials_array) AS cred RETURNING 1 ) SELECT count(*) INTO v_inserted_count FROM inserted; ELSE WITH inserted AS ( INSERT INTO public.inventory (product_id, credential_data, status) SELECT p_target_id, cred, 'Available' FROM unnest(p_credentials_array) AS cred RETURNING 1 ) SELECT count(*) INTO v_inserted_count FROM inserted; END IF; INSERT INTO public.audit_logs (admin_id, action, details) VALUES ( p_admin_id, 'BULK_INSERT_INVENTORY', jsonb_build_object( 'target_id', p_target_id, 'target_type', p_target_type, 'inserted_count', v_inserted_count ) ); RETURN v_inserted_count; END; $$;


ALTER FUNCTION "public"."rpc_bulk_insert_inventory"("p_admin_id" "uuid", "p_target_id" "uuid", "p_target_type" "text", "p_credentials_array" "text"[]) OWNER TO "postgres";

--
-- Name: rpc_claim_inventory("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."rpc_claim_inventory"("p_order_item_id" "uuid") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."rpc_claim_inventory"("p_order_item_id" "uuid") OWNER TO "postgres";

--
-- Name: rpc_delete_product_permanently("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."rpc_delete_product_permanently"("p_product_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM public.inventory 
    WHERE status = 'Available' 
      AND (product_id = p_product_id OR product_id IN (SELECT id FROM public.products WHERE parent_id = p_product_id));

    DELETE FROM public.products WHERE id = p_product_id;
END;
$$;


ALTER FUNCTION "public"."rpc_delete_product_permanently"("p_product_id" "uuid") OWNER TO "postgres";

--
-- Name: rpc_get_variation_stock("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."rpc_get_variation_stock"("p_variation_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."rpc_get_variation_stock"("p_variation_id" "uuid") OWNER TO "postgres";

--
-- Name: rpc_process_warranty_claim("uuid", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."rpc_process_warranty_claim"("p_order_item_id" "uuid", "p_reason" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."rpc_process_warranty_claim"("p_order_item_id" "uuid", "p_reason" "text") OWNER TO "postgres";

--
-- Name: rpc_update_system_settings("uuid", "jsonb"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."rpc_update_system_settings"("p_admin_id" "uuid", "p_settings" "jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."rpc_update_system_settings"("p_admin_id" "uuid", "p_settings" "jsonb") OWNER TO "postgres";

--
-- Name: system_periodic_cleanup(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."system_periodic_cleanup"() RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
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


ALTER FUNCTION "public"."system_periodic_cleanup"() OWNER TO "postgres";

--
-- Name: trigger_fulfill_pending_claims(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION "public"."trigger_fulfill_pending_claims"() RETURNS "trigger"
    LANGUAGE "plpgsql"
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


ALTER FUNCTION "public"."trigger_fulfill_pending_claims"() OWNER TO "postgres";

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255) NOT NULL,
    "slug" character varying(255) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "thumbnail_url" "text",
    "description" "text"
);


ALTER TABLE "public"."categories" OWNER TO "postgres";

--
-- Name: inventory; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."inventory" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "product_id" "uuid",
    "credential_data" "text" NOT NULL,
    "status" "public"."inventory_status_enum" DEFAULT 'Available'::"public"."inventory_status_enum",
    "reserved_until" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "category_id" "uuid"
);


ALTER TABLE "public"."inventory" OWNER TO "postgres";

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "category_id" "uuid",
    "name" character varying(255) NOT NULL,
    "price" numeric(10,2) NOT NULL,
    "description" "text",
    "warranty_days" integer DEFAULT 0,
    "max_claim_limit" integer DEFAULT 0,
    "cooldown_value" integer DEFAULT 0,
    "cooldown_unit" "public"."cooldown_unit_enum" DEFAULT 'hours'::"public"."cooldown_unit_enum",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_archived" boolean DEFAULT false,
    "thumbnail_url" character varying(1000),
    "parent_id" "uuid",
    "is_sync_stock" boolean DEFAULT false
);


ALTER TABLE "public"."products" OWNER TO "postgres";

--
-- Name: admin_product_summary_view; Type: VIEW; Schema: public; Owner: postgres
--

CREATE VIEW "public"."admin_product_summary_view" AS
 SELECT "p"."id",
    "p"."name",
    "p"."description",
    "p"."thumbnail_url",
    "p"."category_id",
    "c"."name" AS "category_name",
    "p"."price" AS "base_price",
    "p"."warranty_days",
    "p"."max_claim_limit",
    "p"."is_archived",
    "p"."is_sync_stock",
    "p"."created_at",
    (0)::numeric AS "min_variation_price",
    (0)::numeric AS "max_variation_price",
    (0)::bigint AS "variation_count",
    ( SELECT "count"(*) AS "count"
           FROM "public"."inventory" "i"
          WHERE ((("p"."is_sync_stock" = true) AND ("i"."category_id" = "p"."category_id") AND ("i"."product_id" IS NULL) AND ("i"."status" = 'Available'::"public"."inventory_status_enum")) OR ((("p"."is_sync_stock" = false) OR ("p"."is_sync_stock" IS NULL)) AND ("i"."product_id" = "p"."id") AND ("i"."status" = 'Available'::"public"."inventory_status_enum")))) AS "total_stock",
    ( SELECT "count"(*) AS "count"
           FROM "public"."inventory" "i"
          WHERE ((("p"."is_sync_stock" = true) AND ("i"."category_id" = "p"."category_id") AND ("i"."product_id" IS NULL) AND ("i"."status" = 'Used'::"public"."inventory_status_enum")) OR ((("p"."is_sync_stock" = false) OR ("p"."is_sync_stock" IS NULL)) AND ("i"."product_id" = "p"."id") AND ("i"."status" = 'Used'::"public"."inventory_status_enum")))) AS "sold_stock",
    ( SELECT "max"("i"."created_at") AS "max"
           FROM "public"."inventory" "i"
          WHERE ((("p"."is_sync_stock" = true) AND ("i"."category_id" = "p"."category_id") AND ("i"."product_id" IS NULL)) OR ((("p"."is_sync_stock" = false) OR ("p"."is_sync_stock" IS NULL)) AND ("i"."product_id" = "p"."id")))) AS "latest_restock"
   FROM ("public"."products" "p"
     LEFT JOIN "public"."categories" "c" ON (("p"."category_id" = "c"."id")));


ALTER VIEW "public"."admin_product_summary_view" OWNER TO "postgres";

--
-- Name: admin_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."admin_sessions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "admin_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL
);


ALTER TABLE "public"."admin_sessions" OWNER TO "postgres";

--
-- Name: admins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."admins" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "username" "text" NOT NULL,
    "password_hash" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admins" OWNER TO "postgres";

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."audit_logs" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "admin_id" "uuid",
    "action" "text" NOT NULL,
    "details" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";

--
-- Name: bot_templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."bot_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" character varying(255) NOT NULL,
    "name" character varying(255) NOT NULL,
    "content_html" "text" NOT NULL,
    "variables_hint" "text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."bot_templates" OWNER TO "postgres";

--
-- Name: login_attempts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."login_attempts" (
    "ip_address" "text" NOT NULL,
    "attempts" integer DEFAULT 1,
    "last_attempt" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."login_attempts" OWNER TO "postgres";

--
-- Name: order_items; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."order_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "inventory_id" "uuid",
    "warranty_end_date" timestamp with time zone,
    "current_claim_count" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "cooldown_bypass_active" boolean DEFAULT false,
    "product_id" "uuid" NOT NULL,
    "max_claim_limit" integer DEFAULT 1 NOT NULL
);


ALTER TABLE "public"."order_items" OWNER TO "postgres";

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "total_amount" numeric(10,2) NOT NULL,
    "payment_status" character varying(50) DEFAULT 'pending'::character varying,
    "delivery_status" character varying(50) DEFAULT 'pending'::character varying,
    "platform_source" character varying(50),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "access_token" "uuid" DEFAULT "gen_random_uuid"(),
    "email" character varying(255),
    "qris_string" "text",
    "payment_expired_at" timestamp with time zone
);


ALTER TABLE "public"."orders" OWNER TO "postgres";

--
-- Name: otp_codes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."otp_codes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "email" character varying(255) NOT NULL,
    "code" character varying(6) NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "used_at" timestamp with time zone
);


ALTER TABLE "public"."otp_codes" OWNER TO "postgres";

--
-- Name: pending_claims; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."pending_claims" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_item_id" "uuid" NOT NULL,
    "status" character varying(50) DEFAULT 'pending'::character varying,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."pending_claims" OWNER TO "postgres";

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."system_settings" (
    "key" character varying(255) NOT NULL,
    "value" "text" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."system_settings" OWNER TO "postgres";

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."users" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255),
    "telegram_chat_id" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."users" OWNER TO "postgres";

--
-- Name: warranty_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE "public"."warranty_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_item_id" "uuid",
    "old_inventory_id" "uuid",
    "new_inventory_id" "uuid",
    "delivery_status" character varying(50) DEFAULT 'pending'::character varying,
    "claimed_at" timestamp with time zone DEFAULT "now"(),
    "reason" "text"
);


ALTER TABLE "public"."warranty_logs" OWNER TO "postgres";

--
-- Data for Name: admin_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."admin_sessions" ("id", "admin_id", "created_at", "expires_at") FROM stdin;
a1ed11b3-153c-4ea0-8c95-a54950b6ff59	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-22 23:39:45.126635+00	2026-06-23 23:39:45.153+00
3bf29a76-ebaa-4f6a-b733-909c5ae2806c	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 04:52:47.512814+00	2026-06-24 04:52:47.541+00
887cf7e1-e7e9-4d8d-8827-57ea67e71ea2	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 04:52:52.76706+00	2026-06-24 04:52:52.8+00
4b6da5db-aa55-435f-a0e2-d364488dc7e2	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 04:52:58.021554+00	2026-06-24 04:52:58.055+00
99b26288-e624-45e0-b948-8b5daba960e2	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 04:53:03.293041+00	2026-06-24 04:53:03.322+00
2f0d0715-ff2a-4673-aa1c-b56348758cca	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 04:55:49.053125+00	2026-06-24 04:55:49.084+00
88d92236-23c3-49c5-b309-83dc5600ed8c	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 04:55:56.329927+00	2026-06-24 04:55:56.359+00
0d3f597f-0456-41a4-9708-f028e49fd694	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 04:56:04.076536+00	2026-06-24 04:56:04.113+00
364706e4-5fce-4bc7-a44d-f9faa26fc81a	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 04:56:10.824921+00	2026-06-24 04:56:10.858+00
c5ca37e7-d5e7-4508-b1c9-8f432698edff	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 04:56:57.188107+00	2026-06-24 04:56:57.213+00
d61fbf2a-e5a5-4acf-aa49-362d988d3efe	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 04:57:04.744493+00	2026-06-24 04:57:04.778+00
af4f7aa3-4a09-44f7-bd79-286867e3cf5b	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 04:57:08.880357+00	2026-06-24 04:57:08.909+00
358efc79-c591-40bc-817b-f5d91a2a51a3	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 04:57:16.472178+00	2026-06-24 04:57:16.499+00
cf65ff08-af4e-4b23-a7a9-86fe3ea9299b	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 04:58:20.741367+00	2026-06-24 04:58:20.773+00
8add0c1a-89c5-4ec3-856c-1a2f33e00480	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 04:58:24.438874+00	2026-06-24 04:58:24.468+00
9e8d0224-f2c7-441f-9e80-02848628a716	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 04:58:28.505925+00	2026-06-24 04:58:28.538+00
f5d5fbc9-f8ec-43aa-a6fe-a092a6d9eb15	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 04:58:32.211659+00	2026-06-24 04:58:32.241+00
6ed428c0-5cee-4f64-a9ec-9a938b26e93a	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:00:07.332423+00	2026-06-24 05:00:07.351+00
2d3d749a-b5e2-4862-9268-35f51880e9dd	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:00:12.391035+00	2026-06-24 05:00:12.415+00
e59a2866-5363-4cab-a042-4f4274743bb4	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:00:21.974742+00	2026-06-24 05:00:21.999+00
f8c3547d-0a7b-49e7-82af-e4cfc00d93b2	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:00:25.731197+00	2026-06-24 05:00:25.759+00
10574c57-76ca-44e3-b8f9-f30c9daecc20	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:01:07.224271+00	2026-06-24 05:01:07.253+00
2fdf881f-22ae-408e-94e9-48aa52a4613e	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:01:11.150545+00	2026-06-24 05:01:11.177+00
d8a228c8-4919-4cc8-8d26-20f8ce0c3e31	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:01:21.898394+00	2026-06-24 05:01:21.926+00
347dd437-9200-413f-9870-4b024c5327ab	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:01:25.659709+00	2026-06-24 05:01:25.689+00
538174d6-de87-40eb-9cda-df2382580d30	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:02:38.850467+00	2026-06-24 05:02:38.876+00
5b4b96ce-6f1d-4b40-8ca0-8c69a80aab5f	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:02:42.789218+00	2026-06-24 05:02:42.816+00
94d23120-701b-4592-b40b-48ac31ffd8e6	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:02:56.293689+00	2026-06-24 05:02:56.308+00
4b51fc99-1a54-4dea-bb6d-74b04a90ebe0	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:02:59.757046+00	2026-06-24 05:02:59.784+00
14c20706-014f-40e8-ad05-c5f4bb3fc4b8	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:04:55.793511+00	2026-06-24 05:04:55.817+00
be5e472c-3907-4a38-a05e-c21a7e883022	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:04:59.670105+00	2026-06-24 05:04:59.692+00
28e97de8-a26f-4955-8b58-6ddd6e974989	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:05:05.706577+00	2026-06-24 05:05:05.732+00
ed0d022a-e994-44fe-a1d3-f97bfb8aca6b	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:05:09.257526+00	2026-06-24 05:05:09.281+00
818df19f-768b-4117-b0e9-7e389c7a75c2	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:06:06.039993+00	2026-06-24 05:06:06.063+00
d06a3b35-5b5d-40ea-b905-fb04358d421e	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:06:09.82063+00	2026-06-24 05:06:09.844+00
4b4ff3dc-7091-4435-b219-ca9bb5794432	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:06:26.302572+00	2026-06-24 05:06:26.322+00
9197532b-8972-4fa6-92aa-9a151c21e221	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:06:30.106362+00	2026-06-24 05:06:30.126+00
e170ec8a-5913-4b66-8be5-e2dfd594743a	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:07:43.730691+00	2026-06-24 05:07:43.756+00
fb6a1b79-edc4-4631-9678-a6bbceef8140	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:07:47.523003+00	2026-06-24 05:07:47.545+00
e0296720-e0bc-435f-9636-24fca9f1a7bf	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:08:00.904284+00	2026-06-24 05:08:00.927+00
3c76c8f7-e9cf-4fec-a98f-694a33e19128	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:08:04.630931+00	2026-06-24 05:08:04.653+00
02101b1b-5f42-4fc6-9e8c-16d564efe53b	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:09:11.50026+00	2026-06-24 05:09:11.525+00
c013ba0b-3aa2-424c-bed3-18b92e19740b	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:09:15.275159+00	2026-06-24 05:09:15.296+00
d7b05de3-3992-4387-b0f5-7191af78a3bf	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:09:28.822486+00	2026-06-24 05:09:28.843+00
bf83467c-a45b-4279-9fc1-b62ef32dfa80	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:09:32.558903+00	2026-06-24 05:09:32.578+00
0f001a34-f27a-49fe-9064-e6659a5c8517	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:14:51.841621+00	2026-06-24 05:14:51.86+00
58089b64-c305-4a00-9845-dae999bb122a	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:14:55.818488+00	2026-06-24 05:14:55.843+00
24a3378b-ca99-4204-b18b-50f504af8274	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:15:05.980014+00	2026-06-24 05:15:05.999+00
6aaa22a1-9863-4e1a-ad06-00d419c84257	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:15:09.703283+00	2026-06-24 05:15:09.724+00
a79680c8-0ed4-410e-8c14-685943d9c182	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:18:42.615601+00	2026-06-24 05:18:42.632+00
ec24f36e-53b4-4789-b3e6-b69f558d8435	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:18:46.749343+00	2026-06-24 05:18:46.765+00
33ffe4ef-faac-483b-8130-8993c65edd12	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:18:55.644367+00	2026-06-24 05:18:55.669+00
3c6d9182-3743-43c2-9951-7fcdc404d741	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:18:59.388055+00	2026-06-24 05:18:59.412+00
fd334149-95c1-4826-a21f-c5ea64919305	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:21:05.620217+00	2026-06-24 05:21:05.642+00
62806358-0abe-4f96-a004-bd63365d277b	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:21:09.595684+00	2026-06-24 05:21:09.617+00
d1b2f9b9-e78f-4b13-afa1-8f1b6c24aee9	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:21:18.926522+00	2026-06-24 05:21:18.952+00
bc98d080-efba-46fb-8aec-fc3fb6e6aa33	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:21:22.555476+00	2026-06-24 05:21:22.58+00
80a10bbd-4400-49ff-9658-df379c3ccd21	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:26:45.24987+00	2026-06-24 05:26:45.274+00
53f23b15-21ad-40c7-9765-806f42cea2f2	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:26:49.449387+00	2026-06-24 05:26:49.473+00
2447708e-2ae5-4579-9a2d-ac0fea232755	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:26:59.23207+00	2026-06-24 05:26:59.257+00
fff18da6-b4a8-4909-b308-8ba96117aa20	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 05:27:02.992852+00	2026-06-24 05:27:03.02+00
8ce120ba-a4b9-46a4-ad91-686ad7c43f90	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:32:04.785137+00	2026-06-24 16:32:04.811+00
58c2dd33-ab0f-4ea2-86ff-394ee0a63a58	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:32:09.821688+00	2026-06-24 16:32:09.853+00
d4c7e59f-71c3-4f54-be9d-082b2b6917dd	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:32:14.900591+00	2026-06-24 16:32:14.924+00
58396317-9545-4588-a3b5-102ce8e94f7a	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:32:19.930406+00	2026-06-24 16:32:19.952+00
e8a4e417-10c5-4a9a-ad9b-9e7faa0a83bf	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:32:25.007905+00	2026-06-24 16:32:25.031+00
3b4d1ef1-3d5b-40b3-9384-f32e2f5a0c39	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:32:30.010693+00	2026-06-24 16:32:30.024+00
0d0461d3-a981-42bc-a04c-ba6db343947f	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:32:35.04154+00	2026-06-24 16:32:35.05+00
9cee29bc-b271-47df-9670-0a28af543f4a	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:32:40.625769+00	2026-06-24 16:32:40.596+00
bccfc444-81e8-4e3f-900f-8833cdce7f09	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:32:46.569375+00	2026-06-24 16:32:46.6+00
106a2655-bf08-47a3-9c5a-3f116bc93d1d	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:32:51.642754+00	2026-06-24 16:32:51.669+00
af87bd0d-fe36-4989-9a9d-82df48d2ceec	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:32:56.851199+00	2026-06-24 16:32:56.877+00
5273ba46-177e-4485-a0b7-8b7735598532	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:33:01.885318+00	2026-06-24 16:33:01.918+00
4316ecbc-c4bc-44e3-b23b-fcdd54dca79c	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:33:07.005734+00	2026-06-24 16:33:07.039+00
3c489d5e-4f4e-404f-862b-051d0c424977	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:33:12.033494+00	2026-06-24 16:33:12.061+00
9842589f-f6c7-4c12-a31e-0227e636510e	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:33:12.967042+00	2026-06-24 16:33:12.991+00
b2e0ed9a-6f9f-44c5-a784-9a90150bb185	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:34:27.719873+00	2026-06-24 16:34:27.721+00
d380bc40-8106-4333-af02-ba1fd7dceec4	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:35:03.552871+00	2026-06-24 16:35:03.581+00
74ffe09a-2e45-4624-be73-1730d73750d1	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:37:38.512398+00	2026-06-24 16:37:38.532+00
34f89c62-e803-4e70-8f81-d857b121f77a	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:37:53.579342+00	2026-06-24 16:37:53.607+00
d6045436-de8a-454b-afd8-f07ee76c9d36	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:39:05.355699+00	2026-06-24 16:39:05.365+00
99a73548-eabd-45b2-af53-a3b6714ca613	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:39:30.708428+00	2026-06-24 16:39:30.743+00
64533a9c-be95-4299-bdbb-2b7487f7d6ef	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:43:04.382898+00	2026-06-24 16:43:04.409+00
cfb37587-67f8-47b5-8554-a3eb21fe6097	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:43:24.912135+00	2026-06-24 16:43:24.927+00
77710c2e-6b36-48cd-860d-27b4092be1ac	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:46:14.109327+00	2026-06-24 16:46:14.117+00
06085b0e-4eaf-49b2-a3a2-e8402d4b0386	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:46:34.946208+00	2026-06-24 16:46:34.953+00
53e230f0-6bc5-49e7-be19-d60a7a0a20fb	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:48:24.709126+00	2026-06-24 16:48:24.712+00
4257846a-64e7-4ea7-926e-1700406278bb	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:49:38.397267+00	2026-06-24 16:49:38.397+00
b9641108-7a24-4d43-a350-05fd64a21cd2	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:50:33.092801+00	2026-06-24 16:50:33.085+00
ed341bf7-103b-4bec-806f-8c502d7d4914	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 16:51:31.781446+00	2026-06-24 16:51:31.77+00
e5562fd4-15d4-4b8b-b199-47b825f2bfbe	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 18:04:25.854234+00	2026-06-24 18:04:25.859+00
d6e97462-6f23-499c-a6c2-a9292003c7ed	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 18:06:12.0433+00	2026-06-24 18:06:12.056+00
e593276c-d43d-4c9e-988d-2fdc3a6f966b	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 19:08:45.793891+00	2026-06-24 19:08:45.794+00
106d6c7d-c981-4a2b-9c17-23221561a26b	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 19:09:53.889409+00	2026-06-24 19:09:53.878+00
0491cb64-2a65-43c4-a791-b8a5e0cf44f2	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 19:54:47.614607+00	2026-06-24 19:54:47.603+00
8ad7402e-bc58-4b4e-948e-8952454c9670	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 19:56:47.203267+00	2026-06-24 19:56:47.207+00
ab1c03a2-7a2d-4c86-ac5f-5c73a3c09efe	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 19:59:04.403758+00	2026-06-24 19:59:04.411+00
441994a5-bd26-44e5-9f2c-60c0f7f2285a	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 20:06:54.026791+00	2026-06-24 20:06:54.017+00
10c911a4-f9fa-4ce8-a8a6-20f04701f3de	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 20:10:14.770293+00	2026-06-24 20:10:14.755+00
e9938788-305a-48d6-8ec5-8aed3b2b1a72	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 20:44:47.595025+00	2026-06-24 20:44:47.563+00
8389ca8c-3c47-49dc-bd07-275963b67a6c	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 20:45:43.787198+00	2026-06-24 20:45:43.763+00
ba22b3e3-4f91-4648-85bf-7c121a6b5f68	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 20:47:23.13+00	2026-06-24 20:47:23.124+00
e7db4717-668b-43e9-8728-541957260c51	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 20:50:30.378656+00	2026-06-24 20:50:30.372+00
aef974fb-97b7-4d43-ac77-bd4f89171479	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	2026-06-23 20:52:13.631539+00	2026-06-24 20:52:13.614+00
504caff4-b77b-4033-ae53-d1b7fa59df3a	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-23 23:40:06.780108+00	2026-06-24 23:40:06.77+00
7aa87043-86a8-4091-85fb-4add4f074966	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-25 01:13:46.863109+00	2026-06-26 01:13:46.812+00
7db645d3-8c01-40c6-9127-d007fedfc219	fe5c8479-83e8-4771-b3cf-de99483f0ffc	2026-06-25 05:35:22.276818+00	2026-06-26 05:35:22.292+00
\.


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."admins" ("id", "username", "password_hash", "created_at") FROM stdin;
fe5c8479-83e8-4771-b3cf-de99483f0ffc	bryannv	$2b$10$GQM9GJSrZch6dhTPSnGtB.5DwLNSEYM3PVMmuYQQOuYX4iWyhF6eG	2026-06-22 23:37:49.780502+00
a17d0f03-1edd-426c-9ad3-eefdcb104cb2	admin	$2b$10$8sAQMSREcaBqPl4/v./yDOD6.VnxhFL/tOe4GDwmJy43y3xUw5ad.	2026-06-23 16:31:54.635106+00
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."audit_logs" ("id", "admin_id", "action", "details", "created_at") FROM stdin;
8c192992-5378-46cf-b1c8-6341dca046fa	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	delete_category	{"category_id": "ec9c569c-2703-4c3b-ba20-c69678c32fcd"}	2026-06-23 16:37:44.758768+00
6c4c43ab-6f9d-483a-94b5-b1fe90091d37	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	archive_product	{"product_id": "5279b579-be00-4bf0-823c-23434fb2fd38"}	2026-06-23 16:39:35.536769+00
7c500beb-4223-4bed-82f5-c5dd09b0d348	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	restore_product	{"product_id": "5279b579-be00-4bf0-823c-23434fb2fd38"}	2026-06-23 16:39:35.734294+00
7026f55d-5594-4c91-a472-755fcecc9b83	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	archive_product	{"product_id": "5279b579-be00-4bf0-823c-23434fb2fd38"}	2026-06-23 16:39:44.756355+00
a5cb0f28-e62b-434e-b063-a584ed39285d	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	restore_product	{"product_id": "5279b579-be00-4bf0-823c-23434fb2fd38"}	2026-06-23 16:39:44.961025+00
d45b7392-28ea-47c6-b2ea-f6cb2f3ed6c8	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	delete_category	{"category_id": "b23e4373-495a-4054-975c-14be113d0396"}	2026-06-23 16:43:10.247359+00
da442be2-a72a-49b8-a2f7-5b407212ff80	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	archive_product	{"product_id": "e769a8df-6869-4d81-90e4-12027d70ef1c"}	2026-06-23 16:43:25.650428+00
7a7fe395-affa-44bc-9e84-a752863803b1	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	restore_product	{"product_id": "e769a8df-6869-4d81-90e4-12027d70ef1c"}	2026-06-23 16:43:25.823444+00
6c5a864b-4be4-4440-81da-77f7ca0c44c1	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	archive_product	{"product_id": "e769a8df-6869-4d81-90e4-12027d70ef1c"}	2026-06-23 16:43:31.408932+00
e0f1100b-9caf-4430-8b20-8f0bfc04c824	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	restore_product	{"product_id": "e769a8df-6869-4d81-90e4-12027d70ef1c"}	2026-06-23 16:43:31.573695+00
18800785-1afe-472e-a4cd-1036dd0c2422	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	delete_category	{"category_id": "8feb7027-f22d-48d9-be38-4a376a2f5475"}	2026-06-23 16:46:19.895613+00
45e6aa33-899c-4577-97c8-25025f299cce	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	archive_product	{"product_id": "4a255af2-7f0f-44fd-ab0e-8d1eb324b454"}	2026-06-23 16:46:35.764005+00
94ef7027-4c15-4c4b-bfc4-e53ec0d58742	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	restore_product	{"product_id": "4a255af2-7f0f-44fd-ab0e-8d1eb324b454"}	2026-06-23 16:46:35.937775+00
45d7983b-cc1c-4170-a38c-9820a5a1d4cf	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	archive_product	{"product_id": "4a255af2-7f0f-44fd-ab0e-8d1eb324b454"}	2026-06-23 16:46:37.126056+00
15f2a37d-6f28-496d-8e28-b12e5dbb3692	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	restore_product	{"product_id": "4a255af2-7f0f-44fd-ab0e-8d1eb324b454"}	2026-06-23 16:46:37.339689+00
7ed17057-db34-4cf0-a4c5-eb86db986c3c	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	delete_category	{"category_id": "bbae08a2-6ea4-4c57-a7eb-5aafe7e2e43d"}	2026-06-23 16:48:30.434857+00
c6c0f214-4a63-4729-a340-80e14e979a22	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	delete_category	{"category_id": "f2e3f048-d232-4a84-8793-6a0e81d6ad4c"}	2026-06-23 16:49:44.198381+00
d166de78-2942-4da7-b9fb-ba0a258d710d	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	delete_category	{"category_id": "97ad25c6-e110-4719-9ded-7d71ebd8e5a0"}	2026-06-23 16:50:38.97745+00
eccac771-f573-4a06-9945-1e94e6e51f9a	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	create_category	{"name": "Software Tools", "slug": "software-tools", "category_id": "f6e2ea08-c477-44d5-a4dc-9973948bf36e"}	2026-06-23 16:51:33.955864+00
935a2c71-52f0-48d2-b312-c3f7f1e6055d	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	delete_category	{"category_id": "c40a002b-f8ae-4c07-8da8-64b82e136abd"}	2026-06-23 16:51:34.55195+00
fbb59dca-e8b9-453a-acef-aa766bfc26be	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	create_category	{"name": "Temp Cat Desktop", "slug": "temp-cat-desktop", "category_id": "526e9c1f-1ab0-4f99-a215-debe0d092f5b"}	2026-06-23 16:51:35.612872+00
f3ebc80e-dee3-4790-9b3a-397210ce5736	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	delete_category	{"category_id": "526e9c1f-1ab0-4f99-a215-debe0d092f5b"}	2026-06-23 16:51:35.894614+00
7c03898d-1bea-4931-98cd-521337a742d7	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	create_category	{"name": "Mobile Category", "slug": "mobile-cat", "category_id": "961e7b9c-9af9-4bcc-8206-ae2729afa4c2"}	2026-06-23 16:51:37.141781+00
ec7268a7-2517-4174-a475-dc5c10f86912	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	delete_category	{"category_id": "961e7b9c-9af9-4bcc-8206-ae2729afa4c2"}	2026-06-23 16:51:37.397698+00
a91015ab-1657-4fed-826a-497f35b75050	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	create_product	{"name": "Std Prod 1782237872513", "product_id": "9d09cc09-dd02-4146-927e-1c16e719d69e", "hasVariations": false}	2026-06-23 18:04:34.329993+00
1a9645a1-5f4a-43de-bd6f-94d9d55a601a	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	create_product	{"name": "Var Prod 1782237878933", "product_id": "7bbdd7d1-6478-4797-9730-9580a895ea38", "hasVariations": true}	2026-06-23 18:04:41.367614+00
ad078558-025d-409d-ad3b-24e5d6e9f53f	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	create_variation	{"name": "1 Bulan", "parent_id": "7bbdd7d1-6478-4797-9730-9580a895ea38", "variation_id": "bd504616-e2dd-4550-84c9-4c5f7a73e485"}	2026-06-23 18:04:41.415438+00
4ffc9c4c-fed2-461e-86c2-5a59a8690334	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	create_variation	{"name": "3 Bulan", "parent_id": "7bbdd7d1-6478-4797-9730-9580a895ea38", "variation_id": "198b7867-393c-40fd-a46a-88f34382e6c9"}	2026-06-23 18:04:41.415438+00
840c80b2-c4f7-47ee-910b-732e477b0520	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	create_product	{"name": "Mob Prod 1782237890405", "product_id": "21b61ea4-951b-4299-ba67-b53a124af373", "hasVariations": true}	2026-06-23 18:04:53.362992+00
a6702797-c171-4a0e-9765-789d2f534933	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	create_variation	{"name": "Premium", "parent_id": "21b61ea4-951b-4299-ba67-b53a124af373", "variation_id": "ff002a64-29b2-4471-90bb-c540da8ab878"}	2026-06-23 18:04:53.418603+00
f924ec50-2201-48d4-95a2-bc3e4e2a1721	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	create_product	{"name": "Std Prod 1782237974605", "product_id": "771f5521-2a74-4f0f-9232-0e228c1b30c4", "hasVariations": false}	2026-06-23 18:06:16.417113+00
181e8f0c-bf95-4597-bce4-8d26775eb5ac	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	create_product	{"name": "Var Prod 1782237976972", "product_id": "369f3a8e-a60e-467f-9738-e042ee1f4001", "hasVariations": true}	2026-06-23 18:06:19.487364+00
01db0e8a-f93a-42cf-9633-89990bdfeda9	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	create_variation	{"name": "1 Bulan", "parent_id": "369f3a8e-a60e-467f-9738-e042ee1f4001", "variation_id": "49bf3d85-1609-4400-83fb-e18fde2dde52"}	2026-06-23 18:06:19.534458+00
47d96a4d-fd7c-462e-89be-6ec3cf898e7a	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	create_variation	{"name": "3 Bulan", "parent_id": "369f3a8e-a60e-467f-9738-e042ee1f4001", "variation_id": "531e5f13-125e-426b-9c9a-d5dd6567e237"}	2026-06-23 18:06:19.534458+00
4ee7cf1a-d981-45a5-b176-597afbfdc82e	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	create_product	{"name": "Mob Prod 1782237980444", "product_id": "637ff9a9-7a21-4085-bf86-eacb2470c359", "hasVariations": true}	2026-06-23 18:06:21.649521+00
5bd1fa43-1338-4219-8383-5f5c3c87e666	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	create_variation	{"name": "Premium", "parent_id": "637ff9a9-7a21-4085-bf86-eacb2470c359", "variation_id": "4973c6e0-fa84-4688-9554-b3740a02ddbf"}	2026-06-23 18:06:21.708682+00
20cff6a0-8fc6-43b0-bbde-6b5c29eecb36	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "60a0f20b-d756-440b-a029-522289bf5f97", "inserted_count": 2}	2026-06-23 19:08:54.709192+00
1e651ab3-f462-4fd2-a9ab-b2ae945bd025	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "60a0f20b-d756-440b-a029-522289bf5f97", "inserted_count": 1}	2026-06-23 19:08:56.217191+00
329d62b2-2576-443f-acee-6b51bea2b253	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "60a0f20b-d756-440b-a029-522289bf5f97", "inserted_count": 1}	2026-06-23 19:09:00.750786+00
28d2dff3-75a1-4446-885a-80592e4ebaa2	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "18eacfd3-bd46-4947-8033-b7503d0fae1a", "inserted_count": 2}	2026-06-23 19:09:58.757739+00
4331d311-ba51-4e37-9c9a-5f8112226ed8	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "18eacfd3-bd46-4947-8033-b7503d0fae1a", "inserted_count": 1}	2026-06-23 19:10:00.308101+00
467df51d-7a3b-484a-b240-e055d83f8937	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "18eacfd3-bd46-4947-8033-b7503d0fae1a", "inserted_count": 1}	2026-06-23 19:10:02.634705+00
f1174a8e-ea9e-4d2d-8df8-a52ae740d50e	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "18eacfd3-bd46-4947-8033-b7503d0fae1a", "inserted_count": 2}	2026-06-23 20:06:57.813029+00
34056422-e650-4ed0-b67f-d9e26430830e	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "18eacfd3-bd46-4947-8033-b7503d0fae1a", "inserted_count": 1}	2026-06-23 20:06:59.944609+00
25df1809-90f0-4cdf-b946-d3daca3f6105	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "18eacfd3-bd46-4947-8033-b7503d0fae1a", "inserted_count": 1}	2026-06-23 20:07:01.920065+00
9b0361ed-a669-4d30-834a-7348d92a32d1	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "18eacfd3-bd46-4947-8033-b7503d0fae1a", "inserted_count": 2}	2026-06-23 20:10:18.062296+00
7714c710-7250-427e-8f3d-fb95ceab25a2	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "18eacfd3-bd46-4947-8033-b7503d0fae1a", "inserted_count": 1}	2026-06-23 20:10:19.403543+00
9e5c600a-4e3e-4996-ace8-f11bf09074c5	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "18eacfd3-bd46-4947-8033-b7503d0fae1a", "inserted_count": 1}	2026-06-23 20:10:20.901788+00
de675c49-a187-4dcf-b0fa-7e21b91f527f	fe5c8479-83e8-4771-b3cf-de99483f0ffc	create_variation	{"name": "1 Bulan", "parent_id": "18eacfd3-bd46-4947-8033-b7503d0fae1a", "variation_id": "c62f80b8-ed1b-45cd-9ab3-90ac5a14815c"}	2026-06-23 20:13:06.13025+00
4a897dc1-2ec4-4cd6-9893-ca5a017dc311	fe5c8479-83e8-4771-b3cf-de99483f0ffc	create_variation	{"name": "2 Bulan", "parent_id": "18eacfd3-bd46-4947-8033-b7503d0fae1a", "variation_id": "b394a3cf-e845-4250-8b67-19e29f011136"}	2026-06-23 20:13:24.607612+00
472e7c8f-66e8-47ac-8a81-4820bddff6b4	fe5c8479-83e8-4771-b3cf-de99483f0ffc	bulk_upload_inventory	{"product_id": "c62f80b8-ed1b-45cd-9ab3-90ac5a14815c", "inserted_count": 1}	2026-06-23 20:13:56.711491+00
898cd29e-5775-4e32-bfc5-92f766fcc4c4	fe5c8479-83e8-4771-b3cf-de99483f0ffc	bulk_upload_inventory	{"product_id": "c62f80b8-ed1b-45cd-9ab3-90ac5a14815c", "inserted_count": 0}	2026-06-23 20:14:56.616036+00
5001dc0b-ac5f-467f-91ad-0b29ce074a1f	fe5c8479-83e8-4771-b3cf-de99483f0ffc	bulk_upload_inventory	{"product_id": "c62f80b8-ed1b-45cd-9ab3-90ac5a14815c", "inserted_count": 1}	2026-06-23 20:40:10.009061+00
ddaf1c47-fcd0-4d0a-80cf-f4065ef8cbe7	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "c62f80b8-ed1b-45cd-9ab3-90ac5a14815c", "inserted_count": 2}	2026-06-23 20:44:50.615895+00
d29c3687-e43d-4a50-bdfb-1364c381045e	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "c62f80b8-ed1b-45cd-9ab3-90ac5a14815c", "inserted_count": 1}	2026-06-23 20:44:55.77436+00
ddfa4f86-05be-4e80-8cc5-06610181ad99	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "c62f80b8-ed1b-45cd-9ab3-90ac5a14815c", "inserted_count": 1}	2026-06-23 20:45:03.788117+00
2b355a5d-0fc4-4cd7-bc68-ea450172d19d	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "c62f80b8-ed1b-45cd-9ab3-90ac5a14815c", "inserted_count": 2}	2026-06-23 20:45:46.742188+00
28360559-855b-422c-905a-d1b4fe022761	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "c62f80b8-ed1b-45cd-9ab3-90ac5a14815c", "inserted_count": 1}	2026-06-23 20:45:57.972934+00
99c7c5f4-405c-4b5e-8c33-36036791c12f	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "c62f80b8-ed1b-45cd-9ab3-90ac5a14815c", "inserted_count": 1}	2026-06-23 20:46:12.020292+00
9aad8d25-f909-4221-bfc2-b5a19d926d3e	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "c62f80b8-ed1b-45cd-9ab3-90ac5a14815c", "inserted_count": 2}	2026-06-23 20:47:26.192317+00
3a0919b2-0f24-409a-9d1f-1f10cef34b61	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "c62f80b8-ed1b-45cd-9ab3-90ac5a14815c", "inserted_count": 1}	2026-06-23 20:47:37.347313+00
c432aca6-b5a0-4626-8680-28aed352448c	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "c62f80b8-ed1b-45cd-9ab3-90ac5a14815c", "inserted_count": 1}	2026-06-23 20:47:51.383225+00
aef55e7c-a31b-412a-9f0e-60a6d6d47625	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "c62f80b8-ed1b-45cd-9ab3-90ac5a14815c", "inserted_count": 2}	2026-06-23 20:50:33.38939+00
8c9e992d-a106-4551-b053-a7545da21abf	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "c62f80b8-ed1b-45cd-9ab3-90ac5a14815c", "inserted_count": 1}	2026-06-23 20:50:44.774495+00
ec87909d-4a43-4488-831f-6ecb19d5800c	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "c62f80b8-ed1b-45cd-9ab3-90ac5a14815c", "inserted_count": 1}	2026-06-23 20:50:56.244606+00
66e434f6-d425-4ec0-af98-8696cfbc364f	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "18eacfd3-bd46-4947-8033-b7503d0fae1a", "inserted_count": 2}	2026-06-23 20:52:18.536396+00
cf40f156-36a3-4b0d-979e-173564adce97	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "18eacfd3-bd46-4947-8033-b7503d0fae1a", "inserted_count": 1}	2026-06-23 20:52:20.601682+00
4ad6a4c7-907b-4dbc-8e7e-e740cf7dd814	a17d0f03-1edd-426c-9ad3-eefdcb104cb2	bulk_upload_inventory	{"product_id": "18eacfd3-bd46-4947-8033-b7503d0fae1a", "inserted_count": 1}	2026-06-23 20:52:22.813868+00
3b12032c-42c6-4403-be63-d7efb79b1330	fe5c8479-83e8-4771-b3cf-de99483f0ffc	bulk_upload_inventory	{"product_id": "c62f80b8-ed1b-45cd-9ab3-90ac5a14815c", "inserted_count": 1}	2026-06-23 20:55:33.573263+00
a2fc2e69-8e8c-4c2e-9028-672c599e8eee	fe5c8479-83e8-4771-b3cf-de99483f0ffc	bulk_upload_inventory	{"product_id": "c62f80b8-ed1b-45cd-9ab3-90ac5a14815c", "inserted_count": 1}	2026-06-23 20:56:14.447845+00
dc09a10c-ea1b-4b9a-85fd-02c25442bd2e	fe5c8479-83e8-4771-b3cf-de99483f0ffc	bulk_upload_inventory	{"product_id": "c62f80b8-ed1b-45cd-9ab3-90ac5a14815c", "inserted_count": 1}	2026-06-23 21:07:58.248347+00
2cb27ec8-5130-4036-b6b8-5deef84787c5	fe5c8479-83e8-4771-b3cf-de99483f0ffc	BULK_INSERT_INVENTORY	{"product_id": "b394a3cf-e845-4250-8b67-19e29f011136", "inserted_count": 2}	2026-06-23 21:23:23.474846+00
91a0df53-9ef5-49f5-bb34-3de7f29f3e6d	fe5c8479-83e8-4771-b3cf-de99483f0ffc	update_category	{"name": "Canva Pro", "slug": "canva", "category_id": "0b26a120-660a-4b8d-954c-ee05f4287cb8"}	2026-06-25 01:18:02.583478+00
6031b052-cbcf-4c0f-9e52-10a79ac51b1b	fe5c8479-83e8-4771-b3cf-de99483f0ffc	create_product	{"name": "Canva Pro 1 Bulan", "product_id": "298c3dec-39aa-459d-850c-31cf03c114c2"}	2026-06-25 01:19:20.570648+00
76b0ec8b-c2fd-4249-89cc-905a31ea40c9	fe5c8479-83e8-4771-b3cf-de99483f0ffc	create_product	{"name": "\\tCanva Pro 2 Bulan", "product_id": "37cd89e2-6f59-4e69-8a43-b3cf70d6d881"}	2026-06-25 01:20:04.63485+00
9087c566-e92f-448b-9981-4a6e699ce628	fe5c8479-83e8-4771-b3cf-de99483f0ffc	create_product	{"name": "\\tCanva Pro 6 Bulan", "product_id": "0c758bb7-3e85-4712-940b-baef11915a88"}	2026-06-25 01:22:20.842245+00
84ccf955-4bfc-4b42-a818-e0f33273c861	fe5c8479-83e8-4771-b3cf-de99483f0ffc	BULK_INSERT_INVENTORY	{"product_id": "298c3dec-39aa-459d-850c-31cf03c114c2", "inserted_count": 1}	2026-06-25 01:22:47.715778+00
120db83e-c509-47f8-836d-e29e0c66d848	fe5c8479-83e8-4771-b3cf-de99483f0ffc	BULK_INSERT_INVENTORY	{"product_id": "37cd89e2-6f59-4e69-8a43-b3cf70d6d881", "inserted_count": 1}	2026-06-25 01:22:56.020287+00
f26c6625-9222-42ae-8d6f-fe6632d44b7d	fe5c8479-83e8-4771-b3cf-de99483f0ffc	BULK_INSERT_INVENTORY	{"product_id": "0c758bb7-3e85-4712-940b-baef11915a88", "inserted_count": 1}	2026-06-25 01:23:02.3349+00
d6205bf5-ffd2-4c98-aaa2-948782f59353	fe5c8479-83e8-4771-b3cf-de99483f0ffc	BULK_INSERT_INVENTORY	{"target_id": "0b26a120-660a-4b8d-954c-ee05f4287cb8", "target_type": "category", "inserted_count": 1}	2026-06-25 02:20:23.194+00
f3c6d67d-a839-45a0-8f4c-7fa6472e8bc5	fe5c8479-83e8-4771-b3cf-de99483f0ffc	update_product	{"product_id": "298c3dec-39aa-459d-850c-31cf03c114c2"}	2026-06-25 02:23:00.987966+00
e59ff4a1-9ad5-4e77-bfc6-ba4df76e9d25	fe5c8479-83e8-4771-b3cf-de99483f0ffc	update_product	{"product_id": "37cd89e2-6f59-4e69-8a43-b3cf70d6d881"}	2026-06-25 02:32:17.445349+00
3e9d1ac3-b60d-4698-a40b-a67db088f408	fe5c8479-83e8-4771-b3cf-de99483f0ffc	update_product	{"product_id": "0c758bb7-3e85-4712-940b-baef11915a88"}	2026-06-25 02:32:22.965827+00
\.


--
-- Data for Name: bot_templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."bot_templates" ("id", "key", "name", "content_html", "variables_hint", "updated_at") FROM stdin;
2191d9dc-0210-4d34-8097-063bf8a5f519	welcome_message	Pesan Welcome	✨ <b>Selamat Datang di YimStore!</b> ✨\n\nPusat layanan digital dan akun premium terpercaya. Kami menyediakan berbagai macam kebutuhan digital dengan proses yang instan dan otomatis 24/7.\n\n📊 <b>Statistik Bot:</b>\n👥 Pengguna Aktif: {{user_count}} Pengguna\n🛍️ Transaksi Berhasil: {{order_count}} Pesanan\n\nSilakan pilih menu di bawah ini untuk memulai:	{{user_count}}, {{order_count}}	2026-06-25 12:50:56.973157+00
0580d32e-15fe-4023-b1cd-839f077f6172	order_confirmation	Konfirmasi Pesanan	<b>KONFIRMASI PESANAN</b>\n=========================\nProduk: {{product_name}}\nHarga: Rp {{base_price}} / item\nStok Tersedia: {{available_stock}}\n-------------------------\nJumlah Pesanan: 1\nFee Payment: Rp {{fee_payment}} (QRIS)\nTotal Dibayar: Rp {{total_payment}}\n=========================\nKlik ✅ Konfirmasi untuk menahan stok dan melakukan pembayaran.	{{product_name}}, {{base_price}}, {{available_stock}}, {{fee_payment}}, {{total_payment}}	2026-06-25 12:50:56.976776+00
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."categories" ("id", "name", "slug", "created_at", "thumbnail_url", "description") FROM stdin;
a1a1f6a4-837f-4edc-b778-88bc93df71be	Streaming	streaming	2026-06-24 03:56:39.398038+00	\N	\N
9bb10fc6-925a-46fb-b86c-e208d02184f9	VPN	vpn	2026-06-24 03:56:39.398038+00	\N	\N
0b26a120-660a-4b8d-954c-ee05f4287cb8	Canva Pro	canva	2026-06-24 03:56:39.398038+00		deskripsi singkat\r\n-\r\n-\r\n-\r\n-\r\n-
\.


--
-- Data for Name: inventory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."inventory" ("id", "product_id", "credential_data", "status", "reserved_until", "created_at", "updated_at", "category_id") FROM stdin;
553905ae-3893-434c-b811-33712ac1fd73	298c3dec-39aa-459d-850c-31cf03c114c2	link 1 bulan	Revoked	\N	2026-06-25 01:22:47.715778+00	2026-06-25 01:22:47.715778+00	\N
31f3b252-cb16-418a-a7c1-db9bfad14148	\N	link sync 1	Revoked	2026-06-25 03:20:53.133895+00	2026-06-25 02:32:49.15197+00	2026-06-25 02:32:49.15197+00	0b26a120-660a-4b8d-954c-ee05f4287cb8
e77cd5a8-301b-45ae-9506-9ac46a1995dc	\N	link sync 1	Used	\N	2026-06-25 02:32:49.15197+00	2026-06-25 02:32:49.15197+00	0b26a120-660a-4b8d-954c-ee05f4287cb8
58d59e95-2c52-4529-b92c-7ff354314fb5	b276aec7-fcce-4100-9b98-61af6b57b6d1	netflix_user0@mail.com:pass123	Used	\N	2026-06-24 03:56:39.449458+00	2026-06-24 03:56:39.449458+00	\N
39c0bb30-5e88-43e3-840a-3011f54f2da0	\N	link sync 1	Revoked	2026-06-25 03:22:49.121718+00	2026-06-25 02:32:49.15197+00	2026-06-25 02:32:49.15197+00	0b26a120-660a-4b8d-954c-ee05f4287cb8
4fb29670-2ed6-4e9a-a66c-40d199d041cc	\N	link sync 1	Used	\N	2026-06-25 02:32:49.15197+00	2026-06-25 02:32:49.15197+00	0b26a120-660a-4b8d-954c-ee05f4287cb8
f5b75de6-46ee-4330-8e15-9ff13622a0a6	b276aec7-fcce-4100-9b98-61af6b57b6d1	netflix_user4@mail.com:pass123	Available	\N	2026-06-24 03:56:39.449458+00	2026-06-24 03:56:39.449458+00	\N
dffb5f6a-55f8-49ab-bdaa-0d7c4d446fe1	b276aec7-fcce-4100-9b98-61af6b57b6d1	netflix_user2@mail.com:pass123	Available	\N	2026-06-24 03:56:39.449458+00	2026-06-24 03:56:39.449458+00	\N
d6b7dc70-a812-4e8b-8548-a44204e3919a	\N	link sync 1	Available	\N	2026-06-25 02:32:49.15197+00	2026-06-25 02:32:49.15197+00	0b26a120-660a-4b8d-954c-ee05f4287cb8
8d0b032d-fd48-4558-8453-13dc190904bf	\N	link sync 1	Available	\N	2026-06-25 02:32:49.15197+00	2026-06-25 02:32:49.15197+00	0b26a120-660a-4b8d-954c-ee05f4287cb8
c7058456-85d9-43e5-9aa8-28385c7be7b2	b276aec7-fcce-4100-9b98-61af6b57b6d1	netflix_user3@mail.com:pass123	Revoked	\N	2026-06-24 03:56:39.449458+00	2026-06-24 03:56:39.449458+00	\N
59e86c5c-96d5-4a8e-997a-89e27637d5f1	b276aec7-fcce-4100-9b98-61af6b57b6d1	netflix_user1@mail.com:pass123	Used	\N	2026-06-24 03:56:39.449458+00	2026-06-24 03:56:39.449458+00	\N
ffc1ac3e-b181-4e06-b32e-0e1ad26082bf	\N	link sync 1	Revoked	\N	2026-06-25 02:32:49.15197+00	2026-06-25 02:32:49.15197+00	0b26a120-660a-4b8d-954c-ee05f4287cb8
734c7310-9c33-494f-8c9c-a386b603c4de	\N	link sync 1	Used	\N	2026-06-25 02:32:49.15197+00	2026-06-25 02:32:49.15197+00	0b26a120-660a-4b8d-954c-ee05f4287cb8
64bd5acc-83d0-4ba4-a3dc-a506f0272f13	0c758bb7-3e85-4712-940b-baef11915a88	Akun Pembelian Manual	Used	\N	2026-06-25 06:05:35.081884+00	2026-06-25 06:05:35.081884+00	\N
30755fac-70c1-43c0-a476-336edb7dc1df	\N	link sync 1	Used	\N	2026-06-25 02:32:49.15197+00	2026-06-25 02:32:49.15197+00	0b26a120-660a-4b8d-954c-ee05f4287cb8
127a3395-562d-40f0-84d1-b6e6c6cb055c	b276aec7-fcce-4100-9b98-61af6b57b6d1	netflix_user5@mail.com:pass123	Available	\N	2026-06-24 03:56:39.449458+00	2026-06-24 03:56:39.449458+00	\N
3ef20526-5b5c-4f39-af0e-aa28bfed8add	b276aec7-fcce-4100-9b98-61af6b57b6d1	netflix_user6@mail.com:pass123	Available	\N	2026-06-24 03:56:39.449458+00	2026-06-24 03:56:39.449458+00	\N
b8795bc9-78e4-4c5e-aced-c215ef9aad70	b276aec7-fcce-4100-9b98-61af6b57b6d1	netflix_user7@mail.com:pass123	Available	\N	2026-06-24 03:56:39.449458+00	2026-06-24 03:56:39.449458+00	\N
0d377e06-0ead-481f-95d6-f871916f9239	b276aec7-fcce-4100-9b98-61af6b57b6d1	netflix_user8@mail.com:pass123	Available	\N	2026-06-24 03:56:39.449458+00	2026-06-24 03:56:39.449458+00	\N
edb34f70-8bca-44f8-a1b1-3a3c10aee89f	b276aec7-fcce-4100-9b98-61af6b57b6d1	netflix_user9@mail.com:pass123	Available	\N	2026-06-24 03:56:39.449458+00	2026-06-24 03:56:39.449458+00	\N
ab3dbf3d-6957-427f-b2f6-1cf24338687f	b276aec7-fcce-4100-9b98-61af6b57b6d1	netflix_used1@mail.com:pass123	Used	\N	2026-06-24 03:56:39.449458+00	2026-06-24 03:56:39.449458+00	\N
b15893c0-ebdf-4ccd-a341-a0e5ce683392	b276aec7-fcce-4100-9b98-61af6b57b6d1	netflix_used2@mail.com:pass123	Used	\N	2026-06-24 03:56:39.449458+00	2026-06-24 03:56:39.449458+00	\N
dff73fa3-0c07-4dd0-84a8-635a126493f2	b276aec7-fcce-4100-9b98-61af6b57b6d1	netflix_hold@mail.com:pass123	Available	\N	2026-06-24 03:56:39.449458+00	2026-06-24 03:56:39.449458+00	\N
6601354d-0b2b-4a18-9a76-888e68704b76	b276aec7-fcce-4100-9b98-61af6b57b6d1	dummy_cred	Available	\N	2026-06-25 05:07:41.36127+00	2026-06-25 05:07:41.36127+00	\N
1e8bb432-17a3-4482-bab8-b65610f5ad2a	0c758bb7-3e85-4712-940b-baef11915a88	Akun Pembelian Manual	Revoked	\N	2026-06-25 06:07:40.237701+00	2026-06-25 06:07:40.237701+00	\N
0544fc52-693b-4de6-a396-4a8caf37f793	0c758bb7-3e85-4712-940b-baef11915a88	Akun Pembelian Manual	Used	\N	2026-06-25 06:03:08.218263+00	2026-06-25 06:03:08.218263+00	\N
810d8e55-f774-4aa4-9a1e-c249aaa4e9d2	0c758bb7-3e85-4712-940b-baef11915a88	Akun Pembelian Manual	Used	\N	2026-06-25 07:14:52.915274+00	2026-06-25 07:14:52.915274+00	\N
72be445d-433f-4946-bae1-43c3a8d35aa8	0c758bb7-3e85-4712-940b-baef11915a88	Akun Pembelian Manual	Used	\N	2026-06-25 06:04:03.577651+00	2026-06-25 06:04:03.577651+00	\N
a3239219-5717-4baf-bab5-c0f981565e76	37cd89e2-6f59-4e69-8a43-b3cf70d6d881	Akun Pembelian Manual	Used	\N	2026-06-25 06:04:56.555259+00	2026-06-25 06:04:56.555259+00	\N
accd6380-f44a-4c21-ade4-4f3b91404303	298c3dec-39aa-459d-850c-31cf03c114c2	link 1 bulan	Used	\N	2026-06-25 01:23:28.15983+00	2026-06-25 01:23:28.15983+00	\N
f51e4042-f12e-4902-8825-b3f7b679efbb	\N	link sync 1	Available	\N	2026-06-25 02:20:23.194+00	2026-06-25 02:20:23.194+00	0b26a120-660a-4b8d-954c-ee05f4287cb8
\.


--
-- Data for Name: login_attempts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."login_attempts" ("ip_address", "attempts", "last_attempt") FROM stdin;
\.


--
-- Data for Name: order_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."order_items" ("id", "order_id", "inventory_id", "warranty_end_date", "current_claim_count", "created_at", "cooldown_bypass_active", "product_id", "max_claim_limit") FROM stdin;
5cbfd0ff-ce08-44d3-93ec-2ff94e44a9ae	91a268b1-b612-43cc-b043-70d2459f1803	58d59e95-2c52-4529-b92c-7ff354314fb5	\N	0	2026-06-24 03:59:06.403281+00	f	b276aec7-fcce-4100-9b98-61af6b57b6d1	5
b58428bb-4673-4353-be62-d6f1caa179a4	7aa72583-1ce7-4da9-b58a-0aec0128c440	59e86c5c-96d5-4a8e-997a-89e27637d5f1	\N	0	2026-06-24 04:01:05.63702+00	f	b276aec7-fcce-4100-9b98-61af6b57b6d1	5
802f2b71-4b62-4d97-8e26-773a4d43767d	44defa16-8241-4b3d-89b0-1ac884ca8a71	dffb5f6a-55f8-49ab-bdaa-0d7c4d446fe1	\N	0	2026-06-24 04:07:50.368635+00	f	b276aec7-fcce-4100-9b98-61af6b57b6d1	5
871d08fe-8ab3-4c91-b472-b70ff23a3770	a0a73d39-a7de-4b86-a565-975ec36a10fd	58d59e95-2c52-4529-b92c-7ff354314fb5	\N	0	2026-06-24 04:29:17.089613+00	f	b276aec7-fcce-4100-9b98-61af6b57b6d1	5
b405c7e8-cd64-4bb3-a195-cc92ce4632f4	7af5be49-ad91-4547-ab18-e929ae3ee835	59e86c5c-96d5-4a8e-997a-89e27637d5f1	\N	0	2026-06-24 04:29:25.493476+00	f	b276aec7-fcce-4100-9b98-61af6b57b6d1	5
db64d88b-1fbb-4b05-bea3-35cdfda71dc9	7b3de292-a42f-47a2-8ddf-55b754ce648b	dffb5f6a-55f8-49ab-bdaa-0d7c4d446fe1	\N	0	2026-06-24 05:16:43.715428+00	f	b276aec7-fcce-4100-9b98-61af6b57b6d1	5
9f5da792-1073-4618-a79b-66ff1559fc05	ecb28171-9808-4f78-9b8a-c66d6c69aa79	58d59e95-2c52-4529-b92c-7ff354314fb5	\N	0	2026-06-24 05:25:17.784259+00	f	b276aec7-fcce-4100-9b98-61af6b57b6d1	5
9c8b7cd4-d6e7-491b-b9c8-83a729d24042	56f3ccda-e6b0-4f00-bda9-3c9f38878e3f	59e86c5c-96d5-4a8e-997a-89e27637d5f1	\N	0	2026-06-24 05:33:03.42821+00	f	b276aec7-fcce-4100-9b98-61af6b57b6d1	5
d77cbadd-0e5d-4ef6-86c9-3cd00a63f423	17fbeef1-6a66-42b6-adb4-46f9b124f1c7	dffb5f6a-55f8-49ab-bdaa-0d7c4d446fe1	\N	0	2026-06-24 05:40:00.426019+00	f	b276aec7-fcce-4100-9b98-61af6b57b6d1	5
0fed3fba-0d44-429f-a60d-1d1830f05531	6ad48106-672f-4ef5-a232-2703b066266d	58d59e95-2c52-4529-b92c-7ff354314fb5	\N	0	2026-06-24 05:44:42.58278+00	f	b276aec7-fcce-4100-9b98-61af6b57b6d1	5
190f4b20-ad39-47e1-b9a6-408529301c66	76ceb8da-f418-4862-baee-5b1243fd94ed	59e86c5c-96d5-4a8e-997a-89e27637d5f1	\N	0	2026-06-24 05:49:03.795136+00	f	b276aec7-fcce-4100-9b98-61af6b57b6d1	5
8737d4d5-6ca9-41b1-9e9c-6fc0a52c32b0	6989db96-5b10-455c-b684-0e75b723293c	dffb5f6a-55f8-49ab-bdaa-0d7c4d446fe1	\N	0	2026-06-24 17:47:13.014912+00	f	b276aec7-fcce-4100-9b98-61af6b57b6d1	5
b9584c95-a35e-4a4b-9899-19ba206ccf99	a1c05e76-85b8-44d1-941b-57d01bf96139	58d59e95-2c52-4529-b92c-7ff354314fb5	2026-07-24 17:52:18.8775+00	0	2026-06-24 17:52:04.576692+00	f	b276aec7-fcce-4100-9b98-61af6b57b6d1	5
ee4a4743-c8ad-4342-a851-4be183f11b99	5710231c-30f0-4574-b9b7-0cd03b69aa48	59e86c5c-96d5-4a8e-997a-89e27637d5f1	\N	0	2026-06-24 23:54:35.380306+00	f	b276aec7-fcce-4100-9b98-61af6b57b6d1	5
a90740b0-f6ff-4309-91b3-ef9ae209e57c	23528777-ff47-46aa-a473-5584c0ecbd9a	accd6380-f44a-4c21-ade4-4f3b91404303	2026-07-20 01:25:23.613614+00	1	2026-06-25 01:25:02.498671+00	f	298c3dec-39aa-459d-850c-31cf03c114c2	1
602f4e97-a7a3-4a53-90fc-d908e7ef8500	90a4547a-4979-452f-8166-82bae255319b	39c0bb30-5e88-43e3-840a-3011f54f2da0	\N	0	2026-06-25 02:49:23.692557+00	f	298c3dec-39aa-459d-850c-31cf03c114c2	1
18ebc51a-c775-4faf-9f88-d54431d9bff7	2b22bade-ca09-4e80-8f5d-a7885cb876b8	d6b7dc70-a812-4e8b-8548-a44204e3919a	\N	0	2026-06-25 02:50:53.294978+00	f	298c3dec-39aa-459d-850c-31cf03c114c2	1
30c0b18b-28f2-4653-bd6d-89ce32dafe25	fcc1a1d5-2f03-4abd-83f3-671d89cca4e4	8d0b032d-fd48-4558-8453-13dc190904bf	\N	0	2026-06-25 02:54:17.105352+00	f	298c3dec-39aa-459d-850c-31cf03c114c2	1
a86a02ed-0f83-4f7b-9aeb-7284fce2d149	5ef97d89-5c95-4d71-ae3c-a8c577e065b1	734c7310-9c33-494f-8c9c-a386b603c4de	\N	0	2026-06-25 02:59:33.019492+00	f	298c3dec-39aa-459d-850c-31cf03c114c2	1
f1938aba-0cbb-4dd2-b119-342c5f817b26	3c2d7207-d587-4c9a-84f8-d109f80adaa9	30755fac-70c1-43c0-a476-336edb7dc1df	\N	0	2026-06-25 03:01:23.032717+00	f	298c3dec-39aa-459d-850c-31cf03c114c2	1
fac76356-a651-4dc2-9638-81ed8929a6a2	b74ab278-9de2-4bb6-9d5e-9e6a7960f79b	e77cd5a8-301b-45ae-9506-9ac46a1995dc	2026-07-20 03:06:45.551+00	1	2026-06-25 03:05:53.232048+00	f	298c3dec-39aa-459d-850c-31cf03c114c2	1
20e5503b-5295-4f5a-8cca-269c5afdd294	c020615c-c481-47e2-bbb5-59e0040ed88a	4fb29670-2ed6-4e9a-a66c-40d199d041cc	2026-07-20 03:07:56.371+00	1	2026-06-25 03:07:49.196367+00	f	298c3dec-39aa-459d-850c-31cf03c114c2	1
638487ba-b089-48ee-b1ae-aa3079fd433d	73a67082-d786-4fb7-9034-3c812c2ae192	d6b7dc70-a812-4e8b-8548-a44204e3919a	2026-07-20 04:21:12.982+00	0	2026-06-25 04:21:01.183387+00	f	298c3dec-39aa-459d-850c-31cf03c114c2	1
a65ec8ef-a470-4e09-99a0-8d91cd88a1f1	2dd12f79-7b5c-4e65-85c1-eb2357c06032	8d0b032d-fd48-4558-8453-13dc190904bf	2026-07-20 04:39:10.303+00	0	2026-06-25 04:38:59.720542+00	f	298c3dec-39aa-459d-850c-31cf03c114c2	1
e85dc6f3-ac0a-4371-8b2d-7e359a2176ba	08388431-d394-4c5f-9457-1af6829dc960	59e86c5c-96d5-4a8e-997a-89e27637d5f1	2026-07-24 05:54:10.775033+00	1	2026-06-24 05:53:53.20512+00	f	b276aec7-fcce-4100-9b98-61af6b57b6d1	5
83197770-a1de-4cfb-ac64-22a174c17b1e	99b25573-3c35-46ea-ab08-2009be9d6ef5	734c7310-9c33-494f-8c9c-a386b603c4de	2026-07-20 04:15:49.083+00	1	2026-06-25 04:14:35.220588+00	f	298c3dec-39aa-459d-850c-31cf03c114c2	1
fc6521e2-5926-4bdc-8dad-544cdd584a94	8758636a-b612-4623-b063-2b2cd892bc02	72be445d-433f-4946-bae1-43c3a8d35aa8	2026-06-20 00:00:00+00	3	2026-06-25 06:04:03.68999+00	f	0c758bb7-3e85-4712-940b-baef11915a88	1
ef722e28-838b-498e-aa15-436ad5df3416	92721c1a-7753-40c1-8bcd-a5154addba00	a3239219-5717-4baf-bab5-c0f981565e76	2026-12-12 00:00:00+00	0	2026-06-25 06:04:56.695762+00	f	37cd89e2-6f59-4e69-8a43-b3cf70d6d881	1
d3304bbb-8d1f-4e7c-96d6-563a17ddd04a	afaba384-9dbb-4c61-8e56-483637fa7cbe	64bd5acc-83d0-4ba4-a3dc-a506f0272f13	2026-12-12 00:00:00+00	3	2026-06-25 06:05:35.193312+00	f	0c758bb7-3e85-4712-940b-baef11915a88	1
0e267d75-fac4-42ed-801d-2cc2dc20c936	46b1ac11-00b1-4ef5-8d70-7b96510f1431	30755fac-70c1-43c0-a476-336edb7dc1df	2026-12-12 00:00:00+00	4	2026-06-25 06:07:40.342041+00	f	0c758bb7-3e85-4712-940b-baef11915a88	6
1e8d9b5b-e00c-47c6-9357-13160794d806	669903bd-8524-4bc8-beb0-b58caac13210	810d8e55-f774-4aa4-9a1e-c249aaa4e9d2	2026-12-12 00:00:00+00	3	2026-06-25 07:14:53.098764+00	f	0c758bb7-3e85-4712-940b-baef11915a88	6
\.


--
-- Data for Name: orders; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."orders" ("id", "user_id", "total_amount", "payment_status", "delivery_status", "platform_source", "created_at", "access_token", "email", "qris_string", "payment_expired_at") FROM stdin;
91a268b1-b612-43cc-b043-70d2459f1803	\N	35000.00	pending	pending	web	2026-06-24 03:59:06.380736+00	430f2f7b-32e2-4111-962f-530ea2f0de19	\N	\N	\N
7aa72583-1ce7-4da9-b58a-0aec0128c440	\N	35000.00	pending	pending	web	2026-06-24 04:01:05.59329+00	43b3142d-c784-4125-9bad-e23201767582	\N	\N	\N
44defa16-8241-4b3d-89b0-1ac884ca8a71	\N	35000.00	pending	pending	web	2026-06-24 04:07:50.341093+00	91f498eb-50f8-4fe5-a4a6-d2ab8b955963	\N	\N	\N
a0a73d39-a7de-4b86-a565-975ec36a10fd	\N	35000.00	pending	pending	web	2026-06-24 04:29:17.059614+00	1488c5de-295a-481f-aac9-375e1d7ea372	\N	\N	\N
7af5be49-ad91-4547-ab18-e929ae3ee835	\N	35000.00	pending	pending	web	2026-06-24 04:29:25.455287+00	996130a7-df30-4cac-aa01-a360ae4eaef4	\N	\N	\N
7b3de292-a42f-47a2-8ddf-55b754ce648b	\N	35000.00	pending	pending	web	2026-06-24 05:16:43.687693+00	32b7459b-6fcb-4169-9c3c-21c4e0a9853c	\N	\N	\N
ecb28171-9808-4f78-9b8a-c66d6c69aa79	\N	35000.00	pending	pending	web	2026-06-24 05:25:17.759038+00	49c6b836-7e4d-45e8-9a47-2a5fedaec3ef	\N	\N	\N
56f3ccda-e6b0-4f00-bda9-3c9f38878e3f	\N	35000.00	pending	pending	web	2026-06-24 05:33:03.401333+00	0dcc57ee-5573-46a6-a435-1eb1a964b8a2	\N	\N	\N
17fbeef1-6a66-42b6-adb4-46f9b124f1c7	\N	35000.00	pending	pending	web	2026-06-24 05:40:00.40614+00	ba74a387-848b-4938-92fd-adf5cf4a46b3	\N	\N	\N
6ad48106-672f-4ef5-a232-2703b066266d	\N	35000.00	pending	pending	web	2026-06-24 05:44:42.545177+00	724a98b8-adfb-4ff0-81e9-50f28dca3d7e	\N	\N	\N
76ceb8da-f418-4862-baee-5b1243fd94ed	\N	35000.00	pending	pending	web	2026-06-24 05:49:03.74166+00	74e9a89f-f8fe-4325-ba06-b9a3b5d89bc0	\N	\N	\N
08388431-d394-4c5f-9457-1af6829dc960	\N	35000.00	PAID	pending	web	2026-06-24 05:53:53.180195+00	6b415bad-e90c-4872-abbf-3c91fa11aed1	\N	\N	\N
6989db96-5b10-455c-b684-0e75b723293c	\N	35000.00	pending	pending	web	2026-06-24 17:47:12.977693+00	861555bb-bf50-46d6-b3aa-7e45b5fa64bf	\N	\N	\N
a1c05e76-85b8-44d1-941b-57d01bf96139	\N	35000.00	PAID	pending	web	2026-06-24 17:52:04.550874+00	60a03a75-cf8a-424c-9b1c-0bc467dca1a5	\N	\N	\N
c39109fc-7b5d-40b7-a3b0-0ef36a0ad968	\N	35000.00	pending	pending	telegram	2026-06-24 23:07:36.87829+00	2da6d275-21d9-4428-9813-c747a8c3e34a	\N	\N	\N
76db95dd-836f-4cd2-81a5-f660bd1a08e3	\N	35000.00	pending	pending	telegram	2026-06-24 23:53:19.238745+00	175036b8-366f-4f54-abbc-537f40642bab	\N	\N	\N
5710231c-30f0-4574-b9b7-0cd03b69aa48	\N	35000.00	pending	pending	web	2026-06-24 23:54:35.351218+00	1c717c87-dba8-41ae-bbe3-c115309907a5	\N	\N	\N
a0a95332-43c9-44cf-99df-fbe7703bfdf9	\N	35000.00	pending	pending	telegram	2026-06-24 23:58:53.53796+00	8d274b0f-bd1e-4c0c-8b5d-4e91c2df7ec4	\N	\N	\N
daf5a6a2-3ec0-416e-8bd9-2afcd5cd7bac	\N	35000.00	cancelled	pending	telegram:51	2026-06-25 00:13:54.418123+00	cfad4df7-4451-4406-8f83-72501227f197	\N	\N	\N
23528777-ff47-46aa-a473-5584c0ecbd9a	2bed7662-8639-419f-b314-62fb3b7f5a8d	10000.00	PAID	pending	web	2026-06-25 01:25:02.473078+00	56cfdc50-46c6-4d4d-91f6-2bae700f4143	\N	\N	\N
73a67082-d786-4fb7-9034-3c812c2ae192	2bed7662-8639-419f-b314-62fb3b7f5a8d	10000.00	PAID	pending	telegram:206	2026-06-25 04:21:01.156216+00	e8f71657-0255-4a79-b81f-1cb698f851fd	\N	\N	\N
a2c64e16-def5-4254-be11-14566e638b70	2bed7662-8639-419f-b314-62fb3b7f5a8d	10000.00	cancelled	pending	telegram:90	2026-06-25 02:36:25.15248+00	257b6605-a506-49be-980d-5cf6e4d21439	\N	\N	\N
70406605-92c4-46e8-a023-e9201000eb0c	2bed7662-8639-419f-b314-62fb3b7f5a8d	10000.00	cancelled	pending	telegram:90	2026-06-25 02:39:41.550185+00	fade450b-95ae-4d16-a3c1-0ab5b1be57c6	\N	\N	\N
90a4547a-4979-452f-8166-82bae255319b	2bed7662-8639-419f-b314-62fb3b7f5a8d	10000.00	cancelled	pending	telegram:92	2026-06-25 02:49:23.667846+00	3b780e35-8d53-4c56-b5bb-9348e00475fa	\N	\N	\N
2dd12f79-7b5c-4e65-85c1-eb2357c06032	2bed7662-8639-419f-b314-62fb3b7f5a8d	10000.00	PAID	pending	telegram:232	2026-06-25 04:38:59.687168+00	6544c1e5-7df2-4777-9607-493d73fd8574	\N	\N	\N
2b22bade-ca09-4e80-8f5d-a7885cb876b8	2bed7662-8639-419f-b314-62fb3b7f5a8d	10000.00	PAID	pending	telegram:92	2026-06-25 02:50:53.272121+00	673754f7-3a8c-42d4-84f7-71314c800f0a	\N	\N	\N
99b25573-3c35-46ea-ab08-2009be9d6ef5	2bed7662-8639-419f-b314-62fb3b7f5a8d	10000.00	PAID	pending	web	2026-06-25 04:14:35.197465+00	ab94e355-d784-42d4-b7a8-16ff2336e836	\N	\N	\N
fcc1a1d5-2f03-4abd-83f3-671d89cca4e4	2bed7662-8639-419f-b314-62fb3b7f5a8d	10000.00	PAID	pending	telegram:94	2026-06-25 02:54:17.080543+00	b3359505-e219-4f46-b6d0-fae06c2dd7f2	\N	\N	\N
1244352a-a90f-4f46-87e6-21c26cd72c3c	\N	35000.00	paid	completed	manual	2026-06-25 06:03:08.289444+00	41bc2ae5-a6e7-42be-8765-13d3647578fc	\N	\N	\N
5ef97d89-5c95-4d71-ae3c-a8c577e065b1	2bed7662-8639-419f-b314-62fb3b7f5a8d	10000.00	PAID	pending	telegram:96	2026-06-25 02:59:32.991792+00	69314f8c-9e3a-46ea-9abf-38c2e3c5b1cd	\N	\N	\N
8758636a-b612-4623-b063-2b2cd892bc02	\N	35000.00	paid	completed	manual	2026-06-25 06:04:03.626167+00	9c388b84-ccdf-4691-9c28-bf0a602aed98	\N	\N	\N
3c2d7207-d587-4c9a-84f8-d109f80adaa9	2bed7662-8639-419f-b314-62fb3b7f5a8d	10000.00	PAID	pending	telegram:100	2026-06-25 03:01:22.998845+00	532b24bf-ab8e-4e8e-83c3-f75c6604e10b	\N	\N	\N
92721c1a-7753-40c1-8bcd-a5154addba00	\N	18000.00	paid	completed	manual	2026-06-25 06:04:56.608961+00	0ca0300b-32bc-4225-8db1-0620c474c40a	\N	\N	\N
b74ab278-9de2-4bb6-9d5e-9e6a7960f79b	2bed7662-8639-419f-b314-62fb3b7f5a8d	10000.00	PAID	pending	telegram:102	2026-06-25 03:05:53.19927+00	18ac1a6d-3189-49d6-8b04-f7e11121dd35	\N	\N	\N
afaba384-9dbb-4c61-8e56-483637fa7cbe	\N	35000.00	paid	completed	manual	2026-06-25 06:05:35.13106+00	ea32c143-e54e-4424-aceb-3b052363ae8e	\N	\N	\N
c020615c-c481-47e2-bbb5-59e0040ed88a	2bed7662-8639-419f-b314-62fb3b7f5a8d	10000.00	PAID	pending	telegram:107	2026-06-25 03:07:49.170497+00	3505c786-a0dd-4beb-91e7-c31db59cff86	\N	\N	\N
46b1ac11-00b1-4ef5-8d70-7b96510f1431	2bed7662-8639-419f-b314-62fb3b7f5a8d	35000.00	paid	completed	manual	2026-06-25 06:07:40.272005+00	f6a21657-6a79-435f-8a63-3e7c2040df74	\N	\N	\N
669903bd-8524-4bc8-beb0-b58caac13210	\N	35000.00	paid	completed	manual	2026-06-25 07:14:52.983242+00	010c46e6-85df-4f80-baa0-d3f4d71be541	\N	\N	\N
\.


--
-- Data for Name: otp_codes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."otp_codes" ("id", "order_id", "email", "code", "expires_at", "created_at", "used_at") FROM stdin;
\.


--
-- Data for Name: outbox_events; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."outbox_events" ("id", "event_type", "payload", "status", "error_message", "retry_count", "created_at", "updated_at", "transaction_id", "next_retry_at") FROM stdin;
a4d026f5-95fd-4d67-81d5-86d6d7a1039a	DELIVER_CREDENTIALS	{"order_id": "08388431-d394-4c5f-9457-1af6829dc960"}	pending	\N	0	2026-06-24 05:54:10.775033+00	2026-06-24 05:54:10.775033+00	\N	2026-06-24 05:54:10.775033+00
760fe578-65da-45fb-87e3-28579d2908f5	BROADCAST_TESTIMONIAL	{"order_id": "08388431-d394-4c5f-9457-1af6829dc960"}	pending	\N	0	2026-06-24 05:54:10.775033+00	2026-06-24 05:54:10.775033+00	\N	2026-06-24 05:54:10.775033+00
d8c1c332-8e16-4b42-b642-8300d0b80226	DELIVER_CREDENTIALS	{"order_id": "a1c05e76-85b8-44d1-941b-57d01bf96139"}	pending	\N	0	2026-06-24 17:52:18.8775+00	2026-06-24 17:52:18.8775+00	\N	2026-06-24 17:52:18.8775+00
7405b7be-cbc2-4947-b3c5-b5fb169a5095	BROADCAST_TESTIMONIAL	{"order_id": "a1c05e76-85b8-44d1-941b-57d01bf96139"}	pending	\N	0	2026-06-24 17:52:18.8775+00	2026-06-24 17:52:18.8775+00	\N	2026-06-24 17:52:18.8775+00
dfd0145b-7ed2-4f93-bf01-64980fe04821	DELIVER_CREDENTIALS	{"order_id": "23528777-ff47-46aa-a473-5584c0ecbd9a"}	pending	\N	0	2026-06-25 01:25:23.613614+00	2026-06-25 01:25:23.613614+00	\N	2026-06-25 01:25:23.613614+00
664fb9e4-1de0-4745-b270-844d2291d7c1	BROADCAST_TESTIMONIAL	{"order_id": "23528777-ff47-46aa-a473-5584c0ecbd9a"}	pending	\N	0	2026-06-25 01:25:23.613614+00	2026-06-25 01:25:23.613614+00	\N	2026-06-25 01:25:23.613614+00
cb8b7ddb-061d-444e-9ed2-387b52040ccb	DELIVER_CREDENTIALS	{"order_id": "2b22bade-ca09-4e80-8f5d-a7885cb876b8"}	pending	\N	0	2026-06-25 02:51:47.058311+00	2026-06-25 02:51:47.058311+00	\N	2026-06-25 02:51:47.058311+00
e3200744-5949-4b0a-b1a5-a1ae7ee592ad	BROADCAST_TESTIMONIAL	{"order_id": "2b22bade-ca09-4e80-8f5d-a7885cb876b8"}	pending	\N	0	2026-06-25 02:51:47.058311+00	2026-06-25 02:51:47.058311+00	\N	2026-06-25 02:51:47.058311+00
c1404131-be46-4c3a-9e64-0b4c6824d0e4	DELIVER_CREDENTIALS	{"order_id": "fcc1a1d5-2f03-4abd-83f3-671d89cca4e4"}	pending	\N	0	2026-06-25 02:54:30.749381+00	2026-06-25 02:54:30.749381+00	\N	2026-06-25 02:54:30.749381+00
a54d6927-4f32-4ed0-a0a6-324d9169467b	BROADCAST_TESTIMONIAL	{"order_id": "fcc1a1d5-2f03-4abd-83f3-671d89cca4e4"}	pending	\N	0	2026-06-25 02:54:30.749381+00	2026-06-25 02:54:30.749381+00	\N	2026-06-25 02:54:30.749381+00
3e9002c4-6a6d-41ec-993c-b8ddb55daa68	DELIVER_CREDENTIALS	{"order_id": "5ef97d89-5c95-4d71-ae3c-a8c577e065b1"}	pending	\N	0	2026-06-25 02:59:41.864134+00	2026-06-25 02:59:41.864134+00	\N	2026-06-25 02:59:41.864134+00
c4532a28-c855-4f2e-809e-0c15c72e4090	BROADCAST_TESTIMONIAL	{"order_id": "5ef97d89-5c95-4d71-ae3c-a8c577e065b1"}	pending	\N	0	2026-06-25 02:59:41.864134+00	2026-06-25 02:59:41.864134+00	\N	2026-06-25 02:59:41.864134+00
c28fa880-4a46-4e88-9e3c-964b13f44934	DELIVER_CREDENTIALS	{"order_id": "3c2d7207-d587-4c9a-84f8-d109f80adaa9"}	pending	\N	0	2026-06-25 03:01:38.787678+00	2026-06-25 03:01:38.787678+00	\N	2026-06-25 03:01:38.787678+00
39cf65a7-cceb-4299-868e-e66981b6ccec	BROADCAST_TESTIMONIAL	{"order_id": "3c2d7207-d587-4c9a-84f8-d109f80adaa9"}	pending	\N	0	2026-06-25 03:01:38.787678+00	2026-06-25 03:01:38.787678+00	\N	2026-06-25 03:01:38.787678+00
28c198a5-cd0e-40d7-871b-a01f6231a4e7	DELIVER_CREDENTIALS	{"order_id": "b74ab278-9de2-4bb6-9d5e-9e6a7960f79b"}	pending	\N	0	2026-06-25 03:06:45.479779+00	2026-06-25 03:06:45.479779+00	\N	2026-06-25 03:06:45.479779+00
304ae1ac-0873-41d4-ba08-25a8f404b2c3	BROADCAST_TESTIMONIAL	{"order_id": "b74ab278-9de2-4bb6-9d5e-9e6a7960f79b"}	pending	\N	0	2026-06-25 03:06:45.479779+00	2026-06-25 03:06:45.479779+00	\N	2026-06-25 03:06:45.479779+00
9e2c9bbf-d2d3-402c-9fab-09394eecb132	DELIVER_CREDENTIALS	{"order_id": "c020615c-c481-47e2-bbb5-59e0040ed88a"}	pending	\N	0	2026-06-25 03:07:56.324947+00	2026-06-25 03:07:56.324947+00	\N	2026-06-25 03:07:56.324947+00
0e95e8f3-1d08-48ab-81b0-a039ebdcaf8d	BROADCAST_TESTIMONIAL	{"order_id": "c020615c-c481-47e2-bbb5-59e0040ed88a"}	pending	\N	0	2026-06-25 03:07:56.324947+00	2026-06-25 03:07:56.324947+00	\N	2026-06-25 03:07:56.324947+00
537d47c5-1722-4ec9-ac76-e01c5f160116	DELIVER_CREDENTIALS	{"order_id": "99b25573-3c35-46ea-ab08-2009be9d6ef5"}	pending	\N	0	2026-06-25 04:15:49.015592+00	2026-06-25 04:15:49.015592+00	\N	2026-06-25 04:15:49.015592+00
df376e13-d1ed-4324-a55a-76064c4dbe2f	BROADCAST_TESTIMONIAL	{"order_id": "99b25573-3c35-46ea-ab08-2009be9d6ef5"}	pending	\N	0	2026-06-25 04:15:49.015592+00	2026-06-25 04:15:49.015592+00	\N	2026-06-25 04:15:49.015592+00
b7780394-4a1d-4c1e-b5a1-2b0be3e3694d	DELIVER_CREDENTIALS	{"order_id": "73a67082-d786-4fb7-9034-3c812c2ae192"}	pending	\N	0	2026-06-25 04:21:12.909557+00	2026-06-25 04:21:12.909557+00	\N	2026-06-25 04:21:12.909557+00
9058040c-b968-44b1-a4d2-5ad1d3c262af	BROADCAST_TESTIMONIAL	{"order_id": "73a67082-d786-4fb7-9034-3c812c2ae192"}	pending	\N	0	2026-06-25 04:21:12.909557+00	2026-06-25 04:21:12.909557+00	\N	2026-06-25 04:21:12.909557+00
ccecf831-2883-4b94-be38-9b0f17d3daee	DELIVER_CREDENTIALS	{"order_id": "2dd12f79-7b5c-4e65-85c1-eb2357c06032"}	pending	\N	0	2026-06-25 04:39:10.246216+00	2026-06-25 04:39:10.246216+00	\N	2026-06-25 04:39:10.246216+00
4be4b8d8-2ec5-41c3-9c04-eb13473e1b35	BROADCAST_TESTIMONIAL	{"order_id": "2dd12f79-7b5c-4e65-85c1-eb2357c06032"}	pending	\N	0	2026-06-25 04:39:10.246216+00	2026-06-25 04:39:10.246216+00	\N	2026-06-25 04:39:10.246216+00
\.


--
-- Data for Name: pending_claims; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."pending_claims" ("id", "order_item_id", "status", "created_at") FROM stdin;
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."products" ("id", "category_id", "name", "price", "description", "warranty_days", "max_claim_limit", "cooldown_value", "cooldown_unit", "created_at", "is_archived", "thumbnail_url", "parent_id", "is_sync_stock") FROM stdin;
b276aec7-fcce-4100-9b98-61af6b57b6d1	a1a1f6a4-837f-4edc-b778-88bc93df71be	Netflix Premium 1 Bulan	35000.00	Akun premium 4K	30	5	1	hours	2026-06-24 03:56:39.424452+00	f	\N	\N	f
298c3dec-39aa-459d-850c-31cf03c114c2	0b26a120-660a-4b8d-954c-ee05f4287cb8	Canva Pro 1 Bulan	10000.00	deskripsi singkat:\r\n-\r\n-\r\n-\r\n-\r\n--\r\n-\r\n	25	1	0	hours	2026-06-25 01:19:20.537589+00	f		\N	t
37cd89e2-6f59-4e69-8a43-b3cf70d6d881	0b26a120-660a-4b8d-954c-ee05f4287cb8	\tCanva Pro 2 Bulan	18000.00	deskripsi:\r\n-\r\n-\r\n-\r\n-\r\n--\r\n-\r\n	50	2	0	hours	2026-06-25 01:20:04.604498+00	f		\N	t
0c758bb7-3e85-4712-940b-baef11915a88	0b26a120-660a-4b8d-954c-ee05f4287cb8	\tCanva Pro 6 Bulan	35000.00	deskripsi:\r\n-\r\n-\r\n-\r\n--\r\n-\r\n-\r\n-\r\n-\r\n-\r\n	150	6	0	hours	2026-06-25 01:22:20.813274+00	f		\N	t
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."system_settings" ("key", "value", "updated_at") FROM stdin;
maintenance_mode	false	2026-06-22 03:12:15.239487+00
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."users" ("id", "email", "telegram_chat_id", "created_at") FROM stdin;
26123090-3f44-4a86-932c-62332bfbf32d	\N	\N	2026-06-22 20:01:59.954882+00
f62d125c-150c-4ef6-8489-2db692ca1b93	\N	\N	2026-06-22 20:02:00.549891+00
0de3f56c-0836-40ad-9fb7-7787e48ce9d7	\N	\N	2026-06-22 20:02:01.079238+00
15c9fa93-c031-4274-adde-1f025c2db770	\N	\N	2026-06-22 20:02:01.469469+00
7ce12075-ffd2-400f-a60a-61e2927fa90c	\N	\N	2026-06-22 20:02:02.01044+00
986db47a-1142-452c-a9a0-a39dc834ee74	\N	986db47a-1142-452c-a9a0-a39dc834ee74	2026-06-22 20:06:40.228659+00
c00f6c1b-afdc-489e-bef2-bf43f0030238	\N	c00f6c1b-afdc-489e-bef2-bf43f0030238	2026-06-22 20:06:40.758661+00
71b1cbcf-0448-4ca8-a438-6e900660aa4b	\N	71b1cbcf-0448-4ca8-a438-6e900660aa4b	2026-06-22 20:06:41.287584+00
fbcc3ea4-a5e5-4264-8d51-d570bc5cfdef	\N	fbcc3ea4-a5e5-4264-8d51-d570bc5cfdef	2026-06-22 20:06:41.672815+00
9425dc93-104a-42ec-a506-6b9cb6828051	\N	9425dc93-104a-42ec-a506-6b9cb6828051	2026-06-22 20:06:42.21765+00
58f32551-4a6a-4f4d-a1ae-76bcd695206f	\N	58f32551-4a6a-4f4d-a1ae-76bcd695206f	2026-06-22 20:16:34.345688+00
64ab78b7-604b-46bd-8e40-ced3c4d5165a	\N	64ab78b7-604b-46bd-8e40-ced3c4d5165a	2026-06-22 20:16:34.88734+00
3aa9c0a7-aa1c-40c7-ad7c-4605a988672a	\N	3aa9c0a7-aa1c-40c7-ad7c-4605a988672a	2026-06-22 20:16:35.423757+00
3cfaa450-38cc-4f26-adca-47b88fab51e4	\N	3cfaa450-38cc-4f26-adca-47b88fab51e4	2026-06-22 20:16:35.819544+00
ee6fde5c-6ff1-4986-a032-f25b85611106	\N	ee6fde5c-6ff1-4986-a032-f25b85611106	2026-06-22 20:16:36.549372+00
be9c4fa1-93ae-44a9-92a2-11de294a928f	\N	be9c4fa1-93ae-44a9-92a2-11de294a928f	2026-06-22 20:19:32.173511+00
f0709ada-a6e5-4538-bdc3-3cf54fe7f90c	\N	f0709ada-a6e5-4538-bdc3-3cf54fe7f90c	2026-06-22 20:19:32.735332+00
699ea150-c2b2-4159-a319-0ae5cda47621	\N	699ea150-c2b2-4159-a319-0ae5cda47621	2026-06-22 20:19:33.283958+00
dd0ba0e9-4902-41b4-b4cc-98a8663a1aa4	\N	dd0ba0e9-4902-41b4-b4cc-98a8663a1aa4	2026-06-22 20:19:33.694303+00
7289e5a7-a738-45d9-a188-2dfcd5913529	\N	7289e5a7-a738-45d9-a188-2dfcd5913529	2026-06-22 20:19:34.232784+00
e5d675fa-ef65-43a1-bdd1-bb9e2dbd5534	\N	e5d675fa-ef65-43a1-bdd1-bb9e2dbd5534	2026-06-22 20:21:01.393992+00
de1b8428-862d-4b76-95cc-06c6dad7dae0	\N	de1b8428-862d-4b76-95cc-06c6dad7dae0	2026-06-22 20:21:01.807211+00
31335c62-04e4-441a-b3d3-9616e6f0f0a6	\N	31335c62-04e4-441a-b3d3-9616e6f0f0a6	2026-06-22 20:21:02.362634+00
1ab78ff3-7f7c-4251-8adb-5dda46426492	\N	1ab78ff3-7f7c-4251-8adb-5dda46426492	2026-06-22 20:21:02.736327+00
17bc8088-097b-497a-989a-ae5fdecc0227	\N	17bc8088-097b-497a-989a-ae5fdecc0227	2026-06-22 20:21:03.43762+00
8fb44d55-f481-4589-a25a-7259cb183877	\N	8fb44d55-f481-4589-a25a-7259cb183877	2026-06-22 20:22:12.850032+00
8a85f3fe-6474-4c8e-9434-a45af4c91720	\N	8a85f3fe-6474-4c8e-9434-a45af4c91720	2026-06-22 20:22:13.272221+00
7e9e627f-200f-44de-b6dd-35db84e14b18	\N	7e9e627f-200f-44de-b6dd-35db84e14b18	2026-06-22 20:22:13.832477+00
f1a2ea77-3714-4443-9ee7-4df639673825	\N	f1a2ea77-3714-4443-9ee7-4df639673825	2026-06-22 20:22:14.199412+00
139fded8-9f34-4ac0-901a-0a1e394497ab	\N	139fded8-9f34-4ac0-901a-0a1e394497ab	2026-06-22 20:22:14.742416+00
9c3851e1-b447-4955-815c-58abae998ab7	\N	9c3851e1-b447-4955-815c-58abae998ab7	2026-06-22 20:23:08.621047+00
0e652fba-81d6-484b-9766-37668eb50b1d	\N	0e652fba-81d6-484b-9766-37668eb50b1d	2026-06-22 20:23:09.073138+00
6902c8f6-74cf-4dac-a04b-c1c578771c35	\N	6902c8f6-74cf-4dac-a04b-c1c578771c35	2026-06-22 20:23:09.689015+00
058f7e42-be7d-4882-8b56-b67693ec409a	\N	058f7e42-be7d-4882-8b56-b67693ec409a	2026-06-22 20:23:10.090445+00
2196ec93-7fa8-4899-a213-228ae1f9333f	\N	2196ec93-7fa8-4899-a213-228ae1f9333f	2026-06-22 20:23:10.618154+00
561f2bfd-ec7d-480b-8897-6ca1872899c4	\N	561f2bfd-ec7d-480b-8897-6ca1872899c4	2026-06-22 20:24:21.090008+00
b293b3d2-2fe9-4a7c-b65d-57169134b33a	\N	b293b3d2-2fe9-4a7c-b65d-57169134b33a	2026-06-22 20:24:21.524834+00
a92f7472-0efe-4f90-a3e7-e0db0d0fddae	\N	a92f7472-0efe-4f90-a3e7-e0db0d0fddae	2026-06-22 20:24:22.079717+00
6cfcbee8-e45d-4b7f-8f43-a0da0d5c0ebf	\N	6cfcbee8-e45d-4b7f-8f43-a0da0d5c0ebf	2026-06-22 20:24:22.649221+00
6e271ba0-e313-4383-bbf9-00977f118509	\N	6e271ba0-e313-4383-bbf9-00977f118509	2026-06-22 20:24:23.159521+00
4193453f-17e6-4899-91b4-07a5f3b572c4	\N	4193453f-17e6-4899-91b4-07a5f3b572c4	2026-06-22 20:25:18.495192+00
42967b57-5bc1-4d70-bd0f-5e7acb8b9ed4	\N	42967b57-5bc1-4d70-bd0f-5e7acb8b9ed4	2026-06-22 20:25:18.948697+00
9fba0daf-a171-4fec-8adf-c1838066ed66	\N	9fba0daf-a171-4fec-8adf-c1838066ed66	2026-06-22 20:25:19.533343+00
eca32721-56a7-4542-b171-570a760757fc	\N	eca32721-56a7-4542-b171-570a760757fc	2026-06-22 20:25:19.929945+00
db2d43dd-d608-4730-9400-3244264b972d	\N	db2d43dd-d608-4730-9400-3244264b972d	2026-06-22 20:25:20.465959+00
9e2ca5d2-ea7f-4056-86c4-28ed0f6f57ce	\N	9e2ca5d2-ea7f-4056-86c4-28ed0f6f57ce	2026-06-22 20:26:57.473077+00
8d005f01-ad2f-4cfa-bf52-bfd80b32ec30	\N	8d005f01-ad2f-4cfa-bf52-bfd80b32ec30	2026-06-22 20:26:58.041337+00
5d672bd0-558d-4dc8-99e4-bf89278075c1	\N	5d672bd0-558d-4dc8-99e4-bf89278075c1	2026-06-22 20:26:58.619995+00
6539f4f0-91ac-4ef8-a953-7dbb8ad3125c	\N	6539f4f0-91ac-4ef8-a953-7dbb8ad3125c	2026-06-22 20:26:59.034618+00
93854ff1-68c0-4037-bde7-85617be8c46a	\N	93854ff1-68c0-4037-bde7-85617be8c46a	2026-06-22 20:26:59.616854+00
30736dfe-766d-48a3-bb0d-03db5d49d922	\N	30736dfe-766d-48a3-bb0d-03db5d49d922	2026-06-22 20:28:25.067637+00
20e50238-e820-4282-85e7-3e7e65d13125	\N	20e50238-e820-4282-85e7-3e7e65d13125	2026-06-22 20:28:25.498292+00
00347cb1-a379-4507-8245-651a6ec6984a	\N	00347cb1-a379-4507-8245-651a6ec6984a	2026-06-22 20:28:26.033897+00
ad71d1b0-2b2a-48c5-b5ad-b9922a1ac715	\N	ad71d1b0-2b2a-48c5-b5ad-b9922a1ac715	2026-06-22 20:28:26.419711+00
d6a20891-707e-4a47-8556-796a2eda1146	\N	d6a20891-707e-4a47-8556-796a2eda1146	2026-06-22 20:28:27.0762+00
b92529ee-bbae-423e-a7d0-4d4b6b726de6	\N	b92529ee-bbae-423e-a7d0-4d4b6b726de6	2026-06-22 20:29:19.535661+00
28076219-58eb-47ff-b007-103b52f100b7	\N	28076219-58eb-47ff-b007-103b52f100b7	2026-06-22 20:29:19.947954+00
36236645-8c52-4f27-89f9-fb83bbe284ec	\N	36236645-8c52-4f27-89f9-fb83bbe284ec	2026-06-22 20:29:20.423463+00
17c69662-73e5-4e5d-9443-93953a76e789	\N	17c69662-73e5-4e5d-9443-93953a76e789	2026-06-22 20:29:20.810557+00
163099e9-7fa2-4d7f-89b7-7679fcaafe3f	\N	163099e9-7fa2-4d7f-89b7-7679fcaafe3f	2026-06-22 20:29:21.278919+00
0175aff4-3947-4489-9013-4cfeb28f8b67	\N	0175aff4-3947-4489-9013-4cfeb28f8b67	2026-06-22 20:31:19.979122+00
1184ae1b-e0b9-40b7-a0bb-b3fb6dda7417	\N	1184ae1b-e0b9-40b7-a0bb-b3fb6dda7417	2026-06-22 20:31:20.436952+00
61d3d088-4d2f-4d5d-84c6-91ddbb31babd	\N	61d3d088-4d2f-4d5d-84c6-91ddbb31babd	2026-06-22 20:31:20.927438+00
5caea50d-560f-4b0c-a55c-f80516e4422b	\N	5caea50d-560f-4b0c-a55c-f80516e4422b	2026-06-22 20:31:21.339472+00
54e7466b-0d6a-4fd4-8dd6-050d1ef2af43	\N	54e7466b-0d6a-4fd4-8dd6-050d1ef2af43	2026-06-22 20:31:21.809618+00
e7a499d3-2e70-47b6-abf9-4dc57f6e6b3c	\N	e7a499d3-2e70-47b6-abf9-4dc57f6e6b3c	2026-06-22 20:32:01.595496+00
8b0b05b7-4fc3-4eb0-988f-bd396b31065c	\N	8b0b05b7-4fc3-4eb0-988f-bd396b31065c	2026-06-22 20:32:02.224988+00
e4d51b27-67fc-4272-ae5a-e850e4d497f6	\N	e4d51b27-67fc-4272-ae5a-e850e4d497f6	2026-06-22 20:32:02.685753+00
e3431236-7b7b-44e2-9236-2eaa865dcb2b	\N	e3431236-7b7b-44e2-9236-2eaa865dcb2b	2026-06-22 20:32:03.069237+00
89206f87-7618-4ea2-81de-890aaa7ed7e8	\N	89206f87-7618-4ea2-81de-890aaa7ed7e8	2026-06-22 20:32:03.495926+00
3eedf107-8ce8-4973-862a-c5b033b9bec7	\N	E2E-USER-1782192422162	2026-06-23 05:27:02.268783+00
2bed7662-8639-419f-b314-62fb3b7f5a8d	\N	7392836954	2026-06-25 01:37:27.554335+00
\.


--
-- Data for Name: warranty_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."warranty_logs" ("id", "order_item_id", "old_inventory_id", "new_inventory_id", "delivery_status", "claimed_at", "reason") FROM stdin;
218ef6bf-c3ea-429a-b704-cc0d2c56db39	a90740b0-f6ff-4309-91b3-ef9ae209e57c	553905ae-3893-434c-b811-33712ac1fd73	accd6380-f44a-4c21-ade4-4f3b91404303	pending	2026-06-25 01:54:10.784516+00	Klaim via Telegram Bot
fce6bf6c-40a9-43a3-99a8-30b6fce05b48	fac76356-a651-4dc2-9638-81ed8929a6a2	31f3b252-cb16-418a-a7c1-db9bfad14148	e77cd5a8-301b-45ae-9506-9ac46a1995dc	pending	2026-06-25 03:07:10.877659+00	Klaim via Telegram Bot
4c51911d-ae8a-400f-aa2c-d82d7e7b2a05	20e5503b-5295-4f5a-8cca-269c5afdd294	39c0bb30-5e88-43e3-840a-3011f54f2da0	4fb29670-2ed6-4e9a-a66c-40d199d041cc	pending	2026-06-25 03:08:09.470511+00	Klaim via Telegram Bot
9e71bc5c-71f7-47a5-b699-748030a3f255	e85dc6f3-ac0a-4371-8b2d-7e359a2176ba	c7058456-85d9-43e5-9aa8-28385c7be7b2	59e86c5c-96d5-4a8e-997a-89e27637d5f1	pending	2026-06-25 05:07:41.436149+00	Testing claim via script
6cc97fd8-2b9f-4c78-9375-44955f2f408e	83197770-a1de-4cfb-ac64-22a174c17b1e	ffc1ac3e-b181-4e06-b32e-0e1ad26082bf	734c7310-9c33-494f-8c9c-a386b603c4de	pending	2026-06-25 05:17:09.964242+00	Klaim Garansi Otomatis dari Web
70fd1037-0dd7-4668-baa8-2bb01a5a1291	0e267d75-fac4-42ed-801d-2cc2dc20c936	1e8bb432-17a3-4482-bab8-b65610f5ad2a	30755fac-70c1-43c0-a476-336edb7dc1df	pending	2026-06-25 06:07:50.085266+00	Klaim Garansi Otomatis dari Web
\.


--
-- Name: admin_sessions admin_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."admin_sessions"
    ADD CONSTRAINT "admin_sessions_pkey" PRIMARY KEY ("id");


--
-- Name: admins admins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");


--
-- Name: admins admins_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_username_key" UNIQUE ("username");


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");


--
-- Name: bot_templates bot_templates_key_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."bot_templates"
    ADD CONSTRAINT "bot_templates_key_key" UNIQUE ("key");


--
-- Name: bot_templates bot_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."bot_templates"
    ADD CONSTRAINT "bot_templates_pkey" PRIMARY KEY ("id");


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");


--
-- Name: inventory inventory_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_pkey" PRIMARY KEY ("id");


--
-- Name: login_attempts login_attempts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."login_attempts"
    ADD CONSTRAINT "login_attempts_pkey" PRIMARY KEY ("ip_address");


--
-- Name: order_items order_items_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_pkey" PRIMARY KEY ("id");


--
-- Name: orders orders_access_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_access_token_key" UNIQUE ("access_token");


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");


--
-- Name: otp_codes otp_codes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."otp_codes"
    ADD CONSTRAINT "otp_codes_pkey" PRIMARY KEY ("id");


--
-- Name: outbox_events outbox_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."outbox_events"
    ADD CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id");


--
-- Name: outbox_events outbox_events_transaction_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."outbox_events"
    ADD CONSTRAINT "outbox_events_transaction_id_key" UNIQUE ("transaction_id");


--
-- Name: pending_claims pending_claims_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."pending_claims"
    ADD CONSTRAINT "pending_claims_pkey" PRIMARY KEY ("id");


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."system_settings"
    ADD CONSTRAINT "system_settings_pkey" PRIMARY KEY ("key");


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");


--
-- Name: users users_telegram_chat_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_telegram_chat_id_key" UNIQUE ("telegram_chat_id");


--
-- Name: warranty_logs warranty_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."warranty_logs"
    ADD CONSTRAINT "warranty_logs_pkey" PRIMARY KEY ("id");


--
-- Name: idx_admin_sessions_admin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_admin_sessions_admin_id" ON "public"."admin_sessions" USING "btree" ("admin_id");


--
-- Name: idx_audit_logs_admin_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_audit_logs_admin_id" ON "public"."audit_logs" USING "btree" ("admin_id");


--
-- Name: idx_inventory_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_inventory_category_id" ON "public"."inventory" USING "btree" ("category_id");


--
-- Name: idx_inventory_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_inventory_product_id" ON "public"."inventory" USING "btree" ("product_id");


--
-- Name: idx_order_items_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_order_items_created_at" ON "public"."order_items" USING "btree" ("created_at");


--
-- Name: idx_order_items_inventory_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_order_items_inventory_id" ON "public"."order_items" USING "btree" ("inventory_id");


--
-- Name: idx_order_items_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_order_items_order_id" ON "public"."order_items" USING "btree" ("order_id");


--
-- Name: idx_order_items_product_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_order_items_product_id" ON "public"."order_items" USING "btree" ("product_id");


--
-- Name: idx_orders_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_orders_created_at" ON "public"."orders" USING "btree" ("created_at");


--
-- Name: idx_orders_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_orders_user_id" ON "public"."orders" USING "btree" ("user_id");


--
-- Name: idx_otp_codes_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_otp_codes_order_id" ON "public"."otp_codes" USING "btree" ("order_id");


--
-- Name: idx_outbox_events_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_outbox_events_status" ON "public"."outbox_events" USING "btree" ("status");


--
-- Name: idx_outbox_queue; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_outbox_queue" ON "public"."outbox_events" USING "btree" ("next_retry_at") WHERE (("status")::"text" = ANY ((ARRAY['pending'::character varying, 'processing'::character varying])::"text"[]));


--
-- Name: idx_pending_claims_order_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_pending_claims_order_item_id" ON "public"."pending_claims" USING "btree" ("order_item_id");


--
-- Name: idx_products_category_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_products_category_id" ON "public"."products" USING "btree" ("category_id");


--
-- Name: idx_products_parent_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_products_parent_id" ON "public"."products" USING "btree" ("parent_id");


--
-- Name: idx_warranty_logs_new_inv_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_warranty_logs_new_inv_id" ON "public"."warranty_logs" USING "btree" ("new_inventory_id");


--
-- Name: idx_warranty_logs_old_inv_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_warranty_logs_old_inv_id" ON "public"."warranty_logs" USING "btree" ("old_inventory_id");


--
-- Name: idx_warranty_logs_order_item_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_warranty_logs_order_item_id" ON "public"."warranty_logs" USING "btree" ("order_item_id");


--
-- Name: inventory fulfill_pending_claims_on_restock; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER "fulfill_pending_claims_on_restock" AFTER INSERT OR UPDATE OF "status" ON "public"."inventory" FOR EACH ROW WHEN ((("new"."status" = 'Available'::"public"."inventory_status_enum") AND ("pg_trigger_depth"() < 1))) EXECUTE FUNCTION "public"."trigger_fulfill_pending_claims"();


--
-- Name: admin_sessions admin_sessions_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."admin_sessions"
    ADD CONSTRAINT "admin_sessions_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE CASCADE;


--
-- Name: audit_logs audit_logs_admin_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id");


--
-- Name: inventory inventory_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;


--
-- Name: inventory inventory_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."inventory"
    ADD CONSTRAINT "inventory_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;


--
-- Name: order_items order_items_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_inventory_id_fkey" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id");


--
-- Name: order_items order_items_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;


--
-- Name: order_items order_items_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."order_items"
    ADD CONSTRAINT "order_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id");


--
-- Name: otp_codes otp_codes_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."otp_codes"
    ADD CONSTRAINT "otp_codes_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;


--
-- Name: pending_claims pending_claims_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."pending_claims"
    ADD CONSTRAINT "pending_claims_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id");


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE CASCADE;


--
-- Name: products products_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;


--
-- Name: warranty_logs warranty_logs_new_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."warranty_logs"
    ADD CONSTRAINT "warranty_logs_new_inventory_id_fkey" FOREIGN KEY ("new_inventory_id") REFERENCES "public"."inventory"("id");


--
-- Name: warranty_logs warranty_logs_old_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."warranty_logs"
    ADD CONSTRAINT "warranty_logs_old_inventory_id_fkey" FOREIGN KEY ("old_inventory_id") REFERENCES "public"."inventory"("id");


--
-- Name: warranty_logs warranty_logs_order_item_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."warranty_logs"
    ADD CONSTRAINT "warranty_logs_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "public"."order_items"("id");


--
-- Name: inventory Admins manage inventory; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage inventory" ON "public"."inventory" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."id" = ((("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text"))::"uuid"))));


--
-- Name: orders Admins manage orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage orders" ON "public"."orders" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."id" = ((("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text"))::"uuid"))));


--
-- Name: products Admins manage products; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins manage products" ON "public"."products" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."id" = ((("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text"))::"uuid"))));


--
-- Name: admins Admins read own; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins read own" ON "public"."admins" FOR SELECT USING (("id" = ((("current_setting"('request.jwt.claims'::"text", true))::json ->> 'sub'::"text"))::"uuid"));


--
-- Name: categories Allow public read on categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow public read on categories" ON "public"."categories" FOR SELECT USING (true);


--
-- Name: bot_templates Enable all for admin; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable all for admin" ON "public"."bot_templates" TO "authenticated" USING (true) WITH CHECK (true);


--
-- Name: bot_templates Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable read access for all users" ON "public"."bot_templates" FOR SELECT USING (true);


--
-- Name: categories Public Read Categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public Read Categories" ON "public"."categories" FOR SELECT USING (true);


--
-- Name: products Public Read Products; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public Read Products" ON "public"."products" FOR SELECT USING (true);


--
-- Name: products Public products viewable; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public products viewable" ON "public"."products" FOR SELECT USING (true);


--
-- Name: otp_codes Service role can manage otp_codes; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service role can manage otp_codes" ON "public"."otp_codes" USING (true) WITH CHECK (true);


--
-- Name: inventory Users read own inventory; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users read own inventory" ON "public"."inventory" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."order_items" "oi"
     JOIN "public"."orders" "o" ON (("oi"."order_id" = "o"."id")))
  WHERE (("oi"."inventory_id" = "inventory"."id") AND ("o"."user_id" = "auth"."uid"())))));


--
-- Name: order_items Users read own order items; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users read own order items" ON "public"."order_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."orders"
  WHERE (("orders"."id" = "order_items"."order_id") AND ("orders"."user_id" = "auth"."uid"())))));


--
-- Name: orders Users read own orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users read own orders" ON "public"."orders" FOR SELECT USING (("user_id" = "auth"."uid"()));


--
-- Name: users Users read own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users read own profile" ON "public"."users" FOR SELECT USING (("id" = "auth"."uid"()));


--
-- Name: warranty_logs Users read own warranty logs; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users read own warranty logs" ON "public"."warranty_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."order_items" "oi"
     JOIN "public"."orders" "o" ON (("oi"."order_id" = "o"."id")))
  WHERE (("oi"."id" = "warranty_logs"."order_item_id") AND ("o"."user_id" = "auth"."uid"())))));


--
-- Name: admin_sessions; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."admin_sessions" ENABLE ROW LEVEL SECURITY;

--
-- Name: admins; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;

--
-- Name: audit_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."audit_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: bot_templates; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."bot_templates" ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;

--
-- Name: inventory; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."inventory" ENABLE ROW LEVEL SECURITY;

--
-- Name: login_attempts; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."login_attempts" ENABLE ROW LEVEL SECURITY;

--
-- Name: order_items; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."order_items" ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;

--
-- Name: otp_codes; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."otp_codes" ENABLE ROW LEVEL SECURITY;

--
-- Name: outbox_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."outbox_events" ENABLE ROW LEVEL SECURITY;

--
-- Name: pending_claims; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."pending_claims" ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;

--
-- Name: system_settings; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."system_settings" ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;

--
-- Name: warranty_logs; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."warranty_logs" ENABLE ROW LEVEL SECURITY;

--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


--
-- Name: FUNCTION "check_cooldown_validity"("p_order_item_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."check_cooldown_validity"("p_order_item_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."check_cooldown_validity"("p_order_item_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_cooldown_validity"("p_order_item_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "check_cooldown_validity"("last_claim_time" timestamp with time zone, "cooldown_val" integer, "cooldown_unit" "public"."cooldown_unit_enum"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."check_cooldown_validity"("last_claim_time" timestamp with time zone, "cooldown_val" integer, "cooldown_unit" "public"."cooldown_unit_enum") TO "anon";
GRANT ALL ON FUNCTION "public"."check_cooldown_validity"("last_claim_time" timestamp with time zone, "cooldown_val" integer, "cooldown_unit" "public"."cooldown_unit_enum") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_cooldown_validity"("last_claim_time" timestamp with time zone, "cooldown_val" integer, "cooldown_unit" "public"."cooldown_unit_enum") TO "service_role";


--
-- Name: TABLE "outbox_events"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."outbox_events" TO "anon";
GRANT ALL ON TABLE "public"."outbox_events" TO "authenticated";
GRANT ALL ON TABLE "public"."outbox_events" TO "service_role";


--
-- Name: FUNCTION "get_pending_outbox_events"("batch_size" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_pending_outbox_events"("batch_size" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_pending_outbox_events"("batch_size" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_outbox_events"("batch_size" integer) TO "service_role";


--
-- Name: FUNCTION "hold_inventory"("p_product_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."hold_inventory"("p_product_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hold_inventory"("p_product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hold_inventory"("p_product_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "process_payment_fulfillment"("p_order_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."process_payment_fulfillment"("p_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."process_payment_fulfillment"("p_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_payment_fulfillment"("p_order_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "process_payment_fulfillment"("p_order_id" "uuid", "p_amount" numeric); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."process_payment_fulfillment"("p_order_id" "uuid", "p_amount" numeric) TO "anon";
GRANT ALL ON FUNCTION "public"."process_payment_fulfillment"("p_order_id" "uuid", "p_amount" numeric) TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_payment_fulfillment"("p_order_id" "uuid", "p_amount" numeric) TO "service_role";


--
-- Name: FUNCTION "process_warranty_claim"("p_order_item_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."process_warranty_claim"("p_order_item_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."process_warranty_claim"("p_order_item_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."process_warranty_claim"("p_order_item_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "rpc_archive_product"("p_admin_id" "uuid", "p_product_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."rpc_archive_product"("p_admin_id" "uuid", "p_product_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_archive_product"("p_admin_id" "uuid", "p_product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_archive_product"("p_admin_id" "uuid", "p_product_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "rpc_bulk_insert_inventory"("p_admin_id" "uuid", "p_target_id" "uuid", "p_target_type" "text", "p_credentials_array" "text"[]); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."rpc_bulk_insert_inventory"("p_admin_id" "uuid", "p_target_id" "uuid", "p_target_type" "text", "p_credentials_array" "text"[]) TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_bulk_insert_inventory"("p_admin_id" "uuid", "p_target_id" "uuid", "p_target_type" "text", "p_credentials_array" "text"[]) TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_bulk_insert_inventory"("p_admin_id" "uuid", "p_target_id" "uuid", "p_target_type" "text", "p_credentials_array" "text"[]) TO "service_role";


--
-- Name: FUNCTION "rpc_claim_inventory"("p_order_item_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."rpc_claim_inventory"("p_order_item_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_claim_inventory"("p_order_item_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_claim_inventory"("p_order_item_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "rpc_delete_product_permanently"("p_product_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."rpc_delete_product_permanently"("p_product_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_delete_product_permanently"("p_product_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_delete_product_permanently"("p_product_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "rpc_get_variation_stock"("p_variation_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."rpc_get_variation_stock"("p_variation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_get_variation_stock"("p_variation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_get_variation_stock"("p_variation_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "rpc_process_warranty_claim"("p_order_item_id" "uuid", "p_reason" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."rpc_process_warranty_claim"("p_order_item_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_process_warranty_claim"("p_order_item_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_process_warranty_claim"("p_order_item_id" "uuid", "p_reason" "text") TO "service_role";


--
-- Name: FUNCTION "rpc_update_system_settings"("p_admin_id" "uuid", "p_settings" "jsonb"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."rpc_update_system_settings"("p_admin_id" "uuid", "p_settings" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."rpc_update_system_settings"("p_admin_id" "uuid", "p_settings" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."rpc_update_system_settings"("p_admin_id" "uuid", "p_settings" "jsonb") TO "service_role";


--
-- Name: FUNCTION "system_periodic_cleanup"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."system_periodic_cleanup"() TO "anon";
GRANT ALL ON FUNCTION "public"."system_periodic_cleanup"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."system_periodic_cleanup"() TO "service_role";


--
-- Name: FUNCTION "trigger_fulfill_pending_claims"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."trigger_fulfill_pending_claims"() TO "anon";
GRANT ALL ON FUNCTION "public"."trigger_fulfill_pending_claims"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."trigger_fulfill_pending_claims"() TO "service_role";


--
-- Name: TABLE "categories"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";


--
-- Name: TABLE "inventory"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."inventory" TO "anon";
GRANT ALL ON TABLE "public"."inventory" TO "authenticated";
GRANT ALL ON TABLE "public"."inventory" TO "service_role";


--
-- Name: TABLE "products"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";


--
-- Name: TABLE "admin_product_summary_view"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."admin_product_summary_view" TO "anon";
GRANT ALL ON TABLE "public"."admin_product_summary_view" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_product_summary_view" TO "service_role";


--
-- Name: TABLE "admin_sessions"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."admin_sessions" TO "anon";
GRANT ALL ON TABLE "public"."admin_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_sessions" TO "service_role";


--
-- Name: TABLE "admins"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";


--
-- Name: TABLE "audit_logs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";


--
-- Name: TABLE "bot_templates"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."bot_templates" TO "anon";
GRANT ALL ON TABLE "public"."bot_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."bot_templates" TO "service_role";


--
-- Name: TABLE "login_attempts"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."login_attempts" TO "anon";
GRANT ALL ON TABLE "public"."login_attempts" TO "authenticated";
GRANT ALL ON TABLE "public"."login_attempts" TO "service_role";


--
-- Name: TABLE "order_items"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."order_items" TO "anon";
GRANT ALL ON TABLE "public"."order_items" TO "authenticated";
GRANT ALL ON TABLE "public"."order_items" TO "service_role";


--
-- Name: TABLE "orders"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";


--
-- Name: TABLE "otp_codes"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."otp_codes" TO "anon";
GRANT ALL ON TABLE "public"."otp_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."otp_codes" TO "service_role";


--
-- Name: TABLE "pending_claims"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."pending_claims" TO "anon";
GRANT ALL ON TABLE "public"."pending_claims" TO "authenticated";
GRANT ALL ON TABLE "public"."pending_claims" TO "service_role";


--
-- Name: TABLE "system_settings"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."system_settings" TO "anon";
GRANT ALL ON TABLE "public"."system_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."system_settings" TO "service_role";


--
-- Name: TABLE "users"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";


--
-- Name: TABLE "warranty_logs"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."warranty_logs" TO "anon";
GRANT ALL ON TABLE "public"."warranty_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."warranty_logs" TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- PostgreSQL database dump complete
--

\unrestrict Sh38YjzYAU4hQncXtBenfx1yBxHJ8Dw1DFfZJy6vCeGtLugRDKkLDoHDAafSObG

