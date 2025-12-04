const db = require('./db');

// Add sold_count column if it doesn't exist
try {
  db.prepare("ALTER TABLE products ADD COLUMN sold_count INTEGER DEFAULT 0").run();
  console.log('✓ Added sold_count column');
} catch (err) {
  if (err.message.includes('already exists')) {
    console.log('✓ sold_count column already exists');
  } else {
    console.error('Error adding sold_count:', err.message);
  }
}

// Add discount_percent column if it doesn't exist
try {
  db.prepare("ALTER TABLE products ADD COLUMN discount_percent INTEGER DEFAULT 0").run();
  console.log('✓ Added discount_percent column');
} catch (err) {
  if (err.message.includes('already exists')) {
    console.log('✓ discount_percent column already exists');
  } else {
    console.error('Error adding discount_percent:', err.message);
  }
}

console.log('Column setup completed');
