import { supabaseAdmin } from './src/lib/supabase/admin';

async function main() {
  const { data, error } = await supabaseAdmin
    .from('order_items')
    .select('id, orders!inner(users!inner(telegram_chat_id))')
    .limit(1);
    
  console.log("Data:", JSON.stringify(data, null, 2));
  console.log("Error:", error);
}

main();
