# Production Audit Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the production-readiness concerns surfaced by the `production-audit` skill, specifically the tracked `.env` file and missing foreign key indexes.

**Architecture:** We will use `git rm --cached` to stop tracking the `.env` file since it's already in `.gitignore`, and we will generate a new Supabase migration to add indexes for unindexed foreign keys (like `order_id`, `user_id`, etc.) across the database to prevent query-performance cliffs.

**Tech Stack:** Git, Supabase (SQL Migrations)

---

### Task 1: Remove `.env` from Git Tracking

**Files:**
- Modify: Git Index

**Step 1: Check `.env` status**

Run: `git ls-files .env`
Expected: Outputs `.env` (indicating it's currently tracked)

**Step 2: Remove `.env` from git tracking (keep local)**

Run: `git rm --cached .env`
Expected: PASS (file removed from index but kept locally)

**Step 3: Commit**

```bash
git commit -m "chore: remove .env from git tracking to prevent credential exposure"
```

---

### Task 2: Create Migration for Missing FK Indexes

**Files:**
- Create: `supabase/migrations/20260626000000_add_missing_fk_indexes.sql`

**Step 1: Create the migration file**

```sql
-- Indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);

-- Indexes for order_items table
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_inventory_id ON public.order_items(inventory_id);

-- Indexes for warranty_logs table
CREATE INDEX IF NOT EXISTS idx_warranty_logs_order_item_id ON public.warranty_logs(order_item_id);
CREATE INDEX IF NOT EXISTS idx_warranty_logs_handled_by ON public.warranty_logs(handled_by);

-- Indexes for inventory table
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON public.inventory(product_id);

-- Indexes for products table
CREATE INDEX IF NOT EXISTS idx_products_category_id ON public.products(category_id);

-- Indexes for outbox_events table
CREATE INDEX IF NOT EXISTS idx_outbox_events_status ON public.outbox_events(status);
```

**Step 2: Apply the migration locally**

Run: `npx supabase db push` or `npm run db:push` (depending on local setup) to ensure it applies cleanly, OR just run the SQL against the local postgres instance.
*Note: Since there is no automated test runner configured for migrations, we will manually execute it.*

**Step 3: Commit**

```bash
git add supabase/migrations/*_add_missing_fk_indexes.sql
git commit -m "chore: add missing foreign key indexes for performance"
```
