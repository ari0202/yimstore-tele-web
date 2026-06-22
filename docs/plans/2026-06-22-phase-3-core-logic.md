# Phase 3: Core Logic & Multi-Channel Interface (v6)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Mengimplementasikan Sistem Klaim Garansi Mandiri dan Antarmuka dengan keandalan Telegram Deep Linking, Anti-Leak Cookies Middleware, dan Backorder (Pending Claims) Mitigation.

---

### Task 1: Database Migration untuk Pending Claims, Backorder Trigger & Warranty RPC

**Files:**
- Create: `supabase/migrations/20260622110000_phase3_warranty_claim.sql`

**Step 1: SQL Migration Script**
```sql
-- 1. System Settings & Kill-Switch
CREATE TABLE IF NOT EXISTS public.system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value VARCHAR(255) NOT NULL
);
INSERT INTO public.system_settings (key, value) VALUES ('maintenance_mode', 'false') ON CONFLICT DO NOTHING;

-- 2. Pending Claims untuk Mitigasi Kadaluwarsa saat Out of Stock
CREATE TABLE IF NOT EXISTS public.pending_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID NOT NULL REFERENCES public.order_items(id),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending' / 'fulfilled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Tokenized Access (Split-Brain Fix & IDOR Prevention)
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS access_token UUID DEFAULT gen_random_uuid() UNIQUE;

-- 4. Auto-Fulfill Pending Claims Trigger (Menutup Blackhole Klaim)
CREATE OR REPLACE FUNCTION trigger_fulfill_pending_claims()
RETURNS TRIGGER AS $$
DECLARE
    v_pending_claim RECORD;
BEGIN
    -- Cek Global Kill-Switch (Mencegah Trigger Bypass)
    IF EXISTS (SELECT 1 FROM public.system_settings WHERE key = 'maintenance_mode' AND value = 'true') THEN 
        RETURN NEW; 
    END IF;

    -- Hanya beraksi jika ada stok Available yang masuk/diupdate
    IF NEW.status = 'Available' THEN
        -- Cari klaim tertunda paling tua untuk produk yang sama (EXPLISIT LOCK TABLES TO PREVENT DEADLOCK)
        SELECT pc.id, pc.order_item_id, oi.inventory_id AS old_inventory_id
        INTO v_pending_claim
        FROM public.pending_claims pc
        JOIN public.order_items oi ON pc.order_item_id = oi.id
        JOIN public.inventory old_inv ON oi.inventory_id = old_inv.id
        WHERE pc.status = 'pending' AND old_inv.product_id = NEW.product_id
        ORDER BY pc.created_at ASC
        LIMIT 1 FOR UPDATE OF pc, oi SKIP LOCKED;

        IF FOUND THEN
            -- Alokasikan stok baru ini langsung ke user yang mengantre
            NEW.status := 'Used';
            
            UPDATE public.pending_claims SET status = 'fulfilled' WHERE id = v_pending_claim.id;
            UPDATE public.order_items SET inventory_id = NEW.id WHERE id = v_pending_claim.order_item_id;
            
            -- REVOKE STOK LAMA (Mencegah Korupsi Database State Machine)
            UPDATE public.inventory SET status = 'Revoked' WHERE id = v_pending_claim.old_inventory_id;

            INSERT INTO public.warranty_logs (order_item_id, old_inventory_id, new_inventory_id)
            VALUES (v_pending_claim.order_item_id, v_pending_claim.old_inventory_id, NEW.id);
            
            INSERT INTO public.outbox_events (event_type, payload, status)
            VALUES ('DELIVER_WARRANTY_CREDENTIAL', jsonb_build_object('order_item_id', v_pending_claim.order_item_id), 'pending');
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER fulfill_pending_claims_on_restock
BEFORE INSERT OR UPDATE ON public.inventory
FOR EACH ROW EXECUTE FUNCTION trigger_fulfill_pending_claims();

-- 5. Atomic Warranty Claim RPC
CREATE OR REPLACE FUNCTION process_warranty_claim(p_order_item_id UUID) RETURNS VARCHAR AS $$
DECLARE
    v_item RECORD;
    v_new_inv_id UUID;
    v_valid_cooldown BOOLEAN;
    v_maintenance BOOLEAN;
    v_pending_claim_exists BOOLEAN;
BEGIN
    -- Cek Global Kill-Switch
    SELECT (value = 'true') INTO v_maintenance FROM public.system_settings WHERE key = 'maintenance_mode';
    IF v_maintenance THEN RETURN 'MAINTENANCE_MODE'; END IF;

    -- Lock order_item
    SELECT oi.id, oi.inventory_id, oi.current_claim_count, oi.warranty_end_date, oi.order_id,
           i.product_id, p.max_claim_limit
    INTO v_item
    FROM public.order_items oi
    JOIN public.inventory i ON oi.inventory_id = i.id
    JOIN public.products p ON i.product_id = p.id
    WHERE oi.id = p_order_item_id FOR UPDATE OF oi;

    -- Cek status antrean pending
    SELECT EXISTS(SELECT 1 FROM public.pending_claims WHERE order_item_id = p_order_item_id AND status = 'pending') INTO v_pending_claim_exists;
    
    -- Validasi Garansi (bypass jika sudah masuk daftar antrean pending)
    IF v_item.warranty_end_date < NOW() AND NOT v_pending_claim_exists THEN RETURN 'WARRANTY_EXPIRED'; END IF;
    IF v_item.current_claim_count >= v_item.max_claim_limit AND NOT v_pending_claim_exists THEN RETURN 'LIMIT_REACHED'; END IF;

    -- Validasi Cooldown
    IF NOT v_pending_claim_exists THEN
        SELECT public.check_cooldown_validity(p_order_item_id) INTO v_valid_cooldown;
        IF NOT v_valid_cooldown THEN RETURN 'COOLDOWN_ACTIVE'; END IF;
    END IF;

    -- Coba tarik stok baru
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
        RETURN 'OUT_OF_STOCK'; 
    END IF;

    IF v_pending_claim_exists THEN
        UPDATE public.pending_claims SET status = 'fulfilled' WHERE order_item_id = p_order_item_id AND status = 'pending';
    ELSE
        UPDATE public.order_items SET current_claim_count = current_claim_count + 1 WHERE id = p_order_item_id;
    END IF;

    -- Cabut stok lama & pasang stok baru
    UPDATE public.inventory SET status = 'Revoked' WHERE id = v_item.inventory_id;
    UPDATE public.order_items SET inventory_id = v_new_inv_id WHERE id = p_order_item_id;
    
    INSERT INTO public.warranty_logs (order_item_id, old_inventory_id, new_inventory_id)
    VALUES (p_order_item_id, v_item.inventory_id, v_new_inv_id);

    INSERT INTO public.outbox_events (event_type, payload, status)
    VALUES ('DELIVER_WARRANTY_CREDENTIAL', jsonb_build_object('order_item_id', p_order_item_id), 'pending');

    RETURN 'SUCCESS';
END;
$$ LANGUAGE plpgsql;
```

