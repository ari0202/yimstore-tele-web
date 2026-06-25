import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { Resend } from 'resend';

export async function POST(req: Request) {
    try {
        const { orderId, email } = await req.json();
        if (!orderId || !email) {
            return NextResponse.json({ error: 'Order ID dan Email wajib diisi' }, { status: 400 });
        }

        const { data: order } = await supabaseAdmin
            .from('orders')
            .select('id, email, access_token')
            .eq('id', orderId)
            .eq('email', email)
            .single();

        if (!order) {
            return NextResponse.json({ error: 'Pesanan tidak ditemukan atau email tidak cocok' }, { status: 404 });
        }

        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();

        await supabaseAdmin.from('otp_codes').insert({
            order_id: order.id,
            email: order.email,
            code: code,
            expires_at: expiresAt
        });

        if (process.env.RESEND_API_KEY) {
            const resend = new Resend(process.env.RESEND_API_KEY);
            await resend.emails.send({
                from: 'YimStore <noreply@yimdigital.store>',
                to: email,
                subject: 'Kode OTP Pemulihan Pesanan Anda',
                html: `
                    <h2>Pemulihan Akses Pesanan</h2>
                    <p>Seseorang telah meminta pemulihan akses untuk pesanan <strong>${orderId}</strong>.</p>
                    <p>Kode OTP Anda adalah: <strong style="font-size: 24px;">${code}</strong></p>
                    <p>Kode ini akan kedaluwarsa dalam 15 menit.</p>
                `
            });
        } else {
            console.warn('RESEND_API_KEY not set. OTP code:', code);
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
