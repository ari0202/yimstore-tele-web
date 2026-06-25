'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  warranty_days: number;
  max_claim_limit: number;
  thumbnail_url?: string;
  stock?: number;
  variations?: any[];
}

function getValidImageUrl(url?: string) {
  if (!url) return '';
  
  // Try matching /file/d/ID format
  const gdriveRegex1 = /drive\.google\.com\/file\/d\/([^\/]+)/;
  const match1 = url.match(gdriveRegex1);
  if (match1 && match1[1]) {
    return `https://lh3.googleusercontent.com/d/${match1[1]}=w1000`;
  }

  // Try matching ?id=ID format
  const gdriveRegex2 = /drive\.google\.com\/(?:open|uc)\?.*?id=([^&]+)/;
  const match2 = url.match(gdriveRegex2);
  if (match2 && match2[1]) {
    return `https://lh3.googleusercontent.com/d/${match2[1]}=w1000`;
  }

  return url;
}

export default function ProductCard({ product }: { product: Product }) {
  const [imgError, setImgError] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const hasVariations = product.variations && product.variations.length > 0;
  const [selectedVariationId, setSelectedVariationId] = useState(hasVariations ? product.variations![0].id : product.id);

  // Derive active selected variation details
  const activeVariation = hasVariations 
    ? product.variations!.find(v => v.id === selectedVariationId) || product.variations![0]
    : product;

  // Extract first letter for dummy logo fallback
  const firstLetter = product.name ? product.name.charAt(0).toUpperCase() : 'Y';

  return (
    <>
      <motion.div 
        layout
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.3 }}
        onClick={() => setIsModalOpen(true)}
        className="group bg-[var(--color-surface-card,#ffffff)] rounded-xl sm:rounded-2xl border border-[var(--color-border-soft,#d4f3f9)] shadow-sm hover:shadow-lg hover:border-[#0077b6]/30 transition-all duration-300 flex flex-col h-full cursor-pointer relative overflow-hidden"
      >
        {/* Full Thumbnail (Atas) */}
        <div className="w-full aspect-square bg-[#effafd] flex items-center justify-center font-bold text-[#005a77] text-3xl overflow-hidden relative border-b border-[var(--color-border-soft,#d4f3f9)]/50">
          {product.thumbnail_url && !imgError ? (
            <img 
              src={getValidImageUrl(product.thumbnail_url)} 
              alt={product.name} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={() => setImgError(true)}
            />
          ) : (
            <span>{firstLetter}</span>
          )}
          {/* Badge Overlay */}
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2">
             <span className="bg-[#e9f9fc]/90 backdrop-blur-sm text-[#005a77] text-[8px] sm:text-[10px] uppercase tracking-widest font-extrabold px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md shadow-sm">
              {hasVariations ? (
                (() => {
                  const activeVars = product.variations!.filter(v => !v.is_archived);
                  if (activeVars.length === 0) return `${product.warranty_days}H`;
                  const warranties = activeVars.map(v => v.warranty_days);
                  const minW = Math.min(...warranties);
                  const maxW = Math.max(...warranties);
                  if (minW === maxW) return `${minW}H`;
                  return `${minW}-${maxW}H`;
                })()
              ) : (
                `${product.warranty_days}H`
              )}
            </span>
          </div>
        </div>
        
        {/* Konten Card Tipis */}
        <div className="p-2 sm:p-4 flex flex-col flex-1">
          <h3 className="font-bold text-[var(--color-text-primary,#010113)] text-[11px] sm:text-base leading-tight group-hover:text-[#023e8a] transition-colors line-clamp-2">
            {product.name}
          </h3>
          
          <div className="mt-auto pt-2 sm:pt-3">
            <span className="text-xs sm:text-lg font-black text-[var(--color-text-primary,#010113)] block leading-none">
              {hasVariations ? (
                (() => {
                  const activeVars = product.variations!.filter(v => !v.is_archived);
                  if(activeVars.length === 0) return `Rp ${product.price.toLocaleString('id-ID')}`;
                  const prices = activeVars.map(v => v.price);
                  const minPrice = Math.min(...prices);
                  return `Rp ${minPrice.toLocaleString('id-ID')}`;
                })()
              ) : (
                `Rp ${product.price.toLocaleString('id-ID')}`
              )}
            </span>
            
            <div className="flex items-center justify-between mt-1 sm:mt-2">
              <span className={`text-[9px] sm:text-xs font-semibold ${product.stock && product.stock > 0 ? 'text-[#00b4d8]' : 'text-red-500'}`}>
                {product.stock && product.stock > 0 ? `Sisa: ${product.stock}` : 'Habis'}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Modal Variasi & Pembayaran */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-[#010113]/60 backdrop-blur-sm"
            />
            
            <motion.div 
              initial={{ opacity: 0, y: "100%", scale: 1 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: "100%", scale: 1 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-lg bg-[var(--color-surface-bg,#f4fcfe)] sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl border-t sm:border border-[var(--color-border-soft,#d4f3f9)] mt-auto sm:mt-0"
              onClick={e => e.stopPropagation()}
            >
              {/* Drag Handle (Mobile only) */}
              <div className="w-full flex justify-center pt-3 pb-1 sm:hidden" onClick={() => setIsModalOpen(false)}>
                <div className="w-12 h-1.5 bg-slate-300 rounded-full"></div>
              </div>

              <div className="p-6 sm:pt-8">
                <div className="flex justify-between items-start mb-8">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-[#ffffff] border border-[var(--color-border-soft,#d4f3f9)] rounded-2xl flex items-center justify-center font-bold text-[#023e8a] text-2xl flex-shrink-0 overflow-hidden shadow-sm">
                      {product.thumbnail_url && !imgError ? (
                        <img 
                          src={getValidImageUrl(product.thumbnail_url)} 
                          alt={product.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                          onError={() => setImgError(true)}
                        />
                      ) : (
                        <span>{firstLetter}</span>
                      )}
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-[var(--color-text-primary,#010113)] leading-tight tracking-tight">{product.name}</h2>
                      <p className="text-[var(--color-text-muted,#005a77)] text-sm font-medium mt-1">
                        {product.stock && product.stock > 0 ? '✓ Ready Stock' : '✕ Out of Stock'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsModalOpen(false)}
                    className="p-2.5 bg-[var(--color-surface-core,#effafd)] text-[var(--color-text-muted,#005a77)] hover:text-[#010113] hover:bg-[#d4f3f9] rounded-full transition-colors hidden sm:block"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-8">
                  {/* Variasi Selection */}
                  <div>
                    <div className="flex justify-between items-end mb-4">
                      <h3 className="font-bold text-[var(--color-text-secondary,#011836)] text-lg">
                        {hasVariations ? 'Pilih Variasi' : 'Detail Paket'}
                      </h3>
                    </div>
                    <div className="space-y-3 max-h-[60vh] sm:max-h-80 overflow-y-auto pr-2">
                      {(hasVariations ? product.variations! : [product]).map((variation) => (
                        <label 
                          key={variation.id}
                          className={`flex items-center justify-between p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                            selectedVariationId === variation.id 
                              ? 'border-[#023e8a] bg-[#effafd] shadow-[0_0_15px_rgba(2,62,138,0.1)]' 
                              : 'border-[var(--color-border-soft,#d4f3f9)] bg-white hover:border-[#00b4d8]/50'
                          }`}
                          onClick={() => setSelectedVariationId(variation.id)}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${
                              selectedVariationId === variation.id ? 'border-[#023e8a] bg-[#023e8a]' : 'border-slate-300'
                            }`}>
                              {selectedVariationId === variation.id && (
                                <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </div>
                            <div>
                              <span className="block font-bold text-[var(--color-text-primary,#010113)] text-sm sm:text-base">{variation.name}</span>
                              <span className="block text-xs font-medium text-[var(--color-text-muted,#005a77)] mt-0.5">Garansi {variation.warranty_days} Hari</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="block font-black text-[#023e8a] text-base sm:text-lg whitespace-nowrap">Rp {variation.price.toLocaleString('id-ID')}</span>
                            <span className={`block text-[10px] font-semibold mt-1 ${variation.stock && variation.stock > 0 ? 'text-[#00b4d8]' : 'text-red-500'}`}>
                              {variation.stock && variation.stock > 0 ? `Sisa: ${variation.stock}` : 'Habis'}
                            </span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="pt-6 border-t-2 border-dashed border-[var(--color-border-soft,#d4f3f9)]">
                    <div className="flex justify-between items-center mb-6">
                      <span className="text-[var(--color-text-secondary,#011836)] font-semibold">Total Pembayaran</span>
                      <span className="text-2xl sm:text-3xl font-black text-[var(--color-text-primary,#010113)] tracking-tight">
                        Rp {activeVariation.price.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <form action="/api/checkout" method="POST" className="w-full">
                      <input type="hidden" name="productId" value={activeVariation.id} />
                      <button 
                        type="submit" 
                        disabled={!activeVariation.stock || activeVariation.stock <= 0}
                        className={`w-full py-4 sm:py-4.5 rounded-2xl text-base sm:text-lg font-black transition-all flex items-center justify-center gap-3 relative overflow-hidden ${
                          activeVariation.stock && activeVariation.stock > 0 
                            ? 'bg-[#023e8a] text-white hover:bg-[#0077b6] hover:scale-[1.01] shadow-xl shadow-[#023e8a]/20 active:scale-95' 
                            : 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        }`}
                      >
                        {activeVariation.stock && activeVariation.stock > 0 ? (
                          <>
                            <span>Bayar Sekarang</span>
                            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            {/* Shine effect */}
                            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent hover:animate-[shimmer_1.5s_infinite]"></div>
                          </>
                        ) : 'Stok Habis'}
                      </button>
                      <p className="text-center text-xs font-medium text-[var(--color-text-muted,#005a77)] mt-4 flex items-center justify-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Pembayaran aman & instan
                      </p>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
