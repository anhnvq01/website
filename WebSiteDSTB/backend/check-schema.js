const db = require('./db');

const schema = db.prepare("PRAGMA table_info(products)").all();
console.log('Products table schema:');
schema.forEach(col => {
  console.log(`  ${col.name} (${col.type})`);
});
