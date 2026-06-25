const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select(`
      id, name, price,
      inventory(count),
      variations:products!parent_id(
        id, name, price, is_archived, inventory(count)
      )
    `)
    .is('parent_id', null)
    .eq('is_archived', false)
    .eq('inventory.status', 'Available')
    .eq('variations.inventory.status', 'Available');

  console.log(JSON.stringify({ data, error }, null, 2));
}

run();
