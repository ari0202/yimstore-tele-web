Product Requirements Document (PRD)
Brand Name : Yim Digital 
Proyek: Sistem E-Commerce Produk Digital (Multi-Channel Web & Telegram)
Versi: 1.1

1. Ringkasan Proyek (Executive Summary)

Proyek ini bertujuan untuk membangun platform e-commerce otomatis yang menjual produk digital berupa akun premium atau link undangan (misal: Canva Pro, CapCut, Netflix). Sistem ini memiliki fitur unggulan berupa Garansi Otomatis yang memungkinkan pembeli mengklaim pergantian akun rusak secara mandiri dengan batasan (limit) dan waktu jeda (cooldown) tertentu. Sistem ini berjalan pada dua platform antarmuka: Website dan Telegram Bot, menggunakan database tunggal.

2. Arsitektur Sistem Utama

Database: Supabase (PostgreSQL) sebagai Single Source of Truth.

Backend: API terpusat untuk menangani logika bisnis dari Website dan Telegram Bot.

Frontend (User): Website (React/Vue/Blade) untuk interaksi visual.

Frontend (Bot): Telegram Bot API.

Frontend (Admin): Dashboard berbasis web untuk manajemen sistem.

Payment Gateway: Pakasir (Integrasi via API & Webhook/IPN).

3. Fitur Klien (Website & Telegram Bot)

Kedua antarmuka ini (Web & Bot) akan memiliki akses ke fitur yang sama:

3.1. Katalog Produk & Checkout

Sistem menampilkan produk berdasarkan kategori (misal: Kategori "Canva", Produk: "Canva 1 Bulan", "Canva 2 Bulan").

Masing-masing produk menampilkan Harga, Deskripsi spesifik, dan Badge Garansi (Durasi & Limit Klaim).

User melakukan checkout dan sistem me-request URL Pembayaran/QRIS ke Pakasir.

Platform Web: Checkout via UI web.

Platform Bot: Checkout via command atau Inline Keyboard, bot membalas dengan link/QRIS pembayaran.

3.2. Pengiriman Otomatis (Auto-Delivery) & Social Proof

Sistem mendengarkan notifikasi pembayaran (Webhook) dari Pakasir.

Jika status PAID, sistem mengambil stok Available dari database, mengubahnya menjadi Used.

Sistem mendistribusikan akun/link via Email (untuk user Web) atau via Pesan Bot (untuk user Telegram).

[BARU] Auto-Post Testimoni: Segera setelah pengiriman berhasil, sistem (melalui Telegram Bot API) akan otomatis mengirimkan pesan notifikasi pembelian (contoh: "🎉 Transaksi Berhasil! Seseorang baru saja membeli Canva 1 Bulan") ke Telegram Channel Testimoni publik untuk meningkatkan social proof. Data pembeli disensor sebagian untuk privasi.

3.3. Customer Dashboard & Klaim Garansi Otomatis

User dapat melihat daftar pesanan aktif, kredensial (Email/Pass atau Link), sisa kuota klaim, dan countdown garansi.

Tombol Klaim Garansi: Jika akun bermasalah, user dapat menekan tombol klaim.

Logika Klaim:

Cek apakah masa garansi masih berlaku.

Cek apakah limit klaim (misal: max 2x) belum terlampaui.

Cek apakah user sudah melewati masa Cooldown (anti-abuse).

Jika valid, sistem mengganti stok lama menjadi Revoked dan memberikan stok baru Available secara realtime di layar/chat user.

4. Fitur Admin Dashboard (Sistem Kontrol)

4.1. Manajemen Kategori & Produk

CRUD Kategori: Membuat kategori utama (Contoh: Canva, CapCut).

CRUD Produk (Varian): Membuat produk di dalam kategori dengan atribut:

Nama Produk (Contoh: Canva 1 Bulan).

Harga.

Deskripsi / Instruksi Pemakaian.

warranty_days: Lama garansi dalam hitungan hari.

max_claim_limit: Batas maksimal klaim per produk.

4.2. Sistem Cooldown Anti-Abuse (Dinamis)

Form input di detail produk untuk mengatur jeda waktu antar klaim garansi.

Admin dapat memasukkan angka (cooldown_value) dan memilih satuan (cooldown_unit: Jam, Hari, atau Bulan).

Contoh: Admin menyetel cooldown "1 Bulan". Jika user klaim tanggal 5 Januari, tombol klaim akan terkunci (disabled) hingga 5 Februari.

4.3. Manajemen Stok (Inventory)

Sistem untuk melakukan bulk upload kredensial akun (Email:Pass) atau Link Invite.

Monitoring status stok: Available, Used, Revoked.

4.4. Monitoring, Integrasi & Keamanan Kritis

Pengaturan Channel Testimoni: Form untuk memasukkan ID Telegram Channel publik, sehingga sistem tahu ke mana harus melempar broadcast saat ada pembelian sukses.

Notifikasi Stok Menipis: Auto-send alert ke Telegram Private Admin jika stok Available di bawah batas minimum.

Manual Override / Bypass Cooldown: Admin dapat memaksa sistem untuk mereset masa cooldown user tertentu jika terjadi komplain valid.

Global Kill-Switch: Tombol darurat (Maintenance Mode) untuk mematikan fungsi checkout dan klaim sementara dari semua platform (Web & Bot).

5. Struktur Database (Supabase Schema)

Categories: id, name, slug.

Products: id, category_id, name, price, description, warranty_days, max_claim_limit, cooldown_value, cooldown_unit (enum: hours/days/months).

Inventory: id, product_id, credential_data, status (Available/Used/Revoked).

Users: id, email (web), telegram_chat_id (bot).

Orders: id, user_id, total_amount, payment_status, platform_source.

Order_Items: id, order_id, inventory_id, warranty_end_date, current_claim_count.

Warranty_Logs: id, order_item_id, old_inventory_id, new_inventory_id, claimed_at.

System_Settings: Tabel Key-Value untuk setingan global (Maintenance_mode, telegram_testimoni_channel_id, dll).

6. Syarat Non-Fungsional & Keamanan (NFR)

Validasi Webhook (Wajib): Autentikasi ketat menggunakan Signature/HMAC key dari Pakasir untuk mencegah eksekusi webhook palsu.

Idempotency: Menjamin bahwa transaksi yang dibayar (dari Webhook Pakasir) tidak mendistribusikan barang 2x dan tidak mengirim broadcast testimoni 2x meskipun terjadi retry pengiriman data dari payment gateway.

Concurrency Control (Race Condition): Saat terjadi klaim massal atau pembelian massal, sistem harus melakukan penguncian (Row-level lock di Supabase) agar 1 stok Available tidak terkirim ke 2 user yang berbeda di waktu bersamaan.

Interval Time Query: Validasi masa cooldown menggunakan operasi interval PostgreSQL bawaan dari Supabase untuk kalkulasi waktu (Jam/Hari/Bulan) yang sangat presisi.S