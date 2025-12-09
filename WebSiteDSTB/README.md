# 🏔️ TayBac Shop - Đặc Sản Tây Bắc

Full-stack e-commerce website cho sản phẩm đặc sản Tây Bắc.

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Database**: SQLite (dev) / PostgreSQL (production) - tự động switch
- **Frontend**: React (Vite) + Tailwind CSS
- **Deployment**: VPS with Nginx + PM2 + SSL

## 🚀 Quick Start (Development)

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env: set JWT_SECRET
npm run init-db
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## 📦 Production Deployment

### Chi tiết xem file:
- **`DEPLOY.md`** - Hướng dẫn deploy lên VPS (Ubuntu)
- **`POSTGRESQL.md`** - Hướng dẫn setup PostgreSQL
- **`ALTERNATIVES.md`** - Các phương án hosting khác

### Quick deploy:
```bash
# 1. Setup VPS
bash setup-vps.sh

# 2. Deploy lần đầu
bash deploy-first-time.sh

# 3. Update sau này
bash deploy.sh
```

## 📁 Project Structure

```
├── backend/
│   ├── server.js          # Main server
│   ├── db-adapter.js      # Database adapter (SQLite/PostgreSQL)
│   ├── migrate.js         # SQLite migration
│   ├── migrate-postgres.js # PostgreSQL migration
│   └── routes/            # API routes
├── frontend/
│   ├── src/
│   │   ├── pages/         # React pages
│   │   └── components/    # React components
│   └── public/
├── setup-vps.sh           # VPS setup script
├── deploy.sh              # Update deployment script
└── nginx-taybac.conf      # Nginx configuration

```

## 🔑 Default Admin

- Username: `admin`
- Password: `admin123`

**⚠️ Đổi password sau khi deploy production!**

## 📚 Documentation

- [DEPLOY.md](./DEPLOY.md) - Chi tiết deploy VPS
- [POSTGRESQL.md](./POSTGRESQL.md) - Setup database production
- [ALTERNATIVES.md](./ALTERNATIVES.md) - Hosting alternatives

## 💰 Deployment Cost

- VPS: ~50-120k VNĐ/tháng
- Domain: ~200-300k VNĐ/năm
- **Total: ~1-1.5M VNĐ/năm** (~100k/tháng)

## 📝 Features

- ✅ Product management
- ✅ Shopping cart
- ✅ Order placement
- ✅ Admin dashboard
- ✅ Payment proof upload
- ✅ Telegram notifications
- ✅ Responsive design
- ✅ Auto SSL (Let's Encrypt)
- ✅ Database auto-backup

---

Made with ❤️ for Đặc Sản Tây Bắc