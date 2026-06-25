'use client';

import Link from 'next/link';
import { MagnifyingGlass, List, X } from '@phosphor-icons/react';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams?.get('q') || '');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}#catalog`);
      setIsMobileMenuOpen(false);
    } else {
      router.push(`/`);
      setIsMobileMenuOpen(false);
    }
  };

  return (
    <nav className="w-full bg-[var(--color-surface-card)] border-b border-[var(--color-border-soft)] sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Yim Digital
            </Link>
          </div>

          {/* Center: Search Bar (Desktop) */}
          <div className="flex-1 max-w-xl px-8 hidden md:block">
            <form onSubmit={handleSearch} className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlass size={18} className="text-[var(--color-text-muted)]" />
              </div>
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-[var(--color-border-soft)] rounded-full leading-5 bg-[var(--color-surface-bg)] placeholder-[var(--color-text-muted)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-action-primary)] focus:border-[var(--color-action-primary)] sm:text-sm transition-colors" 
                placeholder="Cari produk digital..." 
              />
            </form>
          </div>

          {/* Right: Links (Desktop) */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/#catalog" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
              Catalog
            </Link>
            <Link href="/#faq" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
              FAQ
            </Link>
            <Link href="/cari-pesanan" className="text-sm font-medium text-[var(--color-action-primary)] hover:text-[var(--color-action-hover)] transition-colors">
              My Order
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] focus:outline-none p-2"
            >
              {isMobileMenuOpen ? <X size={24} /> : <List size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[var(--color-surface-card)] border-t border-[var(--color-border-soft)] px-4 pt-2 pb-4 space-y-4 shadow-lg">
          <form onSubmit={handleSearch} className="relative mt-2">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlass size={18} className="text-[var(--color-text-muted)]" />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-[var(--color-border-soft)] rounded-full leading-5 bg-[var(--color-surface-bg)] placeholder-[var(--color-text-muted)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-action-primary)] focus:border-[var(--color-action-primary)] sm:text-sm transition-colors" 
              placeholder="Cari produk digital..." 
            />
          </form>
          <div className="flex flex-col space-y-3 pt-2 px-2">
            <Link href="/#catalog" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
              Catalog
            </Link>
            <Link href="/#faq" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]">
              FAQ
            </Link>
            <Link href="/cari-pesanan" onClick={() => setIsMobileMenuOpen(false)} className="text-base font-medium text-[var(--color-action-primary)] hover:text-[var(--color-action-hover)]">
              My Order
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
