import { Bot, InlineKeyboard, InputFile, Keyboard } from 'grammy';
import QRCode from 'qrcode';
import { supabaseAdmin } from './supabase/admin';
import { createPakasirTransaction } from './pakasir';

import { limit } from '@grammyjs/ratelimiter';

const botToken = process.env.TELEGRAM_BOT_TOKEN || '123456789:dummy_token_for_build';
export const bot = new Bot(botToken);

// Anti-Spam Rate Limiter: max 3 messages per 2 seconds per user
bot.use(
  limit({
    timeFrame: 2000,
    limit: 3,
    onLimitExceeded: async (ctx) => {
      try {
        await ctx.reply('Mohon pelan-pelan, jangan spam ya! Tunggu beberapa detik.');
      } catch (err) {
        // Ignore if we can't even reply
      }
    },
  })
);

let buttonLabelsCache: Record<string, string> | null = null;
let buttonCacheTimeout: NodeJS.Timeout | null = null;

export async function getButtonLabel(key: string, fallback: string): Promise<string> {
  if (!buttonLabelsCache) {
    const { data } = await supabaseAdmin.from('bot_templates').select('key, content_html').like('key', 'btn_%');
    buttonLabelsCache = {};
    if (data) {
      data.forEach((row: any) => {
        // Strip HTML tags like <tg-emoji> from button text because Telegram buttons don't support HTML
        const cleanText = (row.content_html || '').replace(/<[^>]*>/g, '');
        buttonLabelsCache![row.key] = cleanText;
      });
    }
    // Cache for 60 seconds to allow Next.js dashboard updates to reflect quickly without heavy DB load
    if (buttonCacheTimeout) clearTimeout(buttonCacheTimeout);
    buttonCacheTimeout = setTimeout(() => { buttonLabelsCache = null; }, 60000);
  }
  return buttonLabelsCache[key] || fallback;
}

export async function getMainKeyboard() {
  const [btnKatalog, btnSaldo, btnRiwayat, btnAdmin, btnBestseller, btnHelp] = await Promise.all([
    getButtonLabel('btn_main_catalog', '🛒 List Produk'),
    getButtonLabel('btn_main_balance', '💰 Saldo : Rp 0'),
    getButtonLabel('btn_main_history', '📄 Riwayat Transaksi'),
    getButtonLabel('btn_main_admin', '💬 Kontak Admin'),
    getButtonLabel('btn_main_bestseller', '✨ Best Seller'),
    getButtonLabel('btn_main_help', '❓ Bantuan')
  ]);

  return new Keyboard()
    .text(btnKatalog).text(btnSaldo).row()
    .text(btnRiwayat).text(btnAdmin).row()
    .text(btnBestseller).text(btnHelp)
    .resized();
}

// MOCK BYPASS FOR E2E TESTING
if (process.env.APP_ENV === 'test') {
  bot.api.sendMessage = async (chatId, text) => {
    console.log(`[TEST MOCK] Telegram message to ${chatId}: ${text}`);
    return {} as any;
  };
}

// ==========================================
// Bot Template Engine & State
// ==========================================
export const adminEditStates = new Map<number, string>();

