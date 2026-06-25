'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export default function CopyOrderLinkButton({ orderId, accessToken }: { orderId: string, accessToken: string }) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/order/${orderId}---${accessToken}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!accessToken) return null;

  return (
    <button
      onClick={copyToClipboard}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)] bg-[var(--color-surface-bg)] hover:bg-[var(--color-surface-core)] rounded-lg transition-colors border border-transparent hover:border-[var(--color-border-soft)] focus:outline-none focus:ring-2 focus:ring-[var(--color-action-primary)]"
      title="Salin Kredensial Link"
    >
      {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
      <span className="hidden sm:inline">{copied ? 'Tersalin' : 'Salin Link'}</span>
    </button>
  );
}
