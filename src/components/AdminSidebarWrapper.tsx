'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, LayoutDashboard, Package, Grid, Settings, Menu, X, PlusSquare, ShoppingCart, Moon, Sun } from 'lucide-react';
import { handleLogout } from '@/app/admin/actions';
import { useTheme } from 'next-themes';

export default function AdminSidebarWrapper({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme, resolvedTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Parse Title for Header
  let title = 'Dashboard';
  if (pathname.includes('/categories')) title = 'Categories';
  else if (pathname.includes('/products')) title = 'Products';
  else if (pathname.includes('/inventory/available')) title = 'Available Inventory';
  else if (pathname.includes('/inventory')) title = 'Bulk Upload';
  else if (pathname.includes('/orders')) title = 'Manajemen Pesanan';
  else if (pathname.includes('/settings')) title = 'Settings';

  return (
    <div className="min-h-[100dvh] bg-gray-50 dark:bg-gray-950 flex relative w-full overflow-hidden transition-colors">
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col fixed md:relative top-0 bottom-0 z-50 transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 transition-colors`}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-gray-800 shrink-0 transition-colors">
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">YimStore Admin</h1>
          <button onClick={() => setIsOpen(false)} className="md:hidden p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
             <X size={24} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <Link href="/admin" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${pathname === '/admin' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/admin/categories" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${pathname.includes('/categories') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <Grid size={20} /> Categories
          </Link>
          <Link href="/admin/orders" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${pathname.includes('/orders') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <ShoppingCart size={20} /> Pesanan
          </Link>
          <Link href="/admin/products" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${pathname === '/admin/products' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <Package size={20} /> Products
          </Link>
          <Link href="/admin/products/add" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${pathname === '/admin/products/add' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <PlusSquare size={20} /> Tambah Produk
          </Link>
          <Link href="/admin/inventory" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${pathname === '/admin/inventory' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <Package size={20} /> Bulk Upload
          </Link>
          <Link href="/admin/inventory/available" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${pathname.includes('/inventory/available') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <Grid size={20} /> Available Inventory
          </Link>
          <Link href="/admin/settings" onClick={() => setIsOpen(false)} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors ${pathname.includes('/settings') ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
            <Settings size={20} /> Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200 dark:border-gray-800 shrink-0 transition-colors">
          <form action={handleLogout}>
            <button className="flex w-full items-center gap-3 px-3 py-2.5 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors">
              <LogOut size={20} />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-gray-50 dark:bg-gray-950 h-[100dvh] overflow-hidden transition-colors">
        {/* Header embedded inside Wrapper so it can toggle sidebar */}
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 sm:px-8 h-16 flex items-center justify-between shrink-0 shadow-sm z-10 transition-colors">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsOpen(true)} 
              className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 rounded-lg md:hidden transition-colors"
            >
              <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 truncate">{title}</h1>
          </div>
          <div className="w-9 h-9 flex items-center justify-center">
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Toggle theme"
              >
                {resolvedTheme === 'dark' ? <Sun size={20} className="text-yellow-500" /> : <Moon size={20} />}
              </button>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-4 sm:p-8 bg-gray-50 dark:bg-gray-950 transition-colors">
          {children}
        </div>
      </main>
    </div>
  );
}
