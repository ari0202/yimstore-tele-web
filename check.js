require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('inventory').select('*').then(res => { console.log(JSON.stringify(res.data, null, 2)); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });
