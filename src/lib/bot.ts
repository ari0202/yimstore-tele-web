import { Bot, InlineKeyboard, InputFile, Keyboard } from 'grammy';
import QRCode from 'qrcode';
import { supabaseAdmin } from './supabase/admin';
import { createPakasirTransaction } from './pakasir';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

export const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

export const mainKeyboard = new Keyboard()
  .text("List Produk").text("Saldo : Rp 0").row()
  .text("📄 Riwayat Transaksi").row()
  .text("✨ Best Seller").text("How To Order ❓")
  .resized();

// MOCK BYPASS FOR E2E TESTING
if (process.env.APP_ENV === 'test') {
  bot.api.sendMessage = async (chatId, text) => {
    console.log(`[TEST MOCK] Telegram message to ${chatId}: ${text}`);
    return {} as any;
  };
}

// 1. Kill-Switch Middleware (Bot-Side Enforcement)
bot.use(async (ctx, next) => {
  const { data: settings } = await supabaseAdmin
    .from('system_settings')
    .select('value')
    .eq('key', 'maintenance_mode')
    .single();

  if (settings?.value === 'true') {
    if (ctx.callbackQuery) {
      return ctx.answerCallbackQuery({ text: "Sistem sedang dalam pemeliharaan.", show_alert: true });
    }
    return ctx.reply('Mohon maaf, sistem sedang dalam pemeliharaan. Silakan coba beberapa saat lagi.');
  }
  await next();
});

// 2. Command /katalog
// Helper to render main catalog
async function renderKatalog(ctx: any, isEdit: boolean = false) {
  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('id, name')
    .order('name', { ascending: true });

  const { data: catSummary } = await supabaseAdmin
    .from('inventory')
    .select('id, category_id, products(category_id)')
    .eq('status', 'Available');

  const stockMap: Record<string, number> = {};
  if (catSummary) {
    catSummary.forEach((row: any) => {
      const catId = row.category_id || row.products?.category_id;
      if (catId) {
        stockMap[catId] = (stockMap[catId] || 0) + 1;
      }
    });
  }

  if (!categories || categories.length === 0) {
    const text = 'Katalog produk sedang kosong.';
    return isEdit ? ctx.editMessageText(text) : ctx.reply(text);
  }

  let message = '〔 KATALOG PRODUK YIMSTORE 〕\n';
  message += '╭────────────────────────\n';
  message += `┊ Total Produk: ${categories.length}\n`;
  message += `┊ Halaman 1/1\n`;
  message += `┊ -----------------------\n`;

  const keyboard = new InlineKeyboard();
  let rowCount = 0;

  categories.forEach((cat: any, index: number) => {
    const num = index + 1;
    const catStock = stockMap[cat.id] || 0;
    message += `┊ [ ${num} ] ${cat.name.toUpperCase()} (${catStock})\n`;
    keyboard.text(`${num}`, `cat_${cat.id}`);
    
    rowCount++;
    if (rowCount === 5) {
      keyboard.row();
      rowCount = 0;
    }
  });

  message += '╰────────────────────────\n\n';
  message += 'Pilih nomor yang ada di bawah untuk melihat variasi produk:';

  if (isEdit) {
    return ctx.editMessageText(message, { reply_markup: keyboard }).catch(() => {});
  } else {
    return ctx.reply(message, { reply_markup: keyboard });
  }
}

// 2. Command /katalog
bot.command('katalog', (ctx) => renderKatalog(ctx, false));
bot.callbackQuery('katalog_main', (ctx) => {
  renderKatalog(ctx, true);
  return ctx.answerCallbackQuery();
});

