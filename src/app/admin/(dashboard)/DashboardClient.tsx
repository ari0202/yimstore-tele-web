'use client';

import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { 
  TrendingUp, CreditCard, ShoppingBag, AlertTriangle, 
  Package, Clock, CheckCircle, Search
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function DashboardClient() {
  const [range, setRange] = useState('7d');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/dashboard?range=${range}`);
        if (!res.ok) throw new Error('Failed to fetch data');
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [range]);

  if (!data && loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-red-500">Gagal memuat dashboard.</div>;

  const { metrics, chartData, operationalStatus, recentOrders, lowStockAlerts, topSelling } = data;

  return (
    <div className="space-y-6">
      {/* Header & Date Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Ikhtisar Dashboard</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ringkasan performa toko Anda.</p>
        </div>
        <select 
          value={range} 
          onChange={(e) => setRange(e.target.value)}
          className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 focus:ring-blue-500 outline-none"
        >
          <option value="today">Hari Ini</option>
          <option value="7d">7 Hari Terakhir</option>
          <option value="30d">30 Hari Terakhir</option>
          <option value="all">Semua Waktu</option>
        </select>
      </div>

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 dark:bg-blue-900/20 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 relative z-10 flex items-center gap-2">
            <TrendingUp size={16} className="text-blue-500" /> Pendapatan Kotor
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2 relative z-10">
            Rp{metrics.totalRevenue.toLocaleString('id-ID')}
          </p>
        </div>
        
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 relative z-10 flex items-center gap-2">
            <ShoppingBag size={16} className="text-green-500" /> Total Pesanan
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2 relative z-10">
            {metrics.totalOrders} <span className="text-sm font-normal text-gray-500">pesanan</span>
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 dark:bg-purple-900/20 rounded-full group-hover:scale-110 transition-transform duration-500"></div>
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 relative z-10 flex items-center gap-2">
            <CreditCard size={16} className="text-purple-500" /> Rata-rata Pesanan
          </h3>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100 mt-2 relative z-10">
            Rp{Math.round(metrics.aov).toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Tren Pendapatan</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-soft)" opacity={0.5} />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(val) => range === 'today' ? format(new Date(val), 'HH:mm') : format(new Date(val), 'dd MMM', { locale: id })}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tickFormatter={(val) => `Rp${(val/1000)}k`}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: 'var(--color-surface-bg)', borderRadius: '8px', border: '1px solid var(--color-border-soft)', color: 'var(--color-text-primary)' }}
                  formatter={(value: any) => [`Rp${Number(value).toLocaleString('id-ID')}`, 'Pendapatan']}
                  labelFormatter={(label: any) => range === 'today' ? format(new Date(label), 'dd MMMM yyyy, HH:mm', { locale: id }) : format(new Date(label), 'dd MMMM yyyy', { locale: id })}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-6">Produk Terlaris</h3>
          <div className="space-y-4">
            {topSelling.length === 0 && <p className="text-sm text-gray-500">Belum ada data penjualan.</p>}
            {topSelling.map((prod: any, idx: number) => (
              <div key={prod.id} className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-gray-100 text-gray-700' : idx === 2 ? 'bg-orange-100 text-orange-700' : 'bg-blue-50 text-blue-600'}`}>
                  #{idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{prod.name}</p>
                </div>
                <div className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {prod.sales}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Operational & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Operational Status & Low Stock */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
              <Package size={18} /> Status Operasional
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Clock size={16} className="text-orange-500" /> Pending (Belum Bayar)
                </div>
                <span className="font-bold text-gray-900 dark:text-gray-100">{operationalStatus.pending}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <Search size={16} className="text-blue-500" /> Diproses
                </div>
                <span className="font-bold text-gray-900 dark:text-gray-100">{operationalStatus.processing}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <CheckCircle size={16} className="text-green-500" /> Selesai
                </div>
                <span className="font-bold text-gray-900 dark:text-gray-100">{operationalStatus.completed}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl border border-red-200 dark:border-red-900 shadow-sm">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-4 flex items-center gap-2">
              <AlertTriangle size={18} /> Peringatan Stok Menipis
            </h3>
            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2">
              {lowStockAlerts.length === 0 && <p className="text-sm text-gray-500 dark:text-gray-400">Semua stok produk dalam kondisi aman.</p>}
              {lowStockAlerts.map((alert: any) => (
                <div key={alert.id} className="flex justify-between items-center pb-2 border-b border-red-100 dark:border-red-900/30 last:border-0 last:pb-0">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate pr-4">{alert.name}</span>
                  <span className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded-full shrink-0">
                    Sisa {alert.stock}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Pesanan Terbaru</h3>
            <a href="/admin/orders" className="text-sm font-medium text-blue-600 hover:underline">Lihat Semua</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
              <thead className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-300">
                <tr>
                  <th className="px-6 py-4 font-semibold">Order ID</th>
                  <th className="px-6 py-4 font-semibold">Pelanggan</th>
                  <th className="px-6 py-4 font-semibold">Tanggal</th>
                  <th className="px-6 py-4 font-semibold text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {recentOrders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">Belum ada pesanan terbaru.</td>
                  </tr>
                )}
                {recentOrders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs">{order.id.split('-')[0]}...</div>
                      <div className="mt-1">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ['paid', 'PAID', 'success', 'SUCCESS', 'completed', 'COMPLETED'].includes(order.payment_status) 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                            : ['cancelled', 'CANCELLED', 'failed', 'FAILED'].includes(order.payment_status)
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : ['pending', 'PENDING'].includes(order.payment_status)
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}>
                          {order.payment_status}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-gray-900 dark:text-gray-200">
                        {order.users?.telegram_chat_id || 'Anonim'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {format(new Date(order.created_at), 'dd MMM yyyy, HH:mm', { locale: id })}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-gray-900 dark:text-gray-100">
                      Rp{order.total_amount.toLocaleString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
