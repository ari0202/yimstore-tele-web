import { supabaseAdmin } from './src/lib/supabase/admin';

async function main() {
  const { data: item } = await supabaseAdmin.from('order_items').select('id, orders!inner(users!inner(telegram_chat_id))').limit(1).single();
  console.log("Found item:", item);
  
  if (!item) return;

  const orderItemId = item.id;
  const chatId = (item as any).orders.users.telegram_chat_id;

  const { data, error } = await supabaseAdmin
    .from('order_items')
    .select('id, orders!inner(users!inner(telegram_chat_id))')
    .eq('id', orderItemId)
    .eq('orders.users.telegram_chat_id', chatId)
    .single();
    
  console.log("Data:", data);
  console.log("Error:", error);
}

main();
