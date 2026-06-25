import { supabaseAdmin } from './src/lib/supabase/admin';

async function main() {
  const { data, error } = await supabaseAdmin
    .from('order_items')
    .select('id, orders!inner(users!inner(telegram_chat_id))')
    .eq('id', 'a90740b0-f6ff-4309-91b3-ef9ae209e57c')
    .eq('orders.users.telegram_chat_id', '123456789')
    .single();
    
  console.log("Data:", data);
  console.log("Error:", error);
}

main();
