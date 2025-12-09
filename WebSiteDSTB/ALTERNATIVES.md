# 🔧 Giải pháp thay thế nếu không muốn dùng VPS

## Option 1: Railway.app (Khuyến nghị - Miễn phí có hạn)

**Ưu điểm:**
- ✅ Miễn phí $5 credit/tháng
- ✅ Không bị ngắt như Render
- ✅ Deploy tự động từ GitHub
- ✅ Có PostgreSQL miễn phí
- ✅ Easy setup

**Nhược điểm:**
- ⚠️ Hết credit phải trả tiền
- ⚠️ $5/tháng sau khi hết trial

**Cách deploy:**
1. Đăng ký Railway.app
2. Connect GitHub repo
3. Add PostgreSQL service
4. Deploy xong!

---

## Option 2: Fly.io (Miễn phí vĩnh viễn)

**Ưu điểm:**
- ✅ Free tier vĩnh viễn: 3 shared-cpu-1x VMs, 3GB persistent volume
- ✅ Không bị ngắt
- ✅ Có PostgreSQL/SQLite persistent storage
- ✅ Deploy nhanh

**Cách deploy:**
```bash
# Cài Fly CLI
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"

# Login
flyctl auth login

# Deploy
flyctl launch
flyctl deploy
```

---

## Option 3: Vercel + Serverless (Cho website nhỏ)

**Chỉ phù hợp nếu:**
- Website nhỏ, ít data
- Dùng PostgreSQL/MongoDB cloud
- Chấp nhận cold start

**Setup:**
- Frontend: Vercel (đã có)
- Backend: Vercel Serverless Functions
- Database: Supabase (PostgreSQL miễn phí)

---

## Option 4: Hosting Việt Nam giá rẻ

**Nếu muốn hỗ trợ tiếng Việt:**

### Azdigi Web Hosting
- **Giá:** 20k/tháng
- **Hỗ trợ:** Node.js, PM2
- **Nhược điểm:** Chia sẻ tài nguyên

### INET Web Hosting  
- **Giá:** 30k/tháng
- **Support:** 24/7 tiếng Việt

---

## 💡 Khuyến nghị cuối cùng

**Cho production thực tế:**

```
VPS ($4-6/tháng) > Railway ($5/tháng) > Fly.io (free) > Render (free but sleep)
```

**Lý do chọn VPS:**
1. ✅ Full control
2. ✅ Không giới hạn
3. ✅ SQLite hoạt động tốt (lưu file trực tiếp)
4. ✅ Backup dễ dàng
5. ✅ Scale khi cần
6. ✅ Không lo bị khóa account

**Chi phí 1 năm:**
- VPS $4/tháng × 12 = $48 (~1.1 triệu VNĐ)
- Domain .com = 250k
- **Tổng: ~1.4 triệu VNĐ/năm** → ~115k/tháng

→ Rẻ hơn 1 ly café mỗi ngày! 😄
