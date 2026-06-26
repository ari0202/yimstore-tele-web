import dotenv from 'dotenv';
dotenv.config({ path: '.env.development' });

console.log('Starting Telegram Bot in long-polling mode...');
console.log('Token starts with:', process.env.TELEGRAM_BOT_TOKEN?.substring(0, 10));

async function startBot() {
  const { bot } = await import('./lib/bot');

  bot.start({
    onStart: (botInfo: any) => {
      console.log(`Bot @${botInfo.username} started successfully!`);
    },
  });

  process.once('SIGINT', () => bot.stop());
  process.once('SIGTERM', () => bot.stop());
}

startBot();
