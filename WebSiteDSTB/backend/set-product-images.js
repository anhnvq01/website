const db = require('./db');

const updates = [
  { id: 'P1', images: ['/images/products/trau_gac_bep.jpg'], weight: '200g', promo_price: 100000 },
  { id: 'P2', images: ['/images/products/mang_kho.jpg'], weight: '500g', promo_price: null },
  { id: 'P4', images: ['/images/products/mang_kho.jpg'], weight: '375ml', promo_price: null }
];

const stmt = db.prepare('UPDATE products SET images = @images, weight = @weight, promo_price = @promo_price WHERE id = @id');

for (const u of updates) {
  const info = stmt.run({ id: u.id, images: JSON.stringify(u.images), weight: u.weight, promo_price: u.promo_price });
  console.log(`Updated ${u.id}: changes=${info.changes}`);
}

console.log('Product image/metadata fields updated.');
