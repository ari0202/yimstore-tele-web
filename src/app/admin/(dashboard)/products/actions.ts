'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdminSession } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export async function getVariations(parentId: string) {
  await verifyAdminSession();
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, name, price, warranty_days, max_claim_limit, is_archived')
    .eq('parent_id', parentId)
    .order('created_at', { ascending: true });
    
  if (error) throw new Error(error.message);
  return data;
}

export async function createVariation(parentId: string, formData: FormData) {
  const { admin_id } = await verifyAdminSession();
  const name = formData.get('name') as string;
  const price = parseInt(formData.get('price') as string);
  const warranty_days = parseInt(formData.get('warranty_days') as string);
  const max_claim_limit = parseInt(formData.get('max_claim_limit') as string);

  // Inherit properties from parent
  const { data: parent } = await supabaseAdmin.from('products').select('category_id, thumbnail_url, description').eq('id', parentId).single();

  const { data: prod, error } = await supabaseAdmin
    .from('products')
    .insert({
      parent_id: parentId,
      name,
      price,
      warranty_days,
      max_claim_limit,
      category_id: parent?.category_id,
      thumbnail_url: parent?.thumbnail_url,
      description: parent?.description
    })
    .select('id').single();

  if (error) throw new Error(error.message);

  await supabaseAdmin.from('audit_logs').insert({
    admin_id,
    action: 'create_variation',
    details: { parent_id: parentId, variation_id: prod.id, name }
  });

  revalidatePath('/admin/products');
  revalidatePath('/');
}

export async function archiveVariation(variationId: string) {
  const { admin_id } = await verifyAdminSession();
  
  await supabaseAdmin.rpc('rpc_archive_product', {
    p_admin_id: admin_id,
    p_product_id: variationId
  });

  revalidatePath('/admin/products');
  revalidatePath('/');
}

export async function updateVariation(formData: FormData) {
  'use server';
  await verifyAdminSession();
  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  
  const price = parseInt(formData.get('price') as string);
  const warranty_days = parseInt(formData.get('warranty_days') as string);
  const max_claim_limit = parseInt(formData.get('max_claim_limit') as string);

  if (isNaN(price) || price < 0 || isNaN(warranty_days) || warranty_days < 0 || isNaN(max_claim_limit) || max_claim_limit < 0) {
    throw new Error('Nilai numerik tidak valid. Pastikan semua angka lebih dari atau sama dengan 0.');
  }

  await supabaseAdmin.from('products').update({ name, price, warranty_days, max_claim_limit }).eq('id', id);
  revalidatePath('/admin/products');
}

export async function createProductWithVariations(formData: FormData, variationsJson: string) {
  const { admin_id } = await verifyAdminSession();
  
  const name = formData.get('name') as string;
  const category_id = formData.get('category_id') as string;
  const description = formData.get('description') as string;
  const thumbnail_url = formData.get('thumbnail_url') as string;
  
  const price = parseInt(formData.get('price') as string);
  const warranty_days = parseInt(formData.get('warranty_days') as string);
  const max_claim_limit = parseInt(formData.get('max_claim_limit') as string);

  if (thumbnail_url && !thumbnail_url.startsWith('https://')) {
    throw new Error('Thumbnail URL must start with https:// for security reasons.');
  }

  // 1. Insert Product
  const { data: prod, error: prodError } = await supabaseAdmin
    .from('products')
    .insert({
      name,
      category_id,
      description,
      thumbnail_url,
      price,
      warranty_days,
      max_claim_limit
    })
    .select('id').single();

  if (prodError || !prod) {
    throw new Error(prodError?.message || 'Failed to create product');
  }

  // 2. Audit log
  await supabaseAdmin.from('audit_logs').insert({
    admin_id,
    action: 'create_product',
    details: { product_id: prod.id, name }
  });

  revalidatePath('/');
  revalidatePath('/admin/products');
}
