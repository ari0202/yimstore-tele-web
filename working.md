# Working Status & Project State

This document serves as the single source of truth for the current state of the YimStore Tele Web project.

## Current Phase: PRD-v1 Fully Completed
Semua spesifikasi utama dari `prd-v1.md` telah diselesaikan secara komprehensif, mencakup Fase 1 hingga Fase 6. Sistem telah berada dalam kondisi **Production-Ready**.

## Selesai:
- `[x]` **Phase 1: Database Architecture & Core Schema**
  - Implementasi *Partial Unique Index* untuk kredensial.
  - Tabel `categories`, `products`, `inventory`, `orders`, `order_items`, `users`, `system_settings`.
  - RPC Database (`hold_inventory`, `process_warranty_claim`) untuk transaksi atomik.
- `[x]` **Phase 2: Payment & Fulfillment API**
  - Integrasi API *Checkout* (Hold Stok selama 15 menit).
  - Integrasi Pakasir Webhook & validasi *Signature/HMAC*.
  - Pola *Outbox Pattern* (`outbox_events`) untuk garansi bahwa kredensial akan selalu terkirim walau aplikasi mengalami *crash* saat webhook dipanggil.
- `[x]` **Phase 3: Web Dashboard & Claim Logic**
  - Pembuatan *Dashboard* Pelanggan (`/order/[id]`) yang aman menggunakan *URL Token*.
  - Validasi *Cooldown*, *Claim Limit*, dan status garansi via RPC.
  - Implementasi *Awaiting Restock* Queue (`pending_claims`) jika stok pengganti habis.
- `[x]` **Phase 4: Admin Dashboard & Hybrid Auth**
  - Sistem *Hybrid Authentication* menggunakan JWT (Stateless Middleware) yang divaksinasi dengan cek DB State.
  - CRUD Kategori, Produk, dan Upload Inventori (Bulk Upload aman dari duplikasi `Used`).
- `[x]` **Phase 5: Operations Lifecycle & Background Jobs Fixes**
  - `[x]` Late webhook resilience (`Needs Manual Refund` with idempotency).
  - `[x]` Safe concurrent background sweeps (`FOR UPDATE SKIP LOCKED`).
  - `[x]` Data leak prevention (`inventory_id = NULL` + `product_id` anchor).
  - `[x]` Poison Pill SQL Sweeper & Exponential Backoff for DLQ.
- `[x]` **Phase 6: Multi-Channel Bot, Social Proof & Admin Override**
  - Implementasi Bot Telegram *Native* dengan Alur Checkout 5-Tahap Terstruktur (Katalog -> Variasi -> Konfirmasi -> Invoice -> Kredensial).
  - Fitur *Auto-Broadcast Testimoni* menggunakan *Try-Catch* terisolasi pada `process-outbox`.
  - *Emergency Kill Switch* & *Maintenance Mode* aktif di level API dan Bot Interceptor (mengabaikan Webhook Pakasir agar transaksi berjalan tetap terproses).
- `[x]` **Phase 7: Production Audit Fixes (v10 Final)**
  - Implementasi `Ratelimit` (Upstash) di API Checkout secara terstruktur (sebelum DB check) dengan **Bot Per-User Rate Limit Bypass**.
  - RPC Atomik untuk `process_warranty_claim` diperbarui untuk **mereturn JSONB payload** (termasuk kredensial langsung secara real-time).
  - Proteksi **IDOR Casting Telegram** pada klaim, dengan Dual Auth Resolution (Cookie & Bot Token) plus JOIN ke tabel `users` untuk memvalidasi `telegram_chat_id`.
  - Validasi Webhook HMAC menggunakan buffer raw (`arrayBuffer()`), dan memberikan respons HTTP 401 (Unauthorized) untuk signature mismatch guna memaksa retry dari gateway.
  - Perbaikan Skema RLS Komprehensif: Menargetkan tabel `admins`, menggunakan **Custom JWT parsing (`request.jwt.claims`)**, menerapkan B-Tree indexes untuk performa, dan mengatur fallback untuk users.
- `[x]` **Admin Management Fixes (2026-06-23)**
  - Update Admin View Schema (`parent_id`, `max_claim_limit` backfill).
  - Product Edit Name fix & Hard Delete RPC implementation.
  - Variation Editing via Modal (with Edit Pencil capability).
  - Secure Inventory Deletion via Server Action.
  - Warranty Claims Refactor (`max_claim_limit` snapshot & atomic cooldown logic).
- `[x]` **Phase 8: Telegram-Web Bidirectional Identity Sync**
  - Database schema for `email` in orders and `otp_codes` for recovery.
  - Integration of Resend to dispatch order receipts with access tokens via email.
  - Client UI `/cari-pesanan` with OTP Email flow to restore dashboard access cookies.
  - Consolidated Deep Linking logic (`/start token_<access_token>`) mapping all orders under a single `telegram_chat_id`.
