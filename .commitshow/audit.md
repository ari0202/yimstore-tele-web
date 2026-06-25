# commit.show · Audit report

**yimstore-tele-web**
_https://github.com/ari0202/yimstore-tele-web_

## What this build missed
- Committed .env file persists 4 rounds — live credential exposure risk, -5 hard penalty every evaluation.
- 49 FK columns, only 15 indexes, gap_estimate=25 — p_order_id, p_user_id unindexed, query-perf cliff imminent.

## What it got right
- RLS coverage: 11 policies across 13 tables, gap_estimate=0 — no open writable table surface detected.
- 35 SQL files with 13 CREATE TABLE statements signals a deliberate, schema-first data architecture.
- Webhook signature verified on primary handler (src/app/api/webhook/route.ts) — 1 of 2 handlers protected.

## Score · 8 / 100

- Audit:      0/50
- Scout:      0/30
- Community:  1/20
- **Δ -5** since last audit

---
Audited on commit.show · https://commit.show/projects/b60bbb96-467e-4291-a755-9eade56ead00
