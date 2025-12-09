#!/bin/bash
# Script tự động setup VPS Ubuntu cho TayBac Shop
# Chạy với quyền root: sudo bash setup-vps.sh

set -e

echo "=== Bắt đầu cài đặt VPS cho TayBac Shop ==="

# 1. Update hệ thống
echo "📦 Cập nhật hệ thống..."
apt update && apt upgrade -y

# 2. Cài đặt Node.js 18.x
echo "📦 Cài đặt Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# 3. Cài đặt PM2
echo "📦 Cài đặt PM2..."
npm install -g pm2

# 4. Cài đặt Nginx
echo "📦 Cài đặt Nginx..."
apt install -y nginx

# 5. Cài đặt Certbot cho SSL
echo "📦 Cài đặt Certbot (Let's Encrypt SSL)..."
apt install -y certbot python3-certbot-nginx

# 6. Cài đặt Git
echo "📦 Cài đặt Git..."
apt install -y git

# 7. Tạo thư mục cho ứng dụng
echo "📁 Tạo thư mục ứng dụng..."
mkdir -p /var/www/taybac
chown -R $USER:$USER /var/www/taybac

# 8. Cấu hình firewall
echo "🔒 Cấu hình firewall..."
ufw allow 'Nginx Full'
ufw allow OpenSSH
echo "y" | ufw enable

# 9. Tạo user cho ứng dụng (tùy chọn, an toàn hơn)
echo "👤 Tạo user taybac..."
if ! id "taybac" &>/dev/null; then
    useradd -m -s /bin/bash taybac
    usermod -aG sudo taybac
fi

echo ""
echo "✅ Cài đặt cơ bản hoàn tất!"
echo ""
echo "📝 Các bước tiếp theo:"
echo "1. Clone code: cd /var/www/taybac && git clone <your-repo-url> ."
echo "2. Cấu hình nginx: sudo nano /etc/nginx/sites-available/taybac"
echo "3. Copy file nginx-taybac.conf (sẽ tạo ở bước sau)"
echo "4. Cài đặt SSL: sudo certbot --nginx -d yourdomain.com"
echo "5. Deploy app: bash deploy.sh"
echo ""
echo "🔍 Kiểm tra version:"
node --version
npm --version
pm2 --version
nginx -v
