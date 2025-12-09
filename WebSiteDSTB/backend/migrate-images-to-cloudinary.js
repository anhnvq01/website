// Script upload tất cả ảnh local lên Cloudinary và update database
// Chạy: node migrate-images-to-cloudinary.js

require('dotenv').config();
const { v2: cloudinary } = require('cloudinary');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Check config
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.error('❌ Chưa config Cloudinary trong .env!');
  console.log('');
  console.log('Thêm vào .env:');
  console.log('CLOUDINARY_CLOUD_NAME=your_cloud_name');
  console.log('CLOUDINARY_API_KEY=your_api_key');
  console.log('CLOUDINARY_API_SECRET=your_api_secret');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('❌ Chưa config DATABASE_URL trong .env!');
  process.exit(1);
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
});

async function uploadImageToCloudinary(localPath) {
  try {
    const result = await cloudinary.uploader.upload(localPath, {
      folder: 'taybac-products',
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

async function migrateImages() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Lấy tất cả products có ảnh local
    const { rows: products } = await client.query('SELECT id, image, images FROM products');
    console.log(`📦 Tìm thấy ${products.length} products`);
    console.log('');

    const imageMapping = {}; // Map local path -> cloudinary URL
    const imagesDir = path.join(__dirname, '../frontend/public/images/products');

    // 1. Upload tất cả ảnh unique
    console.log('☁️  Bắt đầu upload ảnh lên Cloudinary...');
    console.log('');

    for (const product of products) {
      // Main image
      if (product.image && product.image.startsWith('/images/')) {
        const localPath = path.join(__dirname, '../frontend/public', product.image);
        if (fs.existsSync(localPath) && !imageMapping[product.image]) {
          console.log(`📤 Uploading: ${product.image}`);
          const cloudinaryUrl = await uploadImageToCloudinary(localPath);
          if (cloudinaryUrl) {
            imageMapping[product.image] = cloudinaryUrl;
            console.log(`  ✅ → ${cloudinaryUrl}`);
          }
        }
      }

      // Additional images (JSON array)
      if (product.images) {
        let imagesArray = [];
        try {
          imagesArray = JSON.parse(product.images);
        } catch (e) {
          // Nếu không parse được, bỏ qua
        }

        for (const imgPath of imagesArray) {
          if (imgPath && imgPath.startsWith('/images/')) {
            const localPath = path.join(__dirname, '../frontend/public', imgPath);
            if (fs.existsSync(localPath) && !imageMapping[imgPath]) {
              console.log(`📤 Uploading: ${imgPath}`);
              const cloudinaryUrl = await uploadImageToCloudinary(localPath);
              if (cloudinaryUrl) {
                imageMapping[imgPath] = cloudinaryUrl;
                console.log(`  ✅ → ${cloudinaryUrl}`);
              }
            }
          }
        }
      }
    }

    console.log('');
    console.log(`✅ Đã upload ${Object.keys(imageMapping).length} ảnh lên Cloudinary`);
    console.log('');

    // 2. Update database với Cloudinary URLs
    console.log('📝 Updating database...');
    let updatedCount = 0;

    for (const product of products) {
      let needUpdate = false;
      let newImage = product.image;
      let newImages = product.images;

      // Update main image
      if (product.image && imageMapping[product.image]) {
        newImage = imageMapping[product.image];
        needUpdate = true;
      }

      // Update images array
      if (product.images) {
        try {
          let imagesArray = JSON.parse(product.images);
          const newImagesArray = imagesArray.map(img => 
            imageMapping[img] || img
          );
          
          if (JSON.stringify(newImagesArray) !== JSON.stringify(imagesArray)) {
            newImages = JSON.stringify(newImagesArray);
            needUpdate = true;
          }
        } catch (e) {
          // Skip if can't parse
        }
      }

      if (needUpdate) {
        await client.query(
          'UPDATE products SET image = $1, images = $2 WHERE id = $3',
          [newImage, newImages, product.id]
        );
        updatedCount++;
        console.log(`  ✅ Updated product: ${product.id}`);
      }
    }

    console.log('');
    console.log(`✅ Đã update ${updatedCount} products`);
    console.log('');
    console.log('🎉 Migration hoàn tất!');
    console.log('');
    console.log('📝 Bạn có thể:');
    console.log('   1. Xóa thư mục frontend/public/images/products (không cần nữa)');
    console.log('   2. Start backend: npm start');
    console.log('   3. Tất cả ảnh giờ load từ Cloudinary!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await client.end();
  }
}

migrateImages();
