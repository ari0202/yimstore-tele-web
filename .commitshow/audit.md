# commit.show · Audit report

**yimstore-tele-web**
_https://github.com/ari0202/yimstore-tele-web_

## What this build missed
- 25 of 49 FK columns lack a CREATE INDEX — full-table scans certain at scale (fix_rpc.sql, rpc_dump.sql samples).
- No live URL — Lighthouse, completeness, and all user-facing quality slots score zero; app is unshippable as-is.

## What it got right
- 13 RLS policies covering all 14 tables — gap_estimate=0, no anon-writable tables detected.
- 37 SQL files with 14 CREATE TABLE + PLpgSQL RPCs — substantial schema work, 15% of codebase is database logic.
- @upstash/ratelimit detected in 37 deps — rate-limiting library wired before any live traffic.

## Score · 13 / 100

- Audit:      5/50
- Scout:      0/30
- Community:  1/20
- **Δ +3** since last audit

---
Audited on commit.show · https://commit.show/projects/b60bbb96-467e-4291-a755-9eade56ead00
