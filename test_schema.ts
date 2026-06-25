import { supabaseAdmin } from './src/lib/supabase/admin';

async function main() {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('telegram_chat_id')
    .limit(1);
    
  console.log("Users schema:", typeof data?.[0]?.telegram_chat_id, data?.[0]?.telegram_chat_id);
}

main();
