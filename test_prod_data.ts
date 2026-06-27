import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
    const { data: categories, error } = await supabase
        .from('categories')
        .select(`
            id, name, description, thumbnail_url,
            inventory(status),
            variations:products(
                id, name, price, warranty_days, max_claim_limit, is_archived, is_sync_stock, inventory(status)
            )
        `);
    if (error) console.error(error);
    else console.log(JSON.stringify(categories, null, 2));
}

run();
