'use client';

import { useState } from 'react';
import { Eye, X } from 'lucide-react';

interface ProductDetailModalProps {
  product: any;
}

export default function ProductDetailModal({ product }: ProductDetailModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        title="View Details" 
        className="text-gray-500 hover:text-gray-700 px-3 py-1.5 hover:bg-gray-100 rounded-lg transition-colors inline-flex items-center gap-1.5 font-medium text-sm border border-transparent hover:border-gray-200"
      >
        <Eye size={16} /> <span className="hidden sm:inline">Detail</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <h3 className="font-semibold text-lg text-gray-900">Product Details</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Name</span>
                <p className="text-gray-900 font-medium">{product.name}</p>
              </div>
              
              <div>
                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Category</span>
                <p className="text-gray-900">{product.category_name}</p>
              </div>
              
              <div>
                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Pricing</span>
                <p className="text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded-md border border-gray-100 inline-block">
                  {product.variation_count > 0 ? (
                    product.min_variation_price === product.max_variation_price 
                      ? `Rp ${Number(product.min_variation_price).toLocaleString()}`
                      : `Rp ${Number(product.min_variation_price).toLocaleString()} - Rp ${Number(product.max_variation_price).toLocaleString()}`
                  ) : (
                    `Rp ${Number(product.base_price).toLocaleString()}`
                  )}
                </p>
              </div>

              <div>
                <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Warranty & Claims</span>
                <p className="text-gray-900">
                  {product.variation_count > 0 ? (
                    <span className="text-blue-600 font-medium">{product.variation_count} Variations Configuration</span>
                  ) : (
                    `${product.warranty_days} Days (Max ${product.max_claim_limit}x Claims)`
                  )}
                </p>
              </div>

              <div className="flex justify-between pt-2 border-t border-gray-100 mt-4">
                <div>
                  <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Status</span>
                  {product.is_archived ? 
                    <span className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">Archived</span> : 
                    <span className="px-2.5 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full">Active</span>}
                </div>
                <div className="text-right">
                  <span className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Stock</span>
                  <p className="font-semibold text-lg text-emerald-600">{product.total_stock}</p>
                </div>
              </div>

              <div className="flex justify-end pt-4 gap-3">
                <button type="button" onClick={() => setIsOpen(false)} className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium rounded-lg transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
