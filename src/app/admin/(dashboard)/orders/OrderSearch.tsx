'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';

export default function OrderSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams?.get('q') || '');
  const isFirstRender = useRef(true);

  // Debounce search
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const currentUrlQ = searchParams?.get('q') || '';
    if (query === currentUrlQ) {
      // Don't trigger search if query hasn't changed from URL (e.g. when paginating)
      return;
    }

    const delayDebounceFn = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString() || '');
      
      if (query.trim()) {
        params.set('q', query.trim());
      } else {
        params.delete('q');
      }
      
      // Reset to page 1 on new search
      params.set('page', '1');
      
      router.push(`/admin/orders?${params.toString()}`);
    }, 300); // 300ms delay

    return () => clearTimeout(delayDebounceFn);
  }, [query, router, searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (query.trim()) {
      params.set('q', query.trim());
    } else {
      params.delete('q');
    }
    params.set('page', '1');
    router.push(`/admin/orders?${params.toString()}`);
  };

  return (
    <form onSubmit={handleSubmit} className="relative max-w-md w-full flex items-center">
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <Search size={18} className="text-[var(--color-text-muted)]" />
      </div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="block w-full pl-10 pr-16 py-2 border border-[var(--color-border-soft)] rounded-lg leading-5 bg-[var(--color-surface-bg)] placeholder-[var(--color-text-muted)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-action-primary)] focus:border-[var(--color-action-primary)] sm:text-sm transition-colors"
        placeholder="Cari pesanan..."
      />
      <button 
        type="submit"
        className="absolute right-1 top-1 bottom-1 px-3 text-xs font-semibold bg-[var(--color-action-primary)] text-[var(--color-surface-bg)] rounded-md hover:bg-[var(--color-action-hover)] transition-colors"
      >
        Cari
      </button>
    </form>
  );
}
