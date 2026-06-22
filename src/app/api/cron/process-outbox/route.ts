import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { bot } from '@/lib/bot';

export async function POST() {
    // 1. Bersihkan transaksi expired & buang completed events yang sudah lama
    await supabaseAdmin.rpc('system_periodic_cleanup');
    
    // 2. Ambil antrean outbox dengan SKIP LOCKED
    const { data: events } = await supabaseAdmin.rpc('get_pending_outbox_events', { batch_size: 10 });
    if (!events || events.length === 0) return NextResponse.json({ processed: 0 });

    for (const event of events) {
        try {
            if (event.event_type === 'PAYMENT_COMPLETED') {
                // 3a. Fulfillment via Monolithic Atomic RPC
                const { data: result } = await supabaseAdmin.rpc('process_payment_fulfillment', { 
                    p_order_id: event.payload.order_id, 
                    p_amount: event.payload.amount 
                });
                
                let errMsg = null;
                if (result === 'DUPLICATE') errMsg = 'Duplicate payment skipped';
                else if (result === 'AMOUNT_MISMATCH') errMsg = 'Amount mismatch';
                else if (result === 'NEEDS_REFUND') {
                    errMsg = 'Fallback stock depleted. Needs manual refund.';
                    // Admin Notification
                    const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
                    if (adminChatId) {
                        await bot.api.sendMessage(
                            adminChatId,
                            `🚨 KONDISI KRITIS: STOK HABIS SAAT PEMBAYARAN MASUK!\n\nOrder ID: ${event.payload.order_id}\n\nPelanggan telah membayar namun stok pengganti darurat (fallback) sepenuhnya kosong. Segera lakukan REFUND manual kepada pelanggan.`
                        ).catch(e => console.error('Admin alert failed', e));
                    }
                }

                await supabaseAdmin.from('outbox_events').update({ 
                    status: 'completed', 
                    error_message: errMsg 
                }).eq('id', event.id);

            } else if (event.event_type === 'DELIVER_CREDENTIALS') {
                const orderId = event.payload.order_id;
                const { data: order } = await supabaseAdmin
                  .from('orders')
                  .select('user_id, access_token, users(telegram_chat_id)')
                  .eq('id', orderId)
                  .single();

                const chatId = (order?.users as any)?.telegram_chat_id;
                if (chatId) {
                  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/order/${orderId}?token=${order?.access_token}`;
                  await bot.api.sendMessage(
                    chatId, 
                    `🎉 Pesanan Anda berhasil diproses!\n\nID Pesanan: ${orderId}\n\nAkses kredensial produk Anda melalui Dashboard Web kami:\n🔗 ${dashboardUrl}`
                  );
                }
                
                await supabaseAdmin.from('orders').update({ delivery_status: 'Delivered' }).eq('id', orderId);
                await supabaseAdmin.from('outbox_events').update({ status: 'completed' }).eq('id', event.id);

            } else if (event.event_type === 'DELIVER_WARRANTY_CREDENTIAL') {
                const orderItemId = event.payload.order_item_id;
                const { data: orderItem } = await supabaseAdmin
                  .from('order_items')
                  .select('order_id, orders(access_token, users(telegram_chat_id))')
                  .eq('id', orderItemId)
                  .single();
                  
                const chatId = ((orderItem?.orders as any)?.users as any)?.telegram_chat_id;
                if (chatId) {
                  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/order/${orderItem?.order_id}?token=${(orderItem?.orders as any)?.access_token}`;
                  await bot.api.sendMessage(
                    chatId, 
                    `🛡️ Klaim Garansi Berhasil!\n\nKredensial pengganti telah dialokasikan ke pesanan Anda. Silakan periksa di Dashboard:\n🔗 ${dashboardUrl}`
                  );
                }
                await supabaseAdmin.from('outbox_events').update({ status: 'completed' }).eq('id', event.id);

            } else if (event.event_type === 'ADMIN_ALERT_OUT_OF_STOCK') {
                const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
                if (adminChatId) {
                  await bot.api.sendMessage(
                    adminChatId,
                    `⚠️ PERINGATAN STOK HABIS\n\nProduk ID: ${event.payload.product_id}\n\nTerdapat pelanggan yang menekan tombol klaim garansi namun stok kosong. Silakan segera restock untuk memenuhi antrean klaim.`
                  );
                }
                await supabaseAdmin.from('outbox_events').update({ status: 'completed' }).eq('id', event.id);

            } else if (event.event_type === 'BROADCAST_TESTIMONIAL') {
                try {
                  // Ambil setting channel ID
                  const { data: settings } = await supabaseAdmin
                    .from('system_settings')
                    .select('value')
                    .eq('key', 'telegram_testimoni_channel_id')
                    .single();
                    
                  const channelId = settings?.value;
                  if (channelId && channelId.trim() !== '') {
                    // Ambil nama produk untuk testimonial (di-pass di payload)
                    // Aturannya: produk id / nama produk disuntikkan ke payload saat payment sukses.
                    // Jika tidak ada di payload, fallback ke "Produk Digital"
                    const productName = event.payload?.product_name || "Produk Digital";
                    
                    await bot.api.sendMessage(
                      channelId,
                      `🎉 *Transaksi Berhasil!*\nSeseorang baru saja membeli *${productName}*.\nTerima kasih atas kepercayaannya!`,
                      { parse_mode: 'Markdown' }
                    );
                  }
                } catch (broadcastErr) {
                  // ISOLATED FAILURE: Jangan lemparkan error ke atas agar cron loop tetap berjalan
                  console.error('Testimonial broadcast failed:', broadcastErr);
                }
                // Mark event as completed regardless of whether marketing broadcast failed
                await supabaseAdmin.from('outbox_events').update({ status: 'completed' }).eq('id', event.id);
            }
        } catch (e: any) {
            // [RETRY LOGIC UNTUK EXTERNAL API FAILURES]
            const currentRetries = event.retry_count || 0;
            if (currentRetries < 3) {
                await supabaseAdmin.from('outbox_events').update({ 
                    status: 'pending', 
                    retry_count: currentRetries + 1, 
                    error_message: e.message 
                }).eq('id', event.id);
            } else {
                await supabaseAdmin.from('outbox_events').update({ 
                    status: 'failed', 
                    error_message: `Max retries reached: ${e.message}` 
                }).eq('id', event.id);
            }
        }
    }
    return NextResponse.json({ processed: events.length });
}
