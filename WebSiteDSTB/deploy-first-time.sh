#!/bin/bash
# Script deploy lần đầu tiên cho TayBac Shop
# Chạy sau khi đã setup VPS và có domain

set -e

APP_DIR="/var/www/taybac"
REPO_URL="YOUR_GIT_REPO_URL"  # Thay bằng URL repo của bạn
DOMAIN="yourdomain.com"        # Thay bằng domain của bạn

echo "🚀 Deploy lần đầu TayBac Shop..."

# 1. Clone repository
echo "📥 Clone repository..."
if [ ! -d "$APP_DIR/.git" ]; then
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
else
    echo "Repository đã tồn tại, pull code mới nhất..."
    cd $APP_DIR
    git pull
fi

# 2. Cài đặt dependencies backend
echo "📦 Cài đặt backend..."
cd $APP_DIR/backend
npm install --production

# 3. Copy và config .env
if [ ! -f "$APP_DIR/backend/.env" ]; then
    echo "⚙️  Tạo file .env..."
    cp $APP_DIR/backend/.env.example $APP_DIR/backend/.env
    echo ""
    echo "⚠️  Lưu ý: Hãy chỉnh sửa file .env với thông tin thực tế:"
    echo "   - JWT_SECRET (tạo secret key mạnh)"
    echo "   - TELEGRAM_BOT_TOKEN (nếu dùng)"
    echo "   - TELEGRAM_CHAT_ID (nếu dùng)"
    echo ""
    echo "Nhấn Enter để tiếp tục sau khi đã cấu hình .env..."
    read
fi

# 4. Khởi tạo database
echo "💾 Khởi tạo database..."
cd $APP_DIR/backend
npm run init-db

# 5. Build frontend
echo "🏗️  Build frontend..."
cd $APP_DIR/frontend
npm install
npm run build

# 6. Config nginx
echo "⚙️  Cấu hình Nginx..."
sudo cp $APP_DIR/nginx-taybac.conf /etc/nginx/sites-available/taybac
sudo sed -i "s/yourdomain.com/$DOMAIN/g" /etc/nginx/sites-available/taybac
sudo ln -sf /etc/nginx/sites-available/taybac /etc/nginx/sites-enabled/
sudo nginx -t

# 7. Cài đặt SSL với Let's Encrypt
echo "🔒 Cài đặt SSL certificate..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email your-email@example.com

# 8. Tạo thư mục logs
mkdir -p $APP_DIR/logs

# 9. Start PM2
echo "🚀 Start backend với PM2..."
cd $APP_DIR
pm2 start ecosystem.config.js
pm2 save
pm2 startup

echo ""
echo "✅ Deploy lần đầu hoàn tất!"
echo ""
echo "🎉 Website đã sẵn sàng tại: https://$DOMAIN"
echo ""
echo "📝 Các lệnh hữu ích:"
echo "   - Xem logs: pm2 logs"
echo "   - Restart: pm2 restart all"
echo "   - Status: pm2 status"
echo "   - Deploy/update: bash deploy.sh"
