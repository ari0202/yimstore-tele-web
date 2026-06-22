import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { verifyAdminSession } from '@/lib/auth';
import { Plus, Archive, Trash2 } from 'lucide-react';
import EditProductModal from './EditProductModal';

export default async function ProductsPage() {
  const { data: products } = await supabaseAdmin
    .from('products')
    .select(`
      *,
      categories (name)
    `)
    .order('created_at', { ascending: false });

  const { data: categories } = await supabaseAdmin.from('categories').select('id, name');

  async function createProduct(formData: FormData) {
    'use server';
    const { admin_id } = await verifyAdminSession();
    const name = formData.get('name') as string;
    const category_id = formData.get('category_id') as string;
    const price = parseInt(formData.get('price') as string);
    const description = formData.get('description') as string;
    const warranty_days = parseInt(formData.get('warranty_days') as string);
    const max_claim_limit = parseInt(formData.get('max_claim_limit') as string);
    const thumbnail_url = formData.get('thumbnail_url') as string;

    if (thumbnail_url && !thumbnail_url.startsWith('https://')) {
      throw new Error('Thumbnail URL must start with https:// for security reasons.');
    }

    const { data: prod } = await supabaseAdmin
      .from('products')
      .insert({ name, category_id, price, description, warranty_days, max_claim_limit, thumbnail_url })
      .select('id').single();

    if (prod) {
      await supabaseAdmin.from('audit_logs').insert({
        admin_id,
        action: 'create_product',
        details: { product_id: prod.id, name }
      });
    }

    revalidatePath('/');
    revalidatePath('/admin/products');
  }

  async function updateProduct(formData: FormData) {
    'use server';
    const { admin_id } = await verifyAdminSession();
    const id = formData.get('id') as string;
    const description = formData.get('description') as string;
    const thumbnail_url = formData.get('thumbnail_url') as string;

    if (thumbnail_url && !thumbnail_url.startsWith('https://')) {
      throw new Error('Thumbnail URL must start with https:// for security reasons.');
    }

    await supabaseAdmin
      .from('products')
      .update({ description, thumbnail_url })
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

    // Gunakan RPC Atomic untuk Archive + Audit
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

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
      </div>

      {/* Create Form */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Add New Product</h2>
        <form action={createProduct} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-end">
          <div className="col-span-full md:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" name="name" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select name="category_id" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
              <option value="">Select Category</option>
              {categories?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (Rp)</label>
            <input type="number" name="price" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea name="description" rows={2} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warranty (Days)</label>
            <input type="number" name="warranty_days" defaultValue={30} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max Claim Limit</label>
            <input type="number" name="max_claim_limit" defaultValue={2} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
            <input type="url" name="thumbnail_url" placeholder="https://..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="col-span-full flex justify-end">
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
              <Plus size={20} /> Add Product
            </button>
          </div>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Name</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Category</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Price</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Warranty</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {products?.map((prod: any) => (
              <tr key={prod.id} className={`hover:bg-gray-50 ${prod.is_archived ? 'opacity-60 bg-gray-50' : ''}`}>
                <td className="px-6 py-4">
                  {prod.is_archived ? 
                    <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Archived</span> : 
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Active</span>}
                </td>
                <td className="px-6 py-4 font-medium text-gray-900">{prod.name}</td>
                <td className="px-6 py-4 text-gray-500">{prod.categories?.name}</td>
                <td className="px-6 py-4 font-mono">Rp {prod.price.toLocaleString()}</td>
                <td className="px-6 py-4 text-gray-500">{prod.warranty_days}d ({prod.max_claim_limit}x)</td>
                <td className="px-6 py-4">
                  {prod.is_archived ? (
                    <form action={restoreProduct}>
                       <input type="hidden" name="id" value={prod.id} />
                       <button type="submit" className="text-blue-600 hover:underline text-sm font-medium">Restore</button>
                    </form>
                  ) : (
                    <div className="flex items-center gap-2">
                      <EditProductModal product={prod} updateAction={updateProduct} />
                      <form action={archiveProduct}>
                        <input type="hidden" name="id" value={prod.id} />
                        <button type="submit" title="Archive Product" className="text-orange-500 hover:text-orange-700 p-2 hover:bg-orange-50 rounded-lg transition-colors">
                          <Archive size={18} />
                        </button>
                      </form>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {!products?.length && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No products found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
