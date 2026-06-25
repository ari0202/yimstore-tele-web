import crypto from 'crypto';

const SECRET = process.env.PAKASIR_WEBHOOK_SECRET || process.env.PAKASIR_TEST_SECRET || 'dummy_secret_for_local_tests';
const orderId = process.argv[2];

if (!orderId) {
  console.error('Usage: npx tsx scripts/simulate-webhook.ts <ORDER_ID>');
  process.exit(1);
}

const payload = {
  order_id: orderId,
  status: 'PAID',
  amount: 35000,
  customer_email: 'tester@mail.com'
};

const payloadString = JSON.stringify(payload);
const signature = crypto.createHmac('sha256', SECRET).update(payloadString).digest('hex');

console.log('\n🚀 Simulate Webhook with cURL:\n');
console.log(`curl -X POST http://localhost:3000/api/webhook/pakasir \\
  -H "Content-Type: application/json" \\
  -H "x-pakasir-signature: ${signature}" \\
  -d '${payloadString}'`);

console.log('\nOr you can run this node fetch command in a separate script. Run the cURL above in your terminal!');
