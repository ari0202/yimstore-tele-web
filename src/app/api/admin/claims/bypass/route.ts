import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdminAPI } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await verifyAdminAPI();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { orderItemId } = await req.json();

    // To bypass cooldown, we simply update the latest warranty_log's claimed_at to 10 years ago
    // so that it passes the cooldown check instantly.
    const { error } = await supabaseAdmin
      .from('warranty_logs')
      .update({ claimed_at: new Date(Date.now() - 10 * 365 * 24 * 60 * 60 * 1000).toISOString() })
      .eq('order_item_id', orderItemId);

    if (error) {
      console.error('Bypass error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Cooldown bypassed' }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
