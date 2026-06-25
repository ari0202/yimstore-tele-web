'use client';

import { resetCooldown } from '@/lib/actions/admin-orders';
import { useState } from 'react';
import { AlertCircle } from 'lucide-react';

export default function BypassButton({ orderItemId, isActive }: { orderItemId: string, isActive: boolean }) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleBypass = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(false);
    setLoading(true);
    const res = await resetCooldown(orderItemId);
    if (!res.success) {
      alert('Gagal: ' + res.error);
    }
    setLoading(false);
  };

  return (
    <div className="mb-2 last:mb-0">
      <button 
        onClick={(e) => { e.stopPropagation(); setShowConfirm(true); }}
        disabled={loading || isActive}
        className="px-3 py-1.5 w-full sm:w-auto bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold rounded-lg hover:bg-orange-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
      >
        {loading ? 'Memproses...' : isActive ? 'Bypass Aktif' : 'Bypass Cooldown'}
      </button>

      {/* Custom Confirm Modal */}
      {showConfirm && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity"
          onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}
        >
          <div 
            className="bg-[var(--color-surface-card)] w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all border border-[var(--color-border-soft)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 sm:p-6 flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                <AlertCircle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Bypass Cooldown?</h3>
                <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                  Apakah Anda yakin ingin mem-bypass jeda klaim untuk item ini? Ini akan mengizinkan pelanggan untuk langsung mengklaim ulang.
                </p>
              </div>
            </div>
            
            <div className="bg-[var(--color-surface-core)] px-5 py-4 sm:px-6 flex flex-col sm:flex-row-reverse border-t border-[var(--color-border-soft)] gap-2">
              <button
                type="button"
                onClick={handleBypass}
                className="w-full inline-flex justify-center rounded-xl bg-[var(--color-action-primary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-action-hover)] sm:w-auto transition-colors"
              >
                Ya, Bypass
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setShowConfirm(false); }}
                className="w-full inline-flex justify-center rounded-xl bg-[var(--color-surface-card)] border border-[var(--color-border-soft)] px-4 py-2.5 text-sm font-semibold text-[var(--color-text-secondary)] shadow-sm hover:bg-[var(--color-surface-core)] sm:w-auto transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
