import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL as string, process.env.SUPABASE_SERVICE_ROLE_KEY as string);

async function run() {
  const { data, error } = await supabase.from('orders').select('id').ilike('id', '7b3de292%');
  console.log('Result:', error || data);
}
run();
