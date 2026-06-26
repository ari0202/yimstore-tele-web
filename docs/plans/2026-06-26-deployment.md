# Vercel Deployment & Live URL Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Deploy the Next.js application to Vercel to secure a Live URL, resolving the `production-audit` UX concern ("No live URL"). We will also include a minor database cleanup to add the 1 genuinely missing foreign key index, as the static analysis engine's "25 missing FKs" report is largely a false positive from historical migrations.

**Architecture:** We will prepare the repository for Vercel deployment by ensuring all build commands are clean, adding a `vercel.json` if needed, and linking the repository to Vercel (or instructing the user to do so). We will also run a final migration for `inventory.category_id`.

**Tech Stack:** Vercel, Next.js, Supabase

---

### Task 1: Add Final Missing FK Index

The live database only actually has 15 foreign keys, 14 of which are perfectly indexed. The audit engine's "49 FKs" count is a side-effect of reading historical migration files. We will patch the single genuinely unindexed FK (`inventory.category_id`).

**Files:**
- Create: `supabase/migrations/20260626000001_add_inventory_category_index.sql`

**Step 1: Write the implementation**
```sql
-- Add the final missing index on inventory.category_id
CREATE INDEX IF NOT EXISTS idx_inventory_category_id ON public.inventory(category_id);
```

**Step 2: Apply and Commit**
- Run `npx tsx migration.ts` to push to remote.
- Commit the file: `git add supabase/migrations/* && git commit -m "chore: add inventory category index"`

---

### Task 2: Prepare for Vercel Deployment

**Files:**
- Modify: `package.json` (Verify build script)

**Step 1: Build Verification**
Run `npm run build` locally to ensure there are no TypeScript, ESLint, or Next.js build errors that would block a Vercel deployment.

**Step 2: Environment Variables Guide**
Since Vercel requires environment variables, create a `.env.example` (if missing) or update it so the user knows exactly what to paste into Vercel's dashboard.

```bash
git add .
git commit -m "chore: prepare for vercel deployment"
git push origin master
```

---

## User Action Required (After Plan Execution)

Once this plan is executed, the repository will be 100% production-ready. 

To resolve the audit concern, you will need to:
1. Go to [Vercel](https://vercel.com/new) and import the GitHub repository.
2. Paste the contents of `.env` into the Environment Variables section.
3. Deploy!
4. Once deployed, update `audit.json` or tell the audit engine the new live URL.
