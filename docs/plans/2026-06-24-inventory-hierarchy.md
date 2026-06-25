# Inventory Hierarchy & Separation Implementation Plan (v2)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separate the "Available Inventory" table into its own page and navigation menu, and implement a credential hierarchy system so credentials uploaded to a parent product can be claimed by all its variations without destroying database concurrency or loss of variation telemetry.

**Architecture Updates (Based on Review):** 
1. **Data Integrity:** We will add `product_id` directly to `order_items`. This ensures that even if a variation uses parent inventory, we permanently record exactly which variation was ordered to preserve warranty durations, cooldown limits, and financial audits.
2. **Database Concurrency:** We will rewrite `hold_inventory`, `process_payment_fulfillment`, and `rpc_claim_inventory` using PL/pgSQL block execution (`IF NOT FOUND` logic) to query explicit variation stock first, then fallback to parent stock. This preserves B-Tree indexing and avoids `ORDER BY CASE` transaction bottlenecks.
3. **Checkout Logic:** We will update frontend pre-checkout endpoints and UI to calculate available stock as the sum of direct variation stock plus available parent stock so valid purchases are not blocked.
4. **Admin Operations:** We will create a dedicated RPC `rpc_get_variation_stock` to accurately calculate hierarchical stock for child variations, as the main `admin_product_summary_view` deliberately filters out children. We will also relocate the inventory table to `/admin/inventory/available`.

**Tech Stack:** Next.js (App Router), Tailwind CSS, PostgreSQL/Supabase

---

### Task 1: UI & Routing Restructure

**Files:**
- Modify: `src/app/admin/(dashboard)/layout.tsx`
- Modify: `src/app/admin/(dashboard)/inventory/page.tsx`
- Create: `src/app/admin/(dashboard)/inventory/available/page.tsx`

**Step 1: Update Sidebar Navigation**
Modify `layout.tsx` to add "Available Inventory" linking to `/admin/inventory/available`.

**Step 2: Move Inventory Table & Enhance Visibility**
Move the `<table/>` UI, `deleteInventoryAction`, and related frontend components from `inventory/page.tsx` to the new `available/page.tsx`.
**CRITICAL:** Update the Supabase query for this table to `JOIN` the `products` table. Render an explicit badge on each row indicating whether the credential is "Shared (Parent)" or "Isolated (Variation)" based on the product type, so admins do not accidentally delete shared credentials. Leave only the Bulk Upload form in `inventory/page.tsx`.

**Step 3: Commit**
```bash
git add src/app/admin/\(dashboard\)/layout.tsx src/app/admin/\(dashboard\)/inventory/page.tsx src/app/admin/\(dashboard\)/inventory/available/page.tsx
git commit -m "feat: separate available inventory to new page and menu"
```

---

### Task 2: Data Architecture - Add product_id to order_items

**Files:**
- Create: `supabase/migrations/20260624000000_order_items_product_id.sql`
- Modify: `src/app/api/checkout/route.ts` (or checkout server action)

**Step 1: Write Database Migration**
Add `product_id` to `order_items` referencing `products(id)` if not already present.
Execute a safe backfill: `UPDATE public.order_items oi SET product_id = i.product_id FROM public.inventory i WHERE oi.inventory_id = i.id AND oi.product_id IS NULL;`
**CRITICAL:** Do NOT enforce a `NOT NULL` constraint on `product_id`. Historical or expired orders where `inventory_id` was wiped (for privacy/cleanup) will fail the backfill, and forcing `NOT NULL` will crash the production migration.

**Step 2: Update Checkout Logic**
When `process_payment_fulfillment` creates `order_items`, explicitly pass and save the variation's `product_id`.

**Step 3: Commit**
```bash
git add supabase/migrations/20260624000000_order_items_product_id.sql src/app/api/checkout/route.ts
git commit -m "feat: add explicit product_id to order_items for variation tracking"
```

---

### Task 3: Database Concurrency - Hierarchical RPC Updates

**Files:**
- Create: `supabase/migrations/20260624000001_inventory_hierarchy_rpcs.sql`

**Step 1: Update `hold_inventory` and Checkout/Claim RPCs**
Replace the dynamic `ORDER BY CASE` query with PL/pgSQL dual queries:
```sql
-- Attempt exact variation stock first
SELECT id INTO v_new_inv_id FROM public.inventory 
WHERE product_id = v_item.product_id AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1;

-- Fallback to parent stock if not found
IF v_new_inv_id IS NULL THEN
    SELECT id INTO v_new_inv_id FROM public.inventory 
    WHERE product_id = (SELECT parent_id FROM public.products WHERE id = v_item.product_id) 
    AND status = 'Available' FOR UPDATE SKIP LOCKED LIMIT 1;
END IF;
```
Apply this block structure to `hold_inventory`, `process_payment_fulfillment`, and `rpc_claim_inventory`.

**Step 2: Create Admin Variation Stock RPC**
Create `rpc_get_variation_stock(variation_id UUID)` that returns the sum of variation stock + available parent stock, so the admin variations modal displays accurate numbers.

**Step 3: Commit**
```bash
git add supabase/migrations/20260624000001_inventory_hierarchy_rpcs.sql
git commit -m "feat: implement high-concurrency credential hierarchy RPCs"
```

---

### Task 4: Pre-Checkout and Storefront Validations

**Files:**
- Modify: `src/app/(storefront)/product/[slug]/page.tsx`
- Modify: Frontend pre-checkout validation API/Actions

**Step 1: Update Available Stock Calculation**
Update any queries that determine whether a product/variation is "In Stock" or "Out of Stock" to use the new hierarchical logic (Variation Stock + Parent Stock).

**Step 2: Commit**
```bash
git commit -am "fix: frontend checkout logic respects hierarchical stock"
```

---

### Task 5: Update Cypress Tests

**Files:**
- Modify: `cypress/e2e/admin-inventory-exhaustive.cy.ts`
- Modify: `cypress/e2e/checkout-flow.cy.ts` (if applicable)

**Step 1: Update assertions for separated pages and hierarchical checkout**
Ensure the E2E tests target `/admin/inventory/available` for inventory checks, and write a specific test that verifies buying a variation consumes a parent's credential if variation stock is empty.

**Step 2: Commit**
```bash
git commit -am "test: update e2e coverage for inventory separation and hierarchy"
```
