import Link from 'next/link';
import { cookies } from 'next/headers';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { createPakasirTransaction } from '@/lib/pakasir';
import AutoRefresh from './AutoRefresh';
import PaymentSection from './PaymentSection';
import CopyButton from './CopyButton';
import CopyPageLinkButton from './CopyPageLinkButton';
import ClaimButton from './ClaimButton';
import CancelOrderButton from './CancelOrderButton';
import { cancelOrder } from './actions';

export default async function OrderDashboard({ params, searchParams }: { params: { id: string }, searchParams: { token?: string } }) {
  // Await cookies and params as required in modern Next.js
  const cookieStore = await cookies();
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  let rawId = resolvedParams.id;
  let urlToken = resolvedSearch.token;
  
  if (rawId.includes('---')) {
    const parts = rawId.split('---');
    rawId = parts[0];
    urlToken = parts[1];
  }

  const token = urlToken || cookieStore.get(`order_token_${rawId}`)?.value;

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
      id,
      total_amount,
      payment_status,
      created_at,
      order_items (
        id, warranty_end_date, current_claim_count,
        products ( name, max_claim_limit, warranty_days ),
        inventory ( 
          credential_data
        )
      )
    `)
    .eq('id', rawId)
    .eq('access_token', token)
    .single();

  if (error || !order) {
    console.error("Order fetch error:", error, "Order:", order);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-800">
        <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-lg border border-red-100 text-center">
          <h1 className="text-2xl font-bold mb-2 text-red-600">Pesanan Tidak Valid</h1>
          <p className="text-gray-500">ID Pesanan atau Token tidak valid.</p>
        </div>
      </div>
    );
  }

  // Ambil detail QRIS on-the-fly untuk pesanan pending
  let qrisString = null;
  let paymentExpiredAt = null;
  let totalPayment = order.total_amount;
  const shortId = `INV-${order.id.split('-')[0].toUpperCase()}`;

  // Enforce 15-minute expiration rule visually on the frontend
  // This handles cases where the background cron job hasn't run yet or is delayed
  const systemExpiredAt = new Date(new Date(order.created_at).getTime() + 15 * 60 * 1000);
  const isTimeExpired = new Date().getTime() > systemExpiredAt.getTime();
  
  if (isTimeExpired && order.payment_status === 'pending') {
    // Mutate the local object so the UI reflects the expired state immediately
    order.payment_status = 'expired';
  }

  if (order.payment_status === 'pending') {
    try {
      const detail = await createPakasirTransaction(shortId, order.total_amount);
      if (detail?.payment?.payment_number) {
        qrisString = detail.payment.payment_number;
        // Gunakan batas waktu sistem (15 menit)
        paymentExpiredAt = systemExpiredAt.toISOString();
        if (detail.payment.total_payment) {
          totalPayment = detail.payment.total_payment;
        }
      }
    } catch (e) {
      console.error('Failed to get QRIS details:', e);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--color-surface-bg)] p-4 md:p-8 text-[var(--color-text-primary)] relative">
      {order.payment_status === 'pending' && <AutoRefresh intervalMs={10000} />}
      <div className="max-w-3xl mx-auto space-y-6 relative z-10">
        
        {/* Order Items */}
        {order.order_items.map((item: any) => {
          const product = item.products;
          const isPaid = ['paid', 'success', 'completed'].includes(order.payment_status?.toLowerCase());
          const isWarrantyActive = isPaid && new Date(item.warranty_end_date) > new Date();
          const canClaim = isPaid && isWarrantyActive && item.current_claim_count < product.max_claim_limit;

          return (
            <div key={item.id} className="bg-[var(--color-surface-card)] rounded-2xl shadow-sm border border-[var(--color-border-soft)] overflow-hidden">
              <div className="p-5 border-b border-[var(--color-border-soft)] bg-[var(--color-surface-core)]/30">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-start gap-2">
                      <span className="leading-tight">{product?.name || 'Produk Digital'}</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </h2>
                    <p className="text-sm text-[var(--color-text-muted)] mt-1.5 font-medium flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-[var(--color-action-primary)]" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 012.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0110 1.944zM11 14a1 1 0 11-2 0 1 1 0 012 0zm0-7a1 1 0 10-2 0v3a1 1 0 102 0V7z" clipRule="evenodd" />
                      </svg>
                      Garansi {product?.warranty_days} Hari
                    </p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className="inline-block px-3 py-1 bg-white border border-[var(--color-border-soft)] text-[var(--color-text-muted)] rounded-md text-xs font-mono font-bold tracking-widest shadow-sm whitespace-nowrap">
                      {shortId}
                    </span>
                    {order.payment_status === 'pending' ? (
                      <div className="flex items-center gap-1.5 text-yellow-600 mt-0.5 bg-yellow-50 px-2.5 py-1 rounded-full border border-yellow-200 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 animate-pulse"></span>
                        <span className="text-[10px] font-bold tracking-wider uppercase">Pending</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-sky-600 mt-0.5 bg-sky-50 px-2.5 py-1 rounded-full border border-sky-200 shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                        <span className="text-[10px] font-bold tracking-wider uppercase">{order.payment_status}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="p-5 md:p-6 space-y-6">
                {order.payment_status?.toLowerCase() === 'expired' || order.payment_status?.toLowerCase() === 'cancelled' ? (
                  <div className="space-y-6 text-center py-8">
                    <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                      </svg>
                    </div>
                    <h3 className="font-black text-xl text-[var(--color-text-primary)]">Pesanan Dibatalkan</h3>
                    <p className="text-sm text-[var(--color-text-muted)] mt-2 max-w-sm mx-auto">
                      Waktu pembayaran untuk pesanan ini telah habis atau pesanan telah dibatalkan secara manual.
                    </p>
                    <div className="pt-4">
                      <Link 
                        href="/" 
                        className="inline-flex items-center justify-center px-6 py-3 bg-[var(--color-action-primary)] hover:bg-[var(--color-action-hover)] text-white font-bold rounded-xl transition-all shadow-md hover:shadow-lg gap-2 text-sm"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path>
                        </svg>
                        Beli Produk Lain
                      </Link>
                    </div>
                  </div>
                ) : !isPaid ? (
                  <div className="space-y-6">
                    <div className="text-center pt-2">
                      <h3 className="font-black text-xl text-[var(--color-text-primary)]">Selesaikan Pembayaran</h3>
                      <p className="text-sm text-[var(--color-text-muted)] mt-1">Sistem akan memverifikasi otomatis dalam 1-5 menit.</p>
                    </div>
                    <div className="text-center space-y-8">
                      
                      {qrisString ? (
                        <PaymentSection 
                          qrisString={qrisString}
                          totalAmount={totalPayment}
                          paymentExpiredAt={paymentExpiredAt || ''}
                          token={token}
                        />
                      ) : (
                        <div className="space-y-4">
                          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg className="w-8 h-8 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                          </div>
                          <p className="text-gray-600 text-sm max-w-md mx-auto">
                            Menyiapkan QRIS pembayaran Anda... Silakan _refresh_ halaman ini dalam beberapa detik.
                          </p>
                        </div>
                      )}
                      
                      <CancelOrderButton orderId={order.id} token={token} />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Credentials Box */}
                    <div className="bg-gray-900 rounded-xl p-5 relative group mt-4">
                      {item.inventory?.credential_data && (
                        <CopyButton text={typeof item.inventory.credential_data === 'string' ? item.inventory.credential_data : JSON.stringify(item.inventory.credential_data, null, 2)} />
                      )}
                      <div className="text-xs text-gray-400 font-mono mb-2">
                        Kredensial Aktif:
                      </div>
                      <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap">
                        {item.inventory?.credential_data 
                          ? (typeof item.inventory.credential_data === 'string' ? item.inventory.credential_data : JSON.stringify(item.inventory.credential_data, null, 2))
                          : 'Sedang diproses...'}
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

                    <div className="pt-6 border-t border-[var(--color-border-soft)] space-y-3 mt-4">
                      <a 
                        href={`https://t.me/${process.env.TELEGRAM_BOT_USERNAME || 'YimStoreBot'}?start=token_${token}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="w-full py-3.5 rounded-xl font-bold transition-all duration-200 flex justify-center items-center gap-2 bg-[var(--color-action-primary)] hover:bg-[var(--color-action-hover)] text-white shadow-md hover:shadow-lg hover:-translate-y-0.5"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.195-.054-.285-.346-.09l-6.4 4.024-2.76-.86c-.6-.185-.61-.6.125-.89l10.736-4.138c.498-.184.93.116.805.882z"/></svg>
                        Tautkan Pesanan ke Telegram
                      </a>

                      <CopyPageLinkButton />
                      
                      <ClaimButton canClaim={canClaim} itemId={item.id} token={token} />
                      {!isWarrantyActive && (
                        <p className="text-xs text-center text-red-500 mt-2">Masa garansi telah kedaluwarsa.</p>
                      )}
                      {isWarrantyActive && item.current_claim_count >= product.max_claim_limit && (
                        <p className="text-xs text-center text-red-500 mt-2">Batas klaim maksimal telah tercapai.</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
