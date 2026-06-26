# Webhook Idempotency Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the production-audit concern regarding webhook idempotency to prevent duplicate order processing on retries, and execute the pending foreign key index migration using the provided `migration.ts` script.

**Architecture:** We will implement an idempotency layer using `@upstash/redis` to track processed webhooks by checking the `idempotency-key` header or falling back to hashing the payload. This will be applied to both the Pakasir payment webhook and the Telegram bot webhook. Finally, we will run `migration.ts` to push our previously created missing foreign key indexes migration to the remote Supabase database.

**Tech Stack:** Next.js API Routes, Upstash Redis, PostgreSQL (via migration script)

---

### Task 1: Add Idempotency Check to Pakasir Webhook

**Files:**
- Modify: `src/app/api/webhook/route.ts`

**Step 1: Write the implementation**

Update `src/app/api/webhook/route.ts` to import Upstash Redis and add an idempotency check right before processing the fulfillment:

```typescript
// Add at the top
import { Redis } from '@upstash/redis';

// Add inside the POST function, right after signature verification:
  const redis = Redis.fromEnv();
  const idempotencyKey = req.headers.get('idempotency-key') || req.headers.get('x-idempotency-key');
  
  if (idempotencyKey) {
    const isDuplicate = await redis.setnx(`webhook_idempotency:${idempotencyKey}`, 'processed');
    if (!isDuplicate) {
      console.log(`⚠️ Webhook idempotency hit: skipping duplicate processing for key ${idempotencyKey}`);
      return NextResponse.json({ message: 'Duplicate request (Idempotency Key)' }, { status: 200 });
    }
  }
```

**Step 2: Commit**

```bash
git add src/app/api/webhook/route.ts
git commit -m "fix: add idempotency key check to pakasir webhook handler"
```

---

### Task 2: Add Idempotency Check to Telegram Webhook

**Files:**
- Modify: `src/app/api/webhook/telegram/route.ts`

**Step 1: Write the implementation**

Update `src/app/api/webhook/telegram/route.ts` to wrap the `webhookCallback` with a custom handler that checks for `x-telegram-bot-api-secret-token` or an `idempotency-key`. Wait, Telegram doesn't send an idempotency header natively, but the audit requires the idempotency signal to be seen. We can generate an idempotency key using the update ID (from Telegram payload).

```typescript
import { NextResponse } from 'next/server';
import { webhookCallback } from 'grammy';
import { bot } from '@/lib/bot';
import { Redis } from '@upstash/redis';

const grammyHandler = webhookCallback(bot, 'std/http', {
  secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
});

export async function POST(req: Request) {
  try {
    const rawBody = await req.clone().text();
    const update = JSON.parse(rawBody);
    
    // Use update_id as idempotency key for Telegram
    if (update.update_id) {
      const redis = Redis.fromEnv();
      const idempotencyKey = `tg_update_${update.update_id}`;
      const isDuplicate = await redis.setnx(`webhook_idempotency:${idempotencyKey}`, 'processed');
      
      if (!isDuplicate) {
        console.log(`⚠️ Telegram update idempotency hit: skipping ${update.update_id}`);
        return NextResponse.json({ message: 'Duplicate update (Idempotency Key)' }, { status: 200 });
      }
    }
    
    return await grammyHandler(req);
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
```

**Step 2: Commit**

```bash
git add src/app/api/webhook/telegram/route.ts
git commit -m "fix: add idempotency key check to telegram webhook handler"
```

---

### Task 3: Execute Missing FK Indexes Migration

**Files:**
- Execute: `migration.ts`

**Step 1: Run the migration script**

Run: `npx tsx migration.ts`
Expected: Output showing `✅ Applied: 20260626000000_add_missing_fk_indexes.sql` followed by `🎉 All new migrations pushed successfully!`

**Step 2: No commit required for execution**

*Since the file is already committed, we just need to ensure it applies cleanly to the remote database.*
