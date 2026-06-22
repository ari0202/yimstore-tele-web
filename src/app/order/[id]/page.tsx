import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';

export default async function OrderDashboard({ params }: { params: { id: string } }) {
  // Await cookies and params as required in modern Next.js
  const cookieStore = await cookies();
  const resolvedParams = await params;
  
  const token = cookieStore.get(`order_token_${resolvedParams.id}`)?.value;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-red-100 text-center">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v-2m0 2h.01M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold mb-2">Akses Ditolak</h1>
          <p className="text-gray-500">Token rahasia tidak ditemukan atau telah kedaluwarsa. Silakan gunakan link dari Telegram Bot Anda.</p>
        </div>
      </div>
    );
  }

  // Fetch order data
  const { data: order, error } = await supabaseAdmin
    .from('orders')
    .select(`
      id, total_amount, payment_status,
      order_items (
        id, warranty_end_date, current_claim_count,
        inventory!inner ( 
          credential_data, 
          products ( name, max_claim_limit, warranty_days )
        )
      )
    `)
    .eq('id', resolvedParams.id)
    .eq('access_token', token)
    .single();

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-red-100 text-center">
          <h1 className="text-2xl font-bold mb-2 text-red-600">Pesanan Tidak Valid</h1>
          <p className="text-gray-500">ID Pesanan atau Token tidak valid.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 text-gray-800">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">Dashboard Pesanan</h1>
            <p className="text-sm text-gray-500 mt-1 font-mono">{order.id}</p>
          </div>
          <div className="flex flex-col md:flex-row items-end md:items-center gap-3 mt-4 md:mt-0">
            <div className="px-4 py-1.5 bg-green-50 text-green-700 rounded-full font-medium text-sm flex items-center gap-2 border border-green-200">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              {order.payment_status.toUpperCase()}
            </div>
            
            <a 
              href={`https://t.me/YimStoreBot?start=token_${token}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-4 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full font-medium text-sm transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
              Koneksi Telegram
            </a>
          </div>
        </div>

        {/* Order Items */}
        {order.order_items.map((item: any) => {
          const product = item.inventory?.products;
          const isWarrantyActive = new Date(item.warranty_end_date) > new Date();
          const canClaim = isWarrantyActive && item.current_claim_count < product.max_claim_limit;

          return (
            <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-50 bg-slate-50/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{product?.name || 'Produk Digital'}</h2>
                    <p className="text-sm text-gray-500 mt-1">Garansi {product?.warranty_days} Hari</p>
                  </div>
                </div>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Credentials Box */}
                <div className="bg-gray-900 rounded-xl p-5 relative group">
                  <div className="absolute top-0 right-0 bg-gray-800 text-xs text-gray-400 px-3 py-1 rounded-bl-lg rounded-tr-xl font-mono">
                    Kredensial Aktif
                  </div>
                  <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap mt-2">
                    {item.inventory?.credential_data ? JSON.stringify(item.inventory.credential_data, null, 2) : 'Sedang diproses...'}
                  </pre>
                </div>

                {/* Warranty Status */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100">
                    <p className="text-xs text-blue-500 font-semibold uppercase tracking-wider mb-1">Berlaku Hingga</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(item.warranty_end_date).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="bg-orange-50/50 rounded-xl p-4 border border-orange-100">
                    <p className="text-xs text-orange-500 font-semibold uppercase tracking-wider mb-1">Sisa Limit Klaim</p>
                    <p className="text-gray-900 font-medium">
                      {product.max_claim_limit - item.current_claim_count} dari {product.max_claim_limit}
                    </p>
                  </div>
                </div>

                {/* Action Area */}
                <div className="pt-4 border-t border-gray-100">
                  <button 
                    disabled={!canClaim}
                    className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-200 flex justify-center items-center gap-2
                      ${canClaim 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                    // TODO: Hook this to client-side fetch call
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    {canClaim ? 'Klaim Garansi Otomatis' : 'Garansi Tidak Tersedia'}
                  </button>
                  {!isWarrantyActive && (
                    <p className="text-xs text-center text-red-500 mt-2">Masa garansi telah kedaluwarsa.</p>
                  )}
                  {isWarrantyActive && item.current_claim_count >= product.max_claim_limit && (
                    <p className="text-xs text-center text-red-500 mt-2">Batas klaim maksimal telah tercapai.</p>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
