'use client';

import { useState, useEffect } from 'react';
import { RefreshCw, Trash2, ChevronDown, ChevronRight, Package, Edit2, Check, X, Loader2 } from 'lucide-react';
import { getAvailableInventory, deleteInventoryAction, bulkDeleteInventoryAction, updateInventoryQuantityAction } from '../actions';

export default function AvailableInventoryPage() {
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  
  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number>(0);
  const [savingRow, setSavingRow] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoadingInventory(true);
    try {
      const data = await getAvailableInventory();
      setInventoryList(data);
    } catch (e) {
      console.error(e);
    }
    setLoadingInventory(false);
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const toggleGroup = (productName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [productName]: !prev[productName]
    }));
  };

  const handleStartEdit = (rowId: string, currentQty: number) => {
    setEditingRow(rowId);
    setEditQty(currentQty);
  };

  const handleSaveEdit = async (productId: string | null, categoryId: string | null, credentialData: string, rowId: string) => {
    setSavingRow(rowId);
    try {
      await updateInventoryQuantityAction(productId, categoryId, credentialData, editQty);
      await fetchInventory();
    } catch (e) {
      console.error('Failed to update quantity', e);
      alert('Gagal mengupdate kuantitas');
    }
    setSavingRow(null);
    setEditingRow(null);
  };

  const handleTakeOne = async (cred: string, subItems: any[]) => {
    try {
      await navigator.clipboard.writeText(cred);
      alert('Tersalin ke clipboard!');
    } catch (err) {
      console.error('Failed to copy', err);
      alert('Gagal menyalin ke clipboard.');
    }
    
    // Delete precisely 1 item ID
    const formData = new FormData();
    formData.append('id', subItems[0].id);
    await deleteInventoryAction(formData);
    fetchInventory();
  };

  const handleDeleteAll = async (subItems: any[]) => {
    if (!confirm(`Yakin ingin menghapus semua ${subItems.length} stok ini?`)) return;
    const ids = subItems.map(item => item.id);
    await bulkDeleteInventoryAction(ids);
    fetchInventory();
  };

  // Group inventory by product or category
  const groupedInventory = inventoryList.reduce((acc: Record<string, any[]>, item: any) => {
    let pName = 'Unknown';
    if (item.product_id && item.products) {
      pName = item.products.name;
    } else if (item.category_id && item.categories) {
      pName = item.categories.name;
    }
    if (!acc[pName]) acc[pName] = [];
    acc[pName].push(item);
    return acc;
  }, {});

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Available Inventory</h1>
        <p className="text-[var(--color-text-muted)] mt-2">Daftar stok kredensial yang siap dijual, dikelompokkan berdasarkan produk dan kredensial identik.</p>
      </div>

      <div className="bg-[var(--color-surface-card)] p-6 rounded-xl border border-[var(--color-border-soft)] shadow-sm space-y-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-[var(--color-text-primary)]">Stock Overview</h2>
          <button data-testid="refresh-inventory-button" onClick={fetchInventory} className="text-[var(--color-surface-card)] bg-[var(--color-action-primary)] hover:bg-[var(--color-action-hover)] px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors shadow-sm">
            <RefreshCw size={16} className={loadingInventory ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
        
        <div className="space-y-4">
          {Object.keys(groupedInventory).length === 0 && !loadingInventory && (
            <div className="p-8 text-center border border-dashed border-[var(--color-border-soft)] rounded-xl text-[var(--color-text-muted)]">
              No available inventory found.
            </div>
          )}

          {Object.entries(groupedInventory).map(([productName, items]) => {
            const isExpanded = !!expandedGroups[productName];
            const isCategory = !!(items as any[])[0]?.category_id;
            const isParent = isCategory || !(items as any[])[0]?.products?.parent_id;
            const isSyncStockEnabled = !!(items as any[])[0]?.products?.is_sync_stock;
            
            // Sub-group identical credentials within the product
            const groupedCreds = items.reduce((acc: Record<string, any[]>, item: any) => {
              const cred = item.credential_data;
              if (!acc[cred]) acc[cred] = [];
              acc[cred].push(item);
              return acc;
            }, {});
            
            return (
              <div key={productName} className="border border-[var(--color-border-soft)] rounded-xl overflow-hidden bg-[var(--color-surface-core)] transition-colors">
                <button 
                  data-testid="expand-group-button"
                  onClick={() => toggleGroup(productName)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-[var(--color-surface-bg)] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-[var(--color-surface-card)] rounded-lg border border-[var(--color-border-soft)] text-[var(--color-action-primary)]">
                      <Package size={20} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-[var(--color-text-primary)] text-lg">{productName}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-[var(--color-text-muted)] font-medium">Stock: {items.length}</span>
                        <span className="text-gray-300">•</span>
                        {isCategory ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">Category (Shared)</span>
                        ) : isParent ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">Shared (Parent)</span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">Isolated (Variation)</span>
                        )}
                        
                        {isSyncStockEnabled && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800 border border-orange-200" title="Stok spesifik ini sedang diabaikan karena produk disetel untuk menggunakan stok Kategori.">
                            ⚠️ Syncing Category Stock
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-[var(--color-text-muted)]">
                    {isExpanded ? <ChevronDown size={24} /> : <ChevronRight size={24} />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="bg-[var(--color-surface-card)]">
                    <table className="w-full text-left text-sm">
                      <thead className="hidden md:table-header-group bg-[var(--color-surface-bg)] border-b border-[var(--color-border-soft)]">
                        <tr>
                          <th className="px-6 py-3 font-medium text-[var(--color-text-muted)] w-[50%]">Credential Data</th>
                          <th className="px-6 py-3 font-medium text-[var(--color-text-muted)] text-center w-[20%]">Qty</th>
                          <th className="px-6 py-3 font-medium text-[var(--color-text-muted)] text-right w-[30%]">Action</th>
                        </tr>
                      </thead>
                      <tbody className="block md:table-row-group divide-y divide-[var(--color-border-soft)]">
                        {Object.entries(groupedCreds).map(([cred, subItems]: [string, any]) => {
                          const rowId = subItems[0].id;
                          const isEditing = editingRow === rowId;
                          const currentQty = subItems.length;
                          
                          return (
                          <tr key={rowId} data-testid={`inventory-row-${rowId}`} className={`block md:table-row transition-colors ${isEditing ? 'bg-[var(--color-surface-bg)]' : 'hover:bg-[var(--color-surface-core)]'}`}>
                            
                            {/* Kredensial */}
                            <td className="block md:table-cell px-4 md:px-6 py-4 md:py-3">
                              <div className="flex flex-col md:block">
                                <span className="md:hidden text-[10px] uppercase tracking-wider font-bold text-[var(--color-action-primary)] mb-1.5 opacity-80">Credential Data</span>
                                <span className="text-[var(--color-text-secondary)] font-mono break-all md:truncate md:max-w-xl">
                                  {cred}
                                </span>
                              </div>
                            </td>
                            
                            {/* Kuantitas */}
                            <td className="block md:table-cell px-4 md:px-6 py-3 border-t border-[var(--color-border-soft)] md:border-0 bg-[#f8fdff] md:bg-transparent">
                              <div className="flex items-center justify-between md:justify-center">
                                <span className="md:hidden text-xs font-semibold text-[var(--color-text-secondary)]">Stock Quantity</span>
                                {isEditing ? (
                                  <input 
                                    type="number" 
                                    min="0"
                                    value={editQty}
                                    onChange={(e) => setEditQty(parseInt(e.target.value) || 0)}
                                    className="w-20 px-2 py-1 text-sm border border-[var(--color-action-primary)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--color-action-hover)] bg-white text-center font-bold"
                                    autoFocus
                                  />
                                ) : (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-surface-bg)] text-[var(--color-action-primary)] border border-[var(--color-border-soft)] shadow-sm">
                                    {currentQty}
                                  </span>
                                )}
                              </div>
                            </td>
                            
                            {/* Aksi */}
                            <td className="block md:table-cell px-4 md:px-6 py-3 border-t border-[var(--color-border-soft)] md:border-0">
                              <div className="flex items-center justify-end gap-2 w-full">
                                {isEditing ? (
                                  <>
                                    <button 
                                      onClick={() => handleSaveEdit(subItems[0].product_id, subItems[0].category_id, cred, rowId)}
                                      disabled={savingRow === rowId}
                                      className="text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded-md transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1 text-xs font-medium"
                                    >
                                      {savingRow === rowId ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Simpan
                                    </button>
                                    <button 
                                      onClick={() => setEditingRow(null)}
                                      disabled={savingRow === rowId}
                                      className="text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-md transition-colors flex items-center gap-1 text-xs font-medium border border-red-100"
                                    >
                                      <X size={14} /> Batal
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      onClick={() => handleStartEdit(rowId, currentQty)}
                                      className="text-[var(--color-action-primary)] hover:text-white p-2 hover:bg-[var(--color-action-primary)] rounded-md transition-colors border border-transparent hover:border-[var(--color-action-hover)] bg-blue-50/50 md:bg-transparent"
                                      title="Edit Kuantitas"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    <button 
                                      onClick={() => handleTakeOne(cred, subItems)}
                                      className="text-xs font-medium px-3 py-2 bg-[var(--color-surface-bg)] hover:bg-[var(--color-border-soft)] text-[var(--color-action-primary)] rounded-md border border-[var(--color-border-soft)] transition-colors shadow-sm"
                                    >
                                      Ambil 1 & Copy
                                    </button>
                                    <button 
                                      onClick={() => handleDeleteAll(subItems)}
                                      title="Hapus Semua Identik" 
                                      className="text-red-500 hover:text-white p-2 hover:bg-red-500 rounded-md transition-colors border border-transparent hover:border-red-600 bg-red-50/50 md:bg-transparent"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                            
                          </tr>
                        )})}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
