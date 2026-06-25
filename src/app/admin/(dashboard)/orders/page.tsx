import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdminSession } from '@/lib/auth';
import { Clock } from 'lucide-react';
import BypassButton from './BypassButton';
import CopyOrderLinkButton from './CopyOrderLinkButton';
import OrderRowClient from './OrderRowClient';
import OrderSearch from './OrderSearch';
import Pagination from './Pagination';
import { Suspense } from 'react';

export default async function OrdersPage({ searchParams }: { searchParams: { q?: string, page?: string } }) {
  await verifyAdminSession();
  const resolvedSearch = await searchParams;
  const q = resolvedSearch.q?.toLowerCase() || '';
  const currentPage = Math.max(1, Number(resolvedSearch.page) || 1);
  const PAGE_SIZE = 20;
  
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let filteredOrders: any[] = [];
  let totalCount = 0;

  const selectQuery = `
    id, created_at, payment_status, total_amount, platform_source, access_token,
    users(telegram_chat_id),
    order_items(
      id, current_claim_count, cooldown_bypass_active, warranty_end_date,
      products(name, max_claim_limit)
    )
  `;

  if (q) {
    // If searching, fetch a generous limit and filter in-memory to preserve cross-relation search capability without complex DB views
    const { data: allOrders } = await supabaseAdmin
      .from('orders')
      .select(selectQuery)
      .order('created_at', { ascending: false })
      .limit(3000);

    if (allOrders) {
      const searchResults = allOrders.filter(
        (o: any) =>
          o.id.toLowerCase().includes(q) ||
          (o.users && !Array.isArray(o.users) ? o.users.telegram_chat_id?.toLowerCase().includes(q) : false) ||
          o.order_items?.some((i: any) => i.products?.name?.toLowerCase().includes(q))
      );
      totalCount = searchResults.length;
      filteredOrders = searchResults.slice(from, to + 1); // Apply pagination to search results
    }
  } else {
    // Standard fast database pagination
    const { data: pagedOrders, count } = await supabaseAdmin
      .from('orders')
      .select(selectQuery, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (pagedOrders) {
      filteredOrders = pagedOrders;
      totalCount = count || 0;
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)] transition-colors">Manajemen Pesanan</h1>
        <div className="flex w-full sm:w-auto items-center gap-3">
          <Suspense fallback={<div className="h-9 w-64 bg-[var(--color-surface-core)] rounded-lg animate-pulse"></div>}>
            <OrderSearch />
          </Suspense>
          <a href="/admin/orders/add-manual" className="shrink-0 px-4 py-2 bg-[var(--color-action-primary)] text-white rounded-lg hover:bg-[var(--color-action-hover)] font-medium text-sm transition-colors">
            + Tambah Manual
          </a>
        </div>
      </div>

      <div className="bg-[var(--color-surface-card)] border border-[var(--color-border-soft)] rounded-xl shadow-sm overflow-hidden transition-colors">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-[var(--color-text-secondary)]">
            <thead className="bg-[var(--color-surface-core)] border-b border-[var(--color-border-soft)] text-[var(--color-text-primary)] transition-colors">
              <tr>
                <th className="px-4 md:px-6 py-4 font-semibold">Order ID / Tanggal</th>
                <th className="px-4 md:px-6 py-4 font-semibold hidden sm:table-cell">Pelanggan</th>
                <th className="px-4 md:px-6 py-4 font-semibold hidden lg:table-cell">Item & Status Garansi</th>
                <th className="px-4 md:px-6 py-4 font-semibold">Total Bayar</th>
                <th className="px-6 py-4 font-semibold text-right hidden lg:table-cell">Aksi Manual</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-soft)] transition-colors">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order: any) => (
                  <OrderRowClient key={order.id} order={order} />
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--color-text-muted)] transition-colors">
                    Tidak ada pesanan yang sesuai dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          {totalPages > 1 && (
            <Pagination totalPages={totalPages} currentPage={currentPage} />
          )}
        </div>
      </div>
    </div>
  );
}
