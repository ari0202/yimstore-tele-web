import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Verifying admin_product_summary_view...");
  const { data: viewData, error: viewError } = await supabase.from('admin_product_summary_view').select('description, thumbnail_url, max_claim_limit').limit(1);
  if (viewError) {
      console.error("View Error:", viewError);
      process.exit(1);
  }
  console.log("View is OK. Found rows:", viewData?.length);

  console.log("Verifying order_items max_claim_limit column...");
  const { error: orderItemsError } = await supabase.from('order_items').select('max_claim_limit').limit(1);
  if (orderItemsError) {
      console.error("order_items Error:", orderItemsError);
      process.exit(1);
  }
  console.log("order_items max_claim_limit column is OK.");

  console.log("Verifying rpc_delete_product_permanently...");
  const { error: rpcDelError } = await supabase.rpc('rpc_delete_product_permanently', { p_product_id: '00000000-0000-0000-0000-000000000000' });
  if (rpcDelError) {
      console.error("Delete RPC Error:", rpcDelError);
      process.exit(1);
  }
  console.log("Delete RPC is OK.");

  console.log("Verifying rpc_process_warranty_claim...");
  const { error: rpcClaimError } = await supabase.rpc('rpc_process_warranty_claim', { p_order_item_id: '00000000-0000-0000-0000-000000000000', p_reason: 'test' });
  if (rpcClaimError) {
      if (rpcClaimError.message.includes('Order item not found')) {
          console.log("Claim RPC is OK (returned expected error for missing order_item).");
      } else {
          console.error("Claim RPC Error:", rpcClaimError);
          process.exit(1);
      }
  } else {
      console.error("Claim RPC succeeded when it should have failed.");
      process.exit(1);
  }
  
  console.log("✅ Full verification successful.");
}
run();
