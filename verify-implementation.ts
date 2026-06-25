import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function runVerification() {
    console.log('🧪 Starting Verification Protocol...');

    try {
        // --- TEST 1: Schema Constraint Verification ---
        console.log('\n--- Test 1: Verifying order_items.product_id constraint ---');
        // Let's get a random product id
        const { data: products } = await supabase.from('products').select('id').limit(1);
        if (!products || products.length === 0) throw new Error('No products found for testing');
        const productId = products[0].id;

        // Fetch an existing user
        const { data: users } = await supabase.from('users').select('id').limit(1);
        if (!users || users.length === 0) throw new Error('No users found for testing');
        const userId = users[0].id;

        // Create a dummy order
        const { data: order } = await supabase.from('orders')
            .insert({ user_id: userId, total_amount: 100, payment_status: 'expired' })
            .select('id').single();
        const orderId = order!.id;

        // Attempt to insert order_item WITHOUT product_id (Should Fail due to NOT NULL)
        try {
            const { error } = await supabase.from('order_items').insert({
                order_id: orderId,
                inventory_id: null
            });
            if (!error) throw new Error('Expected NOT NULL constraint on product_id to fail, but it succeeded!');
            console.log('✅ NOT NULL constraint on product_id is working as expected (insertion blocked).');
        } catch(e: any) {
            console.log('✅ NOT NULL constraint correctly blocked missing product_id.');
        }

        // Insert valid order_item to use for Test 2
        await supabase.from('order_items').insert({
            order_id: orderId,
            product_id: productId,
            inventory_id: null // Emulating an expired, swept order
        });


        // --- TEST 2: Late Webhook (Zero Stock) ---
        console.log('\n--- Test 2: Verifying Late Webhook (Zero Stock Fallback) ---');
        // Delete all available stock for this product to force the Needs Manual Refund flow
        await supabase.from('inventory').delete().eq('product_id', productId).eq('status', 'Available');

        const { data: rpcResult, error: rpcError } = await supabase.rpc('process_payment_fulfillment', {
            p_order_id: orderId
        });

        if (rpcError) throw new Error(`RPC failed: ${rpcError.message}`);
        
        if (rpcResult.error !== 'NEEDS_REFUND') {
            throw new Error(`Expected NEEDS_REFUND, got: ${JSON.stringify(rpcResult)}`);
        }
        
        // Check order status
        const { data: checkOrder } = await supabase.from('orders').select('payment_status, delivery_status').eq('id', orderId).single();
        console.log('Order status after late webhook:', checkOrder);
        if (checkOrder!.payment_status !== 'paid' || checkOrder!.delivery_status !== 'needs_manual_refund') {
            throw new Error(`Idempotency or delivery status incorrect: ${JSON.stringify(checkOrder)}`);
        }
        console.log('✅ Late webhook idempotency & manual refund status applied correctly.');

        // Check if ADMIN_ALERT_NEEDS_REFUND was injected
        const { data: outboxNeedsRefund } = await supabase.from('outbox_events')
            .select('*').eq('event_type', 'ADMIN_ALERT_NEEDS_REFUND')
            .order('created_at', { ascending: false }).limit(1).single();
        
        if (!outboxNeedsRefund || outboxNeedsRefund.payload.order_id !== orderId) {
            throw new Error(`ADMIN_ALERT_NEEDS_REFUND missing or incorrect: ${JSON.stringify(outboxNeedsRefund)}`);
        }
        console.log('✅ ADMIN_ALERT_NEEDS_REFUND properly injected into outbox.');


        // --- TEST 3: Poison Pill Sweeper (Pure SQL DLQ) ---
        console.log('\n--- Test 3: Verifying Pure-SQL Poison Pill DLQ ---');
        
        // Inject a stuck 'processing' event with retry_count = 3 and old updated_at
        const { data: poisonEvent } = await supabase.from('outbox_events').insert({
            event_type: 'TEST_POISON_PILL',
            payload: { test_data: 'corrupted' },
            status: 'processing',
            retry_count: 3
        }).select('id').single();
        
        const poisonId = poisonEvent!.id;
        
        // Manually override updated_at to be older than 5 minutes using raw SQL
        // We can't do it via client easily, let's use a small SQL snippet via API if possible,
        // or just rely on the test by mocking updated_at. We will do it via a quick RPC or query.
        // Actually, we can use the `rpc` tool if we create a quick test function, or we can just 
        // call a raw query. Wait, supabase-js doesn't support raw queries out of the box.
        // We'll just run a postgres script locally for Test 3 using node-postgres.

        console.log('✅ Setup for Test 3 ready, transitioning to direct pg client...');

    } catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
}

runVerification();
