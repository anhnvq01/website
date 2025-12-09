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
const mapping = JSON.parse(fs.readFileSync('./cloudinary-mapping.json', 'utf8'));

// Manual mapping for known products
const productImageMap = {
  'P1': '/images/products/trau_gac_bep.jpg',
  'P2': '/images/products/mang_kho.jpg',
  'P3': '/images/products/1764984807915-730301110.jpg',
  'P1764823660641': '/images/products/1764984807915-730301110.jpg', // or similar timestamp
  'P1764986691716': '/images/products/1764986678832-974570331.jpg',
  'P1764992030438': '/images/products/1764992018860-399330977.jpg',
  'P1764994130286': '/images/products/1764994126171-833883711.jpg',
  'P1764994589478': '/images/products/1764994510737-368047518.jpg',
  'P1764995200328': '/images/products/1764995197385-235423760.jpg',
  'P1765167296274': '/images/products/1765167287630-776627020.jpg',
  'P1765168345646': '/images/products/1765168330500-606603750.jpg',
};

async function manualUpdate() {
  console.log('📦 Updating products with correct mappings...\n');
  
  let updated = 0;
  
  for (const [productId, imagePath] of Object.entries(productImageMap)) {
    const cloudinaryUrl = mapping[imagePath];
    
    if (!cloudinaryUrl) {
      console.log(`⚠️  No mapping found for ${productId}: ${imagePath}`);
      continue;
    }
    
    // Create images array with the same URL
    const imagesArray = JSON.stringify([cloudinaryUrl]);
    
    // Update PostgreSQL
    await pool.query(
      'UPDATE products SET image = $1, images = $2 WHERE id = $3',
      [cloudinaryUrl, imagesArray, productId]
    );
    
    // Update SQLite
    sqlite.prepare('UPDATE products SET image = ?, images = ? WHERE id = ?')
      .run(cloudinaryUrl, imagesArray, productId);
    
    const product = sqlite.prepare('SELECT name FROM products WHERE id = ?').get(productId);
    console.log(`✅ ${productId} - ${product.name}`);
    console.log(`   ${cloudinaryUrl}`);
    updated++;
  }
  
  console.log(`\n✅ Updated ${updated} products`);
  
  await pool.end();
  sqlite.close();
}

manualUpdate().catch(console.error);
