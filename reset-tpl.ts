import dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
  console.log('Resetting welcome_message...');
  const { data, error } = await supabaseAdmin
    .from('bot_templates')
    .update({ content_html: '✨ Selamat Datang di YimStore! ✨\n\nSilakan atur ulang pesan ini melalui bot.' })
    .eq('key', 'welcome_message');

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Success!', data);
  }
}

run();
