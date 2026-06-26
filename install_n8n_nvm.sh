#!/bin/bash
set -e

export NVM_DIR="/root/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "Uninstalling n8n latest..."
npm uninstall -g n8n || true

echo "Installing n8n@2.8.4..."
npm install -g n8n@2.8.4

echo "Deleting old n8n pm2 process..."
pm2 delete n8n || true

echo "Starting n8n with WEBHOOK_URL..."
WEBHOOK_URL=https://n8n.yimsdigital.online pm2 start n8n --name "n8n"

echo "Saving PM2..."
pm2 save

echo "Done!"
