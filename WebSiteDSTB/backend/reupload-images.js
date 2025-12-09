const cloudinary = require('cloudinary').v2;
const path = require('path');
const fs = require('fs');
require('dotenv').config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

async function reuploadAllImages() {
  console.log('🗑️  Deleting old images from Cloudinary...');
  
  try {
    // Delete old folder
    await cloudinary.api.delete_resources_by_prefix('taybac/');
    await cloudinary.api.delete_folder('taybac/products');
    await cloudinary.api.delete_folder('taybac');
    console.log('✅ Deleted old images\n');
  } catch (error) {
    console.log('⚠️  Delete error (might be empty):', error.message, '\n');
  }

  const mapping = {};
  const frontendDir = path.join(__dirname, '../frontend/public/images');
  
  // Upload product images
  console.log('📤 Uploading product images...');
  const productsDir = path.join(frontendDir, 'products');
  const productFiles = fs.readdirSync(productsDir).filter(f => f.match(/\.(jpg|jpeg|png|gif|webp)$/i));
  
  for (const file of productFiles) {
    try {
      const filePath = path.join(productsDir, file);
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'taybac/products',
        resource_type: 'auto'
      });
      
      const localPath = `/images/products/${file}`;
      mapping[localPath] = result.secure_url;
      console.log(`✅ ${file} -> ${result.secure_url}`);
    } catch (error) {
      console.error(`❌ Failed to upload ${file}:`, error.message);
    }
  }

  // Upload banner images
  console.log('\n📤 Uploading banner images...');
  for (let i = 1; i <= 4; i++) {
    const file = `bg-${i}.jpg`;
    const filePath = path.join(frontendDir, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  Skipping ${file} (not found)`);
      continue;
    }

    const stats = fs.statSync(filePath);
    if (stats.size > 10 * 1024 * 1024) {
      console.log(`⏭️  Skipping ${file} (too large: ${(stats.size / 1024 / 1024).toFixed(1)}MB)`);
      continue;
    }

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'taybac',
        resource_type: 'auto'
      });
      
      const localPath = `/images/${file}`;
      mapping[localPath] = result.secure_url;
      console.log(`✅ ${file} -> ${result.secure_url}`);
    } catch (error) {
      console.error(`❌ Failed to upload ${file}:`, error.message);
    }
  }

  // Upload other images
  console.log('\n📤 Uploading other images...');
  const otherImages = ['qr.jpg', 'zalo_icon.png'];
  for (const file of otherImages) {
    const filePath = path.join(frontendDir, file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  Skipping ${file} (not found)`);
      continue;
    }

    try {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: 'taybac',
        resource_type: 'auto'
      });
      
      const localPath = `/images/${file}`;
      mapping[localPath] = result.secure_url;
      console.log(`✅ ${file} -> ${result.secure_url}`);
    } catch (error) {
      console.error(`❌ Failed to upload ${file}:`, error.message);
    }
  }

  // Save mapping
  fs.writeFileSync(
    path.join(__dirname, 'cloudinary-mapping.json'),
    JSON.stringify(mapping, null, 2)
  );

  console.log(`\n✅ Done! Uploaded ${Object.keys(mapping).length} images`);
  console.log('📝 Mapping saved to cloudinary-mapping.json');
}

reuploadAllImages().catch(console.error);
