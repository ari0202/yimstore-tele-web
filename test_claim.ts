import { supabaseAdmin } from './src/lib/supabase/admin';

async function main() {
  // Find an order item that can be claimed
  const { data: item } = await supabaseAdmin
    .from('order_items')
    .select('id, current_claim_count, max_claim_limit, warranty_end_date, product_id, inventory_id')
    .lt('current_claim_count', 5)
    .gt('warranty_end_date', new Date().toISOString())
    .limit(1)
    .single();

  if (!item) {
    console.log("No eligible item found to test claim.");
    return;
  }
  
  console.log("Testing with item:", item);
  
  // Need to make sure there's inventory available for this product
  // Let's just create a dummy inventory item
  await supabaseAdmin.from('inventory').insert({
    product_id: item.product_id,
    credential_data: 'dummy_cred',
    status: 'Available'
  });

  const { data: result, error } = await supabaseAdmin.rpc('rpc_process_warranty_claim', { 
    p_order_item_id: item.id,
    p_reason: 'Testing claim via script'
  });
  
  console.log("Result:", result);
  console.log("Error:", error);
}

main();
