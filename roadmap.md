🚀 Vibe Coding Roadmap: E-Commerce Digital (Multi-Channel)

Gunakan urutan ini untuk memberikan instruksi (prompting) ke AI. Fokus pada fungsionalitas per tahap.

🟢 Phase 1: Data Architecture (The Brain)

Tujuan: Membangun struktur tabel di Supabase agar AI memahami relasi data.

[ ] Setup Project Supabase: Buat project baru dan siapkan koneksi.

[ ] SQL Schema Design: Minta AI buatkan tabel berikut:

Categories (Canva, CapCut, dll).

Products (Varian, Harga, Desc, Warranty Days, Max Claim, Cooldown Value, Cooldown Unit).

Inventory (Tempat stok akun/link disimpan dengan status: Available/Used/Revoked).

Orders & Order_Items (Tracking pembelian & sisa garansi).

[ ] Auth Setup: Aktifkan Email Auth untuk Web dan siapkan kolom telegram_chat_id di tabel profil.

🟡 Phase 2: Payment & Fulfillment (The Cashflow)

Tujuan: Mengintegrasikan Pakasir agar uang masuk dan stok terkirim otomatis.

[ ] Pakasir API Integration: Buat fungsi untuk generate link pembayaran.

[ ] Webhook Listener: Buat endpoint (Edge Function) untuk menerima notifikasi PAID dari Pakasir.

[ ] Auto-Delivery Logic:

Ambil 1 stok Available.

Ubah status jadi Used.

Kalkulasi warranty_end_date berdasarkan setting produk.

[ ] Social Proof: Tambahkan logic untuk kirim pesan ke Telegram Channel Testimoni setiap kali transaksi sukses.

🟠 Phase 3: Core Logic (Warranty & Cooldown)

Tujuan: Membangun sistem anti-abuse yang paling kritis.

[ ] Interval-Based Cooldown: Minta AI buatkan query PostgreSQL yang bisa menghitung selisih waktu berdasarkan Satuan (Jam/Hari/Bulan).

[ ] Claim Validation Function: Buat fungsi pengecekan:

Apakah masih dalam masa garansi?

Apakah sisa limit klaim masih ada?

Apakah sudah melewati masa cooldown?

[ ] Replacement Logic: Buat fungsi untuk otomatis mengganti akun Revoked dengan yang baru.

🔵 Phase 4: Multi-Channel Interface (The Face)

Tujuan: Membuat akses untuk pembeli di Web dan Telegram.

[ ] Telegram Bot (Telegraf/grammY):

Menu /katalog (ambil data dari Supabase).

Fitur /cek_pesanan dan tombol klaim via Inline Keyboard.

[ ] Web Dashboard (Tailwind):

Halaman daftar pesanan.

Tombol klaim yang akan disabled otomatis jika syarat tidak terpenuhi.

🔴 Phase 5: Admin Control Panel (The Command)

Tujuan: Manajemen penuh tanpa buka database manual.

[ ] Product Management UI: Form CRUD untuk produk beserta setting harganya.

[ ] Dynamic Cooldown Setter: UI untuk memilih angka dan satuan (Jam/Hari/Bulan).

[ ] Inventory Management: Fitur bulk upload untuk stok akun.

[ ] Global Kill-Switch: Tombol darurat untuk maintenance mode.