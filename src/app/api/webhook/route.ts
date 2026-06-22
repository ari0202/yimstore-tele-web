import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: Request) {
  // Gunakan arrayBuffer untuk mencegah normalisasi string yang memecahkan signature
  const rawBody = await req.arrayBuffer();
  const signature = req.headers.get('x-pakasir-signature');
  
  // Signature hilang bisa 401 karena bukan dari Pakasir
  if (!signature) return NextResponse.json({ error: 'Missing sig' }, { status: 401 });

  // 1. HMAC Validation using timingSafeEqual & Buffer
  const payloadBuffer = Buffer.from(rawBody);
  const expectedSigBuffer = Buffer.from(crypto.createHmac('sha256', process.env.PAKASIR_HMAC_SECRET || process.env.PAKASIR_SECRET!).update(payloadBuffer).digest('hex'));
  const signatureBuffer = Buffer.from(signature);

  // Return 401 agar Pakasir meretry request jika secret key server sedang salah / rotasi
  if (expectedSigBuffer.length !== signatureBuffer.length || !crypto.timingSafeEqual(expectedSigBuffer, signatureBuffer)) {
    return NextResponse.json({ error: 'Invalid sig' }, { status: 401 });
  }

  const payload = JSON.parse(payloadBuffer.toString('utf-8'));
  const orderId = payload.order_id;

  // 2. Fulfillment
  const { data: result, error } = await supabaseAdmin.rpc('process_payment_fulfillment', { 
    p_order_id: orderId, 
    p_amount: payload.amount 
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // Cegah Retry Storm dengan mereturn 200 pada kasus logic error
  if (result === 'AMOUNT_MISMATCH') return NextResponse.json({ error: 'Amount mismatch' }, { status: 200 });
  if (result === 'DUPLICATE') return NextResponse.json({ message: 'Already processed' }, { status: 200 });

  return NextResponse.json({ message: 'Webhook processed' });
}
