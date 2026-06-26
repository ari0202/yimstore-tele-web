INSERT INTO bot_templates (key, name, content_html, variables_hint) VALUES 
('katalog_main', 'Katalog Utama', '〔 <b>KATALOG PRODUK YIMSTORE</b> 〕
╭────────────────────────
┊ Total Produk: {{total_categories}}
┊ Halaman 1/1
┊ -----------------------
{{catalog_list}}
╰────────────────────────

Pilih nomor yang ada di bawah untuk melihat variasi produk:', '{{total_categories}}, {{catalog_list}}') ON CONFLICT (key) DO UPDATE SET content_html = EXCLUDED.content_html, variables_hint = EXCLUDED.variables_hint;

INSERT INTO bot_templates (key, name, content_html, variables_hint) VALUES 
('katalog_variations', 'Pilih Variasi Produk', '<b>Pilih Variasi Produk:</b>

{{variation_list}}

Silakan pilih nomor di bawah ini:', '{{variation_list}}') ON CONFLICT (key) DO UPDATE SET content_html = EXCLUDED.content_html, variables_hint = EXCLUDED.variables_hint;

INSERT INTO bot_templates (key, name, content_html, variables_hint) VALUES 
('order_history_empty', 'Riwayat Pesanan Kosong', 'Belum ada riwayat pesanan aktif.', '') ON CONFLICT (key) DO UPDATE SET content_html = EXCLUDED.content_html, variables_hint = EXCLUDED.variables_hint;

INSERT INTO bot_templates (key, name, content_html, variables_hint) VALUES 
('help_center', 'Menu Pusat Bantuan', 'Pusat Bantuan YimStore.
Silakan pilih topik bantuan yang Anda butuhkan di bawah ini:', '') ON CONFLICT (key) DO UPDATE SET content_html = EXCLUDED.content_html, variables_hint = EXCLUDED.variables_hint;

INSERT INTO bot_templates (key, name, content_html, variables_hint) VALUES 
('help_how_to_order', 'Cara Order', '<b>Cara Order:</b>
1. Klik "List Produk"
2. Pilih produk dan variasi yang diinginkan
3. Lakukan pembayaran via QRIS/VA
4. Akun akan langsung dikirimkan ke chat ini secara instan.', '') ON CONFLICT (key) DO UPDATE SET content_html = EXCLUDED.content_html, variables_hint = EXCLUDED.variables_hint;

INSERT INTO bot_templates (key, name, content_html, variables_hint) VALUES 
('help_claim_warranty', 'Cara Claim Garansi', '<b>Cara Claim Garansi:</b>
1. Klik "Riwayat Transaksi"
2. Pilih pesanan yang ingin Anda klaim
3. Pastikan pesanan masih dalam masa garansi aktif
4. Klik tombol "Klaim Garansi" dan akun pengganti akan langsung dikirimkan kepada Anda.', '') ON CONFLICT (key) DO UPDATE SET content_html = EXCLUDED.content_html, variables_hint = EXCLUDED.variables_hint;

INSERT INTO bot_templates (key, name, content_html, variables_hint) VALUES 
('order_cancelled', 'Pesanan Dibatalkan', '❌ <b>Pesanan Dibatalkan</b>

Terima kasih, pesanan Anda telah berhasil dibatalkan dan stok telah dikembalikan.', '') ON CONFLICT (key) DO UPDATE SET content_html = EXCLUDED.content_html, variables_hint = EXCLUDED.variables_hint;

INSERT INTO bot_templates (key, name, content_html, variables_hint) VALUES 
('warranty_claim_success', 'Klaim Garansi Berhasil', '🎉 <b>Klaim Garansi Berhasil!</b>

Berikut adalah detail akun pengganti Anda:

<code>{{new_credential}}</code>

Silakan simpan baik-baik.', '{{new_credential}}') ON CONFLICT (key) DO UPDATE SET content_html = EXCLUDED.content_html, variables_hint = EXCLUDED.variables_hint;

UPDATE bot_templates SET 
  content_html = '╭─〔 {{product_name}} 〕───
🔄 Restok: {{restok_text}}
💵 Harga: Rp {{base_price}}
📦 Stok: {{available_stock}}
📉 Terjual: {{sold_stock}}
📄 Deskripsi: {{description}}
╰────────────────────────

<b>KONFIRMASI PESANAN</b>
=========================
Produk: {{product_name}}
Harga: Rp {{base_price}} / item
Stok Tersedia: {{available_stock}}
-------------------------
Jumlah Pesanan: 1
Fee Payment: Rp {{fee_payment}} (QRIS)
Total Dibayar: Rp {{total_payment}}
=========================
Klik ✅ Konfirmasi untuk menahan stok dan melakukan pembayaran.',
  variables_hint = '{{product_name}}, {{restok_text}}, {{base_price}}, {{available_stock}}, {{sold_stock}}, {{description}}, {{fee_payment}}, {{total_payment}}'
WHERE key = 'order_confirmation';
