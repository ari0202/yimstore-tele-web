# Phase 4: Admin Dashboard & System Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use `executor` to implement this plan task-by-task.

**Goal:** Build a secure Admin Dashboard while patching critical architectural flaws in the database locking mechanism, warranty logic, and soft-deletion race conditions across the entire E-commerce engine.

**Architecture & Security Hardening (Absolute Zenith):** 
1. **Concurrency Lock (Flash Sale Resilience):** Inventory assignment uses `FOR UPDATE SKIP LOCKED` to absolutely prevent double-issuing accounts during massive concurrent webhook fires.
2. **Atomic Warranty Guard:** Warranty claims will only revoke old credentials *if and only if* a replacement is successfully locked. Otherwise, the claim safely queues in `pending_claims` while leaving the old access intact ("Awaiting Restock" state).
3. **Safe Soft-Deletion:** Archived products disappear from the public catalog but remain fully resolvable for pending checkouts and existing customer dashboards.
4. **Recycling Security Check:** The Bulk Uploader requires a strict UI checkbox confirmation that recycled passwords have been rotated before allowing the upload.
5. **Historical Referential Integrity (Clean Restocking):** Restocking recycled accounts creates brand new `inventory_id` rows via Partial Unique Index (`WHERE status IN ('Available', 'Hold')`).
6. **Atomic Logout & Anti-Spoofing Limiter:** Dedicated Server Action purges `admin_sessions`. IP limits use a robust header fallback chain.
7. **Genesis Backdoor Prevention:** `setup-admin.ts` locks itself permanently.
8. **State-Mutating UI for Uploads:** Textarea aggressively removes lines as chunks succeed.

**Tech Stack:** Next.js 14+ Server Actions, Tailwind CSS v4, Supabase JS (Admin Client), `jose` (JWT), `bcryptjs`, `inquirer`.

---

### Task 1: System Hardening Migrations (Locks, Logic, & Security Tables)

**Files:**
- Create: `supabase/migrations/20260622120000_phase4_hardening.sql`

**Steps:**
1. Create `admins`, `audit_logs`, `login_attempts`, and `admin_sessions`.
2. Alter `products` table to add `is_archived BOOLEAN DEFAULT FALSE`.
3. Create Partial Unique Index: `CREATE UNIQUE INDEX unique_active_credential ON public.inventory (credential_data) WHERE status IN ('Available', 'Hold');`.
4. Create Atomic RPC `rpc_bulk_insert_inventory` returning `INTEGER` (using `INSERT ... ON CONFLICT DO NOTHING RETURNING 1`).
5. Create Atomic RPC `rpc_archive_product` and `rpc_update_system_settings`.
6. **HARDENING UPDATE 1**: `CREATE OR REPLACE FUNCTION process_payment_fulfillment(...)`. Update the inventory `SELECT id ... LIMIT 1` to strictly use `FOR UPDATE SKIP LOCKED`.
7. **HARDENING UPDATE 2**: `CREATE OR REPLACE FUNCTION process_warranty_claim(...)`. Ensure the old inventory `status` is ONLY set to `Revoked` if replacement stock is instantly found. If it goes to `pending_claims`, leave the old stock alone.

---

### Task 2: Locked CLI Setup, Fallback Limiter, Stateful Validation & Logout

**Files:**
- Create: `scripts/setup-admin.ts`
- Create: `src/lib/auth.ts`
- Modify: `src/proxy.ts`
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/login/page.tsx`

**Steps:**
1. Write `scripts/setup-admin.ts` (Aborts if `admins` count > 0).
2. In `/admin/login`, use IP fallback chain. Check `login_attempts`.
3. Verify `username` and `password` via `bcryptjs`. Create session.
4. Create `logoutAdmin()` Server Action to `DELETE FROM admin_sessions`.
5. `layout.tsx` invokes `await verifyAdminSession()`.

---

### Task 3: Categories & Products Management (Safe Soft Deletion)

**Files:**
- Create: `src/app/admin/categories/page.tsx`
- Create: `src/app/admin/products/page.tsx`
- Modify: `src/app/page.tsx`
- Modify: `src/app/api/webhook/pakasir/route.ts` (if applicable)
- Modify: `src/app/order/[id]/page.tsx`

**Steps:**
1. Build Admin Pages. `rpc_archive_product` sets `is_archived = true`.
2. Modify `src/app/page.tsx` (Public Catalog) to strictly query `WHERE is_archived = false`.
3. Ensure Webhooks and `order/[id]/page.tsx` queries do NOT filter by `is_archived` to prevent crashing pending orders.

---

### Task 4: UI-Mutating Client-Chunked Atomic Bulk Upload (With Rotation Guard)

**Files:**
- Create: `src/app/admin/inventory/page.tsx`

**Steps:**
1. Build UI for Bulk Upload. 
2. Add a prominent Checkbox: `"I confirm that all passwords for recycled/revoked credentials have been explicitly rotated at the provider level to prevent theft."` The upload button is disabled until checked.
3. Client slices data into chunks of 1,000. Server Action calls `rpc_bulk_insert_inventory`. Textarea lines are removed upon success.

---

### Task 5: System Settings & Kill-Switch (Atomic Toggle)

**Files:**
- Create: `src/app/admin/settings/page.tsx`

**Steps:**
1. Form for `maintenance_mode` and Telegram channel.
2. Server Action calls `rpc_update_system_settings`.
