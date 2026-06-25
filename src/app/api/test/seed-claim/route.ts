import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  if (process.env.APP_ENV !== 'test' || req.headers.get('x-e2e-bypass') !== process.env.E2E_BYPASS_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
  
  const email = `test-${Date.now()}@test.com`;
  const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true
  });
  
  if (authErr || !authUser.user) return NextResponse.json({ error: authErr?.message }, { status: 500 });
  const userId = authUser.user.id;

  // Create public user if needed
  const { error: userErr } = await supabaseAdmin.from('users').insert({ id: userId, telegram_chat_id: userId });
  if (userErr) return NextResponse.json({ error: 'User err: ' + userErr.message }, { status: 500 });

  // Create order
  const { data: newOrder, error: orderErr } = await supabaseAdmin.from('orders').insert({
    user_id: userId,
    total_amount: 10000,
    payment_status: 'PAID'
  }).select('id').single();
  if (orderErr || !newOrder) return NextResponse.json({ error: 'Order err: ' + orderErr?.message }, { status: 500 });

  // Create an available inventory item to serve as the replacement!
  const { data: products, error: prodErr } = await supabaseAdmin.from('products').select('id').limit(1);
  if (prodErr || !products || products.length === 0) return NextResponse.json({ error: 'Prod err: ' + prodErr?.message }, { status: 500 });
  const product = products[0];

  const { error: invErr1 } = await supabaseAdmin.from('inventory').insert({
    product_id: product.id,
    credential_data: 'replacement:test:' + Date.now(),
    status: 'Available'
  });
  if (invErr1) return NextResponse.json({ error: 'Inv1 err: ' + invErr1.message }, { status: 500 });

  // Create the used inventory item
  const { data: inv, error: invErr2 } = await supabaseAdmin.from('inventory').insert({
    product_id: product.id,
    credential_data: 'used:test:' + Date.now(),
    status: 'Used'
  }).select('id').single();
  if (invErr2 || !inv) return NextResponse.json({ error: 'Inv2 err: ' + invErr2?.message }, { status: 500 });

  // Create order item
  const { data: newOrderItem, error: oiErr } = await supabaseAdmin.from('order_items').insert({
    order_id: newOrder.id,
    inventory_id: inv.id,
    warranty_end_date: new Date(Date.now() + 86400000).toISOString(),
    current_claim_count: 0
  }).select('id').single();
  if (oiErr || !newOrderItem) return NextResponse.json({ error: 'OI err: ' + oiErr?.message }, { status: 500 });

  // Sign in to set cookies for Cypress
  const cookieStore = await cookies();
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { return cookieStore.get(name)?.value; },
        set(name: string, value: string, options: any) { cookieStore.set(name, value, options); },
        remove(name: string, options: any) { cookieStore.set(name, '', options); }
      }
    }
  );
  await supabaseAuth.auth.signInWithPassword({ email, password: 'password123' });

  return NextResponse.json({ 
    orderItemId: newOrderItem!.id,
    userId: userId
  });
}
