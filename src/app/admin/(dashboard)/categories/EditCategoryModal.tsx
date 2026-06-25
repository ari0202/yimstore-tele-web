'use client';

import { useState } from 'react';
import { Pencil, X, Save } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  thumbnail_url: string;
}

export default function EditCategoryModal({ category, updateAction }: { category: Category, updateAction: (formData: FormData) => Promise<void> }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setErrorMsg('');
    const formData = new FormData(e.currentTarget);
    try {
      await updateAction(formData);
      setIsOpen(false);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        title="Edit Kategori" 
        data-testid={`edit-category-${category.slug}`}
        className="text-blue-600 hover:text-blue-800 px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1.5 font-medium text-sm border border-transparent hover:border-blue-100"
      >
        <Pencil size={16} /> <span className="hidden sm:inline">Edit</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--color-surface-card)] rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-[var(--color-border-soft)]">
              <h3 className="font-semibold text-lg text-[var(--color-text-primary)]">Edit Kategori</h3>
              <button onClick={() => setIsOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <input type="hidden" name="id" value={category.id} />
              
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Name</label>
                <input type="text" name="name" required defaultValue={category.name} className="w-full px-4 py-2 border border-[var(--color-border-soft)] rounded-lg focus:ring-2 focus:ring-[var(--color-action-primary)] outline-none bg-[var(--color-surface-card)] text-[var(--color-text-primary)]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Slug</label>
                <input type="text" name="slug" required defaultValue={category.slug} className="w-full px-4 py-2 border border-[var(--color-border-soft)] rounded-lg focus:ring-2 focus:ring-[var(--color-action-primary)] outline-none bg-[var(--color-surface-card)] text-[var(--color-text-primary)]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Deskripsi</label>
                <textarea name="description" rows={3} defaultValue={category.description || ''} className="w-full px-4 py-2 border border-[var(--color-border-soft)] rounded-lg focus:ring-2 focus:ring-[var(--color-action-primary)] outline-none bg-[var(--color-surface-card)] text-[var(--color-text-primary)]" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Thumbnail URL</label>
                <input type="url" name="thumbnail_url" defaultValue={category.thumbnail_url || ''} placeholder="https://..." className="w-full px-4 py-2 border border-[var(--color-border-soft)] rounded-lg focus:ring-2 focus:ring-[var(--color-action-primary)] outline-none bg-[var(--color-surface-card)] text-[var(--color-text-primary)]" />
              </div>

              <div className="flex justify-end pt-4 gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-core)] rounded-lg">Batal</button>
                <button type="submit" disabled={isPending} className="bg-[var(--color-action-primary)] text-white px-6 py-2 rounded-lg hover:bg-[var(--color-action-hover)] flex items-center gap-2 disabled:opacity-50">
                  <Save size={18} /> {isPending ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
