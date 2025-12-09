# 🚀 Setup PostgreSQL Local nhanh nhất

## Cách 1: Docker (Khuyến nghị - Nhanh nhất)

### Bước 1: Cài Docker Desktop
- Download: https://www.docker.com/products/docker-desktop/
- Cài đặt và khởi động Docker Desktop

### Bước 2: Chạy PostgreSQL container
```powershell
# Chạy PostgreSQL trong Docker
docker run --name taybac-postgres `
  -e POSTGRES_PASSWORD=123456 `
  -e POSTGRES_DB=taybac `
  -p 5432:5432 `
  -d postgres:15

# Kiểm tra container đang chạy
docker ps
```

### Bước 3: Config .env
Thêm vào file `.env`:
```env
NODE_ENV=production
DATABASE_URL=postgresql://postgres:123456@localhost:5432/taybac
```

### Bước 4: Import data
```powershell
cd backend
node import-to-postgres.js
```

### Bước 5: Start backend
```powershell
npm start
```

Done! ✅

---

## Cách 2: Cài PostgreSQL trên Windows

### Bước 1: Download PostgreSQL
- Link: https://www.postgresql.org/download/windows/
- Chọn version 15 hoặc 16
- Cài đặt (password: 123456)

### Bước 2: Tạo database
```powershell
# Mở psql từ Start Menu
# Hoặc:
& "C:\Program Files\PostgreSQL\15\bin\psql.exe" -U postgres

# Trong psql:
CREATE DATABASE taybac;
\q
```

### Bước 3: Config .env (giống cách 1)

### Bước 4: Import data
```powershell
cd backend
node import-to-postgres.js
```

---

## Cách 3: Dùng PostgreSQL cloud (Không cần cài gì)

### Render PostgreSQL (Free)
1. Đăng ký: https://render.com
2. New → PostgreSQL → Free plan
3. Copy External Database URL
4. Paste vào .env:
   ```env
   DATABASE_URL=postgres://user:pass@dpg-xxx.oregon-postgres.render.com/dbname
   ```
5. Chạy import:
   ```powershell
   node import-to-postgres.js
   ```

### Supabase (Free)
1. Đăng ký: https://supabase.com
2. New project
3. Copy connection string (Transaction mode)
4. Paste vào .env
5. Import data

---

## 🎯 Lệnh quản lý Docker PostgreSQL

```powershell
# Stop container
docker stop taybac-postgres

# Start lại
docker start taybac-postgres

# Xem logs
docker logs taybac-postgres

# Xóa container (cẩn thận - mất data!)
docker rm -f taybac-postgres

# Connect vào psql
docker exec -it taybac-postgres psql -U postgres -d taybac
```

---

## ⚡ Khuyến nghị

**Cho development:** Docker (Cách 1) - Nhanh, sạch, dễ xóa

**Cho production:** PostgreSQL cloud (Cách 3) - Không lo backup, auto-scale
