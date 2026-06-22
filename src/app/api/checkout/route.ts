import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createPakasirTransaction } from '@/lib/pakasir';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize global Redis rate limiter for Serverless
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '1 m'),
});

export async function POST(req: Request) {
  try {
    // 1. Eksekusi Rate Limit PERTAMA KALI (Sebelum menyentuh DB untuk mencegah koneksi habis)
    const authHeader = req.headers.get('authorization');
    const isInternalBot = authHeader === `Bearer ${process.env.BOT_INTERNAL_TOKEN}`;
    let rateLimitKey = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    
    // Jika dari bot, limit berdasarkan User ID Telegram, BUKAN IP server bot
    if (isInternalBot) {
      const telegramUserId = req.headers.get('x-telegram-user-id');
      if (!telegramUserId) return NextResponse.json({ error: 'Missing telegram ID' }, { status: 400 });
      rateLimitKey = `tg_user_${telegramUserId}`;
    }

    const { success } = await ratelimit.limit(`checkout_${rateLimitKey}`);
    if (!success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 });

    // 2. Check Global Kill-Switch (Aman karena Rate Limit sudah lewat)
    const { data: settings } = await supabaseAdmin.from('system_settings').select('value').eq('key', 'maintenance_mode').single();
    if (settings?.value === 'true') {
      return NextResponse.json({ error: 'System is under maintenance' }, { status: 503 });
    }

    const formData = await req.formData();
    const productId = formData.get('productId') as string;

    if (!productId) {
      return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
    }

    // 1. Get product price
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('price')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 2. Hold inventory atomically
    const { data: holdResult, error: holdError } = await supabaseAdmin.rpc('hold_inventory', {
      p_product_id: productId
    });

    if (holdError || !holdResult) {
      return NextResponse.json({ error: 'Sistem sibuk atau stok habis.' }, { status: 500 });
    }

    if (holdResult === 'OUT_OF_STOCK') {
      return NextResponse.json({ error: 'Stok Habis' }, { status: 400 });
    }

    // UUID dari inventory yang di-hold
    const inventoryId = holdResult;

    // 3. Create Anonymous User since we use Identity Merge later
    const { data: newUser, error: userError } = await supabaseAdmin
      .from('users')
      .insert({})
      .select('id').single();

    // 4. Create Order with access_token
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: newUser?.id || null,
        total_amount: product.price,
        payment_status: 'pending',
        platform_source: 'web'
      })
      .select('id, access_token').single();

    if (orderError || !newOrder) throw orderError;

    // 5. Create Order Item
    await supabaseAdmin
      .from('order_items')
      .insert({
        order_id: newOrder.id,
        inventory_id: inventoryId
      });

    // 6. Create Pakasir Transaction
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/order/${newOrder.id}?token=${newOrder.access_token}`;
    
    // Asumsi createPakasirTransaction mendukung parameter returnUrl
    const pakasirCheckoutUrl = await createPakasirTransaction(newOrder.id, product.price, returnUrl);

    // Redirect user to payment
    return NextResponse.redirect(pakasirCheckoutUrl, { status: 303 });

  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
