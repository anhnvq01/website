// Script export data từ SQLite sang JSON
// Chạy: node export-sqlite-data.js

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'taybac.db');

if (!fs.existsSync(dbPath)) {
  console.error('❌ File taybac.db không tồn tại!');
  process.exit(1);
}

const db = new Database(dbPath);

console.log('📦 Đang export dữ liệu từ SQLite...');

try {
  // Export products
  const products = db.prepare('SELECT * FROM products ORDER BY id').all();
  fs.writeFileSync('export-products.json', JSON.stringify(products, null, 2));
  console.log(`✅ Exported ${products.length} products`);

  // Export orders
  const orders = db.prepare('SELECT * FROM orders ORDER BY id').all();
  fs.writeFileSync('export-orders.json', JSON.stringify(orders, null, 2));
  console.log(`✅ Exported ${orders.length} orders`);

  // Export admins (nếu có)
  try {
    const admins = db.prepare('SELECT * FROM admins ORDER BY id').all();
    fs.writeFileSync('export-admins.json', JSON.stringify(admins, null, 2));
    console.log(`✅ Exported ${admins.length} admins`);
  } catch (e) {
    console.log('⚠️  Table admins không tồn tại, bỏ qua');
  }

  // Export categories (nếu có)
  try {
    const categories = db.prepare('SELECT * FROM categories ORDER BY rowid').all();
    fs.writeFileSync('export-categories.json', JSON.stringify(categories, null, 2));
    console.log(`✅ Exported ${categories.length} categories`);
  } catch (e) {
    console.log('⚠️  Table categories không tồn tại, bỏ qua');
  }

  console.log('');
  console.log('🎉 Export hoàn tất! Files đã tạo:');
  console.log('   - export-products.json');
  console.log('   - export-orders.json');
  console.log('   - export-admins.json (nếu có)');
  console.log('   - export-categories.json (nếu có)');
  console.log('');
  console.log('📝 Bước tiếp theo:');
  console.log('   1. Setup PostgreSQL');
  console.log('   2. Chạy: node import-to-postgres.js');

} catch (error) {
  console.error('❌ Lỗi khi export:', error);
  process.exit(1);
} finally {
  db.close();
}
