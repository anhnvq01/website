# 🐘 Hướng dẫn sử dụng PostgreSQL

Backend hiện đã hỗ trợ **tự động chuyển đổi** giữa SQLite và PostgreSQL:
- **Development (local)**: Dùng SQLite (mặc định)
- **Production (VPS)**: Dùng PostgreSQL

---

## 🔧 Cách hoạt động

### Local (Development) - SQLite
```bash
# Không cần config gì, chạy bình thường
cd backend
npm install
npm run init-db
npm start
```
→ Tự động dùng SQLite (`taybac.db`)

### Production (VPS) - PostgreSQL
```bash
# Thêm DATABASE_URL vào .env
DATABASE_URL=postgresql://username:password@localhost:5432/taybac
NODE_ENV=production

# Chạy migration
node migrate-postgres.js

# Start server
npm start
```
→ Tự động dùng PostgreSQL

---

## 🚀 Setup PostgreSQL trên VPS

### Cách 1: Cài PostgreSQL trên VPS

```bash
# SSH vào VPS
ssh root@your-vps-ip

# Cài PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib -y

# Tạo database và user
sudo -u postgres psql

# Trong psql:
CREATE DATABASE taybac;
CREATE USER taybac_user WITH PASSWORD 'your-strong-password';
GRANT ALL PRIVILEGES ON DATABASE taybac TO taybac_user;
\q

# Test connection
psql -U taybac_user -d taybac -h localhost
```

### Cách 2: Dùng PostgreSQL managed (dễ hơn)

**Render PostgreSQL (Free)**:
1. Vào render.com → New → PostgreSQL
2. Chọn free plan
3. Copy `External Database URL`
4. Paste vào `.env`:
   ```
   DATABASE_URL=postgres://user:pass@dpg-xxxxx.oregon-postgres.render.com/dbname
   ```

**Supabase (Free)**:
1. Vào supabase.com → New project
2. Copy connection string (Transaction mode)
3. Paste vào `.env`

**Railway (Có phí sau trial)**:
1. Vào railway.app → New → PostgreSQL
2. Copy connection string
3. Paste vào `.env`

---

## 📝 Deploy với PostgreSQL

### Bước 1: Setup PostgreSQL
Chọn một trong các cách trên

### Bước 2: Config .env trên VPS
```bash
cd /var/www/taybac/backend
nano .env
```

Thêm:
```env
NODE_ENV=production
DATABASE_URL=postgresql://taybac_user:password@localhost:5432/taybac
JWT_SECRET=your-very-strong-secret-key-here
```

### Bước 3: Migration
```bash
cd /var/www/taybac/backend
npm install
node migrate-postgres.js
```

### Bước 4: Start
```bash
pm2 start ecosystem.config.js
```

---

## 🔄 Migration từ SQLite sang PostgreSQL

Nếu bạn đã có data trong SQLite và muốn chuyển sang PostgreSQL:

```bash
# 1. Export data từ SQLite
cd backend
node -e "
const db = require('better-sqlite3')('taybac.db');
const fs = require('fs');

// Export products
const products = db.prepare('SELECT * FROM products').all();
fs.writeFileSync('products.json', JSON.stringify(products, null, 2));

// Export orders
const orders = db.prepare('SELECT * FROM orders').all();
fs.writeFileSync('orders.json', JSON.stringify(orders, null, 2));

console.log('✅ Exported to products.json and orders.json');
"

# 2. Setup PostgreSQL và chạy migration
DATABASE_URL=your-postgres-url node migrate-postgres.js

# 3. Import data (tạo script riêng nếu cần)
# Hoặc dùng pgAdmin để import JSON
```

---

## ✅ Test kết nối

```bash
# Test PostgreSQL connection
cd backend
node -e "
const { Client } = require('pg');
const client = new Client({ connectionString: 'YOUR_DATABASE_URL' });
client.connect()
  .then(() => console.log('✅ PostgreSQL connected!'))
  .catch(err => console.error('❌ Error:', err))
  .finally(() => client.end());
"
```

---

## 🐛 Xử lý lỗi

### Lỗi: "ECONNREFUSED"
PostgreSQL chưa chạy hoặc config sai:
```bash
sudo systemctl status postgresql
sudo systemctl start postgresql
```

### Lỗi: "password authentication failed"
Sai username/password, kiểm tra lại DATABASE_URL

### Lỗi: "database does not exist"
Chưa tạo database:
```bash
sudo -u postgres createdb taybac
```

---

## 📊 So sánh SQLite vs PostgreSQL

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| Setup | ✅ Cực dễ | ⚠️ Cần config |
| Performance | ✅ Nhanh (đơn giản) | ✅ Nhanh (phức tạp) |
| Concurrent writes | ❌ Hạn chế | ✅ Tốt |
| Production-ready | ⚠️ <10k users | ✅ Millions users |
| Backup | ✅ Copy file | ⚠️ pg_dump |
| Scale | ❌ Không thể | ✅ Dễ dàng |

**Khuyến nghị:**
- Website nhỏ (<100 users/day): SQLite OK
- Website thật cho khách hàng: **Dùng PostgreSQL**

---

## 🎯 Checklist

- [ ] Đã cài `pg` package: `npm install pg`
- [ ] Đã setup PostgreSQL (VPS hoặc cloud)
- [ ] Đã thêm `DATABASE_URL` vào `.env`
- [ ] Đã chạy `node migrate-postgres.js`
- [ ] Đã test connection thành công
- [ ] Backend chạy OK với PostgreSQL
- [ ] Có thể login admin (admin/admin123)

---

**🎉 Done!** Backend giờ sẵn sàng cho production với PostgreSQL!
