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
- `[x]` **Phase 5: Exhaustive E2E Testing & Dummy Data**
  - Pembuatan `inject-dummy-data.ts`.
  - Konfigurasi `cypress` untuk menguji *Happy Path* maupun *Attack Vector* (HMAC Forgery, Cooldown Bypass, dsb).
- `[x]` **Phase 6: Multi-Channel Bot, Social Proof & Admin Override**
  - Implementasi Bot Telegram *Native* (`/katalog`, `/cek_pesanan`) dengan *Checkout* QRIS langsung di Telegram.
  - Fitur *Auto-Broadcast Testimoni* menggunakan *Try-Catch* terisolasi pada `process-outbox`.
  - *Emergency Kill Switch* & *Maintenance Mode* aktif di level API dan Bot Interceptor (mengabaikan Webhook Pakasir agar transaksi berjalan tetap terproses).
- `[x]` **Phase 7: Production Audit Fixes (v10 Final)**
  - Implementasi `Ratelimit` (Upstash) di API Checkout secara terstruktur (sebelum DB check) dengan **Bot Per-User Rate Limit Bypass**.
  - RPC Atomik untuk `process_warranty_claim` diperbarui untuk **mereturn JSONB payload** (termasuk kredensial langsung secara real-time).
  - Proteksi **IDOR Casting Telegram** pada klaim, dengan Dual Auth Resolution (Cookie & Bot Token) plus JOIN ke tabel `users` untuk memvalidasi `telegram_chat_id`.
  - Validasi Webhook HMAC menggunakan buffer raw (`arrayBuffer()`), dan memberikan respons HTTP 401 (Unauthorized) untuk signature mismatch guna memaksa retry dari gateway.
  - Perbaikan Skema RLS Komprehensif: Menargetkan tabel `admins`, menggunakan **Custom JWT parsing (`request.jwt.claims`)**, menerapkan B-Tree indexes untuk performa, dan mengatur fallback untuk users.

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
