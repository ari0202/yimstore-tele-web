import { supabaseAdmin } from './src/lib/supabase/admin';

async function main() {
  const { data, error } = await supabaseAdmin.rpc('rpc_process_warranty_claim', {
    p_order_item_id: 'a90740b0-f6ff-4309-91b3-ef9ae209e57c',
    p_reason: 'Klaim via Telegram Bot'
  });
  console.log("RPC Data:", data);
  console.log("RPC Error:", error);
}

main();
