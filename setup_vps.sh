#!/bin/bash
set -e

echo "=== System Update & Upgrade ==="
export DEBIAN_FRONTEND=noninteractive
sudo apt-get update
sudo apt-get upgrade -y

echo "=== Adding Swap Space (4GB) ==="
if [ ! -f /swapfile ]; then
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "Swap added."
else
    echo "Swapfile already exists."
fi

echo "=== Installing Basic Dependencies ==="
sudo apt-get install -y curl git wget build-essential ufw

echo "=== Installing Nginx & Certbot ==="
sudo apt-get install -y nginx certbot python3-certbot-nginx

echo "=== Installing Node.js v22 ==="
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "=== Installing PM2, Yarn, pnpm ==="
sudo npm install -g pm2 yarn pnpm

echo "=== Tuning System Performance ==="
# Increase max file descriptors
if ! grep -q "fs.file-max" /etc/sysctl.conf; then
    echo "fs.file-max = 65535" | sudo tee -a /etc/sysctl.conf
fi
sudo sysctl -p

echo "=== Setup UFW Firewall ==="
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "=== Setup Completed Successfully ==="
node -v
npm -v
pm2 -v
nginx -v
sudo ufw status
