const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: order } = await supabase
    .from('orders')
    .select('id, payment_status, order_items(inventory_id)')
    .eq('payment_status', 'cancelled')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
    
  console.log(JSON.stringify(order, null, 2));
}

test();
