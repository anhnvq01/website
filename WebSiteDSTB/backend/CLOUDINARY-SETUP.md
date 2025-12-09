# ☁️ Setup Cloudinary - Hướng dẫn nhanh

## Bước 1: Đăng ký Cloudinary (2 phút)

1. Vào: https://cloudinary.com/users/register_free
2. Điền email + password → Sign Up
3. Verify email
4. Login

## Bước 2: Lấy credentials

Sau khi login, Dashboard sẽ hiển thị:

```
Account Details
├─ Cloud Name: dxxxxxxxxxxxx
├─ API Key: 123456789012345
└─ API Secret: abcdefghijklmnopqrst
```

→ **Copy 3 thông tin này!**

## Bước 3: Thêm vào .env

Mở file `backend/.env`:

```env
# Cloudinary
CLOUDINARY_CLOUD_NAME=dxxxxxxxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrst
```

## Bước 4: Restart backend

```powershell
cd backend
npm start
```

Sẽ thấy dòng:
```
☁️  Using Cloudinary for image storage
```

## Bước 5: Test upload

1. Mở frontend: http://localhost:5173
2. Login admin
3. Thêm/sửa sản phẩm → Upload ảnh
4. Ảnh sẽ upload lên Cloudinary!

---

## ✅ Kiểm tra ảnh đã upload

Vào Cloudinary Dashboard → Media Library → folder `taybac-products`

→ Sẽ thấy các ảnh đã upload!

---

## 🎯 Cách hoạt động

### Local dev (KHÔNG có Cloudinary config):
```
Upload ảnh → Lưu vào frontend/public/images/products/
          → URL: /images/products/abc.jpg
```

### Với Cloudinary (CÓ config):
```
Upload ảnh → Lưu lên Cloudinary
          → URL: https://res.cloudinary.com/dxxxx/image/upload/v123/taybac-products/abc.jpg
```

→ **Tự động switch**, không cần sửa code!

---

## 📊 Cloudinary Free Tier

- ✅ 25 GB storage
- ✅ 25 GB bandwidth/tháng
- ✅ Tự động optimize ảnh
- ✅ Resize, crop, watermark
- ✅ CDN toàn cầu

→ **Đủ dùng cho ~5000 ảnh!**

---

## 🚀 Deploy Render/Vercel

Khi deploy, thêm Environment Variables giống như `.env`:

```
CLOUDINARY_CLOUD_NAME=dxxxxxxxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrst
```

→ **DONE!** Ảnh sẽ tự động upload lên Cloudinary trên production!

---

## 💡 Tips

### 1. Xóa ảnh cũ trên Cloudinary
```javascript
// Trong admin dashboard có thể xóa trực tiếp
// Hoặc dùng API:
cloudinary.uploader.destroy('public_id')
```

### 2. Optimize ảnh tự động
Cloudinary đã tự động:
- ✅ Resize max 2000x2000px
- ✅ Compress quality auto
- ✅ Convert format tối ưu (WebP cho browser hỗ trợ)

### 3. Backup ảnh
Cloudinary tự động backup, không lo mất data!

---

**🎉 Xong! Giờ bạn có thể upload ảnh lên cloud!**
