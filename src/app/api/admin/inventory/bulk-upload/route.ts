import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdminSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function POST(request: Request) {
  try {
    const { admin_id } = await verifyAdminSession();
    const body = await request.json();
    const { target_id, target_type, credentials } = body;

    if (!target_id || !target_type || !Array.isArray(credentials) || credentials.length === 0) {
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    // Panggil RPC Atomic
    const { data: inserted_count, error } = await supabaseAdmin.rpc('rpc_bulk_insert_inventory', {
      p_admin_id: admin_id,
      p_target_id: target_id,
      p_target_type: target_type,
      p_credentials_array: credentials
    });

    if (error) {
      console.error('RPC Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Revalidate the storefront cache so new stock numbers appear immediately
    revalidatePath('/', 'page');
    // Revalidate the available inventory list
    revalidatePath('/admin/inventory/available');

    return NextResponse.json({ success: true, inserted_count });
  } catch (error: any) {
    console.error('Bulk Upload Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
