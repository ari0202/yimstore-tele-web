const qrisCache = new Map<string, any>();

export async function createPakasirTransaction(orderId: string, amount: number) {
    if (qrisCache.has(orderId)) {
      return qrisCache.get(orderId);
    }

    const projectSlug = process.env.PAKASIR_PROJECT_SLUG!;
    const apiKey = process.env.PAKASIR_API_KEY || process.env.PAKASIR_SECRET || process.env.PAKASIR_TEST_SECRET;
    
    if (!apiKey) {
      throw new Error('PAKASIR_API_KEY is not set');
    }

    const response = await fetch('https://app.pakasir.com/api/transactioncreate/qris', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            project: projectSlug,
            order_id: orderId,
            amount: amount,
            api_key: apiKey
        })
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Pakasir API Error:', errorText);
        throw new Error(`Gagal membuat transaksi Pakasir: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Cache for 15 minutes to survive page refreshes
    qrisCache.set(orderId, data);
    setTimeout(() => qrisCache.delete(orderId), 15 * 60 * 1000);
    
    return data;
}

export async function getPakasirTransactionDetail(orderId: string, amount: number) {
  const projectSlug = process.env.PAKASIR_PROJECT_SLUG!;
  const apiKey = process.env.PAKASIR_API_KEY || process.env.PAKASIR_SECRET || process.env.PAKASIR_TEST_SECRET;

  if (!projectSlug || !apiKey) {
    throw new Error('Pakasir credentials not configured');
  }

  const url = `https://app.pakasir.com/api/transactiondetail?project=${projectSlug}&amount=${amount}&order_id=${orderId}&api_key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Pakasir detail error:', error);
    throw error;
  }
}
