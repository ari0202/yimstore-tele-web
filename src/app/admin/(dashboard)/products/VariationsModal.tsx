'use client';

import { useState, useEffect } from 'react';
import { Layers, X, Plus, Archive, RefreshCw, Trash2, Pencil } from 'lucide-react';
import { getVariations, createVariation, archiveVariation, updateVariation } from './actions';

export default function VariationsModal({ parentProduct }: { parentProduct: any }) {
  const [isOpen, setIsOpen] = useState(false);
  const [variations, setVariations] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchVariations = async () => {
    setLoading(true);
    try {
      const data = await getVariations(parentProduct.id);
      setVariations(data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      fetchVariations();
    }
  }, [isOpen]);

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      await createVariation(parentProduct.id, formData);
      await fetchVariations();
      (e.target as HTMLFormElement).reset();
    } catch (err) {
      alert('Gagal menambahkan variasi');
    }
    setSubmitting(false);
  };

  const handleArchive = async (variationId: string) => {
    if (!confirm('Arsip variasi ini?')) return;
    try {
      await archiveVariation(variationId);
      await fetchVariations();
    } catch (err) {
      alert('Gagal mengarsip');
    }
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData(e.currentTarget);
      await updateVariation(formData);
      await fetchVariations();
      setEditingId(null);
    } catch (err) {
      alert('Gagal mengedit variasi');
    }
    setSubmitting(false);
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        title="Manage Variations" 
        className="text-purple-600 hover:text-purple-800 p-2 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1.5 px-3 py-1.5 border border-transparent hover:border-purple-100"
      >
        <Layers size={16} /> <span className="hidden sm:inline text-sm font-medium">Variations</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Layers className="text-purple-600" /> Variasi: {parentProduct.name}
              </h2>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50">
              {/* Add New Form */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Tambah Variasi Baru</h3>
                <form onSubmit={handleAdd} className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Nama Variasi (misal: 1 Bulan, 3 Bulan)</label>
                    <input type="text" name="name" required className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Harga (Rp)</label>
                    <input type="number" name="price" required className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 mb-1">Garansi (Hari)</label>
                    <input type="number" name="warranty_days" defaultValue={30} required className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Maks Klaim Garansi</label>
                    <input type="number" name="max_claim_limit" defaultValue={2} required className="w-full px-3 py-2 text-sm border rounded-lg outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500" />
                  </div>
                  <div className="col-span-2 flex justify-end mt-2">
                    <button disabled={submitting} type="submit" className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 text-sm rounded-lg font-medium transition-colors flex items-center gap-2">
                      {submitting ? <RefreshCw className="animate-spin" size={16} /> : <Plus size={16} />} Tambah
                    </button>
                  </div>
                </form>
              </div>

              {/* List Variations */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex justify-between items-center">
                  Daftar Variasi
                  <button onClick={fetchVariations} className="text-purple-600 hover:text-purple-800 p-1"><RefreshCw size={14} className={loading ? 'animate-spin' : ''}/></button>
                </h3>
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-3 font-medium text-gray-500">Nama</th>
                        <th className="px-4 py-3 font-medium text-gray-500">Harga</th>
                        <th className="px-4 py-3 font-medium text-gray-500">Garansi</th>
                        <th className="px-4 py-3 font-medium text-gray-500 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {variations.length === 0 && (
                        <tr><td colSpan={4} className="p-4 text-center text-gray-400">Belum ada variasi.</td></tr>
                      )}
                      {variations.map(v => (
                        <tr key={v.id} className={v.is_archived ? 'opacity-50 bg-gray-50' : 'hover:bg-gray-50'}>
                          {editingId === v.id ? (
                            <td colSpan={4} className="p-0">
                              <form onSubmit={handleUpdate} className="flex gap-2 p-2 bg-purple-50 items-center">
                                <input type="hidden" name="id" value={v.id} />
                                <input type="text" name="name" defaultValue={v.name} required className="px-2 py-1 text-sm border rounded w-1/3" placeholder="Nama" />
                                <input type="number" name="price" defaultValue={v.price} required className="px-2 py-1 text-sm border rounded w-24" placeholder="Harga" />
                                <input type="number" name="warranty_days" defaultValue={v.warranty_days} required className="px-2 py-1 text-sm border rounded w-16" placeholder="Garansi" />
                                <input type="number" name="max_claim_limit" defaultValue={v.max_claim_limit} required className="px-2 py-1 text-sm border rounded w-16" placeholder="Klaim" />
                                <div className="flex gap-1 ml-auto">
                                  <button type="submit" disabled={submitting} className="text-white bg-green-500 hover:bg-green-600 px-2 py-1 rounded text-xs font-medium">Save</button>
                                  <button type="button" onClick={() => setEditingId(null)} className="text-gray-600 bg-gray-200 hover:bg-gray-300 px-2 py-1 rounded text-xs font-medium">Cancel</button>
                                </div>
                              </form>
                            </td>
                          ) : (
                            <>
                              <td className="px-4 py-3 font-medium text-gray-900">
                                {v.name} {v.is_archived && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Archived</span>}
                              </td>
                              <td className="px-4 py-3 text-gray-600">Rp {v.price.toLocaleString()}</td>
                              <td className="px-4 py-3 text-gray-600">{v.warranty_days}h ({v.max_claim_limit}x)</td>
                              <td className="px-4 py-3 text-right">
                                {!v.is_archived && (
                                  <div className="flex justify-end gap-1">
                                    <button onClick={() => setEditingId(v.id)} title="Edit Variasi" className="text-blue-500 hover:text-blue-700 p-1.5 hover:bg-blue-50 rounded-md transition-colors">
                                      <Pencil size={16} />
                                    </button>
                                    <button onClick={() => handleArchive(v.id)} title="Arsip Variasi" className="text-orange-500 hover:text-orange-700 p-1.5 hover:bg-orange-50 rounded-md transition-colors">
                                      <Archive size={16} />
                                    </button>
                                  </div>
                                )}
                              </td>
                            </>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
