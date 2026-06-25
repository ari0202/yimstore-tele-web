'use client';

import Link from 'next/link';
import { MagnifyingGlass } from '@phosphor-icons/react';

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b border-[var(--color-border-soft)] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="text-xl font-bold tracking-tight text-[var(--color-text-primary)]">
              Yim Digital
            </Link>
          </div>

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-xl px-8 hidden md:block">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlass size={18} className="text-[var(--color-text-muted)]" />
              </div>
              <input 
                type="text" 
                className="block w-full pl-10 pr-3 py-2 border border-[var(--color-border-soft)] rounded-full leading-5 bg-[var(--color-surface-bg)] placeholder-[var(--color-text-muted)] focus:outline-none focus:bg-white focus:ring-1 focus:ring-[var(--color-action-primary)] focus:border-[var(--color-action-primary)] sm:text-sm transition-colors" 
                placeholder="Cari produk digital..." 
              />
            </div>
          </div>

          {/* Right: Links */}
          <div className="flex items-center space-x-6">
            <Link href="#" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors hidden sm:block">
              Catalog
            </Link>
            <Link href="#" className="text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors hidden sm:block">
              FAQ
            </Link>
            <Link href="#" className="text-sm font-medium text-[var(--color-action-primary)] hover:text-[var(--color-action-hover)] transition-colors">
              My Order
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
