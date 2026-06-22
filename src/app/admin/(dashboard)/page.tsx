import { supabaseAdmin } from '@/lib/supabase/admin';

export default async function AdminDashboard() {
  const { count: orderCount } = await supabaseAdmin.from('orders').select('*', { count: 'exact', head: true });
  const { count: productCount } = await supabaseAdmin.from('products').select('*', { count: 'exact', head: true }).eq('is_archived', false);
  const { count: availableStock } = await supabaseAdmin.from('inventory').select('*', { count: 'exact', head: true }).eq('status', 'Available');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{orderCount || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Active Products</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{productCount || 0}</p>
        </div>
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Available Stock</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{availableStock || 0}</p>
        </div>
      </div>
    </div>
  );
}
