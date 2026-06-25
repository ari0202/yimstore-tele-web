'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdminSession } from '@/lib/auth';
import { revalidatePath, unstable_noStore as noStore } from 'next/cache';

export async function getAvailableInventory() {
  noStore();
  await verifyAdminSession();
  const { data } = await supabaseAdmin
    .from('inventory')
    .select('id, product_id, category_id, credential_data, products(name, parent_id, is_sync_stock), categories(name)')
    .eq('status', 'Available')
    .order('created_at', { ascending: false });
  return data || [];
}

export async function deleteInventoryAction(formData: FormData) {
  await verifyAdminSession();
  const id = formData.get('id');
  if (!id) return { error: 'ID required' };

  await supabaseAdmin.from('inventory').delete().eq('id', id);
  revalidatePath('/admin/inventory/available');
  return { success: true };
}

export async function bulkDeleteInventoryAction(ids: string[]) {
  await verifyAdminSession();
  if (!ids || ids.length === 0) return { error: 'IDs required' };

  await supabaseAdmin.from('inventory').delete().in('id', ids);
  revalidatePath('/admin/inventory/available');
  return { success: true };
}

export async function updateInventoryQuantityAction(productId: string | null, categoryId: string | null, credentialData: string, newQuantity: number) {
  await verifyAdminSession();
  
  if (newQuantity < 0) return { error: 'Invalid quantity' };

  let query = supabaseAdmin
    .from('inventory')
    .select('id')
    .eq('credential_data', credentialData)
    .eq('status', 'Available');

  if (productId) {
    query = query.eq('product_id', productId);
  } else if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  // Fetch current available stock for this credential
  const { data: currentStock, error } = await query;

  if (error) {
    console.error('Error fetching current stock:', error);
    return { error: 'Failed to fetch current stock' };
  }

  const currentCount = currentStock.length;

  if (newQuantity > currentCount) {
    // Need to insert more
    const diff = newQuantity - currentCount;
    const inserts = Array(diff).fill({
      product_id: productId || null,
      category_id: categoryId || null,
      credential_data: credentialData,
      status: 'Available'
    });
    
    const { error: insertError } = await supabaseAdmin.from('inventory').insert(inserts);
    if (insertError) return { error: 'Failed to add stock' };
  } else if (newQuantity < currentCount) {
    // Need to delete excess
    const diff = currentCount - newQuantity;
    // Slice exactly `diff` IDs to delete
    const idsToDelete = currentStock.slice(0, diff).map(s => s.id);
    
    const { error: deleteError } = await supabaseAdmin.from('inventory').delete().in('id', idsToDelete);
    if (deleteError) return { error: 'Failed to remove excess stock' };
  }

  revalidatePath('/admin/inventory/available');
  return { success: true };
}
