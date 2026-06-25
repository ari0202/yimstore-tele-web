# commit.show · Audit report

**yimstore-tele-web**
_https://github.com/ari0202/yimstore-tele-web_

## What this build missed
- 49 FK columns, only 4 indexes — gap_estimate=25; p_order_id, p_user_id, v_inventory_id all unindexed per fix_rpc.sql and rpc_dump.sql.
- Webhook idempotency missing on both handlers (route.ts + telegram/route.ts); retry storms will create duplicate records.

## What it got right
- RLS gap closed this round — 11 policies across 13 tables, gap_estimate now 0, all write surfaces covered.
- 34 SQL files with 83,978 bytes of PLpgSQL — serious schema investment including RPC functions and inventory hierarchy.
- 74.6% TypeScript across 379 files; 37 package deps including @upstash/ratelimit and Supabase auth libraries.

## Score · 13 / 100

- Audit:      0/50
- Scout:      0/30
- Community:  1/20

---
Audited on commit.show · https://commit.show/projects/b60bbb96-467e-4291-a755-9eade56ead00
