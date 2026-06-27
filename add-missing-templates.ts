import dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  const historyContent = `<b>Riwayat Transaksi</b>\n\nSilakan pilih pesanan Anda di bawah ini:\n{{order_list}}`;
  
  const detailsContent = `<b>Detail Pesanan: <code>{{short_id}}</code></b>

Produk: {{product_name}}
Total: Rp {{total_amount}}
Status: {{status}}

<b>Info Garansi:</b>
Masa Garansi: {{warranty_days}} Hari
Berlaku Hingga: {{warranty_end_date}}
Status Garansi: {{warranty_status}}
Sisa Kuota Klaim: {{claims_left}} Kali`;

  await supabaseAdmin.from('bot_templates').upsert([
    {
      key: 'order_history',
      name: 'Riwayat Transaksi',
      content_html: historyContent,
      variables_hint: '{{order_list}}'
    },
    {
      key: 'order_details',
      name: 'Detail Klaim Garansi',
      content_html: detailsContent,
      variables_hint: '{{short_id}}, {{product_name}}, {{total_amount}}, {{status}}, {{warranty_days}}, {{warranty_end_date}}, {{warranty_status}}, {{claims_left}}'
    }
  ], { onConflict: 'key' });

  console.log('Templates added!');
}

run();
