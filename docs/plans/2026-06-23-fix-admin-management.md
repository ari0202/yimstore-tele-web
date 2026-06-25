# Admin Management Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Resolve critical admin management issues: allow variation editing, enable permanent product deletion (vs archiving) using atomic RPCs, fix product edit data binding & enable name edits, add inventory deletion capability securely, and ensure warranty logic relies on snapshotted `max_claim_limit` securely with a robust atomic concurrency control RPC.

**Architecture:** We will enhance the existing React Server Components and Server Actions. We will recreate the `admin_product_summary_view` to include missing fields. We will add a new inventory list component to the inventory page with secure Server Actions for managing available stock. We will snapshot `max_claim_limit` in `order_items` safely via backfill migration, validate admin inputs tightly, and enforce atomic row-level limits, cooldowns, expiration dates, and inventory allocations inside a single PostgreSQL RPC.

**Tech Stack:** Next.js 14 App Router, Server Actions, Supabase PostgreSQL, Tailwind CSS, Lucide React.

---

### Task 1: Update Product Summary View & Schema

**Files:**
- Create: `supabase/migrations/20260623000003_update_admin_view.sql`

**Step 1: Write the migration script**

```sql
-- 1. Ensure parent_id is explicitly defined with ON DELETE CASCADE
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.products(id) ON DELETE CASCADE;

-- 2. Add max_claim_limit snapshot to order_items (Split migration to protect historical data)
ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS max_claim_limit INT;

-- 3. Backfill historical data correctly using inventory mapping
UPDATE public.order_items oi
SET max_claim_limit = COALESCE(p.max_claim_limit, 1)
FROM public.inventory i
JOIN public.products p ON i.product_id = p.id
WHERE oi.inventory_id = i.id AND oi.max_claim_limit IS NULL;

-- 4. Apply NOT NULL constraint after safe backfill
ALTER TABLE public.order_items ALTER COLUMN max_claim_limit SET NOT NULL;
ALTER TABLE public.order_items ALTER COLUMN max_claim_limit SET DEFAULT 1;

-- 5. Explicitly add reason column to warranty_logs to sync with PRD expectations
ALTER TABLE public.warranty_logs ADD COLUMN IF NOT EXISTS reason TEXT;

-- 6. Create RPC for atomic product hard-deletion
CREATE OR REPLACE FUNCTION public.rpc_delete_product_permanently(p_product_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.inventory 
    WHERE status = 'Available' 
      AND (product_id = p_product_id OR product_id IN (SELECT id FROM public.products WHERE parent_id = p_product_id));

    DELETE FROM public.products WHERE id = p_product_id;
END;
$$;

-- 7. Create RPC for comprehensive atomic warranty claim processing
CREATE OR REPLACE FUNCTION public.rpc_process_warranty_claim(
    p_order_item_id UUID,
    p_reason TEXT
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
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

-- 8. Update the view to include description and thumbnail
CREATE OR REPLACE VIEW public.admin_product_summary_view AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.thumbnail_url,
    p.category_id,
    c.name as category_name,
    p.price as base_price,
    p.warranty_days,
    p.max_claim_limit,
    p.is_archived,
    p.created_at,
    (SELECT MIN(price) FROM public.products v WHERE v.parent_id = p.id) as min_variation_price,
    (SELECT MAX(price) FROM public.products v WHERE v.parent_id = p.id) as max_variation_price,
    (SELECT COUNT(*) FROM public.products v WHERE v.parent_id = p.id) as variation_count,
    (
        SELECT COUNT(*) 
        FROM public.inventory i 
        WHERE (i.product_id = p.id OR i.product_id IN (SELECT id FROM public.products v WHERE v.parent_id = p.id))
          AND i.status = 'Available'
    ) as total_stock
FROM public.products p
LEFT JOIN public.categories c ON p.category_id = c.id
WHERE p.parent_id IS NULL;
```

**Step 2: Apply migration to local DB**

Run: `npx supabase migration up` (or apply manually via psql/SQL editor).

---

### Task 2: Fix Product Edit & Hard Delete

