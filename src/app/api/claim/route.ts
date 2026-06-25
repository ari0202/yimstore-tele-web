import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin'; 
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
  const { data: settings } = await supabaseAdmin.from('system_settings').select('value').eq('key', 'maintenance_mode').single();
  if (settings?.value === 'true') return NextResponse.json({ error: 'System is under maintenance' }, { status: 503 });

  const { orderItemId, reason, access_token } = await req.json();

  // 1. Tri-Auth Resolution (Bot, User Auth, or Access Token)
  let query = supabaseAdmin.from('order_items').select('id, orders!inner(id, user_id, access_token, users(telegram_chat_id))').eq('id', orderItemId);
  let isAuthorized = false;

  const isInternalBot = req.headers.get('authorization') === `Bearer ${process.env.BOT_INTERNAL_TOKEN}`;

  if (isInternalBot) {
    const userId = req.headers.get('x-telegram-user-id');
    query = query.eq('orders.users.telegram_chat_id', userId);
    isAuthorized = !!userId;
  } else if (access_token) {
    // Web Claim via Access Token
    query = query.eq('orders.access_token', access_token);
    isAuthorized = true; // Query ensures token matches
  } else {
    // Fallback to cookie auth
    const cookieStore = await cookies();
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieStore.get(name)?.value; },
        },
      }
    );
    const { data: { user } } = await supabaseAuth.auth.getUser();
    if (user?.id) {
      query = query.eq('orders.user_id', user.id);
      isAuthorized = true;
    }
  }

  if (!isAuthorized) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: orderItem } = await query.single();
  if (!orderItem) return NextResponse.json({ error: 'Forbidden: You do not own this order' }, { status: 403 });
  
  // 3. Execute Admin RPC
  const { data: result, error } = await supabaseAdmin.rpc('rpc_process_warranty_claim', { 
    p_order_item_id: orderItemId,
    p_reason: reason || 'User requested claim'
  });
  
  if (error) {
    console.error("RPC ERROR DETECTED:", error);
    if (error.message.includes('Claim limit reached') || error.message.includes('Warranty expired') || error.message.includes('Cooldown active')) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }
    if (error.message.includes('No replacement inventory available')) {
      return NextResponse.json({ message: 'Stock empty. Claim waitlisted.' }, { status: 202 });
    }
    return NextResponse.json({ error: error.message, details: error }, { status: 500 });
  }

  if (!result || !result.success) {
    console.error("RPC RETURNED NULL RESULT!");
    return NextResponse.json({ error: "Internal Server Error: RPC returned null" }, { status: 500 });
  }

  return NextResponse.json({ message: 'Claim successful', credential: result.new_credential });
}
