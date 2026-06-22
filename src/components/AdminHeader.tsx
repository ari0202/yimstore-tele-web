'use client';

import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function AdminHeader() {
  const pathname = usePathname();
  const router = useRouter();

  // Parse Title
  let title = 'Dashboard';
  if (pathname.includes('/categories')) title = 'Categories';
  else if (pathname.includes('/products')) title = 'Products';
  else if (pathname.includes('/inventory')) title = 'Bulk Upload';
  else if (pathname.includes('/settings')) title = 'Settings';

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
      {pathname !== '/admin' && (
        <button 
          onClick={() => router.back()} 
          className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
          title="Go Back"
        >
          <ArrowLeft size={20} />
        </button>
      )}
      <h1 className="text-xl font-bold text-gray-900">{title}</h1>
    </header>
  );
}
