const db = require('./db');
db.prepare("DELETE FROM products WHERE id NOT IN ('P1', 'P2', 'P3', 'P4')").run();
console.log('Deleted test products');
const products = db.prepare('SELECT id, name, price, image, promo_price FROM products ORDER BY id').all();
console.log('Remaining products:', products.length);
console.log(JSON.stringify(products, null, 2));
