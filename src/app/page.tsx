import { supabaseAdmin } from '@/lib/supabase/admin';
import Navbar from '@/components/ui/Navbar';
import HeroSection from '@/components/ui/HeroSection';
import ProductCard from '@/components/ui/ProductCard';
import { Suspense } from 'react';

export const dynamic = 'force-dynamic';

export default async function CatalogPage({ searchParams }: { searchParams: { error?: string, q?: string } }) {
  const resolvedSearch = await searchParams;
  const searchQuery = resolvedSearch.q?.toLowerCase() || '';
  const { data: rawCategories, error } = await supabaseAdmin
    .from('categories')
    .select(`
      id, name, description, thumbnail_url,
      inventory(status),
      variations:products(
        id, name, price, warranty_days, max_claim_limit, is_archived, is_sync_stock, inventory(status)
      )
    `);

  const products = rawCategories?.map((c: any) => {
    // Process variations (products)
    const categoryInventory = c.inventory?.filter((i: any) => i.status === 'Available').length || 0;

    const activeVariations = c.variations
      ?.filter((v: any) => !v.is_archived)
      .map((v: any) => ({
        ...v,
        stock: v.is_sync_stock 
          ? categoryInventory 
          : (v.inventory?.filter((i: any) => i.status === 'Available').length || 0)
      })) || [];

    // Determine if any variation uses category sync stock
    const usesSyncStock = activeVariations.some((v: any) => v.is_sync_stock);
    const totalStock = usesSyncStock 
      ? categoryInventory 
      : activeVariations.reduce((sum: number, v: any) => sum + (v.stock || 0), 0);
    const minPrice = activeVariations.length > 0 ? Math.min(...activeVariations.map((v: any) => v.price)) : 0;
    const minWarranty = activeVariations.length > 0 ? Math.min(...activeVariations.map((v: any) => v.warranty_days)) : 0;
    const minMaxClaim = activeVariations.length > 0 ? Math.min(...activeVariations.map((v: any) => v.max_claim_limit)) : 0;

    return {
      id: c.id,
      name: c.name,
      description: c.description || '',
      thumbnail_url: c.thumbnail_url || null,
      price: minPrice,
      warranty_days: minWarranty,
      max_claim_limit: minMaxClaim,
      stock: totalStock,
      variations: activeVariations
    };
  }).filter((p: any) => p.variations.length > 0); // only show categories with active variations

  const filteredProducts = searchQuery
    ? products?.filter((p: any) => p.name.toLowerCase().includes(searchQuery) || p.description.toLowerCase().includes(searchQuery))
    : products;

  if (error) {
    console.error("Supabase Error on Homepage:", error);
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 text-red-500 bg-red-50 rounded-2xl">Gagal memuat produk: {error.message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50">
      <Suspense fallback={<div className="h-16 w-full bg-white border-b border-gray-100 sticky top-0 z-40"></div>}>
        <Navbar />
      </Suspense>
      <main className="flex-1">
        <HeroSection />

        <section className="w-full py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          {resolvedSearch.error && (
            <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-100 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-700 font-medium">{resolvedSearch.error}</p>
            </div>
          )}

          <div id="catalog" className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6 pt-16 -mt-16">
            {filteredProducts?.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
            
            {filteredProducts?.length === 0 && (
              <div className="col-span-full py-20 text-center flex flex-col items-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">Produk tidak ditemukan</h3>
                <p className="text-gray-500">Kami tidak dapat menemukan produk yang sesuai dengan pencarian Anda.</p>
              </div>
            )}
          </div>
        </div>
      </section>
      
      {/* FAQ Section */}
      <section id="faq" className="w-full py-16 bg-white border-t border-gray-100 pt-24 -mt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--color-text-primary)]">Pertanyaan Umum (FAQ)</h2>
            <p className="mt-4 text-[var(--color-text-secondary)]">Temukan jawaban untuk pertanyaan yang sering diajukan pelanggan.</p>
          </div>
          <div className="space-y-4">
            <details className="group p-6 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-card)] transition-colors cursor-pointer open:bg-[var(--color-surface-core)]">
              <summary className="flex justify-between items-center font-bold text-[var(--color-text-primary)] list-none [&::-webkit-details-marker]:hidden focus:outline-none">
                <span>Bagaimana cara klaim garansi?</span>
                <span className="transition-transform duration-300 group-open:-rotate-180 text-[var(--color-text-muted)]">
                  <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed mt-4">Anda dapat mengklaim garansi melalui halaman status pesanan dengan mengklik tombol klaim. Sistem kami akan otomatis memproses dan memberikan detail baru jika garansi masih berlaku dan batas klaim belum tercapai.</p>
            </details>
            <details className="group p-6 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-card)] transition-colors cursor-pointer open:bg-[var(--color-surface-core)]">
              <summary className="flex justify-between items-center font-bold text-[var(--color-text-primary)] list-none [&::-webkit-details-marker]:hidden focus:outline-none">
                <span>Berapa lama proses pengiriman produk?</span>
                <span className="transition-transform duration-300 group-open:-rotate-180 text-[var(--color-text-muted)]">
                  <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed mt-4">Produk digital biasanya dikirim instan atau dalam waktu maksimal 1x24 jam setelah pembayaran berhasil dikonfirmasi. Jika pesanan manual, admin akan mengirimkannya melalui Telegram Anda.</p>
            </details>
            <details className="group p-6 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-card)] transition-colors cursor-pointer open:bg-[var(--color-surface-core)]">
              <summary className="flex justify-between items-center font-bold text-[var(--color-text-primary)] list-none [&::-webkit-details-marker]:hidden focus:outline-none">
                <span>Apakah saya bisa refund?</span>
                <span className="transition-transform duration-300 group-open:-rotate-180 text-[var(--color-text-muted)]">
                  <svg fill="none" height="20" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="20"><path d="M6 9l6 6 6-6"></path></svg>
                </span>
              </summary>
              <p className="text-[var(--color-text-muted)] text-sm leading-relaxed mt-4">Refund tidak berlaku untuk produk digital yang sudah dikirimkan dan berhasil diakses. Kami menjamin produk berfungsi melalui sistem klaim garansi selama masa aktif.</p>
            </details>
          </div>
        </div>
      </section>
    </main>
    </div>
  );
}
