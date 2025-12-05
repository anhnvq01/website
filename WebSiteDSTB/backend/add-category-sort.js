const db = require('./db');

try {
  db.prepare('ALTER TABLE categories ADD COLUMN sort_order INTEGER').run();
  console.log('Added sort_order column to categories');
} catch (e) {
  if (e.message.includes('duplicate column name')) {
    console.log('sort_order column already exists');
  } else {
    console.error('Error adding sort_order column:', e.message);
    process.exit(1);
  }
}

// Initialize sort_order if null
const rows = db.prepare('SELECT rowid FROM categories WHERE sort_order IS NULL OR sort_order = 0').all();
if (rows.length) {
  const maxRow = db.prepare('SELECT IFNULL(MAX(sort_order), 0) as maxOrder FROM categories').get();
  let order = maxRow?.maxOrder || 0;
  const update = db.prepare('UPDATE categories SET sort_order = ? WHERE rowid = ?');
  const txn = db.transaction((list) => {
    list.forEach(r => {
      order += 1;
      update.run(order, r.rowid);
    });
  });
  txn(rows);
  console.log(`Initialized sort_order for ${rows.length} categories`);
} else {
  console.log('sort_order already initialized');
}

console.log('Done.');
