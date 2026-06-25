import { supabaseAdmin } from '@/lib/supabase/admin';
import CreateProductForm from '../CreateProductForm';

export default async function AddProductPage() {
  const { data: categories } = await supabaseAdmin.from('categories').select('id, name');

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">Tambah Produk Baru</h1>
      </div>

      <CreateProductForm categories={categories || []} />
    </div>
  );
}
