import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { verifyAdminSession } from '@/lib/auth';
import { Archive, Trash2 } from 'lucide-react';
import EditProductModal from './EditProductModal';
import ProductDetailModal from './ProductDetailModal';
import DeleteActionButton from '../components/DeleteActionButton';

export default async function ProductsPage() {
  // Use the optimized view instead of products table
  const { data: products } = await supabaseAdmin
    .from('admin_product_summary_view')
    .select('*')
    .order('created_at', { ascending: false });

  const { data: categories } = await supabaseAdmin.from('categories').select('id, name');

  async function updateProduct(formData: FormData) {
    'use server';
    const { admin_id } = await verifyAdminSession();
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;
    const thumbnail_url = formData.get('thumbnail_url') as string;
    const is_sync_stock = formData.get('is_sync_stock') === 'on';
    const category_id = formData.get('category_id') as string;
    const price = parseInt(formData.get('price') as string);
    const warranty_days = parseInt(formData.get('warranty_days') as string);
    const max_claim_limit = parseInt(formData.get('max_claim_limit') as string);

    if (isNaN(price) || price < 0 || isNaN(warranty_days) || warranty_days < 0 || isNaN(max_claim_limit) || max_claim_limit < 0) {
      throw new Error('Nilai numerik tidak valid.');
    }

    if (thumbnail_url && !thumbnail_url.startsWith('https://')) {
      throw new Error('Thumbnail URL must start with https:// for security reasons.');
    }

    await supabaseAdmin
      .from('products')
      .update({ name, description, thumbnail_url, is_sync_stock, category_id, price, warranty_days, max_claim_limit })
      .eq('id', id);

    await supabaseAdmin.from('audit_logs').insert({
      admin_id,
      action: 'update_product',
      details: { product_id: id }
    });

    revalidatePath('/');
    revalidatePath('/admin/products');
  }

  async function archiveProduct(formData: FormData) {
    'use server';
    const { admin_id } = await verifyAdminSession();
    const id = formData.get('id') as string;

    await supabaseAdmin.rpc('rpc_archive_product', {
      p_admin_id: admin_id,
      p_product_id: id
    });

    revalidatePath('/admin/products');
  }

  async function restoreProduct(formData: FormData) {
    'use server';
    const { admin_id } = await verifyAdminSession();
    const id = formData.get('id') as string;

    await supabaseAdmin.from('products').update({ is_archived: false }).eq('id', id);

    await supabaseAdmin.from('audit_logs').insert({
      admin_id,
      action: 'restore_product',
      details: { product_id: id }
    });

    revalidatePath('/admin/products');
  }

  async function deleteProductPermanently(formData: FormData) {
    'use server';
    const { admin_id } = await verifyAdminSession();
    const id = formData.get('id') as string;

    const { error } = await supabaseAdmin.rpc('rpc_delete_product_permanently', { p_product_id: id });
    if (error) {
      if (error.code === '23503') {
        return { error: "Tidak dapat menghapus permanen karena produk ini atau variasinya memiliki riwayat transaksi/pesanan. Silakan gunakan fitur Arsip." };
      }
      return { error: error.message };
    }
    revalidatePath('/admin/products');
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Products</h1>
      </div>

      {/* List */}
      <div className="bg-[var(--color-surface-card)] rounded-xl border border-[var(--color-border-soft)] shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr className="bg-[var(--color-surface-core)] border-b border-[var(--color-border-soft)]">
              <th className="px-6 py-3 text-sm font-medium text-[var(--color-text-muted)]">Status</th>
              <th className="px-6 py-3 text-sm font-medium text-[var(--color-text-muted)]">Name</th>
              <th className="px-6 py-3 text-sm font-medium text-[var(--color-text-muted)]">Category</th>
              <th className="px-6 py-3 text-sm font-medium text-[var(--color-text-muted)]">Stock</th>
              <th className="px-6 py-3 text-sm font-medium text-[var(--color-text-muted)]">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-soft)]">
            {products?.map((prod: any) => (
              <tr key={prod.id} data-testid="product-row" className={`hover:bg-[var(--color-surface-core)] transition-colors ${prod.is_archived ? 'opacity-60 bg-[var(--color-surface-core)]' : ''}`}>
                <td className="px-6 py-4">
                  {prod.is_archived ? 
                    <span data-testid={`status-${prod.id}`} className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Archived</span> : 
                    <span data-testid={`status-${prod.id}`} className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Active</span>}
                </td>
                <td className="px-6 py-4 font-medium text-[var(--color-text-primary)]" data-testid={`product-name-${prod.id}`}>{prod.name}</td>
                <td className="px-6 py-4 font-medium text-[var(--color-text-secondary)]">{prod.category_name || '-'}</td>

                <td className="px-6 py-4 font-medium text-[var(--color-text-secondary)]">
                  {prod.total_stock > 0 ? (
                    <span data-testid={`stock-${prod.id}`} className="text-emerald-600">{prod.total_stock}</span>
                  ) : (
                    <span data-testid={`stock-${prod.id}`} className="text-red-500">0</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  {prod.is_archived ? (
                    <form action={restoreProduct}>
                       <input type="hidden" name="id" value={prod.id} />
                       <button type="submit" data-testid={`restore-product-${prod.id}`} className="text-[var(--color-action-primary)] hover:underline text-sm font-medium">Restore</button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div data-testid={`view-product-${prod.id}`}><ProductDetailModal product={prod} /></div>
                      <div data-testid={`edit-product-${prod.id}`}><EditProductModal product={prod} categories={categories || []} updateAction={updateProduct} /></div>
                      <form action={archiveProduct}>
                        <input type="hidden" name="id" value={prod.id} />
                        <button type="submit" data-testid={`archive-product-${prod.id}`} title="Arsip Produk" className="text-orange-500 hover:text-orange-700 px-3 py-1.5 hover:bg-orange-50 rounded-lg transition-colors inline-flex items-center gap-1.5 font-medium text-sm border border-transparent hover:border-orange-100">
                          <Archive size={16} /> <span className="hidden sm:inline">Arsip</span>
                        </button>
                      </form>
                      <div data-testid={`delete-product-${prod.id}`}>
                        <DeleteActionButton id={prod.id} action={deleteProductPermanently} title="Hapus" />
                      </div>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!products?.length && (
              <tr>
                <td colSpan={4} data-testid="empty-products" className="px-6 py-8 text-center text-[var(--color-text-muted)]">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
