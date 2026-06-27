import dotenv from 'dotenv';
dotenv.config();

console.log('Starting Telegram Bot in long-polling mode...');

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
