# Production Audit Fixes Implementation Plan (v11 Final)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Mengimplementasikan perbaikan stabilitas tingkat produksi yang komprehensif. Menyelesaikan masalah dual-authentication bot, custom JWT RLS, optimasi index, webhook handling, dan pengembalian stok otomatis via `pg_cron`.

**Architecture:** 
1. **DDoS Protection & Bot Limiting**: Upstash Rate Limiter sebelum query Supabase.
2. **Real-time Atomic Claims & IDOR**: Memverifikasi kepemilikan `orderItemId` menggunakan cookie ATAU token bot (`telegram_chat_id`). RPC me-return JSONB kredensial baru.
3. **Webhook Integrity & Anti-Storm**: HMAC divalidasi dengan `arrayBuffer()`. Mereturn HTTP 401 untuk signature mismatch.
4. **Comprehensive RLS & Performance**: Skema RLS menargetkan tabel `admins`, menggunakan custom JWT, dan menerapkan B-Tree indexes.
5. **Inventory Garbage Collection**: Ekstensi `pg_cron` untuk merilis inventaris yang tertahan (Hold) karena abandoned checkout secara otomatis setiap menit.

**Tech Stack:** Next.js App Router, Supabase (PostgreSQL, PL/pgSQL, RLS, Auth, pg_cron), Upstash Redis, crypto (Node.js).

---

### Task 1: Checkout Rate Limiting Terstruktur & Proteksi Bot DoS

**Files:**
- Modify: `src/app/api/checkout/route.ts`

**Step 1: Write implementation (Rate Limit sebelum DB & limit via Telegram ID)**

```typescript
// src/app/api/checkout/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'),
});

export async function POST(req: Request) {
  const isInternalBot = req.headers.get('authorization') === `Bearer ${process.env.BOT_INTERNAL_TOKEN}`;
  let rateLimitKey = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
  
  if (isInternalBot) {
    const telegramUserId = req.headers.get('x-telegram-user-id');
    if (!telegramUserId) return NextResponse.json({ error: 'Missing telegram ID' }, { status: 400 });
    rateLimitKey = `tg_user_${telegramUserId}`;
  }

  const { success } = await ratelimit.limit(`checkout_${rateLimitKey}`);
  if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

  const { data: settings } = await supabaseAdmin.from('system_settings').select('value').eq('key', 'maintenance_mode').single();
  if (settings?.value === 'true') {
    return NextResponse.json({ error: 'System is under maintenance' }, { status: 503 });
  }

  const { productId } = await req.json();
  const { data: invId, error } = await supabaseAdmin.rpc('hold_inventory', { p_product_id: productId });
  if (error || !invId) return NextResponse.json({ error: 'Out of stock' }, { status: 400 });

  return NextResponse.json({ url: "https://pakasir.com/pay/123", inventoryId: invId });
}
```

### Task 2: Real-time Atomic Claim dengan Proteksi IDOR & Kill-Switch

**Files:**
- Modify: `supabase/migrations/20260622120001_atomic_claim_rpc.sql`
- Modify: `src/app/api/claim/route.ts`

**Step 1: Update RPC Claim agar mereturn JSONB**

```sql
-- supabase/migrations/20260622120001_atomic_claim_rpc.sql
CREATE OR REPLACE FUNCTION process_warranty_claim(p_order_item_id UUID) 
RETURNS JSONB AS $$
DECLARE
    v_item RECORD;
    v_new_inv_id UUID;
    v_last_claim TIMESTAMPTZ;
    v_credential TEXT;
BEGIN
    SELECT oi.*, p.cooldown_value, p.cooldown_unit, p.max_claim_limit, i.product_id, i.id as old_inv_id
    INTO v_item 
    FROM public.order_items oi
    JOIN public.inventory i ON oi.inventory_id = i.id
    JOIN public.products p ON i.product_id = p.id
    WHERE oi.id = p_order_item_id FOR UPDATE;

    IF v_item.current_claim_count >= v_item.max_claim_limit THEN RETURN jsonb_build_object('status', 'LIMIT_EXCEEDED'); END IF;

    SELECT claimed_at INTO v_last_claim FROM public.warranty_logs 
    WHERE order_item_id = p_order_item_id ORDER BY claimed_at DESC LIMIT 1;

    IF v_last_claim IS NOT NULL AND v_last_claim + (v_item.cooldown_value || ' ' || v_item.cooldown_unit)::INTERVAL > NOW() THEN
        RETURN jsonb_build_object('status', 'COOLDOWN_ACTIVE');
    END IF;

    UPDATE public.inventory SET status = 'Used' 
    WHERE id = (SELECT id FROM public.inventory WHERE product_id = v_item.product_id AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1)
    RETURNING id INTO v_new_inv_id;

    IF v_new_inv_id IS NULL THEN
        INSERT INTO public.warranty_logs (order_item_id, delivery_status) VALUES (p_order_item_id, 'needs_manual_fulfillment');
        INSERT INTO public.outbox_events (event_type, payload, status) VALUES ('ADMIN_ALERT', jsonb_build_object('message', 'Stock empty for claim', 'order_item_id', p_order_item_id), 'pending');
        RETURN jsonb_build_object('status', 'WAITLISTED');
    END IF;

    UPDATE public.inventory SET status = 'Revoked' WHERE id = v_item.old_inv_id;
    UPDATE public.order_items SET inventory_id = v_new_inv_id, current_claim_count = current_claim_count + 1 WHERE id = p_order_item_id;
    INSERT INTO public.warranty_logs (order_item_id, old_inventory_id, new_inventory_id, delivery_status) VALUES (p_order_item_id, v_item.old_inv_id, v_new_inv_id, 'completed');

    SELECT credential_data INTO v_credential FROM public.inventory WHERE id = v_new_inv_id;
    RETURN jsonb_build_object('status', 'SUCCESS', 'new_credential', v_credential);
END;
$$ LANGUAGE plpgsql;
```

