'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  warranty_days: number;
  max_claim_limit: number;
  thumbnail_url?: string;
}

export default function ProductCard({ product }: { product: Product }) {
  const [imgError, setImgError] = useState(false);

  // Extract first letter for dummy logo fallback
  const firstLetter = product.name ? product.name.charAt(0).toUpperCase() : 'Y';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.4 }}
      className="group bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full"
    >
      <div className="flex items-center gap-4 mb-4">
        {/* Logo / Thumbnail */}
        <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center font-bold text-gray-400 flex-shrink-0 overflow-hidden">
          {product.thumbnail_url && !imgError ? (
            <img 
              src={product.thumbnail_url} 
              alt={product.name} 
              className="w-full h-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            <span>{firstLetter}</span>
          )}
        </div>
        
        <div>
          <h3 className="font-semibold text-slate-900 text-lg leading-tight">
            {product.name}
          </h3>
          <p className="text-sm text-slate-500 line-clamp-1">
            {product.description || 'Premium digital account'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-auto pt-4">
        <span className="text-xl font-extrabold text-slate-950">
          Rp {product.price.toLocaleString('id-ID')}
        </span>
        
        <form action="/api/checkout" method="POST">
          <input type="hidden" name="productId" value={product.id} />
          <button 
            type="submit" 
            className="bg-slate-900 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Beli Sekarang
          </button>
        </form>
      </div>
      
      <div className="mt-4 flex gap-2">
        <span className="bg-emerald-50 text-emerald-700 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded">
          Instan
        </span>
        <span className="bg-emerald-50 text-emerald-700 text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded">
          Garansi {product.warranty_days} Hari
        </span>
      </div>
    </motion.div>
  );
}
