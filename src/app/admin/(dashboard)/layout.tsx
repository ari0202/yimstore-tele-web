import { verifyAdminSession, logoutAdmin } from '@/lib/auth';
import { LogOut, LayoutDashboard, Package, Grid, Settings } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import AdminHeader from '@/components/AdminHeader';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Absolute Read-Stateful Validation (Anti-Exfiltration)
  await verifyAdminSession();

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="h-16 flex items-center px-6 border-b border-gray-200 shrink-0">
          <h1 className="text-xl font-bold text-gray-900">YimStore Admin</h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <Link href="/admin" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <LayoutDashboard size={20} /> Dashboard
          </Link>
          <Link href="/admin/categories" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Grid size={20} /> Categories
          </Link>
          <Link href="/admin/products" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Package size={20} /> Products
          </Link>
          <Link href="/admin/inventory" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Package size={20} /> Bulk Upload
          </Link>
          <Link href="/admin/settings" className="flex items-center gap-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            <Settings size={20} /> Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-gray-200 shrink-0">
          <form action={logoutAdmin}>
            <button className="flex w-full items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut size={20} />
              Logout
            </button>
          </form>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-50">
        <AdminHeader />
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
