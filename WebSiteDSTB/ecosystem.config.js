// PM2 Configuration for production
// Chạy: pm2 start ecosystem.config.js
// Xem logs: pm2 logs
// Restart: pm2 restart all

module.exports = {
  apps: [{
    name: 'taybac-backend',
    script: './backend/server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 4000
    },
    error_file: './logs/backend-err.log',
    out_file: './logs/backend-out.log',
    log_file: './logs/backend-combined.log',
    time: true,
    // Auto restart nếu crash
    min_uptime: '10s',
    max_restarts: 10,
    // Graceful shutdown
    kill_timeout: 5000
  }]
}
