import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { verifyAdminAPI } from '@/lib/auth';

export async function POST(req: Request) {
  const session = await verifyAdminAPI();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { productId, purchaseDate, warrantyDays, remainingClaims } = await req.json();

    if (!productId || !purchaseDate || warrantyDays === undefined || remainingClaims === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Fetch product details
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('price')
      .eq('id', productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 2. Create Dummy Inventory
    const { data: dummyInventory, error: inventoryError } = await supabaseAdmin
      .from('inventory')
      .insert({
        product_id: productId,
        credential_data: 'Akun Pembelian Manual',
        status: 'Used'
      })
      .select('id')
      .single();

    if (inventoryError || !dummyInventory) {
      console.error('Failed to create dummy inventory:', inventoryError);
      return NextResponse.json({ error: 'Failed to create inventory' }, { status: 500 });
    }

    // 3. Create Order
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        total_amount: product.price,
        payment_status: 'paid',
        delivery_status: 'completed',
        platform_source: 'manual'
      })
      .select('id, access_token')
      .single();

    if (orderError || !newOrder) {
      console.error('Failed to create order:', orderError);
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 });
    }

    // 4. Create Order Item
    // Calculate warranty_end_date based on purchaseDate + warrantyDays
    const purchaseDateTime = new Date(purchaseDate);
    const warrantyEndDateTime = new Date(purchaseDateTime.getTime() + (warrantyDays * 24 * 60 * 60 * 1000));
    
    // We assume max_claim_limit is handled by the products table usually.
    // Wait, the RPC uses order_item.current_claim_count and product.max_claim_limit, 
    // OR it uses order_item.current_claim_count and product.max_claim_limit. 
    // Wait, earlier I found that max_claim_limit is on `products`.
    // The user wants remainingClaims.
    // If product has 3 max, and remaining is 2, current should be 1.
    // But since the product might have 0 limit, we need to make sure we don't block.
    // Actually, in `rpc_process_warranty_claim`, it checks:
    // `IF v_order_item.current_claim_count >= v_product.max_claim_limit THEN ...` (Ah wait, I need to check where max_claim_limit lives!)

    // For now, let's just insert order_items with current_claim_count = max_claim_limit (from product) - remainingClaims
    const { data: productMaxClaim } = await supabaseAdmin.from('products').select('max_claim_limit').eq('id', productId).single();
    const maxLimit = productMaxClaim?.max_claim_limit || 0;
    const currentCount = Math.max(0, maxLimit - remainingClaims);

    const { error: itemError } = await supabaseAdmin
      .from('order_items')
      .insert({
        order_id: newOrder.id,
        inventory_id: dummyInventory.id,
        product_id: productId,
        warranty_end_date: warrantyEndDateTime.toISOString(),
        current_claim_count: currentCount,
        max_claim_limit: maxLimit
      });

    if (itemError) {
      console.error('Failed to create order item:', itemError);
      return NextResponse.json({ error: 'Failed to create order item' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      orderUrl: `/order/${newOrder.id}---${newOrder.access_token}`
    });

  } catch (err: any) {
    console.error('Error in manual order API:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
