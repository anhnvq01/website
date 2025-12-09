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

async function updateWithNewUrls() {
  const mapping = JSON.parse(fs.readFileSync('./cloudinary-mapping.json', 'utf8'));
  
  console.log('📦 Processing products...\n');
  
  // Get products from SQLite with original paths
  const products = sqlite.prepare('SELECT id, name, image, images FROM products').all();
  
  let updated = 0;
  
  for (const product of products) {
    // Find matching cloudinary URL by filename
    let newImage = product.image;
    let newImages = product.images;
    let needsUpdate = false;
    
    // Extract filename from current image path
    if (product.image) {
      // Check if it's already a Cloudinary URL
      if (product.image.includes('cloudinary.com')) {
        // Extract just the filename from the Cloudinary URL
        const filename = product.image.split('/').pop();
        
        // Look for this filename in the mapping
        for (const [localPath, cloudinaryUrl] of Object.entries(mapping)) {
          if (localPath.includes(filename)) {
            newImage = cloudinaryUrl;
            needsUpdate = true;
            break;
          }
        }
      }
      // If it's a local path, match directly
      else {
        for (const [localPath, cloudinaryUrl] of Object.entries(mapping)) {
          if (localPath.includes(product.image) || product.image.includes(localPath)) {
            newImage = cloudinaryUrl;
            needsUpdate = true;
            break;
          }
        }
      }
    }
    
    // Update images array
    if (product.images) {
      try {
        const imagesArray = JSON.parse(product.images);
        const newImagesArray = [];
        
        for (const img of imagesArray) {
          let newImg = img;
          
          if (img.includes('cloudinary.com')) {
            const filename = img.split('/').pop();
            for (const [localPath, cloudinaryUrl] of Object.entries(mapping)) {
              if (localPath.includes(filename)) {
                newImg = cloudinaryUrl;
                needsUpdate = true;
                break;
              }
            }
          }
          
          newImagesArray.push(newImg);
        }
        
        newImages = JSON.stringify(newImagesArray);
      } catch (e) {
        console.error(`❌ Error parsing images for ${product.id}`);
      }
    }
    
    if (needsUpdate) {
      // Update PostgreSQL
      await pool.query(
        'UPDATE products SET image = $1, images = $2 WHERE id = $3',
        [newImage, newImages, product.id]
      );
      
      // Update SQLite
      sqlite.prepare('UPDATE products SET image = ?, images = ? WHERE id = ?')
        .run(newImage, newImages, product.id);
      
      console.log(`✅ ${product.name}`);
      console.log(`   ${newImage.substring(60, 120)}`);
      updated++;
    }
  }
  
  console.log(`\n✅ Updated ${updated} products`);
  
  await pool.end();
  sqlite.close();
}

updateWithNewUrls().catch(console.error);
