'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdminSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function resetCooldown(orderItemId: string) {
  try {
    await verifyAdminSession(); // Ensure only admins can do this
    
    // Set the flag to true (single-use bypass)
    const { error } = await supabaseAdmin
      .from('order_items')
      .update({ cooldown_bypass_active: true })
      .eq('id', orderItemId);

    if (error) throw error;

    revalidatePath('/admin/orders');
    return { success: true };
  } catch (err: any) {
    console.error('Reset Cooldown Error:', err);
    return { success: false, error: err.message || 'Failed to reset cooldown' };
  }
}
