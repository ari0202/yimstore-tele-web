import { NextResponse } from 'next/server';
import { webhookCallback } from 'grammy';
import { bot } from '@/lib/bot';
import { Redis } from '@upstash/redis';

const grammyHandler = webhookCallback(bot, 'std/http', {
  secretToken: process.env.TELEGRAM_WEBHOOK_SECRET,
});

export async function POST(req: Request) {
  try {
    const rawBody = await req.clone().text();
    const update = JSON.parse(rawBody);
    
    // Use update_id as idempotency key for Telegram
    if (update.update_id) {
      const redis = Redis.fromEnv();
      const idempotencyKey = `tg_update_${update.update_id}`;
      const isDuplicate = await redis.setnx(`webhook_idempotency:${idempotencyKey}`, 'processed');
      
      if (!isDuplicate) {
        console.log(`⚠️ Telegram update idempotency hit: skipping ${update.update_id}`);
        return NextResponse.json({ message: 'Duplicate update (Idempotency Key)' }, { status: 200 });
      }
    }
    
    return await grammyHandler(req);
  } catch (error) {
    console.error('Telegram webhook error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
