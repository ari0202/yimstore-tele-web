import dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const content = `🎉 <b>PEMBAYARAN BERHASIL</b>

Terima kasih, pembayaran pesanan Anda telah diverifikasi!

<b>DETAIL PESANAN:</b>
- Order ID: <code>{{short_id}}</code>
- Produk: {{product_name}}
- Total Bayar: Rp {{total_amount}}
- Masa Garansi: {{warranty_days}} Hari
- Berlaku s.d: {{warranty_date}}
- Sisa Kuota Klaim: {{claim_limit}} Kali

<b>KREDENSIAL AKUN:</b>
<code>{{credential_text}}</code>

Untuk melihat riwayat dan klaim garansi, pilih menu Riwayat Transaksi.
Selamat menikmati layanan kami!`;

  const { error } = await supabaseAdmin
    .from('bot_templates')
    .upsert({
      key: 'payment_success',
      name: 'Pembayaran Berhasil',
      content_html: content,
      variables_hint: '{{short_id}}, {{product_name}}, {{total_amount}}, {{warranty_days}}, {{warranty_date}}, {{claim_limit}}, {{credential_text}}'
    }, { onConflict: 'key' });

  if (error) console.error(error);
  else console.log('Added payment_success template!');
}

run();
