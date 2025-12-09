const { Pool } = require('pg');
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const sqlite = new Database(path.join(__dirname, 'taybac.db'));

async function resetWithNewUrls() {
  const mapping = JSON.parse(fs.readFileSync('./cloudinary-mapping.json', 'utf8'));
  
  console.log('📦 Loading products from SQLite...\n');
  
  const products = sqlite.prepare('SELECT id, image, images FROM products').all();
  
  let updated = 0;
  
  for (const product of products) {
    let newImage = product.image;
    let newImages = product.images;
    
    // Update main image
    if (product.image && mapping[product.image]) {
      newImage = mapping[product.image];
      console.log(`✅ Product ${product.id}:`);
      console.log(`   ${product.image} ->`);
      console.log(`   ${newImage}`);
      updated++;
    }
    
    // Update images array
    if (product.images) {
      try {
        const imagesArray = JSON.parse(product.images);
        const newImagesArray = imagesArray.map(img => mapping[img] || img);
        newImages = JSON.stringify(newImagesArray);
      } catch (e) {}
    }
    
    // Update PostgreSQL
    if (newImage !== product.image || newImages !== product.images) {
      await pool.query(
        'UPDATE products SET image = $1, images = $2 WHERE id = $3',
        [newImage, newImages, product.id]
      );
    }
  }
  
  console.log(`\n✅ Updated ${updated} products in PostgreSQL`);
  
  await pool.end();
  sqlite.close();
}

resetWithNewUrls().catch(console.error);
