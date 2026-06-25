import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
    try {
        const { orderId, email, code } = await req.json();
        if (!orderId || !email || !code) {
            return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
        }

        // Cari OTP valid
        const { data: otp, error: otpError } = await supabaseAdmin
            .from('otp_codes')
            .select('id, expires_at, used_at')
            .eq('order_id', orderId)
            .eq('email', email)
            .eq('code', code)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (otpError || !otp) {
            return NextResponse.json({ error: 'Kode OTP tidak valid' }, { status: 400 });
        }

        if (otp.used_at) {
            return NextResponse.json({ error: 'Kode OTP sudah digunakan' }, { status: 400 });
        }

        if (new Date(otp.expires_at) < new Date()) {
            return NextResponse.json({ error: 'Kode OTP sudah kedaluwarsa' }, { status: 400 });
        }

        // Dapatkan token pesanan
        const { data: order } = await supabaseAdmin
            .from('orders')
            .select('access_token')
            .eq('id', orderId)
            .single();

        if (!order) {
            return NextResponse.json({ error: 'Pesanan tidak ditemukan' }, { status: 404 });
        }

        // Tandai OTP digunakan
        await supabaseAdmin.from('otp_codes').update({ used_at: new Date().toISOString() }).eq('id', otp.id);

        // Buat response dengan cookie
        const response = NextResponse.json({ success: true, redirectUrl: `/order/${orderId}` });
        
        response.cookies.set(`order_token_${orderId}`, order.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30 // 30 hari
        });

        return response;
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
