CREATE TABLE IF NOT EXISTS bot_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  content_html TEXT NOT NULL,
  variables_hint TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE bot_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON bot_templates FOR SELECT USING (true);
CREATE POLICY "Enable all for admin" ON bot_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO bot_templates (key, name, content_html, variables_hint) VALUES 
('welcome_message', 'Pesan Welcome', '✨ <b>Selamat Datang di YimStore!</b> ✨

Pusat layanan digital dan akun premium terpercaya. Kami menyediakan berbagai macam kebutuhan digital dengan proses yang instan dan otomatis 24/7.

📊 <b>Statistik Bot:</b>
👥 Pengguna Aktif: {{user_count}} Pengguna
🛍️ Transaksi Berhasil: {{order_count}} Pesanan

Silakan pilih menu di bawah ini untuk memulai:', '{{user_count}}, {{order_count}}') ON CONFLICT (key) DO NOTHING;

INSERT INTO bot_templates (key, name, content_html, variables_hint) VALUES 
('order_confirmation', 'Konfirmasi Pesanan', '<b>KONFIRMASI PESANAN</b>
=========================
Produk: {{product_name}}
Harga: Rp {{base_price}} / item
Stok Tersedia: {{available_stock}}
-------------------------
Jumlah Pesanan: 1
Fee Payment: Rp {{fee_payment}} (QRIS)
Total Dibayar: Rp {{total_payment}}
=========================
Klik ✅ Konfirmasi untuk menahan stok dan melakukan pembayaran.', '{{product_name}}, {{base_price}}, {{available_stock}}, {{fee_payment}}, {{total_payment}}') ON CONFLICT (key) DO NOTHING;
