# E-Commerce Core Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Initialize the base Next.js application, set up the Supabase database schema, and implement the Telegram Bot webhook skeleton.

**Architecture:** A unified Next.js 14 App Router project functioning as both the frontend UI and the centralized backend API (handling Telegram Webhooks and Pakasir). Supabase serves as the single source of truth PostgreSQL database.

**Tech Stack:** Next.js (React), Supabase, Telegraf (Telegram Bot), Tailwind CSS.

---

### Task 1: Initialize Next.js Application

**Files:**
- Create: `package.json`
- Create: `src/app/page.tsx`

**Step 1: Write the failing test**
N/A - Setup task.

**Step 2: Run test to verify it fails**
N/A

**Step 3: Write minimal implementation**
Run: `npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-npm --yes`
Run: `npm install @supabase/supabase-js telegraf`

**Step 4: Run test to verify it passes**
Run: `npm run build`
Expected: PASS

**Step 5: Commit**
```bash
git add .
git commit -m "chore: initialize next.js app with dependencies"
```

### Task 2: Create Supabase Schema Migrations

**Files:**
- Create: `supabase/migrations/20260622000000_initial_schema.sql`

**Step 1: Write the failing test**
N/A

**Step 2: Run test to verify it fails**
N/A

**Step 3: Write minimal implementation**

```sql
-- Categories
CREATE TABLE public.categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE
);

-- Products
CREATE TYPE public.cooldown_unit_enum AS ENUM ('hours', 'days', 'months');
CREATE TABLE public.products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description TEXT,
    warranty_days INTEGER NOT NULL DEFAULT 0,
    max_claim_limit INTEGER NOT NULL DEFAULT 0,
    cooldown_value INTEGER NOT NULL DEFAULT 0,
    cooldown_unit public.cooldown_unit_enum DEFAULT 'hours'
);

-- Inventory
CREATE TYPE public.inventory_status_enum AS ENUM ('Available', 'Used', 'Revoked');
CREATE TABLE public.inventory (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    credential_data TEXT NOT NULL,
    status public.inventory_status_enum DEFAULT 'Available'
);

-- Users
CREATE TABLE public.users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT UNIQUE,
    telegram_chat_id BIGINT UNIQUE
);

-- Orders
CREATE TABLE public.orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id),
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status TEXT NOT NULL DEFAULT 'PENDING',
    platform_source TEXT NOT NULL
);

-- Order Items
CREATE TABLE public.order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    inventory_id UUID REFERENCES public.inventory(id),
    warranty_end_date TIMESTAMP WITH TIME ZONE,
    current_claim_count INTEGER DEFAULT 0
);

-- Warranty Logs
CREATE TABLE public.warranty_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_item_id UUID REFERENCES public.order_items(id) ON DELETE CASCADE,
    old_inventory_id UUID REFERENCES public.inventory(id),
    new_inventory_id UUID REFERENCES public.inventory(id),
    claimed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System Settings
CREATE TABLE public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
```

**Step 4: Run test to verify it passes**
Review the SQL file for syntax errors.

**Step 5: Commit**
```bash
git add supabase/
git commit -m "feat: initial database schema"
```

### Task 3: Setup Telegram Bot Webhook API Route

**Files:**
- Create: `src/app/api/webhook/telegram/route.ts`
- Create: `src/lib/bot.ts`

**Step 1: Write the failing test**

```typescript
import { POST } from '@/app/api/webhook/telegram/route';
// Simple mock test idea
```

**Step 2: Run test to verify it fails**
N/A

**Step 3: Write minimal implementation**

`src/lib/bot.ts`:
```typescript
import { Telegraf } from 'telegraf';

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) throw new Error('TELEGRAM_BOT_TOKEN must be provided!');

export const bot = new Telegraf(token);

bot.start((ctx) => ctx.reply('Selamat datang di E-Commerce Produk Digital!'));
bot.help((ctx) => ctx.reply('Kirim /katalog untuk melihat produk.'));
```

`src/app/api/webhook/telegram/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { bot } from '@/lib/bot';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    await bot.handleUpdate(body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: 'Failed to process webhook' }, { status: 500 });
  }
}
```

**Step 4: Run test to verify it passes**
Run: `npm run build`
Expected: PASS

**Step 5: Commit**
```bash
git add src/
git commit -m "feat: setup telegram bot webhook route"
```
