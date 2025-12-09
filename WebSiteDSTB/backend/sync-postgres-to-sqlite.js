// Script sync data từ PostgreSQL về SQLite và update URLs
// Chạy: node sync-postgres-to-sqlite.js

require('dotenv').config();
const { Client } = require('pg');
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
});

const db = new Database(path.join(__dirname, 'taybac.db'));

async function syncData() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // 1. Lấy tất cả products từ PostgreSQL
    const { rows: products } = await client.query('SELECT * FROM products ORDER BY id');
    console.log(`📦 Fetched ${products.length} products from PostgreSQL`);

    // 2. Update SQLite với Cloudinary URLs
    console.log('📝 Updating SQLite with Cloudinary URLs...');
    
    const updateStmt = db.prepare(`
      UPDATE products 
      SET image = ?, images = ? 
      WHERE id = ?
    `);

    let updatedCount = 0;
    for (const p of products) {
      try {
        updateStmt.run(p.image, p.images, p.id);
        updatedCount++;
      } catch (e) {
        console.log(`  ⚠️  Product ${p.id} not found in SQLite, skipping`);
      }
    }

    console.log(`✅ Updated ${updatedCount} products in SQLite`);
    console.log('');
    console.log('🎉 Sync completed!');
    console.log('');
    console.log('📝 Giờ restart backend:');
    console.log('   npm start');

  } catch (error) {
    console.error('❌ Sync failed:', error);
  } finally {
    await client.end();
    db.close();
  }
}

syncData();
