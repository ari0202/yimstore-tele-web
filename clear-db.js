const { createClient } = require('@supabase/supabase-js');
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE URL or KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function wipeDatabase() {
  console.log('Menghapus data...');

  const tables = [
    'warranty_logs',
    'outbox_events',
    'order_items',
    'orders',
    'inventory',
    'products',
    'categories',
    'audit_logs'
  ];

  for (const table of tables) {
    const { error } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      console.error('Gagal menghapus ' + table + ':', error.message);
    } else {
      console.log('✅ ' + table + ' berhasil dikosongkan.');
    }
  }
}
wipeDatabase().then(() => { console.log('Selesai.'); process.exit(0); });
