"use client";

import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

export default function PaymentSection({
  qrisString,
  totalAmount,
  paymentExpiredAt,
  token,
}: {
  qrisString: string;
  totalAmount: number;
  paymentExpiredAt: string;
  token: string;
}) {
  const [timeLeft, setTimeLeft] = useState<string>("--:--");
  const [isCopied, setIsCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!paymentExpiredAt) return;
    
    const targetDate = new Date(paymentExpiredAt).getTime();
    
    const updateCountdown = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;
      
      if (difference <= 0) {
        setTimeLeft("Kedaluwarsa");
        return;
      }
      
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);
      
      setTimeLeft(
        `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [paymentExpiredAt]);

  const handleCopyNominal = () => {
    navigator.clipboard.writeText(totalAmount.toString());
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svg = document.getElementById("qris-svg");
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const url = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = url;
      a.download = `QRIS-YimStore-${totalAmount}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    };
    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="space-y-5">
      
      {/* 1 & 2. Harga & Timer Digabungkan */}
      <div className="bg-blue-50/50 border border-blue-200 p-5 rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm relative mx-auto w-full max-w-sm">
        
        {/* Countdown Timer */}
        <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm border border-red-200 mb-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <span className="text-xs font-bold uppercase tracking-wider">Sisa Waktu: </span>
          <span className="font-mono text-sm font-bold">{timeLeft}</span>
        </div>

        <p className="text-xs text-blue-600 font-bold uppercase tracking-widest">Total Pembayaran</p>
        
        <div className="flex items-center gap-3 relative">
          <div className="text-4xl font-black text-[var(--color-text-primary)] tracking-tight">
            Rp {new Intl.NumberFormat('id-ID').format(totalAmount)}
          </div>
          <button 
            onClick={handleCopyNominal}
            className="p-2.5 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-gray-700 transition-colors shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none flex items-center justify-center group"
            title="Salin Nominal"
          >
            {isCopied ? (
              <>
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                <span className="text-xs font-bold text-green-700 absolute -bottom-8 whitespace-nowrap bg-green-50 px-2 py-1 rounded-md border border-green-200 shadow-sm transition-all z-10">Disalin!</span>
              </>
            ) : (
              <svg className="w-5 h-5 text-blue-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
            )}
          </button>
        </div>
      </div>

      {/* 3. QRIS Area */}
      <div className="flex flex-col items-center gap-3">
        <div className="inline-block p-4 bg-white rounded-[1.5rem] shadow-[0_4px_20px_rgb(0,0,0,0.06)] border border-[var(--color-border-soft)]">
          <QRCodeSVG 
            value={qrisString} 
            size={240}
            level="H"
            includeMargin={true}
            className="mx-auto rounded-xl"
            id="qris-svg"
          />
        </div>
        
        <button 
          onClick={handleDownloadQR}
          className="flex items-center gap-2 px-5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold rounded-xl shadow-sm transition-colors text-sm focus:ring-2 focus:ring-gray-200"
        >
          <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          Simpan QRIS ke Galeri
        </button>
      </div>

      {/* 4. Instruksi Pembayaran */}
      <div className="bg-[var(--color-surface-core)] border border-[var(--color-border-soft)] p-4 rounded-2xl max-w-md mx-auto text-left space-y-2">
        <h4 className="font-bold text-[var(--color-text-secondary)] text-sm uppercase tracking-wide flex items-center gap-2">
          <svg className="w-5 h-5 text-[var(--color-action-primary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          Cara Bayar via HP
        </h4>
        <ul className="text-sm text-[var(--color-text-secondary)] space-y-1.5 list-disc pl-5">
          <li>Simpan kode QRIS ke galeri (atau <i>screenshot</i>).</li>
          <li>Buka aplikasi <b>M-Banking / e-Wallet</b>.</li>
          <li>Pilih fitur <b>Scan QRIS</b>, lalu unggah gambar dari galeri.</li>
          <li>Setelah bayar, halaman ini akan otomatis memuat ulang.</li>
        </ul>
      </div>

      {/* 5. Fallback Help */}
      <div className="pt-4 border-t border-[var(--color-border-soft)]">
        <a 
          href={process.env.NEXT_PUBLIC_ADMIN_TELEGRAM || `https://t.me/YimStoreBot`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full max-w-md px-6 py-3 bg-[var(--color-action-primary)] hover:bg-[var(--color-action-hover)] text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg gap-3 text-base"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.223-.548.223l.188-2.85 5.18-4.686c.223-.195-.054-.285-.346-.09l-6.4 4.024-2.76-.86c-.6-.185-.61-.6.125-.89l10.736-4.138c.498-.184.93.116.805.882z"/></svg>
          Bantuan Support Telegram
        </a>
        <p className="text-xs text-[var(--color-text-muted)] mt-2 text-center flex flex-col items-center">
          <span className="flex items-center gap-1 text-green-600 font-medium mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Keamanan transaksi terjamin 100% oleh sistem enkripsi
          </span>
          Pembayaran belum masuk? Jangan panik, hubungi support kami.
        </p>
      </div>
    </div>
  );
}
