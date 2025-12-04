const db = require('./db');

function columnExists(name){
  const info = db.prepare("PRAGMA table_info('products')").all();
  return info.some(r => r.name === name);
}

if(!columnExists('images')){
  console.log('Adding column images');
  db.prepare('ALTER TABLE products ADD COLUMN images TEXT').run();
}
if(!columnExists('weight')){
  console.log('Adding column weight');
  db.prepare('ALTER TABLE products ADD COLUMN weight TEXT').run();
}
if(!columnExists('promo_price')){
  console.log('Adding column promo_price');
  db.prepare('ALTER TABLE products ADD COLUMN promo_price INTEGER').run();
}

// Populate images JSON from existing image column when images is empty
const rows = db.prepare('SELECT id, image, images FROM products').all();
const upd = db.prepare('UPDATE products SET images = @images WHERE id = @id');
for(const r of rows){
  if((!r.images || r.images.trim()==='') && r.image){
    try{
      const arr = [r.image];
      upd.run({ id: r.id, images: JSON.stringify(arr) });
      console.log('Populated images for', r.id);
    }catch(e){ console.error(e) }
  }
}

console.log('Schema update complete.');
