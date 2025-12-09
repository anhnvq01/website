const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixUrls() {
  console.log('✅ Connected to PostgreSQL\n');

  const { rows: products } = await pool.query('SELECT id, name, image, images FROM products');
  
  let updated = 0;
  
  for (const product of products) {
    let needsUpdate = false;
    let newImage = product.image;
    let newImages = product.images;
    
    // Fix main image - replace old path with new path
    if (product.image && product.image.includes('/taybac-products/')) {
      newImage = product.image.replace('/taybac-products/', '/taybac/products/');
      needsUpdate = true;
    }
    
    // Fix images array
    if (product.images) {
      try {
        const imagesArray = JSON.parse(product.images);
        const newImagesArray = imagesArray.map(img => {
          if (img && img.includes('/taybac-products/')) {
            return img.replace('/taybac-products/', '/taybac/products/');
          }
          return img;
        });
        newImages = JSON.stringify(newImagesArray);
        if (newImages !== product.images) needsUpdate = true;
      } catch (e) {
        console.error(`❌ Error parsing images for product ${product.id}`);
      }
    }
    
    // Update if changed
    if (needsUpdate) {
      await pool.query(
        'UPDATE products SET image = $1, images = $2 WHERE id = $3',
        [newImage, newImages, product.id]
      );
      console.log(`✅ Fixed #${product.id}: ${product.name}`);
      console.log(`   Old: ${product.image.substring(0, 80)}...`);
      console.log(`   New: ${newImage.substring(0, 80)}...`);
      updated++;
    }
  }
  
  console.log(`\n✅ Fixed ${updated} products`);
  await pool.end();
}

fixUrls().catch(console.error);