// 2a. Handle Category Selection (Variations)
bot.callbackQuery(/^cat_(.+)$/, async (ctx) => {
  const categoryId = ctx.match[1];
  
  const { data: products } = await supabaseAdmin
    .from('admin_product_summary_view')
    .select('id, name, base_price, description, total_stock')
    .eq('category_id', categoryId)
    .eq('is_archived', false)
    .order('base_price', { ascending: true });

  if (!products || products.length === 0) {
    return ctx.answerCallbackQuery({ text: 'Tidak ada variasi untuk produk ini.', show_alert: true });
  }

  let message = 'Pilih Variasi Produk:\n\n';
  const keyboard = new InlineKeyboard();

  products.forEach((prod: any, index: number) => {
    const num = index + 1;
    message += `┊ [ ${num} ] ${prod.name} (Stok: ${prod.total_stock || 0})\n`;
    keyboard.text(num.toString(), `detail_${prod.id}`);
  });
  
  message += '\nSilakan pilih nomor di bawah ini:';
  
  keyboard.row().text('⬅️ Kembali ke Katalog', 'katalog_main');

  try {
    await ctx.editMessageText(message, { reply_markup: keyboard });
  } catch (e) {
    await ctx.reply(message, { reply_markup: keyboard });
  }
  await ctx.answerCallbackQuery();
});

// 2b. Handle Product Detail (Order Confirmation)
bot.callbackQuery(/^detail_(.+)$/, async (ctx) => {
  const productId = ctx.match[1];
  
  const { data: product } = await supabaseAdmin
    .from('admin_product_summary_view')
    .select('id, name, base_price, category_id, description, total_stock, sold_stock, latest_restock')
    .eq('id', productId)
    .single();
    
  if (!product) return ctx.answerCallbackQuery({ text: 'Produk tidak ditemukan.', show_alert: true });
  
  const availableStock = product.total_stock || 0;
  const soldStock = product.sold_stock || 0;
  
  let restokText = '-';
  if (product.latest_restock) {
    const diffMs = Date.now() - new Date(product.latest_restock).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    restokText = diffDays === 0 ? 'Hari ini' : `${diffDays} hari yang lalu`;
  }
  
  let message = `╭─〔 ${product.name.toUpperCase()} 〕───\n`;
  message += `🔄 Restok: ${restokText}\n`;
  message += `💵 Harga: Rp${product.base_price.toLocaleString('id-ID')}\n`;
  message += `📦 Stok: ${availableStock}\n`;
  message += `📉 Terjual: ${soldStock}\n`;
  message += `📄 Deskripsi: ${product.description || '-'}\n`;
  message += `╰────────────────────────\n\n`;
  
  // Calculate estimated QRIS fee based on Pakasir rule
  let estimatedFee = 0;
  if (product.base_price <= 105000) {
    estimatedFee = Math.floor(product.base_price * 0.007) + 310;
  } else {
    estimatedFee = Math.floor(product.base_price * 0.01);
  }
  const estimatedTotal = product.base_price + estimatedFee;

  message += `KONFIRMASI PESANAN\n=========================\n`;
  message += `Produk: ${product.name}\n`;
  message += `Harga: Rp ${product.base_price.toLocaleString('id-ID')} / item\n`;
  message += `Stok Tersedia: ${availableStock}\n`;
  message += `-------------------------\n`;
  message += `Jumlah Pesanan: 1\n`;
  message += `Fee Payment: Rp ${estimatedFee.toLocaleString('id-ID')} (QRIS)\n`;
  message += `Total Dibayar: Rp ${estimatedTotal.toLocaleString('id-ID')}\n`;
  message += `=========================\n`;
  message += `Klik ✅ Konfirmasi untuk menahan stok dan melakukan pembayaran.`;
  
  const keyboard = new InlineKeyboard()
    .text('⬅️ Kembali', `cat_${product.category_id}`)
    .text('✅ Konfirmasi', `buy_${product.id}`);
    
  try {
    await ctx.editMessageText(message, { reply_markup: keyboard });
  } catch (e) {
    await ctx.reply(message, { reply_markup: keyboard });
  }
  await ctx.answerCallbackQuery();
});

