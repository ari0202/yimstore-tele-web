'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button 
      onClick={handleCopy}
      className="absolute top-0 right-0 bg-gray-800 hover:bg-gray-700 text-xs text-gray-300 px-3 py-1.5 rounded-bl-lg rounded-tr-xl font-mono flex items-center gap-1.5 transition-colors"
      title="Salin Kredensial"
    >
      {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
      {copied ? 'Tersalin!' : 'Salin'}
    </button>
  );
}
