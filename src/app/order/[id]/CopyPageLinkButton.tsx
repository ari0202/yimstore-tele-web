'use client';

import { useState, useEffect } from 'react';
import { Link2, Check } from 'lucide-react';

export default function CopyPageLinkButton() {
  const [copied, setCopied] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    setUrl(window.location.href);
  }, []);

  const handleCopy = () => {
    if (!url) return;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mt-4 pt-4 border-t border-[var(--color-border-soft)]">
      <p className="text-sm text-gray-500 mb-2 text-center">
        Simpan tautan ini untuk mengakses kembali pesanan dan klaim garansi Anda di kemudian hari (tanpa perlu Telegram).
      </p>
      <button 
        onClick={handleCopy}
        className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 flex justify-center items-center gap-2
          ${copied 
            ? 'bg-green-100 hover:bg-green-200 text-green-700 border border-green-200 shadow-sm' 
            : 'bg-gray-50 hover:bg-gray-100 text-gray-600 border border-gray-200 shadow-sm'}`}
      >
        {copied ? <Check size={18} /> : <Link2 size={18} />}
        {copied ? 'Tautan Berhasil Disalin!' : 'Salin Tautan Halaman Ini'}
      </button>
    </div>
  );
}
