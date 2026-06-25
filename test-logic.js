const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const productId = '15665c9e-0fba-4fdc-af5c-5c1c531a8e0b';
  const { data: product } = await supabaseAdmin.from('products').select('price, parent_id').eq('id', productId).single();
  console.log('product', product);
  console.log('!product.parent_id', !product.parent_id);
  
  const { data: children } = await supabaseAdmin.from('products').select('id').eq('parent_id', productId).limit(1);
  console.log('children', children);
  console.log('children && children.length > 0', children && children.length > 0);
}

run();
