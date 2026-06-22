const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:%23Sakithatiku02@db.zdhlfoiytkamnyywbgyx.supabase.co:5432/postgres'
});

async function verify() {
  await client.connect();
  
  // Check if outbox_events has transaction_id
  const res1 = await client.query(`
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_name = 'outbox_events' AND column_name = 'transaction_id';
  `);
  console.log('outbox_events.transaction_id exists:', res1.rows.length > 0);

  // Check if process_payment_fulfillment exists
  const res2 = await client.query(`
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_name = 'process_payment_fulfillment';
  `);
  console.log('process_payment_fulfillment exists:', res2.rows.length > 0);

  await client.end();
}

verify().catch(console.error);
