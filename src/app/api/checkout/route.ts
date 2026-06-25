import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createPakasirTransaction } from '@/lib/pakasir';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize global Redis rate limiter for Serverless
// Use lazy initialization or bypass if env vars are missing
const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const ratelimit = (redisUrl && redisToken) ? new Ratelimit({
  redis: new Redis({
    url: redisUrl,
    token: redisToken,
  }),
  limiter: Ratelimit.slidingWindow(5, '1 m'),
}) : null;

export async function POST(req: Request) {
  try {
    const protocol = req.headers.get('x-forwarded-proto') || 'http';
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');

    // Helper untuk redirect error agar tidak muncul JSON raw di browser
    const errorRedirect = (msg: string) => NextResponse.redirect(`${baseUrl}/?error=${encodeURIComponent(msg)}`, { status: 303 });

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

    const isE2E = process.env.APP_ENV === 'test' && req.headers.get('x-e2e-bypass') === process.env.E2E_BYPASS_SECRET;
    if (!isE2E && ratelimit) {
      const { success } = await ratelimit.limit(`checkout_${rateLimitKey}`);
      if (!success) return errorRedirect('Terlalu banyak permintaan. Coba lagi nanti.');
    } else if (!isE2E && !ratelimit && process.env.NODE_ENV === 'production') {
      console.warn('⚠️ Rate limiter is bypassed because Upstash Redis env vars are missing.');
    }

    // 2. Check Global Kill-Switch (Aman karena Rate Limit sudah lewat)
    const { data: settings } = await supabaseAdmin.from('system_settings').select('value').eq('key', 'maintenance_mode').single();
    if (settings?.value === 'true') {
      return errorRedirect('Sistem sedang dalam pemeliharaan');
    }

    const formData = await req.formData();
    const productId = formData.get('productId') as string;
    const email = formData.get('email') as string | null;

    if (!productId) {
      return errorRedirect('Produk tidak ditemukan');
    }

    // 1. Get product price & check parent status
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('name, price, parent_id, max_claim_limit')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return errorRedirect('Produk tidak ditemukan');
    }

    // Security Check: Defense in Depth (API Layer)
    // Cegah pembelian wadah variasi (Parent Product) jika wadah tersebut punya anak.
    if (!product.parent_id) {
      const { data: children } = await supabaseAdmin.from('products').select('id').eq('parent_id', productId).limit(1);
      if (children && children.length > 0) {
        return errorRedirect('Pilih variasi produk terlebih dahulu');
      }
    }

    // 2. Hold inventory atomically
    const { data: holdResult, error: holdError } = await supabaseAdmin.rpc('hold_inventory', {
      p_product_id: productId
    });

    if (holdError) {
      return errorRedirect('Sistem sibuk, gagal menahan stok.');
    }

    if (!holdResult || holdResult === 'OUT_OF_STOCK') {
      return errorRedirect('Stok produk ini sedang habis.');
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
        platform_source: 'web',
        email: email || null
      })
      .select('id, access_token').single();

    if (orderError || !newOrder) throw orderError;

    // 5. Create Order Item
    await supabaseAdmin
      .from('order_items')
      .insert({
        order_id: newOrder.id,
        inventory_id: inventoryId,
        product_id: productId,
        max_claim_limit: product.max_claim_limit ?? 1
      });

    // 5.5 Schedule Email Receipt (if email provided)
    if (email) {
      await supabaseAdmin.from('outbox_events').insert({
        event_type: 'send_order_receipt',
        payload: {
          order_id: newOrder.id,
          email: email,
          product_name: product.name,
          total_amount: product.price,
          access_token: newOrder.access_token
        }
      });
    }

    // Removed Pakasir Transaction creation here since it's created on-the-fly in page.tsx 
    // where we actually need the QR string. Doing it here causes "Transaction already completed" in page.tsx.

    
    const returnUrl = `${baseUrl}/order/${newOrder.id}---${newOrder.access_token}`;

    const cookieStore = await cookies();
    
    // Cleanup old order tokens to prevent HTTP 431 Request Header Fields Too Large
    const allCookies = cookieStore.getAll();
    const orderCookies = allCookies.filter(c => c.name.startsWith('order_token_'));
    if (orderCookies.length > 3) {
      // Delete old cookies so we only keep the 3 most recent ones
      const toDelete = orderCookies.slice(0, orderCookies.length - 3);
      for (const c of toDelete) {
        cookieStore.delete(c.name);
      }
    }

    // Tanam token ke dalam cookie agar ketika Pakasir meredirect kembali tanpa parameter, akses tetap dizinkan
    cookieStore.set(`order_token_${newOrder.id}`, newOrder.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30 // 30 hari
    });
    
    // Redirect user to our own dashboard (Native Experience)
    return NextResponse.redirect(returnUrl, { status: 303 });

  } catch (error: any) {
    console.error('Checkout error:', error);
    require('fs').writeFileSync('/tmp/error.txt', String(error.stack || error));
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
