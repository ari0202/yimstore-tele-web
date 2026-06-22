import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { verifyAdminSession } from '@/lib/auth';
import { Plus, Trash2, Edit } from 'lucide-react';

export default async function CategoriesPage() {
  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('created_at', { ascending: false });

  async function createCategory(formData: FormData) {
    'use server';
    const { admin_id } = await verifyAdminSession();
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string;

    const { data: cat } = await supabaseAdmin
      .from('categories')
      .insert({ name, slug, description })
      .select('id').single();

    if (cat) {
      await supabaseAdmin.from('audit_logs').insert({
        admin_id,
        action: 'create_category',
        details: { category_id: cat.id, name, slug }
      });
    }

    revalidatePath('/admin/categories');
  }

  async function deleteCategory(formData: FormData) {
    'use server';
    const { admin_id } = await verifyAdminSession();
    const id = formData.get('id') as string;

    await supabaseAdmin.from('categories').delete().eq('id', id);

    await supabaseAdmin.from('audit_logs').insert({
      admin_id,
      action: 'delete_category',
      details: { category_id: id }
    });

    revalidatePath('/admin/categories');
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
      </div>

      {/* Create Form */}
      <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Add New Category</h2>
        <form action={createCategory} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" name="name" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug</label>
            <input type="text" name="slug" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
          </div>
          <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2">
            <Plus size={20} /> Add
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Name</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Slug</th>
              <th className="px-6 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {categories?.map((cat: any) => (
              <tr key={cat.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-medium text-gray-900">{cat.name}</td>
                <td className="px-6 py-4 text-gray-500">{cat.slug}</td>
                <td className="px-6 py-4">
                  <form action={deleteCategory}>
                    <input type="hidden" name="id" value={cat.id} />
                    <button type="submit" className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </form>
                </td>
              </tr>
            ))}
            {!categories?.length && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-gray-500">No categories found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