**Files:**
- Modify: `src/app/admin/(dashboard)/products/EditProductModal.tsx`
- Modify: `src/app/admin/(dashboard)/products/page.tsx`

**Step 1: Fix EditProductModal.tsx**
Remove `disabled` from the product name input.
```tsx
<input type="text" name="name" defaultValue={product.name} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
```

**Step 2: Update Server Action in page.tsx**
Update `updateProduct` to process `name`.
```tsx
const name = formData.get('name') as string;
```

**Step 3: Implement Hard Delete Action in page.tsx**
Add `deleteProductPermanently` Action calling the RPC and correctly parsing FK errors.

```tsx
  async function deleteProductPermanently(formData: FormData) {
    'use server';
    const { admin_id } = await verifyAdminSession();
    const id = formData.get('id') as string;

    const { error } = await supabaseAdmin.rpc('rpc_delete_product_permanently', { p_product_id: id });
    if (error) {
      if (error.code === '23503') {
        throw new Error("Tidak dapat menghapus permanen karena produk ini atau variasinya memiliki riwayat transaksi/pesanan. Silakan gunakan fitur Arsip.");
      }
      throw error;
    }
    revalidatePath('/admin/products');
  }
```

---

### Task 3: Implement Variation Editing

**Files:**
- Modify: `src/app/admin/(dashboard)/products/VariationsModal.tsx`
- Modify: `src/app/admin/(dashboard)/products/actions.ts`

**Step 1: Add updateVariation to actions.ts**
```tsx
export async function updateVariation(formData: FormData) {
  'use server';
  const { admin_id } = await verifyAdminSession();
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  
  const price = parseInt(formData.get('price') as string);
  const warranty_days = parseInt(formData.get('warranty_days') as string);
  const max_claim_limit = parseInt(formData.get('max_claim_limit') as string);

  if (isNaN(price) || price < 0 || isNaN(warranty_days) || warranty_days < 0 || isNaN(max_claim_limit) || max_claim_limit < 0) {
    throw new Error('Nilai numerik tidak valid. Pastikan semua angka lebih dari atau sama dengan 0.');
  }

  await supabaseAdmin.from('products').update({ name, price, warranty_days, max_claim_limit }).eq('id', id);
  revalidatePath('/admin/products');
}
```

**Step 2: Add Edit UI to VariationsModal.tsx**
Add an `isEditing` state for each variation in the list. Render a sub-form when editing.

---

### Task 4: Secure Inventory Deletion

**Files:**
- Modify: `src/app/admin/(dashboard)/inventory/page.tsx`

**Step 1: Add Secure Server Action**
Create `deleteInventoryAction` to securely delete inventory directly using `supabaseAdmin`.
```tsx
export async function deleteInventoryAction(formData: FormData) {
  'use server';
  await verifyAdminSession();
  const id = formData.get('id') as string;
  await supabaseAdmin.from('inventory').delete().eq('id', id).eq('status', 'Available');
  revalidatePath('/admin/inventory');
}
```

**Step 2: Add Inventory List Viewer**
Fetch `inventory` where `status = 'Available'`. Add a simple table below the upload form to list available credentials. Provide a "Delete" button for each.

---

### Task 5: Comprehensive Warranty Claims Refactor

**Files:**
- Modify: `src/app/api/checkout/route.ts`
- Modify: `src/app/api/claim/route.ts`

**Step 1: Snapshot max_claim_limit at Checkout**
Update the checkout process (`checkout/route.ts` or RPC) to store `max_claim_limit` using nullish coalescing to preserve `0`.
```typescript
max_claim_limit: product.max_claim_limit ?? 1
```

**Step 2: Atomic Warranty Claim Endpoint**
Refactor the API route to directly call the newly created `rpc_process_warranty_claim` providing the specific `order_item_id`.

```typescript
const { data: claimResult, error: claimError } = await supabaseAdmin.rpc('rpc_process_warranty_claim', {
  p_order_item_id: order.order_items[0].id,
  p_reason: reason
});

if (claimError) {
  return Response.json({ error: claimError.message }, { status: 400 });
}

return Response.json({ success: true, credentials: claimResult.new_credential });
```
