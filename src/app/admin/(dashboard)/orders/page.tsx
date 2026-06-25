import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdminSession } from '@/lib/auth';
import { Clock } from 'lucide-react';
import BypassButton from './BypassButton';

export default async function OrdersPage() {
  await verifyAdminSession();

  // Fetch orders with all details
  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select(`
      id, created_at, payment_status, total_amount, platform_source,
      users(telegram_chat_id),
      order_items(
        id, current_claim_count, cooldown_bypass_active, warranty_end_date,
        products(name, max_claim_limit)
      )
    `)
    .order('created_at', { ascending: false });

  if (!orders) {
    return <div className="p-8">Gagal memuat pesanan.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Pesanan</h1>
        <a href="/admin/orders/add-manual" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-sm">
          + Tambah Manual
        </a>
      </div>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-600">
            <thead className="bg-gray-50 border-b text-gray-900">
              <tr>
                <th className="px-6 py-4 font-semibold">Order ID / Tanggal</th>
                <th className="px-6 py-4 font-semibold">Pelanggan</th>
                <th className="px-6 py-4 font-semibold">Item & Status Garansi</th>
                <th className="px-6 py-4 font-semibold">Total Bayar</th>
                <th className="px-6 py-4 font-semibold text-right">Aksi Manual</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {orders.map((order: any) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs text-gray-500">{order.id}</div>
                    <div className="mt-1 flex items-center gap-1 text-gray-400">
                      <Clock size={14} />
                      {new Date(order.created_at).toLocaleString('id-ID')}
                    </div>
                    <div className="mt-1 inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">
                      {order.platform_source.toUpperCase()}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-medium text-gray-900">{order.users?.telegram_chat_id || 'Anonim'}</span>
                  </td>
                  <td className="px-6 py-4">
                    {order.order_items?.map((item: any) => {
                      const isExpired = new Date(item.warranty_end_date) < new Date();
                      return (
                        <div key={item.id} className="mb-2 last:mb-0">
                          <div className="font-medium text-gray-900">{item.products?.name}</div>
                          <div className="text-xs text-gray-500">
                            Klaim: {item.current_claim_count} / {item.products?.max_claim_limit}
                          </div>
                          {isExpired ? (
                            <span className="text-xs text-red-600 font-semibold">Garansi Habis</span>
                          ) : (
                            <span className="text-xs text-green-600 font-semibold">Garansi Aktif</span>
                          )}
                          {item.cooldown_bypass_active && (
                            <div className="text-xs text-orange-600 font-bold mt-1">⚠️ Bypass Aktif</div>
                          )}
                        </div>
                      );
                    })}
                  </td>
                  <td className="px-6 py-4 font-medium text-gray-900">
                    Rp{order.total_amount.toLocaleString('id-ID')}
                    <div className="text-xs text-green-600 mt-1">{order.payment_status}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {order.order_items?.map((item: any) => (
                      <BypassButton 
                        key={`btn-${item.id}`} 
                        orderItemId={item.id} 
                        isActive={item.cooldown_bypass_active} 
                      />
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