export function parseTelegramToHtml(text: string, entities: any[]): string {
  let html = text;
  
  // 1. Process Telegram entities correctly using UTF-16 code units
  if (entities && entities.length > 0) {
    // Arrays to hold tags to insert at each index
    const openTags: string[][] = Array.from({ length: text.length + 1 }, () => []);
    const closeTags: string[][] = Array.from({ length: text.length + 1 }, () => []);

    for (const ent of entities) {
      const { offset, length, type, custom_emoji_id, url } = ent;
      let open = '';
      let close = '';
      
      if (type === 'custom_emoji') {
        open = `<tg-emoji emoji-id="${custom_emoji_id}">`;
        close = `</tg-emoji>`;
      } else if (type === 'bold') {
        open = `<b>`; close = `</b>`;
      } else if (type === 'italic') {
        open = `<i>`; close = `</i>`;
      } else if (type === 'underline') {
        open = `<u>`; close = `</u>`;
      } else if (type === 'strikethrough') {
        open = `<s>`; close = `</s>`;
      } else if (type === 'code') {
        open = `<code>`; close = `</code>`;
      } else if (type === 'pre') {
        open = `<pre>`; close = `</pre>`;
      } else if (type === 'text_link') {
        open = `<a href="${url}">`; close = `</a>`;
      }

      if (open) {
        // Open tags are added at the offset (prepend so wider entities wrap inner ones)
        openTags[offset].unshift(open);
        // Close tags are added at offset + length (append so wider entities close last)
        closeTags[offset + length].push(close);
      }
    }

    let result = '';
    for (let i = 0; i < text.length; i++) {
      result += closeTags[i].join('');
      result += openTags[i].join('');
      result += text[i];
    }
    result += closeTags[text.length].join('');
    result += openTags[text.length].join('');
    
    html = result;
  }

  // 2. Convert raw Markdown typed by user (which has no entities) into HTML
  html = html.replace(/(?<!\\)\*(.*?)(?<!\\)\*/g, '<b>$1</b>');
  html = html.replace(/(?<![\\A-Za-z0-9])_(.*?)(?<!\\)_(?![A-Za-z0-9])/g, '<i>$1</i>');
  html = html.replace(/(?<!\\)~(.*?)(?<!\\)~/g, '<s>$1</s>');
  html = html.replace(/(?<!\\)`(.*?)`/g, '<code>$1</code>');

  // 3. Unescape MarkdownV2 escape characters
  html = html.replace(/\\([.\-!+()={}\[\]~`>#|])/g, '$1');

  return html;
}

export async function getTemplate(key: string, variables: Record<string, string | number> = {}): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('bot_templates')
    .select('content_html')
    .eq('key', key)
    .single();
    
  if (!data || !data.content_html) return null;
  
  let html = data.content_html;
  for (const [vKey, vValue] of Object.entries(variables)) {
    html = html.replace(new RegExp(`\\{\\{${vKey}\\}\\}`, 'g'), String(vValue));
  }
  return html;
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

  const keyboard = new InlineKeyboard();
  let rowCount = 0;
  let catalog_list = '';

  categories.forEach((cat: any, index: number) => {
    const num = index + 1;
    const catStock = stockMap[cat.id] || 0;
    catalog_list += `┊ [ ${num} ] ${cat.name.toUpperCase()} (${catStock})\n`;
    keyboard.text(`${num}`, `cat_${cat.id}`);
    
    rowCount++;
    if (rowCount === 5) {
      keyboard.row();
      rowCount = 0;
    }
  });

  const tpl = await getTemplate('katalog_main', {
    total_categories: categories.length,
    catalog_list: catalog_list.trimEnd()
  });

  const finalMessage = tpl || `〔 KATALOG PRODUK YIMSTORE 〕\n╭────────────────────────\n┊ Total Produk: ${categories.length}\n┊ Halaman 1/1\n┊ -----------------------\n${catalog_list}╰────────────────────────\n\nPilih nomor yang ada di bawah untuk melihat variasi produk:`;

  if (isEdit) {
    return ctx.editMessageText(finalMessage, { reply_markup: keyboard, parse_mode: tpl ? 'HTML' : undefined }).catch(() => {});
  } else {
    return ctx.reply(finalMessage, { reply_markup: keyboard, parse_mode: tpl ? 'HTML' : undefined });
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
  
  const { data: catStockData } = await supabaseAdmin
    .from('inventory')
    .select('id')
    .eq('category_id', categoryId)
    .eq('status', 'Available');
  const catStock = catStockData ? catStockData.length : 0;

  const { data: products } = await supabaseAdmin
    .from('admin_product_summary_view')
    .select('id, name, base_price, description, available_stock, is_sync_stock')
    .eq('category_id', categoryId)
    .eq('is_archived', false)
    .order('base_price', { ascending: true });

  if (!products || products.length === 0) {
    return ctx.answerCallbackQuery({ text: 'Tidak ada variasi untuk produk ini.', show_alert: true });
  }

  let variation_list = '';
  const keyboard = new InlineKeyboard();

  products.forEach((prod: any, index: number) => {
    const num = index + 1;
    const stock = prod.is_sync_stock ? catStock : (prod.available_stock || 0);
    variation_list += `┊ [ ${num} ] ${prod.name} (Stok: ${stock})\n`;
    keyboard.text(num.toString(), `detail_${prod.id}`);
  });
  
  const btnBack = await getButtonLabel('btn_back_catalog', '⬅️ Kembali ke Katalog');
  keyboard.row().text(btnBack, 'katalog_main');

  const tpl = await getTemplate('katalog_variations', {
    variation_list: variation_list.trimEnd()
  });

  const finalMessage = tpl || `Pilih Variasi Produk:\n\n${variation_list}\nSilakan pilih nomor di bawah ini:`;

  try {
    await ctx.editMessageText(finalMessage, { reply_markup: keyboard, parse_mode: tpl ? 'HTML' : undefined });
  } catch (e) {
    await ctx.reply(finalMessage, { reply_markup: keyboard, parse_mode: tpl ? 'HTML' : undefined });
  }
  await ctx.answerCallbackQuery();
});

// 2b. Handle Product Detail (Order Confirmation)
bot.callbackQuery(/^detail_(.+)$/, async (ctx) => {
  const productId = ctx.match[1];
  
  const { data: product } = await supabaseAdmin
    .from('admin_product_summary_view')
    .select('id, name, base_price, category_id, description, available_stock, sold_stock, is_sync_stock')
    .eq('id', productId)
    .single();
    
  if (!product) return ctx.answerCallbackQuery({ text: 'Produk tidak ditemukan.', show_alert: true });
  
  let availableStock = product.available_stock || 0;
  if (product.is_sync_stock) {
    const { data: catStockData } = await supabaseAdmin
      .from('inventory')
      .select('id')
      .eq('category_id', product.category_id)
      .eq('status', 'Available');
    availableStock = catStockData ? catStockData.length : 0;
  }
  const soldStock = product.sold_stock || 0;
  
  let restokText = '-';
  const { data: latestInv } = await supabaseAdmin
    .from('inventory')
    .select('created_at')
    .eq(product.is_sync_stock ? 'category_id' : 'product_id', product.is_sync_stock ? product.category_id : productId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestInv?.created_at) {
    const diffMs = Date.now() - new Date(latestInv.created_at).getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    restokText = diffDays === 0 ? 'Hari ini' : `${diffDays} hari yang lalu`;
  }
  
  // Calculate estimated QRIS fee based on Pakasir rule
  let estimatedFee = 0;
  if (product.base_price <= 105000) {
    estimatedFee = Math.floor(product.base_price * 0.007) + 310;
  } else {
    estimatedFee = Math.floor(product.base_price * 0.01);
  }
  const estimatedTotal = product.base_price + estimatedFee;

  const tpl = await getTemplate('order_confirmation', {
    product_name: product.name,
    restok_text: restokText,
    base_price: product.base_price.toLocaleString('id-ID'),
    available_stock: availableStock,
    sold_stock: soldStock,
    description: product.description || '-',
    fee_payment: estimatedFee.toLocaleString('id-ID'),
    total_payment: estimatedTotal.toLocaleString('id-ID')
  });

  const finalMessage = tpl || `╭─〔 ${product.name.toUpperCase()} 〕───\n🔄 Restok: ${restokText}\n💵 Harga: Rp${product.base_price.toLocaleString('id-ID')}\n📦 Stok: ${availableStock}\n📉 Terjual: ${soldStock}\n📄 Deskripsi: ${product.description || '-'}\n╰────────────────────────\n\nKONFIRMASI PESANAN\n=========================\nProduk: ${product.name}\nHarga: Rp ${product.base_price.toLocaleString('id-ID')} / item\nStok Tersedia: ${availableStock}\n-------------------------\nJumlah Pesanan: 1\nFee Payment: Rp ${estimatedFee.toLocaleString('id-ID')} (QRIS)\nTotal Dibayar: Rp ${estimatedTotal.toLocaleString('id-ID')}\n=========================\nKlik ✅ Konfirmasi untuk menahan stok dan melakukan pembayaran.`;
  
  const keyboard = new InlineKeyboard()
    .text('⬅️ Kembali', `cat_${product.category_id}`)
    .text('✅ Konfirmasi', `buy_${product.id}`);
    
  try {
    await ctx.editMessageText(finalMessage, { reply_markup: keyboard, parse_mode: tpl ? 'HTML' : undefined });
  } catch (e) {
    await ctx.reply(finalMessage, { reply_markup: keyboard, parse_mode: tpl ? 'HTML' : undefined });
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
    const tpl = await getTemplate('order_history_empty');
    return ctx.reply(tpl || 'Anda belum memiliki pesanan yang terhubung dengan akun Telegram ini.', { parse_mode: tpl ? 'HTML' : undefined });
  }

  const { data: allOrders } = await supabaseAdmin
    .from('orders')
    .select('id, access_token, created_at, payment_status, delivery_status, total_amount, order_items(products(name, warranty_days), current_claim_count, max_claim_limit, warranty_end_date)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const now = new Date();
  const orders = allOrders?.filter((order: any) => {
    const orderItem = order.order_items?.[0];
    if (!orderItem || !orderItem.warranty_end_date) return false;
    return new Date(orderItem.warranty_end_date) > now;
  }) || [];

  if (!orders || orders.length === 0) {
    const tpl = await getTemplate('order_history_empty');
    const msg = tpl || 'Belum ada riwayat pesanan aktif.';
    if (ctx.callbackQuery) {
      return ctx.editMessageText(msg, { parse_mode: tpl ? 'HTML' : undefined });
    }
    return ctx.reply(msg, { parse_mode: tpl ? 'HTML' : undefined });
  }

  let orderListText = '';
  const keyboard = new InlineKeyboard();

  orders.forEach((order: any, index: number) => {
    const orderItem = order.order_items?.[0];
    const productData = Array.isArray(orderItem?.products) ? orderItem.products[0] : orderItem?.products;
    const productName = productData?.name || 'Produk';
    const shortId = `INV-${order.id.split('-')[0].toUpperCase()}`;
    const num = index + 1;
    
    orderListText += `${num}. ${productName} - ${shortId}\n`;
    keyboard.text(num.toString(), `view_order_${order.id}`);
  });

  const tpl = await getTemplate('order_history');
  let text = '';
  let parseMode = 'HTML';

  if (tpl) {
    text = tpl.replace(/{{order_list}}/g, orderListText);
  } else {
    parseMode = 'Markdown';
    text = `*ID Pesanan Anda (Sesuaikan):*\n\n${orderListText}`;
  }

  if (ctx.callbackQuery && ctx.callbackQuery.message) {
    return ctx.editMessageText(text, { reply_markup: keyboard, parse_mode: parseMode as any });
  } else {
    return ctx.reply(text, { reply_markup: keyboard, parse_mode: parseMode as any });
  }
}

// ==========================================
// Admin Template Edit Mode
// ==========================================
bot.command('admin_templates', async (ctx) => {
  const adminIds = (process.env.TELEGRAM_ADMIN_CHAT_ID || '').split(',');
  const chatId = ctx.chat.id.toString();
  if (!adminIds.includes(chatId)) return;

  const { data: templates } = await supabaseAdmin.from('bot_templates').select('key, name');
  if (!templates || templates.length === 0) return ctx.reply('Belum ada template.');

  let text = '⚙️ *Admin Templates Menu*\nPilih template untuk diedit:\n\n';
  const keyboard = new InlineKeyboard();
  
  templates.forEach((tpl: any) => {
    keyboard.text(`📝 ${tpl.name}`, `edit_tpl_${tpl.key}`).row();
  });

  await ctx.reply(text, { parse_mode: 'Markdown', reply_markup: keyboard });
});

bot.callbackQuery(/^edit_tpl_(.+)$/, async (ctx) => {
  const adminIds = (process.env.TELEGRAM_ADMIN_CHAT_ID || '').split(',');
  const chatIdStr = ctx.from?.id?.toString() || ctx.chat?.id?.toString() || '';
  if (!adminIds.includes(chatIdStr)) return ctx.answerCallbackQuery({ text: 'Akses ditolak.' });

  const key = ctx.match[1];
  const { data: tpl } = await supabaseAdmin.from('bot_templates').select('*').eq('key', key).single();
  
  if (!tpl) return ctx.answerCallbackQuery({ text: 'Template tidak ditemukan.', show_alert: true });

  const chatId = parseInt(chatIdStr);
  adminEditStates.set(chatId, key);

  let instructions = `Anda sedang mengedit template: <b>${tpl.name}</b>\n\n`;
  instructions += `<i>Variabel yang didukung:</i> <code>${tpl.variables_hint || '-'}</code>\n\n`;
  instructions += `Silakan copy teks pesan di bawah ini, sisipkan Emoji Premium Anda, lalu kirim kembali pesan tersebut ke bot ini.`;

  await ctx.reply(instructions, { parse_mode: 'HTML' });
  await ctx.reply(tpl.content_html, { parse_mode: 'HTML' });
  
  ctx.answerCallbackQuery();
});

bot.on('message:text', async (ctx, next) => {
  const chatId = ctx.from?.id;
  if (!chatId || !adminEditStates.has(chatId)) {
    return next();
  }

  const templateKey = adminEditStates.get(chatId)!;
  const htmlContent = parseTelegramToHtml(ctx.message.text, ctx.message.entities || []);

  const { error } = await supabaseAdmin
    .from('bot_templates')
    .update({ content_html: htmlContent, updated_at: new Date().toISOString() })
    .eq('key', templateKey);

  if (error) {
    await ctx.reply('❌ Gagal menyimpan template.');
  } else {
    adminEditStates.delete(chatId);
    await ctx.reply('✅ Template berhasil diperbarui dan disimpan!');
  }
});

bot.command('cek_pesanan', async (ctx) => {
  const chatId = ctx.chat.id.toString();
  await showOrderList(ctx, chatId);
});

bot.hears(/List Produk/i, (ctx) => renderKatalog(ctx, false));
bot.hears(/Kontak Admin/i, async (ctx) => {
  const btnAdmin = await getButtonLabel('btn_main_admin', '💬 Hubungi Admin');
  const keyboard = new InlineKeyboard().url(btnAdmin, 'https://t.me/YimDigital');
  return ctx.reply('Silakan klik tombol di bawah ini untuk menghubungi admin kami:', { reply_markup: keyboard });
});
bot.hears(/Riwayat Transaksi/i, async (ctx) => {
  const chatId = ctx.chat.id.toString();
  await showOrderList(ctx, chatId);
});
bot.hears(/Saldo/i, (ctx) => ctx.reply('Fitur Saldo akan segera hadir.'));
bot.hears(/Best Seller/i, (ctx) => ctx.reply('Fitur Best Seller akan segera hadir.'));
bot.hears(/Bantuan/i, async (ctx) => {
  const tpl = await getTemplate('help_center');
  const keyboard = new InlineKeyboard()
    .text('🛒 Cara Order', 'help_how_to_order').row()
    .text('🛡️ Cara Claim Garansi', 'help_claim_warranty').row()
    .url('💬 Hubungi Admin', 'https://t.me/YimDigital');
  return ctx.reply(tpl || 'Pusat Bantuan YimStore.\nSilakan pilih topik bantuan yang Anda butuhkan di bawah ini:', { reply_markup: keyboard, parse_mode: tpl ? 'HTML' : undefined });
});

bot.callbackQuery('menu_katalog', (ctx) => {
  renderKatalog(ctx, false);
  ctx.answerCallbackQuery();
});

bot.callbackQuery('menu_riwayat', async (ctx) => {
  const chatId = ctx.chat?.id?.toString();
  if (chatId) await showOrderList(ctx, chatId);
  ctx.answerCallbackQuery();
});

bot.callbackQuery('menu_bantuan', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text('🛒 Cara Order', 'help_how_to_order').row()
    .text('🛡️ Cara Claim Garansi', 'help_claim_warranty').row()
    .url('💬 Hubungi Admin', 'https://t.me/YimDigital');
  const tpl = await getTemplate('help_center');
  await ctx.reply(tpl || 'Pusat Bantuan YimStore.\nSilakan pilih topik bantuan yang Anda butuhkan di bawah ini:', { reply_markup: keyboard, parse_mode: tpl ? 'HTML' : undefined });
  ctx.answerCallbackQuery();
});

bot.callbackQuery('help_how_to_order', async (ctx) => {
  const tpl = await getTemplate('help_how_to_order');
  const text = tpl || 'Cara Order:\n1. Klik "List Produk"\n2. Pilih produk dan variasi yang diinginkan\n3. Lakukan pembayaran via QRIS/VA\n4. Akun akan langsung dikirimkan ke chat ini secara instan.';
  await ctx.reply(text, { parse_mode: tpl ? 'HTML' : undefined });
  ctx.answerCallbackQuery();
});

bot.callbackQuery('help_claim_warranty', async (ctx) => {
  const tpl = await getTemplate('help_claim_warranty');
  const text = tpl || 'Cara Claim Garansi:\n1. Klik "Riwayat Transaksi"\n2. Pilih pesanan yang ingin Anda klaim\n3. Pastikan pesanan masih dalam masa garansi aktif\n4. Klik tombol "Klaim Garansi" dan akun pengganti akan langsung dikirimkan kepada Anda.';
  await ctx.reply(text, { parse_mode: tpl ? 'HTML' : undefined });
  ctx.answerCallbackQuery();
});

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

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
  const baseUrl = siteUrl.includes('localhost') ? 'https://yimdigital.store' : siteUrl;
  const orderItem = order.order_items?.[0];
  const productData = Array.isArray(orderItem?.products) ? orderItem.products[0] : orderItem?.products;
  const productName = productData?.name || 'Produk';
  const shortId = `INV-${order.id.split('-')[0].toUpperCase()}`;
  const isPaid = ['paid', 'success', 'completed'].includes(order.payment_status?.toLowerCase());
  const statusText = isPaid ? (order.delivery_status === 'Delivered' ? 'Selesai' : 'Proses') : 'Menunggu Pembayaran';
  
  let warrantyEndStr = '-';
  let isWarrantyActive = false;
  let claimsLeft = 0;
  let warrantyDays = 0;

  if (isPaid && orderItem) {
    const warrantyEnd = orderItem.warranty_end_date ? new Date(orderItem.warranty_end_date) : null;
    isWarrantyActive = warrantyEnd ? (warrantyEnd > new Date()) : false;
    warrantyDays = productData?.warranty_days || 0;
    claimsLeft = orderItem.max_claim_limit - (orderItem.current_claim_count || 0);
    if (claimsLeft < 0) claimsLeft = 0;
    if (warrantyEnd) {
      warrantyEndStr = warrantyEnd.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  }

  const tpl = await getTemplate('order_details');
  let text = '';
  let parseMode = 'HTML';

  if (tpl) {
    text = tpl
      .replace(/{{short_id}}/g, shortId)
      .replace(/{{product_name}}/g, productName)
      .replace(/{{total_amount}}/g, order.total_amount.toLocaleString('id-ID'))
      .replace(/{{status}}/g, statusText)
      .replace(/{{warranty_days}}/g, String(warrantyDays))
      .replace(/{{warranty_end_date}}/g, warrantyEndStr)
      .replace(/{{warranty_status}}/g, isWarrantyActive ? 'Aktif' : 'Kedaluwarsa')
      .replace(/{{claims_left}}/g, String(claimsLeft));
  } else {
    parseMode = 'Markdown';
    text = `*Pesanan: ${shortId}*\n`;
    text += `Produk: ${productName}\n`;
    text += `Total: Rp${order.total_amount.toLocaleString('id-ID')}\n`;
    text += `Status: ${statusText}\n`;
    
    if (isPaid && orderItem) {
      text += `\n*[Info Garansi]*\n`;
      text += `Masa Garansi: ${warrantyDays} Hari\n`;
      text += `Berlaku Hingga: ${warrantyEndStr}\n`;
      text += `Status Garansi: ${isWarrantyActive ? 'Aktif' : 'Kedaluwarsa'}\n`;
      text += `Sisa Kuota Klaim: ${claimsLeft}x\n`;
    }
  }

  const dashboardUrl = `${baseUrl}/order/${order.id}?token=${order.access_token}`;
  const keyboard = new InlineKeyboard();

  if (isPaid && orderItem) {
    if (isWarrantyActive && claimsLeft > 0) {
      const btnClaim = await getButtonLabel('btn_inline_claim', '🛡️ Klaim Garansi');
      keyboard.text(btnClaim, `claim_${orderItem.id}`).row();
    }
  }

  const btnDashboard = await getButtonLabel('btn_inline_dashboard', '🌐 Buka Dashboard');
  const btnBackList = await getButtonLabel('btn_inline_back', '🔙 Kembali ke List');
  
  keyboard.url(btnDashboard, dashboardUrl).row();
  keyboard.text(btnBackList, 'cek_pesanan_list');

  await ctx.editMessageText(text, { reply_markup: keyboard });
  ctx.answerCallbackQuery();
});

bot.callbackQuery(/^claim_(.+)$/, async (ctx) => {
  const orderItemId = ctx.match[1];
  const chatId = ctx.from?.id?.toString() || ctx.chat?.id?.toString() || '';

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
    else if (error.message.includes('Cooldown active')) {
      const parts = error.message.split('|');
      if (parts.length > 1) {
        const nextTime = new Date(parts[1]);
        const diffMs = nextTime.getTime() - Date.now();
        if (diffMs > 0) {
          const totalMins = Math.ceil(diffMs / (1000 * 60));
          const hours = Math.floor(totalMins / 60);
          const mins = totalMins % 60;
          let timeStr = '';
          if (hours > 0) timeStr += `${hours} jam `;
          timeStr += `${mins} menit`;
          errMsg = `Masih dalam masa jeda klaim. Coba lagi dalam ${timeStr}.`;
        } else {
          errMsg = 'Masih dalam masa jeda klaim.';
        }
      } else {
        errMsg = 'Masih dalam masa jeda klaim.';
      }
    }
    else if (error.message.includes('No replacement inventory available')) errMsg = 'Stok kosong. Klaim Anda masuk antrean.';
    
    return ctx.answerCallbackQuery({ text: errMsg, show_alert: true });
  }

  if (result?.success) {
    ctx.answerCallbackQuery({ text: 'Klaim berhasil diproses!', show_alert: true });
    // Also re-fetch order to show updated claims left? For now, just send the credential.
    const tpl = await getTemplate('warranty_claim_success', { new_credential: result.new_credential });
    ctx.reply(tpl || `🎉 *Klaim Garansi Berhasil!*\n\nBerikut adalah detail akun pengganti Anda:\n\n\`${result.new_credential}\`\n\nSilakan simpan baik-baik.`, { parse_mode: tpl ? 'HTML' : 'Markdown' });
  } else {
    ctx.answerCallbackQuery({ text: 'Gagal memproses klaim.', show_alert: true });
  }
});

