module.exports = {
  apps: [
    {
      name: 'yimstore-web-bot',
      script: 'server.js',
      cwd: '/var/www/yimstore-tele-web',
      instances: 1, // Bisa diubah ke 'max' jika resource VPS mendukung (cluster mode)
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        // Pastikan file .env ada di dalam direktori VPS (/var/www/yimstore-tele-web/.env)
        // Environment variables tambahan akan dimuat dari file .env tersebut
      }
    }
  ]
};
