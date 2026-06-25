'use client';

import { useState } from 'react';
import { Trash2, Loader2, AlertTriangle } from 'lucide-react';

export default function DeleteActionButton({ 
  id, 
  action, 
  title = "Hapus",
  iconOnly = false
}: { 
  id: string, 
  action: (formData: FormData) => Promise<{error?: string} | void>,
  title?: string,
  iconOnly?: boolean
}) {
  const [isPending, setIsPending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleDelete = async () => {
    setIsPending(true);
    setErrorMsg('');
    const formData = new FormData();
    formData.append('id', id);
    try {
      const res = await action(formData);
      if (res && res.error) {
        // Show error within the same modal
        setErrorMsg(res.error);
      } else {
        // Success
        setShowConfirm(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal memproses aksi penghapusan.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <>
      <button 
        type="button"
        onClick={() => setShowConfirm(true)} 
        disabled={isPending}
        title={title}
        className={
          iconOnly 
            ? "text-red-500 hover:text-red-700 p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
            : "text-red-500 hover:text-red-700 px-3 py-1.5 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center gap-1.5 font-medium text-sm border border-transparent hover:border-red-100 disabled:opacity-50"
        }
      >
        <Trash2 size={iconOnly ? 18 : 16} /> 
        {!iconOnly && <span className="hidden sm:inline">{title}</span>}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all" onClick={e => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4 mx-auto">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                {errorMsg ? 'Tindakan Ditolak' : 'Konfirmasi Penghapusan'}
              </h3>
              
              {errorMsg ? (
                <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-100 text-sm text-red-700 text-center leading-relaxed">
                  {errorMsg}
                </div>
              ) : (
                <p className="text-center text-gray-600 mb-2 leading-relaxed">
                  Apakah Anda yakin ingin menghapus data ini secara permanen? Tindakan ini tidak dapat dibatalkan.
                </p>
              )}
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
              <button 
                type="button"
                onClick={() => { setShowConfirm(false); setErrorMsg(''); }}
                className="px-5 py-2.5 text-gray-700 font-medium hover:bg-gray-200 bg-gray-100 rounded-xl transition-colors"
              >
                {errorMsg ? 'Tutup' : 'Batal'}
              </button>
              
              {!errorMsg && (
                <button 
                  type="button"
                  onClick={handleDelete}
                  disabled={isPending}
                  className="px-5 py-2.5 bg-red-600 text-white font-medium hover:bg-red-700 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {isPending ? <Loader2 size={18} className="animate-spin" /> : 'Ya, Hapus'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
