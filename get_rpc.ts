import { supabaseAdmin } from './src/lib/supabase/admin';

async function main() {
  const { data, error } = await supabaseAdmin.rpc('get_function_definition', { func_name: 'rpc_process_warranty_claim' });
  console.log("Error:", error);
}

main();
