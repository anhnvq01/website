# 🚀 Hướng Dẫn Deploy TayBac Shop Lên VPS Production

## 📋 Yêu cầu

- **VPS**: Ubuntu 20.04/22.04 (512MB RAM trở lên)
- **Domain**: Đã trỏ về IP của VPS
- **Git Repository**: Code đã push lên GitHub/GitLab

## 💰 Chi phí dự kiến

### VPS Việt Nam
- **Azdigi**: 69k/tháng (1GB RAM, 20GB SSD)
- **INET**: 50k/tháng (512MB RAM, 15GB SSD)
- **MatBao**: 60-80k/tháng

### VPS Nước ngoài (rẻ hơn, tốc độ chậm hơn)
- **DigitalOcean**: $4/tháng (~95k VNĐ)
- **Vultr**: $6/tháng (~140k VNĐ)
- **Hostinger VPS**: $4/tháng

### Domain
- **.com**: 200-300k/năm
- **.vn**: 400-600k/năm

**Tổng: ~1-1.5 triệu/năm** (VPS nước ngoài + domain .com)

---

## 🎯 Quy trình Deploy (3 bước chính)

```
1. Setup VPS (chạy 1 lần)
   ↓
2. Deploy lần đầu (chạy 1 lần)
   ↓
3. Update code (chạy mỗi khi có thay đổi)
```

---

## 📝 Bước 1: Chuẩn bị

### 1.1. Mua VPS và Domain

**Mua VPS:**
1. Chọn nhà cung cấp (khuyến nghị: DigitalOcean hoặc Azdigi)
2. Chọn gói: Ubuntu 22.04, tối thiểu 512MB RAM
3. Lưu lại IP của VPS (ví dụ: `103.xxx.xxx.xxx`)

**Mua Domain:**
1. Mua domain ở Tenten.vn, Pa.vn, GoDaddy, Namecheap...
2. Trỏ domain về IP VPS:
   ```
   A Record:  @        → 103.xxx.xxx.xxx
   A Record:  www      → 103.xxx.xxx.xxx
   ```
3. Đợi 5-30 phút để DNS cập nhật

### 1.2. Push code lên Git

```bash
# Nếu chưa có repo
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/taybac-shop.git
git push -u origin main
```

### 1.3. SSH vào VPS

```bash
ssh root@103.xxx.xxx.xxx
# Nhập password đã nhận qua email
```

---

## 🛠️ Bước 2: Setup VPS (chạy 1 lần)

### 2.1. Chạy script tự động

```bash
# Download script
wget https://raw.githubusercontent.com/yourusername/taybac-shop/main/setup-vps.sh

# Hoặc nếu đã có code
cd /root
git clone https://github.com/yourusername/taybac-shop.git
cd taybac-shop

# Chạy script
chmod +x setup-vps.sh
sudo bash setup-vps.sh
```

Script sẽ tự động cài:
- ✅ Node.js 18
- ✅ PM2 (quản lý process)
- ✅ Nginx (web server)
- ✅ Certbot (SSL miễn phí)
- ✅ Git

---

## 🚀 Bước 3: Deploy Lần Đầu

### 3.1. Chỉnh sửa file deploy

```bash
cd /root/taybac-shop
nano deploy-first-time.sh
```

Sửa 3 dòng này:
```bash
REPO_URL="https://github.com/yourusername/taybac-shop.git"  # Repo của bạn
DOMAIN="dacsantaybac.com"                                     # Domain của bạn
# Dòng 53: thay your-email@example.com thành email của bạn
```

### 3.2. Chạy deploy

```bash
chmod +x deploy-first-time.sh
bash deploy-first-time.sh
```

**Quan trọng:** Script sẽ dừng lại để bạn config `.env`:

```bash
cd /var/www/taybac/backend
nano .env
```

Sửa các giá trị:
```env
JWT_SECRET=your-very-strong-secret-key-here-min-32-characters
TELEGRAM_BOT_TOKEN=your-telegram-bot-token  # Nếu có
TELEGRAM_CHAT_ID=your-chat-id               # Nếu có
```

Nhấn `Ctrl+O` → Enter → `Ctrl+X` để lưu.

Sau đó nhấn Enter để script tiếp tục.

### 3.3. Kiểm tra

```bash
pm2 status
pm2 logs
```

Mở trình duyệt: `https://yourdomain.com` → Phải thấy website!

---

## 🔄 Bước 4: Update Code (chạy mỗi khi có thay đổi)

Khi bạn sửa code ở local và push lên Git:

### 4.1. Từ máy local (Windows)

```powershell
# Commit và push
git add .
git commit -m "Update tính năng X"
git push origin main
```

### 4.2. SSH vào VPS và update

```bash
ssh root@103.xxx.xxx.xxx
cd /var/www/taybac
bash deploy.sh
```

Script `deploy.sh` sẽ tự động:
1. ✅ Pull code mới
2. ✅ Install dependencies
3. ✅ Build frontend
4. ✅ Backup database
5. ✅ Restart backend
6. ✅ Reload nginx

**Chỉ mất ~30 giây!**

---

