import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdminSession } from '@/lib/auth';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import ManualOrderForm from './ManualOrderForm';

export default async function AddManualOrderPage() {
  await verifyAdminSession();

  // Fetch all active products
  const { data: products } = await supabaseAdmin
    .from('products')
    .select('id, name, max_claim_limit, warranty_days')
    .order('name');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tambah Pesanan Manual</h1>
          <p className="text-gray-500 text-sm mt-1">Buat pesanan untuk pembeli lama agar mereka bisa mengakses klaim garansi otomatis.</p>
        </div>
      </div>

      <ManualOrderForm products={products || []} />
    </div>
  );
}
