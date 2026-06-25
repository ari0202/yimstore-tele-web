const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Mocking createProductWithVariations logic...");
  
  const name = "Mock Product Verify";
  const { data: category } = await supabaseAdmin.from('categories').select('id').limit(1).single();
  const category_id = category.id;

  const variations = [
    { name: "Var 1", price: 10000, warranty_days: 30, max_claim_limit: 1 },
    { name: "Var 2", price: 20000, warranty_days: 30, max_claim_limit: 2 }
  ];

  // 1. Insert parent
  const { data: prod, error: prodError } = await supabaseAdmin
    .from('products')
    .insert({
      name,
      category_id,
      price: 0,
      warranty_days: 0,
      max_claim_limit: 0
    })
    .select('id').single();

  if (prodError) throw prodError;
  console.log("✅ Created parent:", prod.id);

  // 2. Insert variations
  const variationsToInsert = variations.map((v) => ({
      parent_id: prod.id,
      name: v.name,
      price: v.price,
      warranty_days: v.warranty_days,
      max_claim_limit: v.max_claim_limit,
      category_id,
  }));

  const { data: insertedVariations, error: varError } = await supabaseAdmin
    .from('products')
    .insert(variationsToInsert)
    .select('id, name');

  if (varError) throw varError;
  console.log("✅ Created variations:", insertedVariations);

  // 3. Test the view
  const { data: viewData, error: viewError } = await supabaseAdmin
    .from('admin_product_summary_view')
    .select('*')
    .eq('id', prod.id)
    .single();

  if (viewError) throw viewError;
  console.log("✅ View output for new product:", viewData);
}

run();
