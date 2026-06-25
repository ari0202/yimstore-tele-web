import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { bot } from '@/lib/bot';
import { Resend } from 'resend';

export async function POST(req: Request) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
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
                    // Alert ditangani otomatis oleh RPC yang menginjeksi ADMIN_ALERT_NEEDS_REFUND
                    errMsg = 'Fallback stock depleted. Needs manual refund.';
                }

                await supabaseAdmin.from('outbox_events').update({ 
                    status: 'completed', 
                    error_message: errMsg 
                }).eq('id', event.id);

            } else if (event.event_type === 'DELIVER_CREDENTIALS') {
                const orderId = event.payload.order_id;
                const { data: order } = await supabaseAdmin
                  .from('orders')
                  .select('user_id, access_token, platform_source, order_items(inventory(credential_data, products(name, warranty_days))), users(telegram_chat_id)')
                  .eq('id', orderId)
                  .single();
                  
                if (!order) continue;

                const chatId = (order?.users as any)?.telegram_chat_id;
                if (chatId) {
                  const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/order/${orderId}?token=${order?.access_token}`;
                  
                  let msgIdToEdit = null;
                  if (order.platform_source && order.platform_source.startsWith('telegram:')) {
                      msgIdToEdit = parseInt(order.platform_source.replace('telegram:', ''), 10);
                  }
                  
                  const productData = (order?.order_items?.[0] as any)?.inventory?.products;
                  const credData = (order?.order_items?.[0] as any)?.inventory?.credential_data;
                  
                  let credText = `🎉 PESANAN BERHASIL\n\n- Produk: ${productData?.name || 'Digital Product'}\n- Garansi: ${productData?.warranty_days || 0} Hari\n\nKREDENSIAL ANDA:\n`;
                  
                  if (credData && typeof credData === 'object') {
                      for (const [key, val] of Object.entries(credData)) {
                          credText += `- ${key.toUpperCase()}: \`${val}\`\n`;
                      }
                  } else {
                      credText += `\`${credData}\`\n`;
                  }
                  credText += `\n🔗 Akses Dashboard & Klaim: ${dashboardUrl}`;

                  if (msgIdToEdit) {
                      try {
                          await bot.api.editMessageText(chatId, msgIdToEdit, credText, { parse_mode: 'Markdown' });
                      } catch (e) {
                          await bot.api.sendMessage(chatId, credText, { parse_mode: 'Markdown' });
                      }
                  } else {
                      await bot.api.sendMessage(chatId, credText, { parse_mode: 'Markdown' });
                  }
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

            } else if (event.event_type === 'ADMIN_ALERT_NEEDS_REFUND') {
                const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
                if (adminChatId) {
                  await bot.api.sendMessage(
                    adminChatId,
                    `🚨 KONDISI KRITIS: STOK HABIS SAAT PEMBAYARAN MASUK!\n\nOrder ID: ${event.payload.order_id}\nAlasan: ${event.payload.reason}\n\nPelanggan telah membayar namun stok pengganti darurat (fallback) sepenuhnya kosong. Segera lakukan REFUND manual kepada pelanggan.`
                  );
                }
                await supabaseAdmin.from('outbox_events').update({ status: 'completed' }).eq('id', event.id);

            } else if (event.event_type === 'ADMIN_ALERT_FAILED_DELIVERY') {
                const adminChatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
                if (adminChatId) {
                  await bot.api.sendMessage(
                    adminChatId,
                    `💀 DEAD LETTER QUEUE (POISON PILL)\n\nAlasan: ${event.payload.error_reason}\nEvent Asli: ${event.payload.original_event}\nPayload Asli: ${JSON.stringify(event.payload.original_payload)}`
                  );
                }
                await supabaseAdmin.from('outbox_events').update({ status: 'completed' }).eq('id', event.id);

            } else if (event.event_type === 'BROADCAST_TESTIMONIAL') {
                try {
                  const { data: settings } = await supabaseAdmin
                    .from('system_settings')
                    .select('value')
                    .eq('key', 'telegram_testimoni_channel_id')
                    .single();
                    
                  const channelId = settings?.value;
                  if (channelId && channelId.trim() !== '') {
                    const productName = event.payload?.product_name || "Produk Digital";
                    await bot.api.sendMessage(
                      channelId,
                      `🎉 *Transaksi Berhasil!*\nSeseorang baru saja membeli *${productName}*.\nTerima kasih atas kepercayaannya!`,
                      { parse_mode: 'Markdown' }
                    );
                  }
                } catch (broadcastErr) {
                  console.error('Testimonial broadcast failed:', broadcastErr);
                }
                await supabaseAdmin.from('outbox_events').update({ status: 'completed' }).eq('id', event.id);
            } else if (event.event_type === 'send_order_receipt') {
                const { order_id, email, product_name, total_amount, access_token } = event.payload;
                const dashboardUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/order/${order_id}?token=${access_token}`;
                
                if (process.env.RESEND_API_KEY && email) {
                    const resend = new Resend(process.env.RESEND_API_KEY);
                    await resend.emails.send({
                        from: 'YimStore <noreply@yimdigital.store>',
                        to: email,
                        subject: `Struk Pembelian: ${product_name}`,
                        html: `
                            <h2>Terima kasih atas pesanan Anda!</h2>
                            <p>Pesanan untuk <strong>${product_name}</strong> (Rp${Number(total_amount).toLocaleString('id-ID')}) telah kami terima.</p>
                            <p>Anda dapat memantau status pesanan dan melakukan klaim garansi kapan saja melalui tautan aman berikut:</p>
                            <p><a href="${dashboardUrl}" style="display:inline-block; padding: 10px 20px; background-color: #023e8a; color: white; text-decoration: none; border-radius: 5px;">Buka Dashboard Pesanan</a></p>
                            <br/>
                            <p>Simpan email ini baik-baik. Tautan di atas adalah kunci rahasia untuk mengakses pesanan Anda dan mengikatnya ke Telegram Anda di kemudian hari.</p>
                        `
                    });
                } else {
                    console.warn('Skipping email receipt, RESEND_API_KEY is missing or email is null');
                }
                
                await supabaseAdmin.from('outbox_events').update({ status: 'completed' }).eq('id', event.id);
            }
        } catch (e: any) {
            // [EXPONENTIAL BACKOFF RETRY LOGIC]
            const currentRetries = event.retry_count || 0;
            if (currentRetries < 3) {
                // Calculate next retry time: 2^retries * 5 minutes
                const minutesDelay = Math.pow(2, currentRetries) * 5;
                const nextRetryAt = new Date(Date.now() + minutesDelay * 60 * 1000).toISOString();
                
                await supabaseAdmin.from('outbox_events').update({ 
                    status: 'pending', 
                    retry_count: currentRetries + 1, 
                    next_retry_at: nextRetryAt,
                    error_message: e.message 
                }).eq('id', event.id);
            } else {
                // If it fails after max retries and it's NOT an alert, spawn an alert
                if (event.event_type !== 'ADMIN_ALERT_FAILED_DELIVERY') {
                    await supabaseAdmin.from('outbox_events').insert({
                        event_type: 'ADMIN_ALERT_FAILED_DELIVERY',
                        payload: {
                            error_reason: `Failed after max retries: ${e.message}`,
                            original_event: event.event_type,
                            original_payload: event.payload
                        },
                        status: 'pending'
                    });
                }
                
                await supabaseAdmin.from('outbox_events').update({ 
                    status: 'failed', 
                    error_message: `Max retries reached: ${e.message}` 
                }).eq('id', event.id);
            }
        }
    }
    return NextResponse.json({ processed: events.length });
}