**Step 2: Update API Claim (Casting IDOR Prevention)**

```typescript
// src/app/api/claim/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin'; 
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { data: settings } = await supabaseAdmin.from('system_settings').select('value').eq('key', 'maintenance_mode').single();
  if (settings?.value === 'true') return NextResponse.json({ error: 'System is under maintenance' }, { status: 503 });

  const { orderItemId } = await req.json();

  let userId: string | null = null;
  const isInternalBot = req.headers.get('authorization') === `Bearer ${process.env.BOT_INTERNAL_TOKEN}`;

  if (isInternalBot) {
    userId = req.headers.get('x-telegram-user-id');
  } else {
    const supabaseAuth = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabaseAuth.auth.getUser();
    userId = user?.id || null;
  }

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let query = supabaseAdmin.from('order_items').select('id, orders!inner(user_id, users!inner(telegram_chat_id))').eq('id', orderItemId);

  if (isInternalBot) {
    query = query.eq('orders.users.telegram_chat_id', userId);
  } else {
    query = query.eq('orders.user_id', userId);
  }

  const { data: orderItem } = await query.single();
  if (!orderItem) return NextResponse.json({ error: 'Forbidden: You do not own this order' }, { status: 403 });
  
  const { data: result, error } = await supabaseAdmin.rpc('process_warranty_claim', { p_order_item_id: orderItemId });
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (result.status === 'LIMIT_EXCEEDED') return NextResponse.json({ error: 'Claim limit reached' }, { status: 403 });
  if (result.status === 'COOLDOWN_ACTIVE') return NextResponse.json({ error: 'Cooldown is active' }, { status: 429 });
  if (result.status === 'WAITLISTED') return NextResponse.json({ message: 'Stock empty. Claim waitlisted.' }, { status: 202 });
  
  return NextResponse.json({ message: 'Claim successful', credential: result.new_credential });
}
```

### Task 3: Webhook Payload Integrity & 401 Unauthorized Retry

**Files:**
- Modify: `src/app/api/webhook/route.ts`

**Step 1: Raw ArrayBuffer & 401 Unauthorized for Invalid Sig**

```typescript
// src/app/api/webhook/route.ts
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(req: Request) {
  const rawBody = await req.arrayBuffer();
  const signature = req.headers.get('x-pakasir-signature');
  if (!signature) return NextResponse.json({ error: 'Missing sig' }, { status: 401 });

  const payloadBuffer = Buffer.from(rawBody);
  const expectedSigBuffer = Buffer.from(crypto.createHmac('sha256', process.env.PAKASIR_SECRET!).update(payloadBuffer).digest('hex'));
  const signatureBuffer = Buffer.from(signature);

  if (expectedSigBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedSigBuffer, signatureBuffer)) {
    return NextResponse.json({ error: 'Invalid sig' }, { status: 401 });
  }

  const payload = JSON.parse(payloadBuffer.toString('utf-8'));
  const { data: result, error } = await supabaseAdmin.rpc('process_payment_fulfillment', { p_order_id: payload.order_id, p_amount: payload.amount });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (result === 'AMOUNT_MISMATCH' || result === 'DUPLICATE') return NextResponse.json({ message: 'Processed or invalid' }, { status: 200 });

  return NextResponse.json({ message: 'Webhook processed' });
}
```

### Task 4: Tabel Admins, Custom JWT RLS, & B-Tree Indexes

**Files:**
- Modify: `supabase/migrations/20260622120002_rls_admin_fix.sql`

**Step 1: Rewrite RLS targeting `admins` table and Create Indexes**

```sql
-- supabase/migrations/20260622120002_rls_admin_fix.sql

CREATE INDEX IF NOT EXISTS idx_order_items_inventory_id ON public.order_items(inventory_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read own" ON public.admins FOR SELECT USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public products viewable" ON public.products FOR SELECT USING (true);
CREATE POLICY "Admins manage products" ON public.products FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid));

ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage inventory" ON public.inventory FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid));
CREATE POLICY "Users read own inventory" ON public.inventory FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.order_items oi 
        JOIN public.orders o ON oi.order_id = o.id 
        WHERE oi.inventory_id = inventory.id AND o.user_id = auth.uid()
    )
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own orders" ON public.orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins manage orders" ON public.orders FOR ALL USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid));

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own order items" ON public.order_items FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid())
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.users FOR SELECT USING (id = auth.uid());

ALTER TABLE public.warranty_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own warranty logs" ON public.warranty_logs FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.order_items oi 
        JOIN public.orders o ON oi.order_id = o.id 
        WHERE oi.id = warranty_logs.order_item_id AND o.user_id = auth.uid()
    )
);
```

### Task 5: Inventory Garbage Collection via pg_cron

**Files:**
- Create: `supabase/migrations/20260622120003_pg_cron_abandoned_holds.sql`

**Step 1: Setup Cron Job untuk Release Abandoned Holds**

```sql
-- supabase/migrations/20260622120003_pg_cron_abandoned_holds.sql

-- Pastikan extension pg_cron aktif
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Jadwalkan pelepasan inventory yang di hold namun belum dibayar (lewat 15 menit)
SELECT cron.schedule(
  'release-abandoned-holds', 
  '* * * * *', 
  $$
    UPDATE public.inventory 
    SET status = 'Available', reserved_until = NULL 
    WHERE status = 'Hold' AND reserved_until < NOW();
  $$
);
```
