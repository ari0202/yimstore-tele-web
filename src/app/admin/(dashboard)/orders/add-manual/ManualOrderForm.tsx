'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Copy, CheckCircle2 } from 'lucide-react';

export default function ManualOrderForm({ products }: { products: any[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [productId, setProductId] = useState(products.length > 0 ? products[0].id : '');
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0]);
  const [warrantyDays, setWarrantyDays] = useState(30);
  const [remainingClaims, setRemainingClaims] = useState(2);
  const [useProductPrice, setUseProductPrice] = useState(false);
  
  // Result State
  const [successLink, setSuccessLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessLink('');
    setCopied(false);

    try {
      const res = await fetch('/api/admin/orders/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId,
          purchaseDate,
          warrantyDays: Number(warrantyDays),
          remainingClaims: Number(remainingClaims),
          useProductPrice
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan saat membuat pesanan');
      }

      // Success
      const fullUrl = `${window.location.origin}${data.orderUrl}`;
      setSuccessLink(fullUrl);
      
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (successLink) {
      navigator.clipboard.writeText(successLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (successLink) {
    return (
      <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl shadow-sm p-8 text-center max-w-2xl mx-auto mt-10 transition-colors">
        <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 size={32} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Pesanan Manual Berhasil Dibuat!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Berikan tautan di bawah ini kepada pembeli agar mereka bisa mengklaim garansinya sendiri.</p>
        
        <div className="bg-gray-50 dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-4 mb-6 flex flex-col items-center gap-4">
          <code className="text-sm text-gray-800 dark:text-gray-200 break-all">{successLink}</code>
          <button 
            onClick={copyToClipboard}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              copied ? 'bg-green-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
            }`}
          >
            {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
            {copied ? 'Tersalin!' : 'Salin Tautan'}
          </button>
        </div>

        <button 
          onClick={() => {
            setSuccessLink('');
            setProductId(products.length > 0 ? products[0].id : '');
          }}
          className="text-blue-600 hover:underline text-sm font-medium"
        >
          Buat Pesanan Manual Lainnya
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-900 border dark:border-gray-800 rounded-xl shadow-sm overflow-hidden max-w-2xl transition-colors">
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {errorMsg && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 rounded-lg text-sm">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Produk yang Dibeli</label>
          <select 
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-4 py-2 border outline-none"
            required
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} (Max Klaim: {p.max_claim_limit})</option>
            ))}
          </select>
          <div className="flex items-start gap-3 mt-3">
            <div className="flex items-center h-5">
              <input
                id="useProductPrice"
                type="checkbox"
                checked={useProductPrice}
                onChange={(e) => setUseProductPrice(e.target.checked)}
                className="w-4 h-4 border-gray-300 dark:border-gray-700 rounded text-blue-600 focus:ring-blue-500 dark:bg-gray-800"
              />
            </div>
            <div className="text-sm">
              <label htmlFor="useProductPrice" className="font-medium text-gray-700 dark:text-gray-300">
                Hitung sebagai Penjualan
              </label>
              <p className="text-gray-500 dark:text-gray-400">
                Aktifkan ini jika Anda ingin pesanan manual ini menggunakan harga produk asli. Biarkan nonaktif (Rp 0) agar tidak mempengaruhi laporan pendapatan platform.
              </p>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tanggal Pembelian Asli</label>
          <input 
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            className="w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-transparent text-gray-900 dark:text-gray-100 px-4 py-2 border outline-none"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Masa Garansi (Hari)</label>
            <input 
              type="number"
              min="0"
              value={warrantyDays}
              onChange={(e) => setWarrantyDays(Number(e.target.value))}
              className="w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-transparent text-gray-900 dark:text-gray-100 px-4 py-2 border outline-none"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Sistem akan otomatis menghitung tanggal kedaluwarsa.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sisa Jatah Klaim</label>
            <input 
              type="number"
              min="0"
              value={remainingClaims}
              onChange={(e) => setRemainingClaims(Number(e.target.value))}
              className="w-full border-gray-300 dark:border-gray-700 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 bg-transparent text-gray-900 dark:text-gray-100 px-4 py-2 border outline-none"
              required
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Berapa kali lagi pembeli ini boleh mengklaim.</p>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t dark:border-gray-800">
          <button 
            type="button"
            onClick={() => router.push('/admin/orders')}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 font-medium transition-colors"
          >
            Batal
          </button>
          <button 
            type="submit"
            disabled={loading || products.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? 'Memproses...' : <><Save size={18} /> Simpan & Buat Tautan</>}
          </button>
        </div>
      </form>
    </div>
  );
}
