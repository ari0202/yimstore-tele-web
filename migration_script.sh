#!/bin/bash
set -e

echo "=== Installing Docker ==="
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
fi

echo "=== Running Evolution API ==="
sudo docker rm -f evolution_api || true
sudo docker run -d --name evolution_api -p 8085:8080 --restart always \
  -e SERVER_URL=https://wa.pastidatang.id \
  -e DOCKER_ENV=true \
  -e LOG_LEVEL=CLIENT,ERROR,INFO \
  -e AUTHENTICATION_TYPE=apikey \
  -e AUTHENTICATION_API_KEY=BryanNova110236 \
  -e WA_SESSION_ID=pastidatang_wa \
  -e WA_SESSION_NAME=pastidatang_wa \
  -e SERVER_TYPE=http \
  -e SERVER_PORT=8080 \
  -e CORS_ORIGIN="*" \
  -e CORS_METHODS=POST,GET,PUT,DELETE \
  -e CORS_CREDENTIALS=true \
  -e LOG_COLOR=true \
  -e LOG_BAILEYS=error \
  -e DEL_INSTANCE=false \
  -e DEL_TEMP_INSTANCES=true \
  -e STORE_MESSAGES=true \
  -e STORE_MESSAGE_UP=true \
  atendai/evolution-api:v1.8.2

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

echo "=== Migration script completed successfully ==="
sudo pm2 list
sudo docker ps
