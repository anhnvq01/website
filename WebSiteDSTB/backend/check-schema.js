const db = require('./db');
const info = db.prepare("PRAGMA table_info(products)").all();
console.log('Products table schema:');
console.log(info);
