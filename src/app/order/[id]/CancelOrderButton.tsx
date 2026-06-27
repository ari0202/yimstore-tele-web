"use client";

import { useState } from "react";
import { cancelOrder } from "./actions";

export default function CancelOrderButton({
  orderId,
  token,
}: {
  orderId: string;
  token: string;
}) {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const handleConfirmCancel = async () => {
    setShowModal(false);
    setIsPending(true);
    setError(null);

    const result = await cancelOrder(orderId, token);
    
    if (!result.success) {
      setError(result.message);
      setIsPending(false);
    }
    // Jika berhasil, revalidatePath di actions.ts akan me-refresh halaman 
    // sehingga status otomatis berubah.
  };

  return (
    <>
      <div className="flex flex-col items-center mt-4 w-full max-w-sm mx-auto">
        <button
          onClick={() => setShowModal(true)}
          disabled={isPending}
          className="w-full py-2.5 px-4 bg-white hover:bg-red-50 border border-red-200 text-red-600 font-semibold rounded-xl shadow-sm transition-colors text-sm focus:ring-2 focus:ring-red-100 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isPending ? (
            <span className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          )}
          {isPending ? "Membatalkan..." : "Batalkan Pesanan"}
        </button>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>

      {/* Custom Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl animate-in fade-in zoom-in duration-200">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <h3 className="text-lg font-bold text-center text-[var(--color-text-primary)] mb-2">Batalkan Pesanan?</h3>
            <p className="text-sm text-center text-[var(--color-text-muted)] mb-6">
              Apakah Anda yakin ingin membatalkan pesanan ini? Aksi ini tidak dapat diurungkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors text-sm"
              >
                Kembali
              </button>
              <button
                onClick={handleConfirmCancel}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors text-sm shadow-md"
              >
                Ya, Batalkan
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
