'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ClaimButton({ 
  canClaim, 
  itemId, 
  token 
}: { 
  canClaim: boolean, 
  itemId: string, 
  token: string 
}) {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showResult, setShowResult] = useState<{success: boolean, message: string} | null>(null);
  const router = useRouter();

  const handleClaim = async () => {
    if (!canClaim) return;
    
    setLoading(true);
    setShowConfirm(false);
    
    try {
      const res = await fetch('/api/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          orderItemId: itemId, 
          access_token: token,
          reason: 'Klaim Garansi Otomatis dari Web' 
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Gagal memproses klaim garansi');
      }

      setShowResult({ success: true, message: 'Klaim garansi berhasil diproses! Kredensial akun baru Anda telah diperbarui.' });
      router.refresh();
    } catch (error: any) {
      setShowResult({ success: false, message: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setShowConfirm(true)}
        disabled={!canClaim || loading}
        className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-200 flex justify-center items-center gap-2
          ${canClaim && !loading
            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5' 
            : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
      >
        {loading ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
          </svg>
        )}
        {loading ? 'Memproses...' : canClaim ? 'Klaim Garansi Otomatis' : 'Garansi Tidak Tersedia'}
      </button>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-2">Konfirmasi Klaim</h3>
            <p className="text-gray-600 mb-6 text-sm">
              Apakah Anda yakin ingin mengklaim garansi untuk produk ini? Akun lama Anda mungkin akan ditandai sebagai kedaluwarsa oleh sistem.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-2.5 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleClaim}
                className="flex-1 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                Ya, Klaim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl text-center animate-in zoom-in-95 duration-200">
            <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${showResult.success ? 'bg-green-100 text-green-500' : 'bg-red-100 text-red-500'}`}>
              {showResult.success ? (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {showResult.success ? 'Klaim Berhasil' : 'Klaim Gagal'}
            </h3>
            <p className="text-gray-600 mb-6 text-sm">
              {showResult.message}
            </p>
            <button 
              onClick={() => setShowResult(null)}
              className="w-full py-2.5 rounded-xl font-semibold text-white bg-gray-900 hover:bg-gray-800 transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </>
  );
}
