import dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const buttons = [
  { key: 'btn_main_catalog', name: 'Tombol: List Produk', content_html: '🛒 List Produk' },
  { key: 'btn_main_balance', name: 'Tombol: Saldo', content_html: '💰 Saldo : Rp 0' },
  { key: 'btn_main_history', name: 'Tombol: Riwayat Transaksi', content_html: '📄 Riwayat Transaksi' },
  { key: 'btn_main_admin', name: 'Tombol: Kontak Admin', content_html: '💬 Kontak Admin' },
  { key: 'btn_main_bestseller', name: 'Tombol: Best Seller', content_html: '✨ Best Seller' },
  { key: 'btn_main_help', name: 'Tombol: Bantuan', content_html: '❓ Bantuan' },
  { key: 'btn_inline_claim', name: 'Tombol Inline: Klaim Garansi', content_html: '🛡️ Klaim Garansi' },
  { key: 'btn_inline_dashboard', name: 'Tombol Inline: Buka Dashboard', content_html: '🌐 Buka Dashboard' },
  { key: 'btn_inline_back', name: 'Tombol Inline: Kembali ke List', content_html: '🔙 Kembali ke List' }
];

async function run() {
  const { error } = await supabaseAdmin.from('bot_templates').upsert(
    buttons.map(b => ({ ...b, variables_hint: '(Hanya Teks & Standar Emoji)' })),
    { onConflict: 'key' }
  );
  if (error) console.error(error);
  else console.log('Buttons inserted successfully!');
}
run();
