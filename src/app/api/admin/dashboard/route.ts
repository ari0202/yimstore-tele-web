import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get('range') || '7d'; // 'today', '7d', '30d', 'all'
    
    let startDate = new Date();
    if (range === 'today') {
      startDate.setHours(0, 0, 0, 0);
    } else if (range === '7d') {
      startDate.setDate(startDate.getDate() - 7);
    } else if (range === '30d') {
      startDate.setDate(startDate.getDate() - 30);
    } else if (range === 'all') {
      startDate = new Date(0); // Epoch
    }

    const startDateStr = startDate.toISOString();

    // 1. Fetch Orders in range (completed/paid)
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('id, total_amount, created_at, payment_status')
      .gte('created_at', startDateStr)
      .eq('payment_status', 'paid');

    if (ordersError) throw ordersError;

    // Financial Metrics
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
    const totalOrders = orders.length;
    const aov = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // 2. Fetch Time-series Data
    const timeSeriesMap: Record<string, { date: string; revenue: number; orders: number }> = {};
    
    // Initialize empty dates for the range
    if (range !== 'all') {
      const days = range === '30d' ? 30 : range === '7d' ? 7 : 1;
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        timeSeriesMap[dateStr] = { date: dateStr, revenue: 0, orders: 0 };
      }
    }

    orders.forEach(o => {
      const d = new Date(o.created_at).toISOString().split('T')[0];
      if (!timeSeriesMap[d]) {
        timeSeriesMap[d] = { date: d, revenue: 0, orders: 0 };
      }
      timeSeriesMap[d].revenue += Number(o.total_amount);
      timeSeriesMap[d].orders += 1;
    });

    const chartData = Object.values(timeSeriesMap).sort((a, b) => a.date.localeCompare(b.date));

    // 3. Operational Status Counts (All time, or just recent?)
    // Let's get all pending/processing/completed delivery_status from paid orders
    const { data: allPaidOrders } = await supabaseAdmin
      .from('orders')
      .select('delivery_status')
      .eq('payment_status', 'paid');
      
    const operationalStatus = {
      pending: 0,
      processing: 0,
      completed: 0
    };
    allPaidOrders?.forEach(o => {
      if (o.delivery_status === 'pending') operationalStatus.pending++;
      else if (o.delivery_status === 'processing') operationalStatus.processing++;
      else if (o.delivery_status === 'completed') operationalStatus.completed++;
    });

    // 4. Recent 5 Orders
    const { data: recentOrders } = await supabaseAdmin
      .from('orders')
      .select('id, created_at, total_amount, payment_status, delivery_status, users(telegram_chat_id)')
      .order('created_at', { ascending: false })
      .limit(5);

    // 5. Low Stock Alerts
    // Use the optimized view that handles is_sync_stock logic automatically
    const { data: productsSummary } = await supabaseAdmin
      .from('admin_product_summary_view')
      .select('id, name, total_stock')
      .eq('is_archived', false);

    const lowStockAlerts: any[] = [];
    productsSummary?.forEach(p => {
      if (p.total_stock <= 5) {
        lowStockAlerts.push({ id: p.id, name: p.name, stock: p.total_stock });
      }
    });

    // Fetch products to map names for Top Selling
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('id, name')
      .eq('is_archived', false);

    // 6. Top Selling Products (From order_items in range)
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('product_id')
      .gte('created_at', startDateStr);
      
    const productSalesMap: Record<string, number> = {};
    orderItems?.forEach(item => {
      const pid = item.product_id;
      if (pid) {
        productSalesMap[pid] = (productSalesMap[pid] || 0) + 1;
      }
    });

    const topSelling = Object.entries(productSalesMap)
      .map(([id, sales]) => {
        const prod = products?.find(p => p.id === id);
        return {
          id,
          name: prod ? prod.name : 'Unknown Product',
          sales
        };
      })
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5); // Top 5

    return NextResponse.json({
      metrics: {
        totalRevenue,
        totalOrders,
        aov
      },
      chartData,
      operationalStatus,
      recentOrders: recentOrders || [],
      lowStockAlerts,
      topSelling
    });

  } catch (err: any) {
    console.error('Error in dashboard API:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
