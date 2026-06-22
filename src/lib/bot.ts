import { Bot, InlineKeyboard } from 'grammy';
import { supabaseAdmin } from './supabase/admin';
import { createPakasirTransaction } from './pakasir';

if (!process.env.TELEGRAM_BOT_TOKEN) {
  throw new Error('TELEGRAM_BOT_TOKEN is required');
}

export const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);

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
bot.command('katalog', async (ctx) => {
  const { data: categories } = await supabaseAdmin
    .from('categories')
    .select('id, name, products(id, name, price)');

  if (!categories || categories.length === 0) {
    return ctx.reply('Katalog produk sedang kosong.');
  }

  let message = '🛍️ *Katalog YimStore*\n\n';
  const keyboard = new InlineKeyboard();

  categories.forEach((cat: any) => {
    message += `📁 *${cat.name}*\n`;
    cat.products.forEach((prod: any) => {
      message += `- ${prod.name}: Rp${prod.price.toLocaleString('id-ID')}\n`;
      keyboard.text(`Beli ${prod.name}`, `buy_${prod.id}`).row();
    });
    message += '\n';
  });

  return ctx.reply(message, { parse_mode: 'Markdown', reply_markup: keyboard });
});

// 3. Command /cek_pesanan
bot.command('cek_pesanan', async (ctx) => {
  const chatId = ctx.chat.id.toString();

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
    .select('id, access_token, created_at, payment_status, delivery_status, total_amount, order_items(products(name))')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!orders || orders.length === 0) {
    return ctx.reply('Belum ada riwayat pesanan aktif.');
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  orders.forEach((order: any) => {
    const productName = order.order_items[0]?.products?.name || 'Produk';
    const statusText = order.payment_status === 'paid' ? (order.delivery_status === 'Delivered' ? '✅ Selesai' : '⏳ Proses') : '💳 Menunggu Pembayaran';
    
    let text = `📦 *Pesanan: ${order.id}*\n`;
    text += `Produk: ${productName}\n`;
    text += `Total: Rp${order.total_amount.toLocaleString('id-ID')}\n`;
    text += `Status: ${statusText}\n`;

    const dashboardUrl = `${baseUrl}/order/${order.id}?token=${order.access_token}`;
    const keyboard = new InlineKeyboard().url('Buka Dashboard (Klaim Garansi)', dashboardUrl);

    ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
  });
});

// 4. Native Checkout Logic (Callback Query)
bot.callbackQuery(/^buy_(.+)$/, async (ctx) => {
  const productId = ctx.match[1];
  const chatId = ctx.chat?.id.toString();

  try {
    // A. Get Product
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('price, name')
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
        total_amount: product.price,
        payment_status: 'pending',
        platform_source: 'telegram'
      })
      .select('id, access_token').single();

    if (orderError || !newOrder) throw orderError;

    // E. Create Order Item
    await supabaseAdmin
      .from('order_items')
      .insert({ order_id: newOrder.id, inventory_id: inventoryId });

    // F. Generate Pakasir Payment Link
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const returnUrl = `${baseUrl}/order/${newOrder.id}?token=${newOrder.access_token}`;
    const pakasirCheckoutUrl = await createPakasirTransaction(newOrder.id, product.price, returnUrl);

    // Reply with Payment URL
    const keyboard = new InlineKeyboard().url('💳 Bayar Sekarang', pakasirCheckoutUrl);
    await ctx.reply(`Pesanan Anda untuk *${product.name}* telah dibuat.\n\nSilakan selesaikan pembayaran untuk menerima akun Anda:`, { parse_mode: 'Markdown', reply_markup: keyboard });
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
    return ctx.reply('Selamat datang di YimStore Bot!\nKetik /katalog untuk melihat produk atau /cek_pesanan untuk riwayat pesanan Anda.');
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

    const orderUser = order.users as any;
    if (!orderUser.telegram_chat_id) {
      if (existingUser) {
        await supabaseAdmin.from('orders').update({ user_id: existingUser.id }).eq('id', order.id);
        await supabaseAdmin.from('users').delete().eq('id', order.user_id);
        return ctx.reply('✅ Akses berhasil digabungkan dengan riwayat akun Anda sebelumnya.');
      } else {
        await supabaseAdmin.from('users').update({ telegram_chat_id: chatId }).eq('id', order.user_id);
        return ctx.reply('✅ Akun Telegram Anda berhasil dihubungkan dengan pesanan Anda!');
      }
    } else {
      if (orderUser.telegram_chat_id === chatId) {
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
