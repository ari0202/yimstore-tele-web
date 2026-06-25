import { Client } from 'pg';
import crypto from 'crypto';

const connectionString = 'postgresql://postgres:%23Sakithatiku02@db.zdhlfoiytkamnyywbgyx.supabase.co:5432/postgres';

async function runDLQVerification() {
    console.log('\n--- Test 3: Verifying Pure-SQL Poison Pill DLQ (via pg) ---');
    const client = new Client({ connectionString });

    try {
        await client.connect();

        // 1. Insert a poison pill (processing, retry_count=3, updated_at 10 mins ago)
        const poisonId = crypto.randomUUID();
        await client.query(`
            INSERT INTO public.outbox_events (id, event_type, payload, status, retry_count, updated_at, created_at)
            VALUES ($1, 'TEST_POISON_PILL', '{"test": "corrupted"}', 'processing', 3, NOW() - INTERVAL '10 minutes', NOW() - INTERVAL '15 minutes')
        `, [poisonId]);

        console.log(`Injected Poison Pill ID: ${poisonId}`);

        // 2. Run the periodic cleanup which contains the DLQ sweep
        await client.query(`SELECT system_periodic_cleanup()`);

        // 3. Verify the poison pill status is now 'failed'
        const { rows: poisonRows } = await client.query(`SELECT status FROM public.outbox_events WHERE id = $1`, [poisonId]);
        if (poisonRows[0].status !== 'failed') {
            throw new Error(`Poison pill was not swept! Status is still: ${poisonRows[0].status}`);
        }
        console.log('✅ Poison pill successfully marked as failed.');

        // 4. Verify an ADMIN_ALERT_FAILED_DELIVERY was spawned for it
        const { rows: alertRows } = await client.query(`
            SELECT payload FROM public.outbox_events 
            WHERE event_type = 'ADMIN_ALERT_FAILED_DELIVERY' 
            AND payload->>'original_event' = 'TEST_POISON_PILL'
            ORDER BY created_at DESC LIMIT 1
        `);

        if (alertRows.length === 0) {
            throw new Error('No ADMIN_ALERT_FAILED_DELIVERY was spawned for the poison pill!');
        }

        const alertPayload = alertRows[0].payload;
        if (!alertPayload.error_reason || !alertPayload.original_payload) {
            throw new Error(`Alert payload formatting is incorrect: ${JSON.stringify(alertPayload)}`);
        }
        console.log('✅ ADMIN_ALERT_FAILED_DELIVERY successfully spawned with correctly formatted JSON payload!');

        // Cleanup
        await client.query(`DELETE FROM public.outbox_events WHERE id = $1`, [poisonId]);
        await client.query(`DELETE FROM public.outbox_events WHERE event_type = 'TEST_POISON_PILL'`);

        console.log('\n🎉 ALL VERIFICATION PROTOCOLS PASSED!');
    } catch (error) {
        console.error('❌ DLQ Verification failed:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

runDLQVerification();
