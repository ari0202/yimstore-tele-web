const dotenv = require('dotenv');
dotenv.config({ path: './.env' });

module.exports = {
  apps: [
    {
      name: 'yimstore-web',
      script: 'node',
      args: '.next/standalone/server.js',
      cwd: '/home/ubuntu/yimstore-tele-web',
      exec_mode: 'fork',
      instances: 1, // Bisa diubah ke 'max' jika resource VPS mendukung (cluster mode)
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: 3001,
      }
    }
  ]
};
