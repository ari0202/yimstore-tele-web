#!/bin/bash
set -e

echo "=== Optimizing Nginx Performance Global Config ==="
# Backup original nginx.conf
sudo cp /etc/nginx/nginx.conf /etc/nginx/nginx.conf.backup

# Create optimized nginx.conf
cat << 'EOF' | sudo tee /etc/nginx/nginx.conf
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

# Increase worker connections for high traffic
events {
    worker_connections 4096;
    multi_accept on;
    use epoll;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;

    # Increase maximum upload size
    client_max_body_size 50M;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging Settings
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log crit;

    # Gzip Settings
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_buffers 16 8k;
    gzip_http_version 1.1;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript image/svg+xml;

    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
EOF

echo "=== Creating Server Block for Next.js App ==="
cat << 'EOF' | sudo tee /etc/nginx/sites-available/yimstore
server {
    listen 80;
    listen [::]:80;
    
    server_name yimdigital.store www.yimdigital.store pastidatang.id www.pastidatang.id wa.pastidatang.id yimsdigital.online www.yimsdigital.online;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Proxy Buffers to prevent 502/504 errors on large payloads
        proxy_buffer_size   128k;
        proxy_buffers   4 256k;
        proxy_busy_buffers_size   256k;
    }
}
EOF

echo "=== Creating Server Block for n8n ==="
cat << 'EOF' | sudo tee /etc/nginx/sites-available/n8n
server {
    listen 80;
    listen [::]:80;
    
    server_name n8n.yimsdigital.online;

    location / {
        proxy_pass http://localhost:5678;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        chunked_transfer_encoding off;
        proxy_buffering off;
        proxy_cache off;
    }
}
EOF

# Enable the sites
sudo ln -sf /etc/nginx/sites-available/yimstore /etc/nginx/sites-enabled/yimstore
sudo ln -sf /etc/nginx/sites-available/n8n /etc/nginx/sites-enabled/n8n

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl reload nginx
echo "Nginx configured successfully."
