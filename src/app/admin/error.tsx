'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Optionally log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-red-50 text-red-600 p-4 rounded-full mb-6">
        <AlertTriangle size={48} />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Tindakan Gagal</h2>
      <p className="text-gray-600 mb-8 max-w-lg mx-auto">
        {error.message || "Terjadi kesalahan saat memproses permintaan Anda."}
      </p>
      <button
        onClick={
          // Attempt to recover by trying to re-render the segment
          () => reset()
        }
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 px-6 rounded-lg transition-colors inline-flex items-center gap-2"
      >
        <RefreshCcw size={18} />
        Kembali / Coba Lagi
      </button>
    </div>
  );
}
