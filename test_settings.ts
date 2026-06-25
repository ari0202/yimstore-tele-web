import { supabaseAdmin } from './src/lib/supabase/admin';

async function main() {
  const { data, error } = await supabaseAdmin
    .from('system_settings')
    .select('value')
    .eq('key', 'maintenance_mode')
    .single();
    
  console.log("Settings Data:", data);
  console.log("Settings Error:", error);
}

main();