// 4. Native Checkout Logic (Callback Query)
bot.callbackQuery(/^buy_(.+)$/, async (ctx) => {
  const productId = ctx.match[1];
  const chatId = ctx.from?.id?.toString() || ctx.chat?.id?.toString() || '';

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
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const baseUrl = siteUrl.includes('localhost') ? 'https://yimdigital.store' : siteUrl;
    const returnUrl = `${baseUrl}/order/${newOrder.id}---${newOrder.access_token}`;
    
    // Call API to create transaction on Pakasir's side
    const shortId = `INV-${newOrder.id.split('-')[0].toUpperCase()}`;
    const detail = await createPakasirTransaction(shortId, product.base_price);

    const qrisString = detail?.payment?.payment_number;
    const totalPayment = detail?.payment?.total_payment || product.base_price;
    const feePayment = totalPayment - product.base_price;

    if (qrisString) {
      const qrUrl = `https://quickchart.io/qr?size=300&text=${encodeURIComponent(qrisString)}`;
      const messageText = `DETAIL PEMBAYARAN\n\n- Order ID: ${shortId}\n- Produk: ${product.name}\n- Jumlah: 1\n- Harga: Rp ${product.base_price.toLocaleString('id-ID')}\n- Fee Payment: Rp ${feePayment.toLocaleString('id-ID')}\n- Total Bayar: Rp ${totalPayment.toLocaleString('id-ID')}\n- Expired: 15 Menit\n\nScan QRIS di bawah. Jika tidak ada respon 60 detik setelah transfer, klik Cek Status.`;
      
      const keyboard = new InlineKeyboard()
        .url('Cek Status', returnUrl)
        .row()
        .text('Batalkan Pesanan', `cancel_${newOrder.id}`);

      let msgId;
      if (ctx.callbackQuery?.message) {
        try {
          await ctx.deleteMessage();
        } catch (e) {
          // ignore
        }
      }
      
      const sent = await ctx.replyWithPhoto(qrUrl, {
        caption: messageText,
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
      msgId = sent.message_id;
      
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
    // 1. Initial 20% frame
    const msg = await ctx.reply('🔄 Menyiapkan sistem & memuat statistik...\n[■■□□□□□□□□] 20%');
    
    // Start fetching stats in background
    const statsPromise = Promise.all([
      supabaseAdmin.from('users').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('orders').select('*', { count: 'exact', head: true }).in('payment_status', ['paid', 'PAID', 'completed', 'COMPLETED', 'success', 'SUCCESS'])
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
    const tpl = await getTemplate('welcome_message', {
      user_count: userCount || 0,
      order_count: orderCount || 0
    });
    
    const welcomeText = tpl || `✨ *Selamat Datang di YimStore!* ✨\n\nPusat layanan digital dan akun premium terpercaya. Kami menyediakan berbagai macam kebutuhan digital dengan proses yang instan dan otomatis 24/7.\n\n📊 *Statistik Bot:*\n👥 Pengguna Aktif: ${userCount || 0} Pengguna\n🛍️ Transaksi Berhasil: ${orderCount || 0} Pesanan\n\nSilakan pilih menu di bawah ini untuk memulai:`;
    
    // Fetch dynamic labels for inline keyboard
    const [btnKatalog, btnRiwayat, btnHelp] = await Promise.all([
      getButtonLabel('btn_main_catalog', '🛒 List Produk'),
      getButtonLabel('btn_main_history', '📄 Riwayat Transaksi'),
      getButtonLabel('btn_main_help', '❓ Bantuan')
    ]);

    const welcomeInlineKeyboard = new InlineKeyboard()
      .text(btnKatalog, "menu_katalog").row()
      .text(btnRiwayat, "menu_riwayat")
      .text(btnHelp, "menu_bantuan");

    await ctx.reply(welcomeText, { 
      parse_mode: 'HTML', 
      reply_markup: welcomeInlineKeyboard 
    });


    // 4. Delete the loading message
    await ctx.api.deleteMessage(ctx.chat.id, msg.message_id).catch(() => {});

    const adminIds = (process.env.TELEGRAM_ADMIN_CHAT_ID || '').split(',');
    if (adminIds.includes(chatId)) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
      const safeAdminUrl = siteUrl.includes('localhost') ? 'https://yimdigital.store/admin' : `${siteUrl}/admin`;
      const adminKeyboard = new InlineKeyboard().url('⚙️ Buka Dashboard Admin', safeAdminUrl);
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
        const mk = await getMainKeyboard();
        return ctx.reply('✅ Akses berhasil digabungkan dengan riwayat akun Anda sebelumnya.\n\nKlik "Riwayat Transaksi" untuk melihat semua pesanan Anda.', { reply_markup: mk });
      } else {
        if (order.user_id) {
          await supabaseAdmin.from('users').update({ telegram_chat_id: chatId }).eq('id', order.user_id);
        } else {
          const { data: newUser } = await supabaseAdmin.from('users').insert({ telegram_chat_id: chatId }).select('id').single();
          if (newUser) await supabaseAdmin.from('orders').update({ user_id: newUser.id }).eq('id', order.id);
        }
        const mk = await getMainKeyboard();
        return ctx.reply('✅ Akun Telegram Anda berhasil dihubungkan dengan pesanan Anda!\n\nKlik "Riwayat Transaksi" untuk melihat pesanan Anda.', { reply_markup: mk });
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

    // Update the message to show it was cancelled
    if (ctx.callbackQuery.message) {
      const btnBackCat = await getButtonLabel('btn_back_catalog', '⬅️ Kembali ke Katalog');
      const keyboard = new InlineKeyboard().text(btnBackCat, 'katalog_main');
      const tpl = await getTemplate('order_cancelled');
      
      try {
        await ctx.deleteMessage();
      } catch (e) {
        // Ignore deletion errors
      }
      
      await ctx.reply(tpl || '❌ *Pesanan Dibatalkan*\n\nTerima kasih, pesanan Anda telah berhasil dibatalkan dan stok telah dikembalikan.', { parse_mode: tpl ? 'HTML' : 'Markdown', reply_markup: keyboard }).catch(console.error);
    }

    ctx.answerCallbackQuery({ text: 'Pesanan berhasil dibatalkan.' });
  } catch (error) {
    console.error('Cancellation error:', error);
    ctx.answerCallbackQuery({ text: 'Gagal membatalkan pesanan.', show_alert: true });
  }
});
