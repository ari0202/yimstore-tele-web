'use client';

import { useState } from 'react';
import { Clock, X, ChevronRight, Copy, Check } from 'lucide-react';
import BypassButton from './BypassButton';
import CopyOrderLinkButton from './CopyOrderLinkButton';

export default function OrderRowClient({ order }: { order: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  
  const getStatusColor = (status: string) => {
    if (['paid', 'PAID', 'success', 'SUCCESS', 'completed', 'COMPLETED'].includes(status)) return 'text-green-600';
    if (['cancelled', 'CANCELLED', 'failed', 'FAILED'].includes(status)) return 'text-red-600';
    if (['pending', 'PENDING'].includes(status)) return 'text-yellow-600';
    return 'text-gray-600';
  };
  
  const orderIdFmt = `INV-${order.id.split('-')[0].toUpperCase()}`;

  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(orderIdFmt);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  return (
    <>
      {/* Table Row */}
      <tr 
        onClick={() => setIsModalOpen(true)}
        className="hover:bg-[var(--color-surface-core)] transition-colors cursor-pointer md:cursor-default"
      >
        <td className="px-4 md:px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="font-mono text-xs text-[var(--color-text-primary)] font-semibold">{orderIdFmt}</div>
            <button 
              onClick={handleCopyId}
              className="text-[var(--color-text-muted)] hover:text-[var(--color-action-primary)] transition-colors p-1 rounded-md hover:bg-[var(--color-surface-core)]"
              title="Copy Order ID"
            >
              {copiedId ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
            </button>
          </div>
          <div className="mt-1 flex items-center gap-1 text-[var(--color-text-muted)] text-xs md:text-sm">
            <Clock size={12} className="md:w-3.5 md:h-3.5" />
            {new Date(order.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="mt-1 inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[var(--color-surface-core)] text-[var(--color-action-primary)]">
            {order.platform_source?.toUpperCase()}
          </div>
        </td>
        <td className="px-4 md:px-6 py-4 hidden sm:table-cell">
          <span className="font-medium text-[var(--color-text-primary)] text-sm md:text-base">{order.users?.telegram_chat_id || 'Anonim'}</span>
        </td>
        <td className="px-4 md:px-6 py-4 hidden lg:table-cell">
          {order.order_items?.map((item: any) => {
            const isExpired = new Date(item.warranty_end_date) < new Date();
            return (
              <div key={item.id} className="mb-2 last:mb-0">
                <div className="font-medium text-[var(--color-text-primary)] text-sm">{item.products?.name}</div>
                <div className="text-xs text-[var(--color-text-muted)]">
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
        <td className="px-4 md:px-6 py-4 font-medium text-[var(--color-text-primary)]">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm md:text-base">Rp{order.total_amount.toLocaleString('id-ID')}</div>
              <div className={`text-xs mt-1 ${getStatusColor(order.payment_status)}`}>{order.payment_status}</div>
            </div>
            <div className="lg:hidden text-[var(--color-text-muted)]">
              <ChevronRight size={18} />
            </div>
          </div>
        </td>
        <td className="px-6 py-4 text-right hidden lg:table-cell space-y-2" onClick={(e) => e.stopPropagation()}>
          <div className="flex flex-col items-end gap-2">
            <CopyOrderLinkButton orderId={order.id} accessToken={order.access_token} />
            {order.order_items?.map((item: any) => (
              <BypassButton 
                key={`btn-${item.id}`} 
                orderItemId={item.id} 
                isActive={item.cooldown_bypass_active} 
              />
            ))}
          </div>
        </td>
      </tr>

      {/* Mobile Details Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4 lg:hidden">
          <div 
            className="bg-[var(--color-surface-card)] w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b border-[var(--color-border-soft)] shrink-0 transition-colors">
              <h3 className="font-semibold text-lg text-[var(--color-text-primary)] transition-colors">Detail Pesanan</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors p-1">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto space-y-6">
              {/* Basic Info */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[var(--color-text-muted)]">Order ID</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-[var(--color-text-primary)] font-semibold">{orderIdFmt}</span>
                    <button 
                      onClick={handleCopyId}
                      className="text-[var(--color-text-muted)] hover:text-[var(--color-action-primary)] transition-colors p-1.5 rounded-md hover:bg-[var(--color-surface-core)]"
                      title="Copy Order ID"
                    >
                      {copiedId ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">Tanggal</span>
                  <span className="text-sm text-[var(--color-text-primary)]">{new Date(order.created_at).toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">Pelanggan</span>
                  <span className="text-sm text-[var(--color-text-primary)]">{order.users?.telegram_chat_id || 'Anonim'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">Total Bayar</span>
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">Rp{order.total_amount.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">Status</span>
                  <span className={`text-sm font-medium ${getStatusColor(order.payment_status)}`}>{order.payment_status}</span>
                </div>
              </div>

              {/* Items & Actions */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 uppercase tracking-wider">Item Pesanan</h4>
                <div className="space-y-4">
                  {order.order_items?.map((item: any) => {
                    const isExpired = new Date(item.warranty_end_date) < new Date();
                    return (
                      <div key={item.id} className="bg-[var(--color-surface-core)] p-3 rounded-xl border border-[var(--color-border-soft)] transition-colors">
                        <div className="font-medium text-[var(--color-text-primary)]">{item.products?.name}</div>
                        <div className="flex justify-between mt-2 text-sm">
                          <span className="text-[var(--color-text-muted)]">Klaim:</span>
                          <span className="text-[var(--color-text-primary)]">{item.current_claim_count} / {item.products?.max_claim_limit}</span>
                        </div>
                        <div className="flex justify-between mt-1 text-sm">
                          <span className="text-[var(--color-text-muted)]">Garansi:</span>
                          {isExpired ? (
                            <span className="text-red-600 font-semibold">Habis</span>
                          ) : (
                            <span className="text-green-600 font-semibold">Aktif</span>
                          )}
                        </div>
                        <div className="mt-3 pt-3 border-t border-[var(--color-border-soft)]">
                          <BypassButton 
                            orderItemId={item.id} 
                            isActive={item.cooldown_bypass_active} 
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Copy Link */}
              <div>
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 uppercase tracking-wider">Aksi Lainnya</h4>
                <div className="bg-[var(--color-surface-core)] p-3 rounded-xl border border-[var(--color-border-soft)] transition-colors">
                  <CopyOrderLinkButton orderId={order.id} accessToken={order.access_token} />
                  <p className="text-xs text-[var(--color-text-muted)] mt-2">
                    Salin link kredensial ini untuk diberikan ke pelanggan agar mereka bisa mengakses klaim garansi.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </>
  );
}
