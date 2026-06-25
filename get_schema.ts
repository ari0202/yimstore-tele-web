import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);

async function run() {
  const { data, error } = await supabase.from('orders').select('*').limit(1);
  console.log('Columns:', Object.keys(data?.[0] || {}));
}
run();
