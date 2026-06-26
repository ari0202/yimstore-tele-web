#!/bin/bash
set -e

echo "Uninstalling n8n latest..."
sudo npm uninstall -g n8n || true

echo "Installing n8n@2.8.4..."
sudo npm install -g n8n@2.8.4

echo "Deleting old n8n pm2 process..."
sudo pm2 delete n8n || true

echo "Starting n8n with WEBHOOK_URL..."
sudo WEBHOOK_URL=https://n8n.yimsdigital.online pm2 start n8n --name "n8n"

echo "Saving PM2..."
sudo pm2 save

echo "Done!"
