# commit.show · Audit report

**yimstore-tele-web**
_https://github.com/ari0202/yimstore-tele-web_

## What this build missed
- Both webhook handlers (route.ts + telegram/route.ts) have 0 signature checks — forged POST attacks possible.
- 6 tables (admin_sessions, login_attempts, audit_logs, system_settings, categories, outbox_events) have no RLS policies.

## What it got right
- 33 SQL files with 13 CREATE TABLE statements — real schema work, not scaffolding.
- 10 RLS policies covering 7 of 13 tables; rls intent flag true, partial protection in place.
- 74.6% TypeScript across 378 files — consistent type coverage for an early-stage app.

## Score · 13 / 100

- Audit:      0/50
- Scout:      0/30
- Community:  1/20
- **Δ +5** since last audit

---
Audited on commit.show · https://commit.show/projects/b60bbb96-467e-4291-a755-9eade56ead00
