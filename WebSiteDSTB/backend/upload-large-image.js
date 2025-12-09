// Script compress và upload ảnh lớn
// Chạy: node upload-large-image.js

require('dotenv').config();
const { v2: cloudinary } = require('cloudinary');
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function compressAndUpload() {
  const inputFile = path.join(__dirname, '../frontend/public/images/bg-4.png');
  const outputFile = path.join(__dirname, '../frontend/public/images/bg-4-compressed.jpg');

  try {
    console.log('📦 Đang compress bg-4.png...');
    
    // Compress PNG → JPG với quality 85%, max width 1920px
    await sharp(inputFile)
      .resize(1920, null, { withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(outputFile);

    const stats = fs.statSync(outputFile);
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
    
    console.log(`✅ Đã compress: ${sizeMB} MB`);
    
    if (stats.size > 10 * 1024 * 1024) {
      console.error('❌ File vẫn còn quá lớn, cần giảm chất lượng hơn');
      return;
    }

    console.log('☁️  Uploading lên Cloudinary...');
    
    const result = await cloudinary.uploader.upload(outputFile, {
      folder: 'taybac',
      public_id: 'bg-4',
      overwrite: true
    });

    console.log('✅ Upload thành công!');
    console.log(`🔗 URL: ${result.secure_url}`);
    
    // Xóa file tạm
    fs.unlinkSync(outputFile);
    
    console.log('');
    console.log('📝 Update code frontend:');
    console.log(`   /images/bg-4.png → ${result.secure_url}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

compressAndUpload();
