'use client';

import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { createProductWithVariations } from './actions';
import { useRouter } from 'next/navigation';

interface Category {
  id: string;
  name: string;
}

interface CreateProductFormProps {
  categories: Category[];
}

export default function CreateProductForm({ categories }: CreateProductFormProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsPending(true);
    setErrorMsg('');

    try {
      const formData = new FormData(e.currentTarget);
      await createProductWithVariations(formData, '[]');
      router.push('/admin/products');
    } catch (err: any) {
      setErrorMsg(err.message);
      setIsPending(false);
    }
  }

  return (
    <div className="bg-[var(--color-surface-card)] p-6 rounded-xl border border-[var(--color-border-soft)] shadow-sm">
      <div className="flex justify-between items-center mb-6 border-b border-[var(--color-border-soft)] pb-4">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Informasi Produk</h2>
      </div>

      {errorMsg && (
        <div data-testid="error-message" className="mb-6 p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
        {/* Parent Details */}
        <div className="col-span-full md:col-span-1 lg:col-span-1">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Nama Produk</label>
          <input type="text" name="name" required data-testid="product-name" className="w-full px-4 py-2 border border-[var(--color-border-soft)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] rounded-lg focus:ring-2 focus:ring-[var(--color-action-primary)] outline-none" />
        </div>
        <div className="col-span-full md:col-span-1 lg:col-span-1">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Kategori</label>
          <select name="category_id" required data-testid="product-category" className="w-full px-4 py-2 border border-[var(--color-border-soft)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] rounded-lg focus:ring-2 focus:ring-[var(--color-action-primary)] outline-none">
            <option value="">Pilih Kategori</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        
        <div className="col-span-full lg:col-span-1">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Harga (Rp)</label>
          <input type="number" name="price" required data-testid="product-price" className="w-full px-4 py-2 border border-[var(--color-border-soft)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] rounded-lg focus:ring-2 focus:ring-[var(--color-action-primary)] outline-none" />
        </div>

        <div className="col-span-full">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Deskripsi</label>
          <textarea name="description" rows={3} data-testid="product-description" className="w-full px-4 py-2 border border-[var(--color-border-soft)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] rounded-lg focus:ring-2 focus:ring-[var(--color-action-primary)] outline-none" />
        </div>

        <div className="col-span-full">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">URL Gambar (Thumbnail)</label>
          <input type="url" name="thumbnail_url" placeholder="https://..." data-testid="product-thumbnail" className="w-full px-4 py-2 border border-[var(--color-border-soft)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] rounded-lg focus:ring-2 focus:ring-[var(--color-action-primary)] outline-none" />
        </div>

        <div className="col-span-full md:col-span-1">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Garansi (Hari)</label>
          <input type="number" name="warranty_days" defaultValue={30} required data-testid="product-warranty" className="w-full px-4 py-2 border border-[var(--color-border-soft)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] rounded-lg focus:ring-2 focus:ring-[var(--color-action-primary)] outline-none" />
        </div>
        <div className="col-span-full md:col-span-1">
          <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">Batas Maksimal Klaim</label>
          <input type="number" name="max_claim_limit" defaultValue={2} required data-testid="product-max-claim" className="w-full px-4 py-2 border border-[var(--color-border-soft)] bg-[var(--color-surface-card)] text-[var(--color-text-primary)] rounded-lg focus:ring-2 focus:ring-[var(--color-action-primary)] outline-none" />
        </div>

        <div className="col-span-full flex flex-col sm:flex-row justify-end mt-6 pt-6 border-t border-[var(--color-border-soft)] gap-3">
          <button type="button" data-testid="cancel-button" onClick={() => router.push('/admin/products')} className="w-full sm:w-auto px-6 py-2.5 text-[var(--color-text-secondary)] bg-[var(--color-surface-core)] hover:bg-[var(--color-border-soft)] rounded-lg font-medium transition-colors">
            Batal
          </button>
          <button type="submit" data-testid="submit-button" disabled={isPending} className="w-full sm:w-auto bg-[var(--color-action-primary)] text-[var(--color-surface-card)] px-8 py-2.5 rounded-lg hover:bg-[var(--color-action-hover)] flex items-center justify-center gap-2 font-medium disabled:opacity-50 transition-colors shadow-sm">
            {isPending ? 'Menyimpan...' : <><Plus size={20} /> Simpan Produk</>}
          </button>
        </div>
      </form>
    </div>
  );
}
