// Script fix Cloudinary URLs trong PostgreSQL (remove /1/ from paths)
require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
});

async function fixUrls() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // Get all products
    const { rows } = await client.query('SELECT id, image, images FROM products');
    console.log(`📦 Checking ${rows.length} products...`);

    let fixedCount = 0;

    for (const row of rows) {
      let needUpdate = false;
      let newImage = row.image;
      let newImages = row.images;

      // Fix image if it contains /1/
      if (row.image && row.image.includes('/1/taybac-products/')) {
        newImage = row.image.replace('/1/taybac-products/', '/taybac/products/');
        needUpdate = true;
        console.log(`🔧 Fixing: ${row.id}`);
        console.log(`   Old: ${row.image}`);
        console.log(`   New: ${newImage}`);
      }

      // Fix images array
      if (row.images) {
        try {
          const imagesArray = JSON.parse(row.images);
          const fixedArray = imagesArray.map(img => 
            img.includes('/1/taybac-products/') 
              ? img.replace('/1/taybac-products/', '/taybac/products/')
              : img
          );
          
          if (JSON.stringify(fixedArray) !== JSON.stringify(imagesArray)) {
            newImages = JSON.stringify(fixedArray);
            needUpdate = true;
          }
        } catch (e) {
          // Skip if can't parse
        }
      }

      if (needUpdate) {
        await client.query(
          'UPDATE products SET image = $1, images = $2 WHERE id = $3',
          [newImage, newImages, row.id]
        );
        fixedCount++;
      }
    }

    console.log('');
    console.log(`✅ Fixed ${fixedCount} products`);
    console.log('');
    console.log('📝 Giờ chạy:');
    console.log('   node sync-postgres-to-sqlite.js');
    console.log('   npm start');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

fixUrls();
