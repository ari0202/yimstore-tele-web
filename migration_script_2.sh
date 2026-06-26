#!/bin/bash
set -e

echo "=== Installing n8n globally ==="
sudo npm install -g n8n

echo "=== Setting up Projects ==="
# yimstore-tele-web
echo "-> Installing dependencies for yimstore-tele-web"
cd /root/yimstore-tele-web
sudo npm install
echo "-> Building yimstore-tele-web"
sudo npm run build

# bot-tele-auto
echo "-> Installing dependencies for bot-tele-auto"
cd /root/bot-tele-auto
sudo npm install

# capcut-bot
echo "-> Installing dependencies for capcut-bot"
cd /root/Akun/capcut-account-maker
sudo npm install

echo "=== Starting PM2 Services ==="
sudo pm2 start /root/bot-tele-auto/balz.js --name "bot-tele-auto"
sudo pm2 start /root/Akun/capcut-account-maker/src/bot.js --name "capcut-bot"
sudo pm2 start n8n --name "n8n"
sudo pm2 start npm --name "yimstore-web" --cwd /root/yimstore-tele-web -- start
sudo pm2 start "npx tsx --env-file=.env src/bot-runner.ts" --name "telegram-bot" --cwd /root/yimstore-tele-web

# Generate PM2 Startup script for root
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u root --hp /root || true
sudo pm2 save

# Setup crontab
echo "=== Setting up Crontab ==="
cat << 'EOF' | crontab -
CRON_SECRET="00eee468711109198fd3af5e6"
BASE_URL="https://pastidatang.id"

* * * * * curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/cron/expire-bookings" > /var/log/pastidatang_expire.log 2>&1
* * * * * curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/cron/notification-retry" > /var/log/pastidatang_notification_retry.log 2>&1
5 0 * * * curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/cron/subscription-expiry" > /var/log/pastidatang_sub_expiry.log 2>&1
0 8 * * * curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/cron/reminder-h1" > /var/log/pastidatang_reminder_h1.log 2>&1
30 8 * * * curl -s -X POST -H "Authorization: Bearer $CRON_SECRET" "$BASE_URL/api/cron/reminder-h2" > /var/log/pastidatang_reminder_h2.log 2>&1
* * * * * curl -X POST http://localhost:3000/api/cron/process-outbox >/dev/null 2>&1
* * * * * curl -X POST http://localhost:3000/api/cron/process-outbox >/dev/null 2>&1
EOF

echo "=== Migration script completed successfully ==="
sudo pm2 list
sudo docker ps