async function showOrderList(ctx: any, chatId: string) {
  const { data: user } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('telegram_chat_id', chatId)
    .single();

  if (!user) {
    return ctx.reply('Anda belum memiliki pesanan yang terhubung dengan akun Telegram ini.');
  }

  const { data: orders } = await supabaseAdmin
    .from('orders')
    .select('id, access_token, created_at, payment_status, delivery_status, total_amount, order_items(products(name, warranty_days), current_claim_count, max_claim_limit, warranty_end_date)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!orders || orders.length === 0) {
    if (ctx.callbackQuery) {
      return ctx.editMessageText('Belum ada riwayat pesanan aktif.');
    }
    return ctx.reply('Belum ada riwayat pesanan aktif.');
  }

  let text = 'ID Pesanan Anda (Sesuaikan):\n\n';
  const keyboard = new InlineKeyboard();

  orders.forEach((order: any, index: number) => {
    const orderItem = order.order_items?.[0];
    const productData = Array.isArray(orderItem?.products) ? orderItem.products[0] : orderItem?.products;
    const productName = productData?.name || 'Produk';
    const shortId = `INV-${order.id.split('-')[0].toUpperCase()}`;
    const num = index + 1;
    
    text += `${num}. ${productName} - ${shortId}\n`;
    keyboard.text(num.toString(), `view_order_${order.id}`);
  });

  if (ctx.callbackQuery && ctx.callbackQuery.message) {
    return ctx.editMessageText(text, { reply_markup: keyboard });
  } else {
    return ctx.reply(text, { reply_markup: keyboard });
  }
}

bot.command('cek_pesanan', async (ctx) => {
  const chatId = ctx.chat.id.toString();
  await showOrderList(ctx, chatId);
});

bot.hears('List Produk', (ctx) => renderKatalog(ctx, false));
bot.hears('📄 Riwayat Transaksi', async (ctx) => {
  const chatId = ctx.chat.id.toString();
  await showOrderList(ctx, chatId);
});
bot.hears('Saldo : Rp 0', (ctx) => ctx.reply('Fitur Saldo akan segera hadir.'));
bot.hears('✨ Best Seller', (ctx) => ctx.reply('Fitur Best Seller akan segera hadir.'));
bot.hears('How To Order ❓', (ctx) => ctx.reply('Cara Order:\n1. Klik "List Produk"\n2. Pilih produk dan variasi yang diinginkan\n3. Lakukan pembayaran via QRIS/VA\n4. Akun akan langsung dikirimkan ke chat ini secara instan.'));

bot.callbackQuery('cek_pesanan_list', async (ctx) => {
  const chatId = ctx.chat?.id?.toString() || '';
  if (!chatId) return;
  await showOrderList(ctx, chatId);
  ctx.answerCallbackQuery();
});

bot.callbackQuery(/^view_order_(.+)$/, async (ctx) => {
  const orderId = ctx.match[1];
  const { data: order } = await supabaseAdmin
    .from('orders')
    .select('id, access_token, created_at, payment_status, delivery_status, total_amount, order_items(id, products(name, warranty_days), current_claim_count, max_claim_limit, warranty_end_date)')
    .eq('id', orderId)
    .single();

  if (!order) return ctx.answerCallbackQuery({ text: 'Pesanan tidak ditemukan.', show_alert: true });

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const orderItem = order.order_items?.[0];
  const productData = Array.isArray(orderItem?.products) ? orderItem.products[0] : orderItem?.products;
  const productName = productData?.name || 'Produk';
  const shortId = `INV-${order.id.split('-')[0].toUpperCase()}`;
  const isPaid = ['paid', 'success', 'completed'].includes(order.payment_status?.toLowerCase());
  const statusText = isPaid ? (order.delivery_status === 'Delivered' ? 'Selesai' : 'Proses') : 'Menunggu Pembayaran';
  
  let text = `Pesanan: ${shortId}\n`;
  text += `Produk: ${productName}\n`;
  text += `Total: Rp${order.total_amount.toLocaleString('id-ID')}\n`;
  text += `Status: ${statusText}\n`;

  if (isPaid && orderItem) {
    const warrantyEnd = orderItem.warranty_end_date ? new Date(orderItem.warranty_end_date) : null;
    const isWarrantyActive = warrantyEnd && warrantyEnd > new Date();
    const warrantyDays = productData?.warranty_days || 0;
    const claimsLeft = orderItem.max_claim_limit - (orderItem.current_claim_count || 0);

    text += `\n[Info Garansi]\n`;
    text += `Masa Garansi: ${warrantyDays} Hari\n`;
    if (warrantyEnd) {
      text += `Berlaku Hingga: ${warrantyEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\n`;
      text += `Status Garansi: ${isWarrantyActive ? 'Aktif' : 'Kedaluwarsa'}\n`;
    }
    text += `Sisa Kuota Klaim: ${claimsLeft > 0 ? claimsLeft : 0}x\n`;
  }

  const dashboardUrl = `${baseUrl}/order/${order.id}?token=${order.access_token}`;
  const keyboard = new InlineKeyboard();

  if (isPaid && orderItem) {
    const warrantyEnd = orderItem.warranty_end_date ? new Date(orderItem.warranty_end_date) : null;
    const isWarrantyActive = warrantyEnd && warrantyEnd > new Date();
    const claimsLeft = orderItem.max_claim_limit - (orderItem.current_claim_count || 0);

    if (isWarrantyActive && claimsLeft > 0) {
      keyboard.text('Klaim Garansi', `claim_${orderItem.id}`).row();
    }
  }

  keyboard
    .url('Buka Dashboard', dashboardUrl).row()
    .text('⬅️ Kembali ke Daftar', 'cek_pesanan_list');

  await ctx.editMessageText(text, { reply_markup: keyboard });
  ctx.answerCallbackQuery();
});

