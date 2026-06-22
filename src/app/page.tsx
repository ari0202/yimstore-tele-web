import { supabaseAdmin } from '@/lib/supabase/admin';
import Navbar from '@/components/ui/Navbar';
import HeroSection from '@/components/ui/HeroSection';
import ProductCard from '@/components/ui/ProductCard';

export default async function CatalogPage() {
  const { data: products, error } = await supabaseAdmin
    .from('products')
    .select('id, name, price, description, warranty_days, max_claim_limit, thumbnail_url')
    .eq('is_archived', false);

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

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
