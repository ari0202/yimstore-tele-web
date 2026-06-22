module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/lib/supabase/admin.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "supabaseAdmin",
    ()=>supabaseAdmin
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@supabase/supabase-js/dist/index.mjs [app-route] (ecmascript) <locals>");
;
const supabaseUrl = ("TURBOPACK compile-time value", "https://zdhlfoiytkamnyywbgyx.supabase.co");
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAdmin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$supabase$2f$supabase$2d$js$2f$dist$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["createClient"])(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});
}),
"[project]/src/lib/pakasir.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createPakasirTransaction",
    ()=>createPakasirTransaction
]);
async function createPakasirTransaction(orderId, amount, returnUrl) {
    const projectSlug = process.env.PAKASIR_PROJECT_SLUG;
    // Using Integrasi via URL which is the simplest and supports redirect natively
    let url = `https://app.pakasir.com/pay/${projectSlug}/${amount}?order_id=${orderId}&qris_only=1`;
    if (returnUrl) {
        url += `&redirect=${encodeURIComponent(returnUrl)}`;
    }
    return url;
}
}),
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/src/app/api/checkout/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "POST",
    ()=>POST
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/supabase/admin.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$pakasir$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/lib/pakasir.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$upstash$2f$ratelimit$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@upstash/ratelimit/dist/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$upstash$2f$redis$2f$nodejs$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@upstash/redis/nodejs.mjs [app-route] (ecmascript) <locals>");
;
;
;
;
;
// Initialize global Redis rate limiter for Serverless
const ratelimit = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$upstash$2f$ratelimit$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Ratelimit"]({
    redis: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$upstash$2f$redis$2f$nodejs$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["Redis"].fromEnv(),
    limiter: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$upstash$2f$ratelimit$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Ratelimit"].slidingWindow(5, '1 m')
});
async function POST(req) {
    try {
        // 1. Eksekusi Rate Limit PERTAMA KALI (Sebelum menyentuh DB untuk mencegah koneksi habis)
        const authHeader = req.headers.get('authorization');
        const isInternalBot = authHeader === `Bearer ${process.env.BOT_INTERNAL_TOKEN}`;
        let rateLimitKey = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
        // Jika dari bot, limit berdasarkan User ID Telegram, BUKAN IP server bot
        if (isInternalBot) {
            const telegramUserId = req.headers.get('x-telegram-user-id');
            if (!telegramUserId) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Missing telegram ID'
            }, {
                status: 400
            });
            rateLimitKey = `tg_user_${telegramUserId}`;
        }
        const { success } = await ratelimit.limit(`checkout_${rateLimitKey}`);
        if (!success) return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Too many requests'
        }, {
            status: 429
        });
        // 2. Check Global Kill-Switch (Aman karena Rate Limit sudah lewat)
        const { data: settings } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('system_settings').select('value').eq('key', 'maintenance_mode').single();
        if (settings?.value === 'true') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'System is under maintenance'
            }, {
                status: 503
            });
        }
        const formData = await req.formData();
        const productId = formData.get('productId');
        if (!productId) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Missing productId'
            }, {
                status: 400
            });
        }
        // 1. Get product price
        const { data: product, error: productError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('products').select('price').eq('id', productId).single();
        if (productError || !product) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Product not found'
            }, {
                status: 404
            });
        }
        // 2. Hold inventory atomically
        const { data: holdResult, error: holdError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].rpc('hold_inventory', {
            p_product_id: productId
        });
        if (holdError || !holdResult) {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Sistem sibuk atau stok habis.'
            }, {
                status: 500
            });
        }
        if (holdResult === 'OUT_OF_STOCK') {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
                error: 'Stok Habis'
            }, {
                status: 400
            });
        }
        // UUID dari inventory yang di-hold
        const inventoryId = holdResult;
        // 3. Create Anonymous User since we use Identity Merge later
        const { data: newUser, error: userError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('users').insert({}).select('id').single();
        // 4. Create Order with access_token
        const { data: newOrder, error: orderError } = await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('orders').insert({
            user_id: newUser?.id || null,
            total_amount: product.price,
            payment_status: 'pending',
            platform_source: 'web'
        }).select('id, access_token').single();
        if (orderError || !newOrder) throw orderError;
        // 5. Create Order Item
        await __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$supabase$2f$admin$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["supabaseAdmin"].from('order_items').insert({
            order_id: newOrder.id,
            inventory_id: inventoryId
        });
        // 6. Create Pakasir Transaction
        const baseUrl = ("TURBOPACK compile-time value", "https://yimdigital.store") || 'http://localhost:3000';
        const returnUrl = `${baseUrl}/order/${newOrder.id}?token=${newOrder.access_token}`;
        // Asumsi createPakasirTransaction mendukung parameter returnUrl
        const pakasirCheckoutUrl = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$lib$2f$pakasir$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createPakasirTransaction"])(newOrder.id, product.price, returnUrl);
        // Redirect user to payment
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].redirect(pakasirCheckoutUrl, {
            status: 303
        });
    } catch (error) {
        console.error('Checkout error:', error);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Internal server error'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__019cat1._.js.map