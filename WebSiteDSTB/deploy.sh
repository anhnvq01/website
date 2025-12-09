#!/bin/bash
# Script deploy/update TayBac Shop trên VPS
# Chạy: bash deploy.sh

set -e

APP_DIR="/var/www/taybac"
BRANCH="main"  # Hoặc branch bạn muốn deploy

echo "🚀 Bắt đầu deploy TayBac Shop..."

# 1. Pull code mới nhất
echo "📥 Pull code từ Git..."
cd $APP_DIR
git pull origin $BRANCH

# 2. Install dependencies cho backend
echo "📦 Cài đặt dependencies backend..."
cd $APP_DIR/backend
npm install --production

# 3. Build frontend
echo "🏗️  Build frontend..."
cd $APP_DIR/frontend
npm install
npm run build

# 4. Backup database (nếu có)
echo "💾 Backup database..."
if [ -f "$APP_DIR/backend/taybac.db" ]; then
    cp $APP_DIR/backend/taybac.db $APP_DIR/backend/taybac.db.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Database đã được backup"
fi

# 5. Restart PM2
echo "🔄 Restart backend với PM2..."
cd $APP_DIR
pm2 restart ecosystem.config.js
pm2 save

# 6. Reload Nginx
echo "🔄 Reload Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo ""
echo "✅ Deploy thành công!"
echo ""
echo "📊 Kiểm tra status:"
pm2 status
echo ""
echo "📝 Xem logs: pm2 logs taybac-backend"
echo "🌐 Website: https://yourdomain.com"
