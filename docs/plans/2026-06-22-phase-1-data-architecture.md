# Phase 1: Data Architecture Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Membangun struktur database Supabase yang kuat dan aman sebagai Single Source of Truth untuk aplikasi e-commerce digital YimStore.

**Architecture:** Menggunakan Supabase PostgreSQL dengan skema relasional yang mendukung manajemen kategori, produk, inventory, dan transaksi. Menggunakan Row Level Security (RLS) untuk keamanan akses.

**Tech Stack:** Supabase (PostgreSQL), Supabase CLI (untuk migrasi lokal), SQL.

---

### Task 1: Setup Supabase Project & Migrations

**Files:**
- Create: `supabase/config.toml`
- Create: `supabase/migrations/20260622000000_initial_schema.sql`

**Step 1: Inisialisasi Supabase secara lokal**
Run: `npx supabase init` (jika belum)

**Step 2: Buat file migrasi SQL kosong**
Run: `npx supabase migration new initial_schema`

**Step 3: Tulis migrasi struktur tabel (Categories & Products)**
Modify: `supabase/migrations/*_initial_schema.sql` (tambahkan tabel categories dan products)

```sql
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE cooldown_unit_enum AS ENUM ('hours', 'days', 'months');

CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    description TEXT,
    warranty_days INTEGER DEFAULT 0,
    max_claim_limit INTEGER DEFAULT 0,
    cooldown_value INTEGER DEFAULT 0,
    cooldown_unit cooldown_unit_enum DEFAULT 'hours',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Step 4: Run local migration to verify**
Run: `npx supabase start` (pastikan docker menyala, atau gunakan db lokal)
*(Catatan: Jika db lokal tidak tersedia, aplikasikan langsung via SQL editor di dashboard Supabase jika ini terhubung ke cloud. Untuk TDD kita akan test via lokal terlebih dahulu jika memungkinkan).*

**Step 5: Commit**
```bash
git add supabase/
git commit -m "feat: setup supabase categories and products schema"
```

### Task 2: Create Inventory & Orders Schema

**Files:**
- Modify: `supabase/migrations/*_initial_schema.sql` (append tabel inventory dan orders)

**Step 1: Tulis migrasi tabel Inventory & Orders**
```sql
CREATE TYPE inventory_status_enum AS ENUM ('Available', 'Hold', 'Used', 'Revoked');

CREATE TABLE public.inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    credential_data TEXT NOT NULL,
    status inventory_status_enum DEFAULT 'Available',
    reserved_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE,
    telegram_chat_id VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id),
    total_amount DECIMAL(10, 2) NOT NULL,
    payment_status VARCHAR(50) DEFAULT 'pending',
    delivery_status VARCHAR(50) DEFAULT 'pending',
    platform_source VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES public.inventory(id),
    warranty_end_date TIMESTAMPTZ,
    current_claim_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.warranty_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_item_id UUID REFERENCES public.order_items(id),
    old_inventory_id UUID REFERENCES public.inventory(id),
    new_inventory_id UUID REFERENCES public.inventory(id),
    delivery_status VARCHAR(50) DEFAULT 'pending',
    claimed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    payload JSONB NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.system_settings (
    key VARCHAR(255) PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Step 2: Commit**
```bash
git add supabase/migrations/
git commit -m "feat: add inventory, orders, and warranty tables"
```

### Task 3: Setup Interval-Based Cooldown Query (Core Logic)

**Files:**
- Create: `supabase/migrations/20260622000001_cooldown_function.sql`

**Step 1: Write the SQL Function**
Modify: `supabase/migrations/*_cooldown_function.sql`

```sql
CREATE OR REPLACE FUNCTION check_cooldown_validity(
    last_claim_time TIMESTAMPTZ,
    cooldown_val INTEGER,
    cooldown_unit cooldown_unit_enum
) RETURNS BOOLEAN AS $$
DECLARE
    interval_str TEXT;
    cooldown_passed BOOLEAN;
BEGIN
    interval_str := cooldown_val || ' ' || cooldown_unit;
    cooldown_passed := (NOW() >= (last_claim_time + interval_str::INTERVAL));
    RETURN cooldown_passed;
END;
$$ LANGUAGE plpgsql;
```

**Step 2: Commit**
```bash
git add supabase/migrations/
git commit -m "feat: add cooldown check sql function"
```
