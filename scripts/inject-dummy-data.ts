import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

// 1. HARDCODED FAIL-SAFE (Operational Security Review)
if (process.env.NODE_ENV !== 'development') {
    console.error('🚨 ABORT: Dummy data injection can only run in development environment.');
    process.exit(1);
}

if (!process.argv.includes('--confirm-destroy-real-data')) {
    console.error('🚨 ABORT: Missing --confirm-destroy-real-data flag. This prevents accidental execution.');
    process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inject() {
    console.log('🚀 Initiating Dummy Data Injection...');

    // 2. Clear Existing Test Data & Rate Limiters
    if (process.env.UPSTASH_REDIS_REST_URL && process.env.IS_TEST_REDIS === 'true') {
        console.log('🧹 Flushing Test Redis Database (Idempotency Reset)...');
        try {
            const response = await fetch(`${process.env.UPSTASH_REDIS_REST_URL}/flushdb`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${process.env.UPSTASH_REDIS_REST_TOKEN}` }
            });
            if (response.ok) {
                console.log('✅ Test Redis Flushed');
            } else {
                console.warn('⚠️ Failed to flush Redis:', await response.text());
            }
        } catch (e) {
            console.warn('⚠️ Error connecting to Redis for flush:', e);
        }
    }
    
    console.log('🧹 Truncating existing tables...');
    await supabase.from('warranty_logs').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('pending_claims').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('outbox_events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('inventory').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('categories').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    
    // Inject Dummy Admin
    await supabase.from('admins').delete().eq('username', 'admin');
    await supabase.from('admins').insert({
        username: 'admin',
        password_hash: '$2b$10$8sAQMSREcaBqPl4/v./yDOD6.VnxhFL/tOe4GDwmJy43y3xUw5ad.' // 'admin123'
    });
    console.log('✅ Injected Dummy Admin (admin/admin123)');
    
    // 3. Inject Categories
    const categories = [
        { name: 'Streaming', slug: 'streaming' },
        { name: 'Design', slug: 'design' },
        { name: 'VPN', slug: 'vpn' }
    ];

    let catData;
    const { data: newCat, error: catErr } = await supabase.from('categories').insert(categories).select();
    if (catErr && catErr.code === '23505') { // Unique violation
        console.log('⚠️ Categories already exist. Fetching existing ones...');
        const { data: existingCat } = await supabase.from('categories').select('*');
        catData = existingCat;
    } else if (catErr) {
        console.log('⚠️ Warning injecting categories:', catErr);
        const { data: existingCat } = await supabase.from('categories').select('*');
        catData = existingCat;
    } else {
        catData = newCat;
    }
    console.log(`✅ Injected ${catData?.length} Categories`);

    const streamCat = catData?.find((c: any) => c.slug === 'streaming');
    const designCat = catData?.find((c: any) => c.slug === 'design');

    // 4. Inject Products
    const products = [
        { category_id: streamCat!.id, name: 'Netflix Premium 1 Bulan', price: 35000, warranty_days: 30, max_claim_limit: 5, cooldown_value: 1, cooldown_unit: 'hours', description: 'Akun premium 4K' },
        { category_id: streamCat!.id, name: 'Spotify Premium 1 Bulan', price: 15000, warranty_days: 25, max_claim_limit: 1, cooldown_value: 1, cooldown_unit: 'hours', description: 'No ads, offline' },
        { category_id: designCat!.id, name: 'Canva Pro Invite', price: 10000, warranty_days: 30, max_claim_limit: 1, cooldown_value: 1, cooldown_unit: 'hours', description: 'Invite via email' }
    ];

    let prodData;
    const { data: newProd, error: prodErr } = await supabase.from('products').insert(products).select();
    if (prodErr && prodErr.code === '23505') {
        console.log('⚠️ Products already exist. Fetching existing ones...');
        const { data: existingProd } = await supabase.from('products').select('*');
        prodData = existingProd;
    } else if (prodErr) {
        console.log('⚠️ Warning injecting products:', prodErr);
        const { data: existingProd } = await supabase.from('products').select('*');
        prodData = existingProd;
    } else {
        prodData = newProd;
    }
    console.log(`✅ Injected ${prodData?.length} Products`);

    // 5. Inject Inventory
    const netflix = prodData?.find((p: any) => p.name.includes('Netflix'));
    const inventory = [];
    
    // 10 Available
    for(let i=0; i<10; i++) {
        inventory.push({ product_id: netflix.id, credential_data: `netflix_user${i}@mail.com:pass123`, status: 'Available' });
    }
    // 2 Used
    inventory.push({ product_id: netflix.id, credential_data: `netflix_used1@mail.com:pass123`, status: 'Used' });
    inventory.push({ product_id: netflix.id, credential_data: `netflix_used2@mail.com:pass123`, status: 'Used' });
    // 1 Hold
    inventory.push({ product_id: netflix.id, credential_data: `netflix_hold@mail.com:pass123`, status: 'Hold', reserved_until: new Date(Date.now() + 3600000).toISOString() });

    const { data: invData, error: invErr } = await supabase.from('inventory').insert(inventory).select();
    if (invErr) throw invErr;
    console.log(`✅ Injected ${invData.length} Inventory Items`);

    console.log('🎉 Dummy Data Injection Complete!');
    process.exit(0);
}

inject().catch(console.error);
