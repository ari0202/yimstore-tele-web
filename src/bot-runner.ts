import dotenv from 'dotenv';
dotenv.config();

import { bot } from './lib/bot';

console.log('Starting Telegram Bot in long-polling mode...');

bot.start({
  onStart: (botInfo) => {
    console.log(`Bot @${botInfo.username} started successfully!`);
  },
});

process.once('SIGINT', () => bot.stop());
process.once('SIGTERM', () => bot.stop());
