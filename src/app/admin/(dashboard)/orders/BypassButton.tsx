'use client';

import { resetCooldown } from '@/lib/actions/admin-orders';
import { useState } from 'react';

export default function BypassButton({ orderItemId, isActive }: { orderItemId: string, isActive: boolean }) {
  const [loading, setLoading] = useState(false);

  const handleBypass = async () => {
    if (!confirm('Apakah Anda yakin ingin mem-bypass cooldown untuk item ini? Ini mengizinkan pelanggan langsung klaim.')) return;
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
        onClick={handleBypass}
        disabled={loading || isActive}
        className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-semibold rounded hover:bg-orange-200 transition-colors disabled:opacity-50"
      >
        {loading ? 'Processing...' : isActive ? 'Bypass Active' : 'Bypass Cooldown'}
      </button>
    </div>
  );
}
