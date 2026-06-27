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
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      }
    },
    {
      name: 'yimstore-bot',
      script: 'npx',
      args: 'tsx --conditions react-server src/bot-runner.ts',
      cwd: '/home/ubuntu/yimstore-tele-web',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
      }
    }
  ]
};