---

### Task 2: Next.js Anti-Leak Middleware & Dashboard UI

**Files:**
- Create: `src/middleware.ts`
- Create: `src/app/order/[id]/page.tsx`

1. **Anti-Leak Token Middleware (`middleware.ts`)**:
   - Menerima URL dengan format `?token=[access_token]&id=[order_id]`.
   - Middleware menetapkan *cookie* dinamis `order_token_[order_id]=[access_token]` dengan atribut `HttpOnly`, `Secure`, `SameSite=Strict`.
   - Mengembalikan *HTTP 302 Redirect* untuk menghapus *query parameter*.

---

### Task 3: Telegram Bot Deep Linking & Identity Merge

**Files:**
- Create: `src/lib/bot.ts`
- Create: `src/app/api/webhook/telegram/route.ts`

1. **Identity Merge (Menyelesaikan Multi-Channel Fragmentation)**:
   - Saat pengguna menekan tautan `t.me/YimBot?start=token_[access_token]`.
   - Bot mendeteksi pesanan terkait. Jika `telegram_chat_id` akun pesanan tersebut masih kosong, bot mengecek: *Apakah chat_id ini sudah terikat ke User lain di database?*
   - Jika YA: Bot memindahkan `order.user_id` ke ID User yang lama (`Identity Merge`), lalu menghapus user anonim yang baru terbuat.
   - Jika TIDAK: Bot cukup memperbarui `telegram_chat_id` pada user anonim tersebut.
   - Ini memastikan pelanggan dapat berbelanja berkali-kali tanpa *login*, dan semua pesanan mereka akan bersatu di bawah 1 identitas Telegram yang sama.

---

### Task 4: API Endpoint Eksekusi Klaim & UI Web Dashboard

**Files:**
- Create: `src/app/api/claim/route.ts`
- Update: `src/app/api/cron/process-outbox/route.ts`

1. Endpoint API UI `/api/claim` memvalidasi cookie `order_token_[id]` dan memanggil RPC.
2. Handler Outbox cron dipasang untuk mendistribusikan kredensial hasil `DELIVER_WARRANTY_CREDENTIAL` ke Telegram pembeli.
