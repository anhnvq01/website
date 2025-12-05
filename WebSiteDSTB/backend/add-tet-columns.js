const db = require('./db');

console.log('Adding import_price and is_tet columns to products table...');

try {
  // Add import_price column
  db.prepare(`ALTER TABLE products ADD COLUMN import_price INTEGER DEFAULT 0`).run();
  console.log('✓ Added import_price column');
} catch (e) {
  if (e.message.includes('duplicate column name')) {
    console.log('✓ import_price column already exists');
  } else {
    console.error('Error adding import_price:', e.message);
  }
}

try {
  // Add is_tet column
  db.prepare(`ALTER TABLE products ADD COLUMN is_tet INTEGER DEFAULT 0`).run();
  console.log('✓ Added is_tet column');
} catch (e) {
  if (e.message.includes('duplicate column name')) {
    console.log('✓ is_tet column already exists');
  } else {
    console.error('Error adding is_tet:', e.message);
  }
}

console.log('\nUpdated schema:');
const schema = db.prepare("PRAGMA table_info(products)").all();
schema.forEach(col => {
  console.log(`  ${col.name} (${col.type})`);
});

console.log('\n✅ Migration completed!');
