import { supabaseAdmin } from './src/lib/supabase/admin';

async function main() {
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, order_items(id, current_claim_count, max_claim_limit)')
    .limit(1)
    .single();
  console.log("Order items:", order?.order_items);
  console.log("Is array?", Array.isArray(order?.order_items));
}

main();
