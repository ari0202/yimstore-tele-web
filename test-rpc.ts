import { Client } from 'pg';

const connectionString = 'postgresql://postgres:%23Sakithatiku02@db.zdhlfoiytkamnyywbgyx.supabase.co:5432/postgres';

async function run() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const res = await client.query('SELECT id FROM order_items ORDER BY created_at DESC LIMIT 1');
        if (res.rows.length === 0) {
            console.log('No order items found');
            return;
        }
        const orderItemId = res.rows[0].id;
        console.log('Testing RPC for order_item:', orderItemId);
        const rpcRes = await client.query('SELECT * FROM process_warranty_claim($1)', [orderItemId]);
        console.log('RPC Result:', rpcRes.rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}
run();