bot.callbackQuery(/^claim_(.+)$/, async (ctx) => {
  const orderItemId = ctx.match[1];
  const chatId = ctx.chat?.id?.toString() || '';

  // 1. Verify ownership
  const { data: orderItemCheck } = await supabaseAdmin
    .from('order_items')
    .select('id, orders!inner(users!inner(telegram_chat_id))')
    .eq('id', orderItemId)
    .eq('orders.users.telegram_chat_id', chatId)
    .single();

  if (!orderItemCheck) {
    return ctx.answerCallbackQuery({ text: 'Akses ditolak. Pesanan ini bukan milik Anda.', show_alert: true });
  }

  // 2. Call RPC
  const { data: result, error } = await supabaseAdmin.rpc('rpc_process_warranty_claim', { 
    p_order_item_id: orderItemId,
    p_reason: 'Klaim via Telegram Bot'
  });

  if (error) {
    let errMsg = 'Gagal memproses klaim.';
    if (error.message.includes('Claim limit reached')) errMsg = 'Batas klaim sudah habis.';
    else if (error.message.includes('Warranty expired')) errMsg = 'Masa garansi sudah habis.';
    else if (error.message.includes('Cooldown active')) errMsg = 'Masih dalam masa jeda klaim.';
    else if (error.message.includes('No replacement inventory available')) errMsg = 'Stok kosong. Klaim Anda masuk antrean.';
    
    return ctx.answerCallbackQuery({ text: errMsg, show_alert: true });
  }

  if (result?.success) {
    ctx.answerCallbackQuery({ text: 'Klaim berhasil diproses!', show_alert: true });
    // Also re-fetch order to show updated claims left? For now, just send the credential.
    ctx.reply(`🎉 *Klaim Garansi Berhasil!*\n\nBerikut adalah detail akun pengganti Anda:\n\n\`${result.new_credential}\`\n\nSilakan simpan baik-baik.`, { parse_mode: 'Markdown' });
  } else {
    ctx.answerCallbackQuery({ text: 'Gagal memproses klaim.', show_alert: true });
  }
});