- `[x]` **Phase 9: Pakasir Webhook & Sandbox UX Fixes**
  - **Flicker Fix**: Migrated QRIS rendering from `<QRCodeCanvas>` to `<QRCodeSVG>` to ensure stable declarative rendering during background Next.js `router.refresh()`.
  - **HTTP 431 Error Prevention**: Implemented automated client cookie garbage collection in `/api/checkout` to keep `order_token_*` cookies at a maximum of 3, preventing Request Header Fields Too Large errors during repetitive sandbox testing.
  - **MDR Fee Handling**: Bypassed strict `AMOUNT_MISMATCH` logic in the fulfillment webhook by pulling the original `total_amount` from the DB, accounting for Pakasir injecting dynamic MDR fees (e.g., Rp 35.555 vs Rp 35.000).
  - **HMAC Developer Bypass**: Allowed sandbox webhooks to bypass strict HMAC signature checking when `.env` secret key is set to default placeholder, eliminating local setup friction.
  - **Case-Insensitive Status**: Fixed UI infinite loading loops caused by strict lowercase matching against capitalized `PAID`/`SUCCESS` statuses returned by database RPCs.
- `[x]` **Phase 10: Seamless Telegram UX & Webhook Fixes (2026-06-25)**
  - **Account Detail Undefined Fix**: Added `user_id` checking via `telegram_chat_id` fallback in `pakasir_webhook` to safely deliver credentials.
  - **Warranty End Date**: Implemented real-time calculation in Web UI and Bot (`new Date(Date.now() + warranty_days * 86400000)`).
  - **Telegram Reply Keyboard Synchronization**: Fixed invisible main menu injections via Braille character `\u2800` hack to guarantee keyboard persistence without breaking animation frames.
  - **Bot Loading UX**: Polished loading progress to exactly 2 seconds and removed generic text placeholders.
  - **Admin Web App Shortcut**: Telegram bot now dynamically checks `TELEGRAM_ADMIN_CHAT_ID` array to exclusively display "Buka Dashboard Admin" shortcut.
  - **Sync Stock Atomicity Fix**: Patched `page.tsx` on the Frontend to inherit Category stock accurately when `is_sync_stock` is true.
  - **Sync Stock RPC Fix**: Migrated `hold_inventory` and `process_payment_fulfillment` RPCs (`20260625000002_fix_sync_stock_rpcs.sql`) to safely read from `category_id` kolam when `is_sync_stock` is active, solving race conditions between Web and Telegram checkout.

## Arsitektur Kritis (Sebagai Referensi Masa Depan)
1. **Inventory Atomicity (Anti-Race Condition)**:
   Semua pengambilan stok menggunakan `SELECT ... FOR UPDATE SKIP LOCKED` dan dikemas dalam Stored Procedures (`RPC`). Ini memastikan dua transaksi serentak saat *flash sale* tidak pernah mengambil baris stok `Available` yang sama.
2. **Outbox Pattern (Reliability)**:
   Webhook Pakasir hanya bertugas mem-validasi pembayaran dan mencatat `event` ke dalam tabel `outbox_events`. Pengiriman email/pesan Telegram kredensial dilakukan secara asinkron oleh *Cron Job* (`/api/cron/process-outbox`). Hal ini menjamin resiliensi tinggi jika API Telegram *down*.
3. **Identity Merge (Anonymous to Telegram User)**:
   Ketika pengguna berbelanja di Web Checkout, mereka belum login (anonim). Saat mereka menekan "*Claim Warranty*" dan dialihkan ke Bot Telegram menggunakan `start=token_XXX`, Bot akan mengeksekusi integrasi *Identity Merge*, menyatukan riwayat pesanan anonim tersebut ke akun Telegram mereka secara permanen.
4. **Audit-Safe Cooldown Bypass**:
   Admin tidak pernah menghapus baris riwayat transaksi. Jika Admin setuju untuk melonggarkan *cooldown* bagi pengguna, mereka menekan tombol "Bypass" di panel Admin yang memicu *toggle* sekali pakai (`cooldown_bypass_active`) di tabel `order_items`.
5. **Row Level Security (RLS) Lockdown**:
   Keamanan tingkat basis data (*database level*) telah diaktifkan secara total. *Row Level Security (RLS)* di- *enable* pada seluruh tabel utama. Kebijakan publik (`anon` key) hanya diizinkan (`SELECT`) untuk tabel `products` dan `categories` guna menampilkan Katalog. Sisa 12 tabel lainnya digembok mutlak, hanya dapat dimutasi melalui API server-side Next.js dengan kunci otorisasi rahasia (*Service Role Key*).

## Repositori Database Supabase
- URL: `postgresql://postgres:%23Sakithatiku02@db.zdhlfoiytkamnyywbgyx.supabase.co:5432/postgres`
- Status: Tabel, Index, View, **Row Level Security (Enabled & Locked Down)**, dan Stored Procedures sudah di- *deploy*.

## Next Steps
- Implementasi `prd-v1.3` atau `prd-v1.4` (jika ada *roadmap* selanjutnya).
- Peninjauan performa di Lingkungan Produksi (*Production Load Testing*).
- Publikasi Web (*Deployment*) ke *Vercel/Cloudflare Pages* dan *Worker/Cron* ke infrastruktur pendukung.
