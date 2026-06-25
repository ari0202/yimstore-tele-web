const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id,
      total_amount,
      payment_status,
      telegram_chat_id,
      order_items (
        id, warranty_end_date, current_claim_count,
        inventory!inner ( 
          credential_data, 
          products ( name, max_claim_limit, warranty_days )
        )
      )
    `)
    .eq('id', '7af5be49-ad91-4547-ab18-e929ae3ee835')
    .eq('access_token', '996130a7-df30-4cac-aa01-a360ae4eaef4')
    .single();

  console.log("Error:", error);
  console.log("Data:", JSON.stringify(data, null, 2));
}

run();
