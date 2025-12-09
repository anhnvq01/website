// Script upload TẤT CẢ ảnh trong frontend/public/images lên Cloudinary
// Chạy: node upload-all-images.js

require('dotenv').config();
const { v2: cloudinary } = require('cloudinary');
const fs = require('fs');
const path = require('path');

// Check config
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Chưa config Cloudinary trong .env!');
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Hàm upload ảnh
async function uploadImage(localPath, cloudinaryFolder) {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: cloudinaryFolder,
      transformation: [
        { width: 2000, height: 2000, crop: 'limit' },
        { quality: 'auto' }
      ]
    });
    return result.secure_url;
  } catch (error) {
    console.error(`  ❌ Lỗi upload ${localPath}:`, error.message);
    return null;
  }
}

// Hàm quét thư mục và upload tất cả ảnh
async function uploadDirectory(dir, cloudinaryFolder) {
  const files = fs.readdirSync(dir);
  const results = [];

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      // Nếu là thư mục con, đệ quy
      const subResults = await uploadDirectory(fullPath, `${cloudinaryFolder}/${file}`);
      results.push(...subResults);
    } else {
      // Nếu là file ảnh
      const ext = path.extname(file).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) {
        console.log(`📤 Uploading: ${fullPath.replace(path.join(__dirname, '../frontend/public'), '')}`);
        const cloudinaryUrl = await uploadImage(fullPath, cloudinaryFolder);
        
        if (cloudinaryUrl) {
          const localUrl = fullPath.replace(path.join(__dirname, '../frontend/public'), '').replace(/\\/g, '/');
          results.push({
            localPath: localUrl,
            cloudinaryUrl: cloudinaryUrl
          });
          console.log(`  ✅ → ${cloudinaryUrl}`);
        }
      }
    }
  }

  return results;
}

async function uploadAll() {
  try {
    console.log('☁️  Bắt đầu upload TẤT CẢ ảnh lên Cloudinary...');
    console.log('');

    const imagesDir = path.join(__dirname, '../frontend/public/images');
    
    if (!fs.existsSync(imagesDir)) {
      console.error('❌ Không tìm thấy thư mục images!');
      process.exit(1);
    }

    const results = await uploadDirectory(imagesDir, 'taybac');

    console.log('');
    console.log(`✅ Đã upload ${results.length} ảnh lên Cloudinary`);
    console.log('');

    // Lưu mapping vào file JSON để dễ reference
    const mappingFile = path.join(__dirname, 'cloudinary-mapping.json');
    const mapping = {};
    results.forEach(r => {
      mapping[r.localPath] = r.cloudinaryUrl;
    });
    
    fs.writeFileSync(mappingFile, JSON.stringify(mapping, null, 2));
    console.log(`📝 Đã lưu mapping vào: ${mappingFile}`);
    console.log('');

    // Hiển thị một số ảnh quan trọng
    console.log('🖼️  Một số ảnh đã upload:');
    console.log('');
    
    Object.entries(mapping).slice(0, 10).forEach(([local, cloud]) => {
      console.log(`  ${local}`);
      console.log(`  → ${cloud}`);
      console.log('');
    });

    if (Object.keys(mapping).length > 10) {
      console.log(`  ... và ${Object.keys(mapping).length - 10} ảnh khác`);
      console.log('');
    }

    console.log('🎉 Hoàn tất!');
    console.log('');
    console.log('📋 Quản lý ảnh:');
    console.log(`   → https://console.cloudinary.com/console/c-${process.env.CLOUDINARY_CLOUD_NAME}/media_library/folders/taybac`);

  } catch (error) {
    console.error('❌ Upload failed:', error);
  }
}

uploadAll();
