export async function createPakasirTransaction(orderId: string, amount: number, returnUrl?: string) {
    const projectSlug = process.env.PAKASIR_PROJECT_SLUG!;
    
    // Using Integrasi via URL which is the simplest and supports redirect natively
    let url = `https://app.pakasir.com/pay/${projectSlug}/${amount}?order_id=${orderId}&qris_only=1`;
    
    if (returnUrl) {
        url += `&redirect=${encodeURIComponent(returnUrl)}`;
    }
    
    return url;
}
