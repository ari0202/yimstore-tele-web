import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\s]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\s]+)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim().replace(/^['"]|['"]$/g, '') : '';
const supabaseKey = keyMatch ? keyMatch[1].trim().replace(/^['"]|['"]$/g, '') : '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.rpc('rpc_test', {}).select().limit(1); // just want to trigger a raw query if possible...
  // wait, we can just use REST API to check the schema or do a raw postgres query if we have postgres url
}
check();
