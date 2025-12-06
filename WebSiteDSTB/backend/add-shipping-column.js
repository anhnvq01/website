const db = require('./db');

console.log('Adding can_ship_province column to products table...');

try {
  // Check if column exists
  const tableInfo = db.prepare('PRAGMA table_info(products)').all();
  const hasColumn = tableInfo.some(col => col.name === 'can_ship_province');
  
  if (!hasColumn) {
    db.prepare('ALTER TABLE products ADD COLUMN can_ship_province INTEGER DEFAULT 1').run();
    console.log('✓ Added can_ship_province column (default: 1 = can ship to provinces)');
  } else {
    console.log('✓ Column can_ship_province already exists');
  }
  
  // Add province column to orders table
  const orderTableInfo = db.prepare('PRAGMA table_info(orders)').all();
  const hasProvinceColumn = orderTableInfo.some(col => col.name === 'customer_province');
  
  if (!hasProvinceColumn) {
    db.prepare('ALTER TABLE orders ADD COLUMN customer_province TEXT').run();
    console.log('✓ Added customer_province column to orders table');
  } else {
    console.log('✓ Column customer_province already exists in orders');
  }
  
  console.log('Migration completed successfully!');
} catch (err) {
  console.error('Error during migration:', err);
  process.exit(1);
}
