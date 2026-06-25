require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function test() {
  const { data: cat } = await supabase.from('categories').select('id, name').limit(1);
  if (cat && cat.length > 0) {
    const res = await supabase.from('categories').delete().eq('id', cat[0].id);
    console.log(JSON.stringify(res, null, 2));
  } else {
    console.log('No categories found');
  }
}
test();