## 📊 Quản lý và Giám sát

### Xem trạng thái

```bash
pm2 status                    # Xem app đang chạy
pm2 logs taybac-backend       # Xem logs real-time
pm2 logs --lines 100          # Xem 100 dòng cuối
```

### Restart/Stop

```bash
pm2 restart taybac-backend    # Restart backend
pm2 stop taybac-backend       # Stop backend
pm2 start ecosystem.config.js # Start lại
```

### Xem logs Nginx

```bash
tail -f /var/log/nginx/taybac-access.log   # Access logs
tail -f /var/log/nginx/taybac-error.log    # Error logs
```

### Kiểm tra disk space

```bash
df -h                         # Xem dung lượng còn lại
```

### Backup database

```bash
# Backup thủ công
cd /var/www/taybac/backend
cp taybac.db taybac.db.backup.$(date +%Y%m%d)

# Download về máy local (chạy từ Windows)
scp root@103.xxx.xxx.xxx:/var/www/taybac/backend/taybac.db ./backup/
```

---

## 🔒 Bảo mật

### 1. Đổi password root

```bash
passwd root
```

### 2. Tạo user mới (không dùng root)

```bash
adduser taybac
usermod -aG sudo taybac
su - taybac
```

### 3. Cấu hình SSH key (không cần password)

Từ Windows:
```powershell
ssh-keygen -t rsa -b 4096
ssh-copy-id root@103.xxx.xxx.xxx
```

### 4. Tắt SSH bằng password

```bash
sudo nano /etc/ssh/sshd_config
# Sửa: PasswordAuthentication no
sudo systemctl restart sshd
```

---

## 🐛 Xử lý lỗi thường gặp

### Lỗi: "502 Bad Gateway"

```bash
# Kiểm tra backend có chạy không
pm2 status

# Restart backend
pm2 restart taybac-backend

# Xem logs lỗi
pm2 logs taybac-backend --err
```

### Lỗi: "Cannot connect to database"

```bash
# Kiểm tra file DB
ls -lh /var/www/taybac/backend/taybac.db

# Khởi tạo lại DB
cd /var/www/taybac/backend
npm run init-db
```

### Lỗi: "Port 4000 already in use"

```bash
# Tìm process đang dùng port
sudo lsof -i :4000

# Kill process
pm2 delete taybac-backend
pm2 start ecosystem.config.js
```

### Website chậm

```bash
# Xem CPU/RAM
htop

# Restart tất cả
pm2 restart all
sudo systemctl restart nginx
```

---

## 📈 Nâng cấp

### Tăng RAM khi website lớn

Khi có nhiều người dùng, cân nhắc nâng gói VPS:
- 512MB → 1GB: 100-150k/tháng
- 1GB → 2GB: 150-250k/tháng

### Chuyển sang PostgreSQL (database mạnh hơn)

SQLite phù hợp với ~100-500 người dùng/ngày.  
Nếu lớn hơn, chuyển sang PostgreSQL:

```bash
# Cài PostgreSQL
sudo apt install postgresql postgresql-contrib

# Xem hướng dẫn migration (tạo riêng nếu cần)
```

### Thêm CDN (tăng tốc độ)

Dùng Cloudflare (miễn phí):
1. Đăng ký Cloudflare
2. Add domain
3. Đổi nameserver về Cloudflare
4. Enable CDN và SSL

→ Website sẽ nhanh hơn 2-3 lần!

---

## ✅ Checklist Deploy

- [ ] Đã mua VPS
- [ ] Đã mua domain và trỏ về VPS
- [ ] Đã push code lên Git
- [ ] Đã SSH vào VPS thành công
- [ ] Đã chạy `setup-vps.sh`
- [ ] Đã sửa `REPO_URL` và `DOMAIN` trong `deploy-first-time.sh`
- [ ] Đã chạy `deploy-first-time.sh`
- [ ] Đã config `.env` với JWT_SECRET mạnh
- [ ] Đã kiểm tra `pm2 status` → running
- [ ] Đã truy cập `https://yourdomain.com` → OK
- [ ] Đã test đặt hàng → nhận được thông báo
- [ ] Đã backup database

---

## 🆘 Liên hệ và Hỗ trợ

Nếu gặp vấn đề:

1. **Xem logs chi tiết:**
   ```bash
   pm2 logs --lines 200
   tail -f /var/log/nginx/taybac-error.log
   ```

2. **Kiểm tra kết nối:**
   ```bash
   curl http://localhost:4000/api/products
   ```

3. **Restart toàn bộ:**
   ```bash
   pm2 restart all
   sudo systemctl restart nginx
   ```

---

## 📚 Tài liệu tham khảo

- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [DigitalOcean Tutorials](https://www.digitalocean.com/community/tutorials)

---

**🎉 Chúc bạn deploy thành công!**

Sau khi deploy xong, bạn có thể:
- ✅ Khách hàng truy cập 24/7 không bị ngắt
- ✅ Update code đơn giản bằng `bash deploy.sh`
- ✅ Thêm sản phẩm, ảnh không lo mất dữ liệu
- ✅ Database được backup tự động mỗi lần deploy
