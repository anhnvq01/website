/**
 * Update database schema - add missing columns
 * Run: node migrate-update.js
 */
const db = require('./db');

// Add status column to orders if not exists
try {
  db.exec(`ALTER TABLE orders ADD COLUMN status TEXT DEFAULT 'undelivered'`);
  console.log('Added status column to orders table');
} catch(e) {
  if (e.message.includes('duplicate column name')) {
    console.log('Status column already exists');
  } else {
    console.error('Error adding status column:', e.message);
  }
}

// Add images column to products if not exists
try {
  db.exec(`ALTER TABLE products ADD COLUMN images TEXT`);
  console.log('Added images column to products table');
} catch(e) {
  if (e.message.includes('duplicate column name')) {
    console.log('Images column already exists');
  } else {
    console.error('Error adding images column:', e.message);
  }
}

// Add weight column to products if not exists
try {
  db.exec(`ALTER TABLE products ADD COLUMN weight TEXT`);
  console.log('Added weight column to products table');
} catch(e) {
  if (e.message.includes('duplicate column name')) {
    console.log('Weight column already exists');
  } else {
    console.error('Error adding weight column:', e.message);
  }
}

// Add promo_price column to products if not exists
try {
  db.exec(`ALTER TABLE products ADD COLUMN promo_price INTEGER`);
  console.log('Added promo_price column to products table');
} catch(e) {
  if (e.message.includes('duplicate column name')) {
    console.log('Promo_price column already exists');
  } else {
    console.error('Error adding promo_price column:', e.message);
  }
}

console.log('Database schema update completed!');