// 4. Native Checkout Logic (Callback Query)
bot.callbackQuery(/^buy_(.+)$/, async (ctx) => {
  const productId = ctx.match[1];
  const chatId = ctx.chat?.id.toString();

  try {
    // A. Get Product
    const { data: product } = await supabaseAdmin
      .from('admin_product_summary_view')
      .select('base_price, name')
      .eq('id', productId)
      .single();

    if (!product) return ctx.answerCallbackQuery({ text: 'Produk tidak ditemukan.', show_alert: true });

    // B. Hold Inventory
    const { data: holdResult, error: holdError } = await supabaseAdmin.rpc('hold_inventory', {
      p_product_id: productId
    });

    if (holdError || !holdResult || holdResult === 'OUT_OF_STOCK') {
      return ctx.answerCallbackQuery({ text: 'Maaf, stok habis atau sistem sibuk.', show_alert: true });
    }

    const inventoryId = holdResult;

    // C. Get or Create User
    let userId;
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_chat_id', chatId)
      .single();

    if (existingUser) {
      userId = existingUser.id;
    } else {
      const { data: newUser } = await supabaseAdmin.from('users').insert({ telegram_chat_id: chatId }).select('id').single();
      userId = newUser?.id;
    }

    // D. Create Order
    const { data: newOrder, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        user_id: userId,
        total_amount: product.base_price,
        payment_status: 'pending',
        platform_source: 'telegram'
      })
      .select('id, access_token').single();

    if (orderError || !newOrder) throw orderError;

    // E. Create Order Item
    const { error: itemError } = await supabaseAdmin
      .from('order_items')
      .insert({ order_id: newOrder.id, product_id: productId, inventory_id: inventoryId });

    if (itemError) {
      console.error('Failed to create order item:', itemError);
      // Rollback order and inventory hold
      await supabaseAdmin.from('orders').delete().eq('id', newOrder.id);
      await supabaseAdmin.from('inventory').update({ status: 'Available', reserved_until: null }).eq('id', inventoryId);
      throw itemError;
    }

    // F. Generate Pakasir Payment Link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/order/${newOrder.id}---${newOrder.access_token}`;
    
    // Call API to create transaction on Pakasir's side
    const shortId = `INV-${newOrder.id.split('-')[0].toUpperCase()}`;
    const detail = await createPakasirTransaction(shortId, product.base_price);

    const qrisString = detail?.payment?.payment_number;
    const totalPayment = detail?.payment?.total_payment || product.base_price;
    const feePayment = totalPayment - product.base_price;

    if (qrisString) {
      const qrUrl = `https://quickchart.io/qr?size=300&text=${encodeURIComponent(qrisString)}`;
      const messageText = `[​​​​​​​​​​​](${qrUrl})DETAIL PEMBAYARAN\n\n- Order ID: ${shortId}\n- Produk: ${product.name}\n- Jumlah: 1\n- Harga: Rp ${product.base_price.toLocaleString('id-ID')}\n- Fee Payment: Rp ${feePayment.toLocaleString('id-ID')}\n- Total Bayar: Rp ${totalPayment.toLocaleString('id-ID')}\n- Expired: 15 Menit\n\nScan QRIS di bawah. Jika tidak ada respon 60 detik setelah transfer, klik Cek Status.`;
      
      const keyboard = new InlineKeyboard()
        .url('Cek Status', returnUrl)
        .row()
        .text('Batalkan Pesanan', `cancel_${newOrder.id}`);

      let msgId;
      if (ctx.callbackQuery.message) {
        try {
          await ctx.editMessageText(messageText, { parse_mode: 'Markdown', reply_markup: keyboard });
          msgId = ctx.callbackQuery.message.message_id;
        } catch (e) {
          const sent = await ctx.reply(messageText, { parse_mode: 'Markdown', reply_markup: keyboard });
          msgId = sent.message_id;
        }
      } else {
        const sent = await ctx.reply(messageText, { parse_mode: 'Markdown', reply_markup: keyboard });
        msgId = sent.message_id;
      }
      
      await supabaseAdmin.from('orders').update({ platform_source: `telegram:${msgId}` }).eq('id', newOrder.id);
      
    } else {
      const keyboard = new InlineKeyboard()
        .url('Bayar Sekarang', returnUrl)
        .row()
        .text('Batalkan Pesanan', `cancel_${newOrder.id}`);
        
      const messageText = `DETAIL PEMBAYARAN\n\n- Order ID: ${shortId}\n- Produk: ${product.name}\n- Jumlah: 1\n- Harga: Rp ${product.base_price.toLocaleString('id-ID')}\n- Fee Payment: Rp ${feePayment.toLocaleString('id-ID')}\n- Total Bayar: Rp ${totalPayment.toLocaleString('id-ID')}\n\nSilakan selesaikan pembayaran untuk menerima akun Anda.`;
      
      let msgId;
      if (ctx.callbackQuery.message) {
        try {
          await ctx.editMessageText(messageText, { parse_mode: 'Markdown', reply_markup: keyboard });
          msgId = ctx.callbackQuery.message.message_id;
        } catch (e) {
          const sent = await ctx.reply(messageText, { parse_mode: 'Markdown', reply_markup: keyboard });
          msgId = sent.message_id;
        }
      } else {
        const sent = await ctx.reply(messageText, { parse_mode: 'Markdown', reply_markup: keyboard });
        msgId = sent.message_id;
      }
      
      await supabaseAdmin.from('orders').update({ platform_source: `telegram:${msgId}` }).eq('id', newOrder.id);
    }
    await ctx.answerCallbackQuery();
  } catch (err) {
    console.error('Native checkout error:', err);
    ctx.answerCallbackQuery({ text: 'Terjadi kesalahan sistem.', show_alert: true });
  }
});

