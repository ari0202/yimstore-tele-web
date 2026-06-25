import 'dotenv/config';

async function getPakasirTransactionDetail(orderId: string, amount: number) {
  const projectSlug = process.env.PAKASIR_PROJECT_SLUG!;
  const apiKey = process.env.PAKASIR_API_KEY || process.env.PAKASIR_SECRET || process.env.PAKASIR_TEST_SECRET;

  const url = `https://app.pakasir.com/api/transactiondetail?project=${projectSlug}&amount=${amount}&order_id=${orderId}&api_key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();
  console.log(JSON.stringify(data, null, 2));
}

getPakasirTransactionDetail('INV-7B3DE292', 35000);
