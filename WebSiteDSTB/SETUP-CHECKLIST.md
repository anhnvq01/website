# 📋 CHECKLIST SETUP POSTGRESQL CHO TOÀN BỘ HỆ THỐNG

## ✅ Bước 1: Setup PostgreSQL Cloud (Render)

### 1.1. Tạo PostgreSQL trên Render
- [ ] Đăng ký/Login: https://render.com
- [ ] Dashboard → New → PostgreSQL
- [ ] Database Name: `taybac`
- [ ] Region: Oregon (US West) - gần VN nhất
- [ ] Plan: **Free** (256MB, đủ dùng)
- [ ] Create Database
- [ ] Copy **External Database URL** (dạng: postgres://user:pass@dpg-xxx.oregon-postgres.render.com/db_xxx)

---

## ✅ Bước 2: Import data hiện tại vào PostgreSQL

### 2.1. Trên máy hiện tại (Windows)
```powershell
cd F:\QA\Code' Deploy'\website\WebSiteDSTB\backend

# Tạo file .env
Copy-Item .env.example .env
notepad .env
```

### 2.2. Thêm vào .env:
```env
NODE_ENV=production
DATABASE_URL=postgres://user:pass@dpg-xxx.oregon-postgres.render.com/db_xxx
JWT_SECRET=your-super-secret-key-min-32-chars
PORT=4000
SHIPPING_COST=30000
```

### 2.3. Import data
```powershell
# Đã export rồi (có file export-*.json)
node import-to-postgres.js
```

**Kiểm tra:**
- [ ] Import thành công
- [ ] Hiển thị: "✅ Imported X products"
- [ ] Hiển thị: "✅ Imported X orders"

---

## ✅ Bước 3: Test backend local với PostgreSQL

```powershell
cd backend
npm start
```

**Kiểm tra:**
- [ ] Thấy: "🐘 Using PostgreSQL database"
- [ ] Thấy: "✅ PostgreSQL connected successfully"
- [ ] Server chạy port 4000
- [ ] Mở http://localhost:4000/api/products → thấy sản phẩm

---

## ✅ Bước 4: Push code lên GitHub

### 4.1. Update .gitignore
```gitignore
# Đã có trong .gitignore:
.env
.env.local
.env.production
*.db
export-*.json
```

### 4.2. Push code
```powershell
git add .
git commit -m "Add PostgreSQL support + migration scripts"
git push origin main
```

**Kiểm tra:**
- [ ] Code đã push thành công
- [ ] File `.env` KHÔNG được commit (bảo mật)

---

## ✅ Bước 5: Deploy Backend lên Render

### 5.1. Tạo Web Service
- [ ] Render Dashboard → New → Web Service
- [ ] Connect GitHub repository
- [ ] Name: `taybac-backend`
- [ ] Root Directory: `backend`
- [ ] Environment: `Node`
- [ ] Build Command: `npm install`
- [ ] Start Command: `npm start`
- [ ] Plan: **Free**

### 5.2. Environment Variables
Thêm các biến môi trường:
```
NODE_ENV=production
DATABASE_URL=postgres://user:pass@dpg-xxx.oregon-postgres.render.com/db_xxx
JWT_SECRET=your-super-secret-key-min-32-chars
PORT=4000
SHIPPING_COST=30000
```

### 5.3. Deploy
- [ ] Click "Create Web Service"
- [ ] Đợi deploy (~3-5 phút)
- [ ] Copy URL backend: `https://taybac-backend.onrender.com`

**Kiểm tra:**
- [ ] Mở: `https://taybac-backend.onrender.com/api/products`
- [ ] Thấy danh sách sản phẩm (JSON)

---

## ✅ Bước 6: Deploy Frontend lên Vercel

### 6.1. Update API URL
```powershell
cd frontend
notepad .env.production
```

Thêm:
```env
VITE_API_URL=https://taybac-backend.onrender.com
```

### 6.2. Update code (nếu cần)
File `frontend/src/config.js` (hoặc tương tự):
```javascript
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
```

### 6.3. Deploy Vercel
- [ ] Login: https://vercel.com
- [ ] New Project → Import Git Repository
- [ ] Select repository
- [ ] Framework Preset: **Vite**
- [ ] Root Directory: `frontend`
- [ ] Environment Variables:
  ```
  VITE_API_URL=https://taybac-backend.onrender.com
  ```
- [ ] Deploy

**Kiểm tra:**
- [ ] Website live: `https://your-site.vercel.app`
- [ ] Xem được sản phẩm
- [ ] Đặt hàng được
- [ ] Data lưu vào PostgreSQL

---

## ✅ Bước 7: Setup cho máy dev khác

### 7.1. Trên máy dev mới
```powershell
# Clone repo
git clone <your-repo-url>
cd WebSiteDSTB

# Backend
cd backend
npm install
Copy-Item .env.example .env
notepad .env
```

### 7.2. Thêm DATABASE_URL giống máy cũ
```env
DATABASE_URL=postgres://user:pass@dpg-xxx.oregon-postgres.render.com/db_xxx
NODE_ENV=development
JWT_SECRET=your-secret
```

### 7.3. Start
```powershell
npm start
```

**Kiểm tra:**
- [ ] Thấy data giống máy cũ (vì dùng chung DB cloud)
- [ ] Thêm sản phẩm mới → máy kia cũng thấy

---

## ✅ Bước 8: Deploy lên VPS (sau này)

### 8.1. Tạo PostgreSQL trên VPS (hoặc dùng luôn Render)

**Option A: Dùng PostgreSQL Render (đơn giản)**
- Dùng luôn DATABASE_URL như dev
- Không cần làm gì thêm

**Option B: PostgreSQL riêng trên VPS**
```bash
# SSH vào VPS
ssh root@your-vps-ip

# Cài PostgreSQL
sudo apt install postgresql -y
sudo -u postgres createdb taybac
sudo -u postgres createuser taybac_user -P

# Export từ Render (chạy trên local)
pg_dump "postgres://user:pass@dpg-xxx.oregon-postgres.render.com/db_xxx" > backup.sql

# Upload lên VPS
scp backup.sql root@your-vps-ip:/tmp/

# Import vào VPS
psql postgresql://taybac_user:password@localhost/taybac < /tmp/backup.sql
```

### 8.2. Deploy code
```bash
cd /var/www/taybac
bash deploy.sh
```

---

## 📊 Tóm tắt kiến trúc cuối cùng

```
┌─────────────────────────────────────────────────┐
│         Render PostgreSQL (Cloud)               │
│  postgres://dpg-xxx.oregon-postgres.render.com  │
│         ↑         ↑           ↑                 │
└─────────┼─────────┼───────────┼─────────────────┘
          │         │           │
    ┌─────┴───┐ ┌───┴────┐  ┌──┴─────┐
    │ Máy Dev │ │ Render │  │ Vercel │
    │ (local) │ │Backend │  │Frontend│
    └─────────┘ └────────┘  └────────┘
```

**Khi deploy VPS production:**
```
┌──────────────────────────────────┐
│  VPS (your-domain.com)           │
│  ├── PostgreSQL (local)          │
│  ├── Backend (PM2)               │
│  └── Frontend (Nginx)            │
└──────────────────────────────────┘
```

---

## 🎯 Lợi ích setup này

✅ **Dev trên nhiều máy**: Dùng chung 1 DB cloud → data đồng bộ
✅ **Test trên Render + Vercel**: Dùng chung DB → test với data thật
✅ **Deploy VPS dễ dàng**: Copy DB hoặc dùng luôn Render
✅ **Không mất data**: Mọi thay đổi đều lưu trên cloud
✅ **Free**: Render PostgreSQL free tier đủ dùng

---

## ⚠️ Lưu ý bảo mật

- [ ] File `.env` không được commit lên Git
- [ ] DATABASE_URL là secret, không share public
- [ ] Đổi JWT_SECRET mạnh hơn (min 32 ký tự)
- [ ] Đổi password admin mặc định (admin/admin123)

---

## 🆘 Xử lý lỗi

### Lỗi: "ECONNREFUSED" hoặc "Connection timeout"
→ Kiểm tra DATABASE_URL có đúng không

### Lỗi: "password authentication failed"
→ Copy lại DATABASE_URL từ Render (có thể đã reset password)

### Lỗi: "relation does not exist"
→ Chưa chạy `node import-to-postgres.js`

### Backend Render bị sleep
→ Free tier sleep sau 15 phút không dùng, khách truy cập sẽ đợi ~30s lần đầu

---

**✅ HOÀN TẤT! Giờ bạn có hệ thống hoàn chỉnh với PostgreSQL!**
