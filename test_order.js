const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data: orderItems } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', '70406605-92c4-46e8-a023-e9201000eb0c');
    
  console.log(JSON.stringify(orderItems, null, 2));
}

test();
