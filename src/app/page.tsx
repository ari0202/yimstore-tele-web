import { supabaseAdmin } from '@/lib/supabase/admin';
import Navbar from '@/components/ui/Navbar';
import HeroSection from '@/components/ui/HeroSection';
import ProductCard from '@/components/ui/ProductCard';

export default async function CatalogPage({ searchParams }: { searchParams: { error?: string } }) {
  const resolvedSearch = await searchParams;
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
  });

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="p-8 text-red-500 bg-red-50 rounded-2xl">Gagal memuat produk.</div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-slate-50">
      <Navbar />
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

          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-6">
            {products?.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>
    </main>
    </div>
  );
}
