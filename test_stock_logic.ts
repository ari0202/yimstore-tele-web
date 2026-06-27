import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.production') });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function run() {
    const { data: rawCategories, error } = await supabase
        .from('categories')
        .select(`
            id, name, description, thumbnail_url,
            inventory(status),
            variations:products(
                id, name, price, warranty_days, max_claim_limit, is_archived, is_sync_stock, inventory(status)
            )
        `);

    const products = rawCategories?.map((c: any) => {
        const categoryInventory = c.inventory?.filter((i: any) => i.status === 'Available').length || 0;
        const activeVariations = c.variations
            ?.filter((v: any) => !v.is_archived)
            .map((v: any) => ({
                ...v,
                stock: v.is_sync_stock 
                    ? categoryInventory 
                    : (v.inventory?.filter((i: any) => i.status === 'Available').length || 0)
            })) || [];

        const usesSyncStock = activeVariations.some((v: any) => v.is_sync_stock);
        const totalStock = usesSyncStock 
            ? categoryInventory 
            : activeVariations.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);

        return { name: c.name, categoryInventory, usesSyncStock, totalStock, activeVariations };
    });

    console.log(JSON.stringify(products, null, 2));
}
run();
