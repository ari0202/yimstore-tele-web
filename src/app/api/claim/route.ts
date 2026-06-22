import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin'; 
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { data: settings } = await supabaseAdmin.from('system_settings').select('value').eq('key', 'maintenance_mode').single();
  if (settings?.value === 'true') return NextResponse.json({ error: 'System is under maintenance' }, { status: 503 });

  const { orderItemId } = await req.json();

  // 1. Dual Auth Resolution
  let userId: string | null = null;
  const isInternalBot = req.headers.get('authorization') === `Bearer ${process.env.BOT_INTERNAL_TOKEN}`;

  if (isInternalBot) {
    userId = req.headers.get('x-telegram-user-id');
  } else {
    const supabaseAuth = createRouteHandlerClient({ cookies });
    const { data: { user } } = await supabaseAuth.auth.getUser();
    userId = user?.id || null;
  }

  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // 2. IDOR Prevention (Join table `users` untuk memvalidasi telegram_chat_id guna menghindari Postgres casting error)
  let query = supabaseAdmin.from('order_items').select('id, orders!inner(user_id, users!inner(telegram_chat_id))').eq('id', orderItemId);

  if (isInternalBot) {
    query = query.eq('orders.users.telegram_chat_id', userId);
  } else {
    query = query.eq('orders.user_id', userId);
  }

  const { data: orderItem } = await query.single();
  if (!orderItem) return NextResponse.json({ error: 'Forbidden: You do not own this order' }, { status: 403 });
  
  // 3. Execute Admin RPC
  const { data: result, error } = await supabaseAdmin.rpc('process_warranty_claim', { p_order_item_id: orderItemId });
  
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (result.status === 'LIMIT_EXCEEDED') return NextResponse.json({ error: 'Claim limit reached' }, { status: 403 });
  if (result.status === 'COOLDOWN_ACTIVE') return NextResponse.json({ error: 'Cooldown is active' }, { status: 429 });
  if (result.status === 'WAITLISTED') return NextResponse.json({ message: 'Stock empty. Claim waitlisted.' }, { status: 202 });
  
  return NextResponse.json({ message: 'Claim successful', credential: result.new_credential });
}
