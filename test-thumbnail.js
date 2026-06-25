import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim().replace(/^['"]|['"]$/g, '') : '';
const supabaseKey = keyMatch ? keyMatch[1].trim().replace(/^['"]|['"]$/g, '') : '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('products').select('name, thumbnail_url').eq('name', 'Canva Pro');
  if (error) console.error(error);
  console.log(JSON.stringify(data, null, 2));
}
check();
