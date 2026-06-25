const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { data, error } = await supabase
    .from('order_items')
    .insert({ order_id: '70406605-92c4-46e8-a023-e9201000eb0c', inventory_id: 'e698bbbc-3657-4b77-becf-287df5779ab6' });
    
  console.log(error);
}

test();