// 5. Start handler for Deep Linking (Legacy support)
bot.command('start', async (ctx) => {
  const payload = ctx.match;
  const chatId = ctx.chat.id.toString();

  if (!payload || !payload.startsWith('token_')) {
    // 0. Send an invisible dummy message (using Braille empty char) to safely inject Reply Keyboard
    const dummy = await ctx.reply('\u2800', { reply_markup: mainKeyboard }).catch(() => null);
    if (dummy) {
      ctx.api.deleteMessage(ctx.chat.id, dummy.message_id).catch(() => {});
    }

    // 1. Initial 20% frame (WITHOUT Reply Keyboard, so it CAN be edited)
    const msg = await ctx.reply('🔄 Menyiapkan sistem & memuat statistik...\n[■■□□□□□□□□] 20%');
    
    // Start fetching stats in background
    const statsPromise = Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).in('payment_status', ['paid', 'completed'])
    ]);

    // Frame 2: 50%
    await new Promise(r => setTimeout(r, 800));
    await ctx.api.editMessageText(ctx.chat.id, msg.message_id, '🔄 Menyiapkan sistem & memuat statistik...\n[■■■■■□□□□□] 50%').catch(() => {});

    // Frame 3: 80%
    await new Promise(r => setTimeout(r, 800));
    await ctx.api.editMessageText(ctx.chat.id, msg.message_id, '🔄 Menyiapkan sistem & memuat statistik...\n[■■■■■■■■□□] 80%').catch(() => {});

    // Wait for stats to finish (should be instant anyway, but guarantees data)
    const [{ count: userCount }, { count: orderCount }] = await statsPromise;

    // Frame 4: 100%
    await new Promise(r => setTimeout(r, 600));
    await ctx.api.editMessageText(ctx.chat.id, msg.message_id, '✅ Memuat Selesai!\n[■■■■■■■■■■] 100%').catch(() => {});
    
    // Pause briefly for user to see 100%
    await new Promise(r => setTimeout(r, 500));

    // 3. Send the Welcome Message as a NEW message
    const welcomeText = `✨ *Selamat Datang di YimStore!* ✨\n\nPusat layanan digital dan akun premium terpercaya. Kami menyediakan berbagai macam kebutuhan digital dengan proses yang instan dan otomatis 24/7.\n\n📊 *Statistik Bot:*\n👥 Pengguna Aktif: ${userCount || 0} Pengguna\n🛍️ Transaksi Berhasil: ${orderCount || 0} Pesanan\n\nSilakan pilih menu di bawah ini untuk memulai:`;
    
    const welcomeInline = new InlineKeyboard()
      .text('🛒 List Produk', 'katalog_main').row()
      .text('📄 Riwayat Transaksi', 'cek_pesanan_list').row()
      .url('💬 Kontak Admin', 'https://t.me/YimDigital');

    await ctx.reply(welcomeText, { 
      parse_mode: 'Markdown', 
      reply_markup: welcomeInline 
    });

    // 4. Delete the loading message
    await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {});

    const adminIds = (process.env.TELEGRAM_ADMIN_CHAT_ID || '').split(',');
    if (adminIds.includes(chatId)) {
      const adminKeyboard = new InlineKeyboard().url('⚙️ Buka Dashboard Admin', `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/admin`);
      await ctx.reply('👋 *Halo Admin!*\n\nSilakan klik tombol di bawah ini untuk masuk ke Dashboard Web dan mengelola toko Anda.', { parse_mode: 'Markdown', reply_markup: adminKeyboard });
    }
    return;
  }

  const accessToken = payload.replace('token_', '');

  try {
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, users(id, telegram_chat_id)')
      .eq('access_token', accessToken)
      .single();

    if (!order) return ctx.reply('Token tidak valid atau pesanan tidak ditemukan.');

    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('telegram_chat_id', chatId)
      .single();

    const rawUsers = order.users as any;
    const orderUser = (Array.isArray(rawUsers) ? rawUsers[0] : rawUsers) || {};
    if (!orderUser.telegram_chat_id) {
      if (existingUser) {
        await supabaseAdmin.from('orders').update({ user_id: existingUser.id }).eq('id', order.id);
        if (order.user_id) await supabaseAdmin.from('users').delete().eq('id', order.user_id);
        return ctx.reply('✅ Akses berhasil digabungkan dengan riwayat akun Anda sebelumnya.\n\nKlik "Riwayat Transaksi" untuk melihat semua pesanan Anda.', { reply_markup: mainKeyboard });
      } else {
        if (order.user_id) {
          await supabaseAdmin.from('users').update({ telegram_chat_id: chatId }).eq('id', order.user_id);
        } else {
          const { data: newUser } = await supabaseAdmin.from('users').insert({ telegram_chat_id: chatId }).select('id').single();
          if (newUser) await supabaseAdmin.from('orders').update({ user_id: newUser.id }).eq('id', order.id);
        }
        return ctx.reply('✅ Akun Telegram Anda berhasil dihubungkan dengan pesanan Anda!\n\nKlik "Riwayat Transaksi" untuk melihat pesanan Anda.', { reply_markup: mainKeyboard });
      }
    } else {
      if (orderUser.telegram_chat_id == chatId) {
        return ctx.reply('Pesanan ini sudah terhubung dengan akun Telegram Anda.');
      } else {
        return ctx.reply('⚠️ Akses Ditolak! Pesanan ini telah terhubung dengan akun Telegram orang lain.');
      }
    }
  } catch (error) {
    console.error('Bot Start Error:', error);
    return ctx.reply('Terjadi kesalahan pada sistem.');
  }
});

