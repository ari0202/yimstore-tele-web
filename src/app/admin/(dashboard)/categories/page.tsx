import { supabaseAdmin } from '@/lib/supabase/admin';
import { revalidatePath } from 'next/cache';
import { verifyAdminSession } from '@/lib/auth';
import { Plus } from 'lucide-react';
import DeleteActionButton from '../components/DeleteActionButton';
import EditCategoryModal from './EditCategoryModal';

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
    const thumbnail_url = formData.get('thumbnail_url') as string;

    if (thumbnail_url && !thumbnail_url.startsWith('https://')) {
      throw new Error('Thumbnail URL must start with https://');
    }

    const { data: cat } = await supabaseAdmin
      .from('categories')
      .insert({ name, slug, description, thumbnail_url })
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

    const { error } = await supabaseAdmin.from('categories').delete().eq('id', id);

    if (error) {
      if (error.code === '23503') {
        return { error: "Tidak dapat menghapus kategori ini karena ada produk di dalamnya yang memiliki riwayat pesanan." };
      }
      return { error: error.message };
    }

    await supabaseAdmin.from('audit_logs').insert({
      admin_id,
      action: 'delete_category',
      details: { category_id: id }
    });

    revalidatePath('/admin/categories');
  }

  async function updateCategory(formData: FormData) {
    'use server';
    const { admin_id } = await verifyAdminSession();
    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const slug = formData.get('slug') as string;
    const description = formData.get('description') as string;
    const thumbnail_url = formData.get('thumbnail_url') as string;

    if (thumbnail_url && !thumbnail_url.startsWith('https://')) {
      throw new Error('Thumbnail URL must start with https://');
    }

    const { error } = await supabaseAdmin.from('categories').update({ name, slug, description, thumbnail_url }).eq('id', id);
    if (error) throw new Error(error.message);

    await supabaseAdmin.from('audit_logs').insert({
      admin_id,
      action: 'update_category',
      details: { category_id: id, name, slug }
    });

    revalidatePath('/admin/categories');
    revalidatePath('/');
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Categories</h1>
      </div>

      {/* Create Form */}
      <div className="bg-[var(--color-surface-card)] p-6 rounded-xl border border-[var(--color-border-soft)] shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Add New Category</h2>
        <form action={createCategory} className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Name</label>
            <input type="text" name="name" required data-testid="category-name-input" className="w-full px-4 py-2 border border-[var(--color-border-soft)] rounded-lg focus:ring-2 focus:ring-[var(--color-action-primary)] text-[var(--color-text-primary)] outline-none bg-[var(--color-surface-card)]" />
          </div>
          <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Slug</label>
            <input type="text" name="slug" required data-testid="category-slug-input" className="w-full px-4 py-2 border border-[var(--color-border-soft)] rounded-lg focus:ring-2 focus:ring-[var(--color-action-primary)] text-[var(--color-text-primary)] outline-none bg-[var(--color-surface-card)]" />
          </div>
          <div className="flex-1 w-full md:w-2/3">
            <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Thumbnail URL</label>
            <input type="url" name="thumbnail_url" placeholder="https://..." data-testid="category-thumbnail-input" className="w-full px-4 py-2 border border-[var(--color-border-soft)] rounded-lg focus:ring-2 focus:ring-[var(--color-action-primary)] text-[var(--color-text-primary)] outline-none bg-[var(--color-surface-card)]" />
          </div>
          <button type="submit" data-testid="add-category-button" className="bg-[var(--color-action-primary)] text-[var(--color-surface-card)] px-6 py-2 rounded-lg hover:bg-[var(--color-action-hover)] transition-colors flex items-center justify-center gap-2 w-full md:w-auto">
            <Plus size={20} /> Add
          </button>
        </form>
      </div>

      {/* List */}
      <div className="bg-[var(--color-surface-card)] rounded-xl border border-[var(--color-border-soft)] shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[var(--color-surface-core)] border-b border-[var(--color-border-soft)]">
              <th className="px-3 sm:px-6 py-3 text-sm font-medium text-[var(--color-text-muted)] w-12 sm:w-16">Icon</th>
              <th className="px-3 sm:px-6 py-3 text-sm font-medium text-[var(--color-text-muted)]">Name</th>
              <th className="px-3 sm:px-6 py-3 text-sm font-medium text-[var(--color-text-muted)] hidden sm:table-cell">Slug</th>
              <th className="px-3 sm:px-6 py-3 text-sm font-medium text-[var(--color-text-muted)] text-right w-20 sm:w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border-soft)]">
            {categories?.map((cat: any) => (
              <tr key={cat.id} data-testid="category-row" className="hover:bg-[var(--color-surface-core)] transition-colors">
                <td className="px-3 sm:px-6 py-4">
                  {cat.thumbnail_url ? (
                    <img src={cat.thumbnail_url} alt={cat.name} className="w-8 h-8 rounded bg-white object-cover border" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-400 text-xs font-bold">{cat.name.charAt(0).toUpperCase()}</div>
                  )}
                </td>
                <td className="px-3 sm:px-6 py-4 font-medium text-[var(--color-text-primary)]" data-testid="category-name">{cat.name}</td>
                <td className="px-3 sm:px-6 py-4 text-[var(--color-text-secondary)] hidden sm:table-cell" data-testid="category-slug">{cat.slug}</td>
                <td className="px-3 sm:px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <EditCategoryModal category={cat} updateAction={updateCategory} />
                    <div className="inline-block" data-testid={`delete-category-${cat.slug}`}>
                      <DeleteActionButton id={cat.id} action={deleteCategory} iconOnly={true} title="Hapus Kategori" />
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {!categories?.length && (
              <tr>
                <td colSpan={3} data-testid="empty-categories" className="px-6 py-8 text-center text-[var(--color-text-muted)]">No categories found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
