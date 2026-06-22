import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdminSession } from '@/lib/auth';

export async function POST(request: Request) {
  try {
    const { admin_id } = await verifyAdminSession();
    const body = await request.json();
    const { product_id, credentials } = body;

    if (!product_id || !Array.isArray(credentials) || credentials.length === 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Panggil RPC Atomic
    const { data: inserted_count, error } = await supabaseAdmin.rpc('rpc_bulk_insert_inventory', {
      p_admin_id: admin_id,
      p_product_id: product_id,
      p_credentials_array: credentials
    });

    if (error) {
      console.error('RPC Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, inserted_count });
  } catch (error: any) {
    console.error('Bulk Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