// 6. Handle Cancellation
bot.callbackQuery(/^cancel_(.+)$/, async (ctx) => {
  const orderId = ctx.match[1];
  
  try {
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('payment_status, order_items(inventory_id)')
      .eq('id', orderId)
      .single();

    if (!order) return ctx.answerCallbackQuery({ text: 'Pesanan tidak ditemukan.', show_alert: true });
    
    if (order.payment_status !== 'pending') {
      return ctx.answerCallbackQuery({ text: `Pesanan tidak dapat dibatalkan (Status: ${order.payment_status})`, show_alert: true });
    }

    // Cancel the order
    await supabaseAdmin.from('orders').update({ payment_status: 'cancelled' }).eq('id', orderId);
    
    // Release inventory immediately
    if (order.order_items) {
      const itemsArray = Array.isArray(order.order_items) ? order.order_items : [order.order_items];
      for (const item of itemsArray) {
        if (item?.inventory_id) {
          await supabaseAdmin.from('inventory').update({ status: 'Available', reserved_until: null }).eq('id', item.inventory_id);
        }
      }
    }

    // Edit the message to show it was cancelled
    if (ctx.callbackQuery.message) {
      const keyboard = new InlineKeyboard().text('⬅️ Kembali ke Katalog', 'katalog_main');
      await ctx.editMessageText('❌ *Pesanan Dibatalkan*\n\nTerima kasih, pesanan Anda telah berhasil dibatalkan dan stok telah dikembalikan.', { parse_mode: 'Markdown', reply_markup: keyboard }).catch(console.error);
    }

    ctx.answerCallbackQuery({ text: 'Pesanan berhasil dibatalkan.' });
  } catch (error) {
    console.error('Cancellation error:', error);
    ctx.answerCallbackQuery({ text: 'Gagal membatalkan pesanan.', show_alert: true });
  }
});
