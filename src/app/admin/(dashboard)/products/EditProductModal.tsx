'use client';

import { useState } from 'react';
import { Pencil, X, Save } from 'lucide-react';

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string;
  is_sync_stock: boolean;
  category_id?: string;
  base_price?: number;
  warranty_days?: number;
  max_claim_limit?: number;
  cooldown_value?: number;
}

export default function EditProductModal({ product, categories, updateAction }: { product: Product, categories: Category[], updateAction: (formData: FormData) => Promise<void> }) {
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
        title="Edit Product" 
        className="text-blue-600 hover:text-blue-800 px-3 py-1.5 hover:bg-blue-50 rounded-lg transition-colors inline-flex items-center gap-1.5 font-medium text-sm border border-transparent hover:border-blue-100"
      >
        <Pencil size={16} /> <span className="hidden sm:inline">Edit</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-[var(--color-surface-card)] rounded-xl shadow-xl w-full max-w-md overflow-hidden transition-colors">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-semibold text-lg text-[var(--color-text-primary)]">Edit Product</h3>
              <button onClick={() => setIsOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto">
              <input type="hidden" name="id" value={product.id} />
              
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input type="text" name="name" defaultValue={product.name} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kategori</label>
                <select name="category_id" defaultValue={product.category_id || ''} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none">
                  <option value="">Pilih Kategori</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Harga (Rp)</label>
                  <input type="number" name="price" defaultValue={product.base_price || 0} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Garansi (Hari)</label>
                  <input type="number" name="warranty_days" defaultValue={product.warranty_days || 30} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batas Maksimal Klaim</label>
                  <input type="number" name="max_claim_limit" defaultValue={product.max_claim_limit || 2} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Jeda Antar Klaim (Hari)</label>
                  <input type="number" name="cooldown_value" defaultValue={product.cooldown_value || 0} min={0} required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" defaultValue={product.description || ''} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                <input type="url" name="thumbnail_url" defaultValue={product.thumbnail_url || ''} placeholder="https://..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input 
                  type="checkbox" 
                  id={`sync_stock_${product.id}`} 
                  name="is_sync_stock" 
                  defaultChecked={product.is_sync_stock}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor={`sync_stock_${product.id}`} className="text-sm font-medium text-gray-700">
                  Gunakan Stok Kategori (Sync Category Stock)
                </label>
              </div>

              <div className="flex justify-end pt-4 gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Cancel</button>
                <button type="submit" disabled={isPending} className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50">
                  <Save size={18} /> {isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
