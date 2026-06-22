'use client';

import { useState } from 'react';
import { Pencil, X, Save } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  thumbnail_url: string;
}

export default function EditProductModal({ product, updateAction }: { product: Product, updateAction: (formData: FormData) => Promise<void> }) {
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
        className="text-blue-500 hover:text-blue-700 p-2 hover:bg-blue-50 rounded-lg transition-colors inline-flex"
      >
        <Pencil size={18} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-semibold text-lg text-gray-900">Edit Product</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <input type="hidden" name="id" value={product.id} />
              
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-100">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name <span className="text-gray-400 text-xs font-normal ml-2">(Locked for integrity)</span></label>
                <input type="text" value={product.name} disabled className="w-full px-4 py-2 border rounded-lg bg-gray-50 text-gray-500 outline-none cursor-not-allowed" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" defaultValue={product.description || ''} rows={3} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Thumbnail URL</label>
                <input type="url" name="thumbnail_url" defaultValue={product.thumbnail_url || ''} placeholder="https://..." className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
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
