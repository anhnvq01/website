const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function updateDatabase() {
  const mapping = JSON.parse(fs.readFileSync('./cloudinary-mapping.json', 'utf8'));
  
  console.log('✅ Connected to PostgreSQL');
  console.log('📦 Loading mapping...\n');

  const { rows: products } = await pool.query('SELECT id, name, image, images FROM products');
  
  let updated = 0;
  
  for (const product of products) {
    let newImage = product.image;
    let newImages = product.images;
    
    // Update main image
    if (product.image && mapping[product.image]) {
      newImage = mapping[product.image];
    }
    
    // Update images array
    if (product.images) {
      try {
        const imagesArray = JSON.parse(product.images);
        const newImagesArray = imagesArray.map(img => mapping[img] || img);
        newImages = JSON.stringify(newImagesArray);
      } catch (e) {
        console.error(`❌ Error parsing images for product ${product.id}`);
      }
    }
    
    // Update if changed
    if (newImage !== product.image || newImages !== product.images) {
      await pool.query(
        'UPDATE products SET image = $1, images = $2 WHERE id = $3',
        [newImage, newImages, product.id]
      );
      console.log(`✅ Updated product #${product.id}: ${product.name}`);
      updated++;
    }
  }
  
  console.log(`\n✅ Updated ${updated} products`);
  await pool.end();
}

updateDatabase().catch(console.error);
