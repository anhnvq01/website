/**
 * Initialize database with demo schema and data.
 * Run: npm run init-db
 */
const db = require('./db');
const bcrypt = require('bcrypt');

db.exec(`
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT,
  price INTEGER,
  category TEXT,
  description TEXT,
  image TEXT
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  createdAt TEXT,
  customer_name TEXT,
  customer_phone TEXT,
  customer_address TEXT,
  items_json TEXT,
  subtotal INTEGER,
  shipping INTEGER,
  discount INTEGER,
  total INTEGER,
  method TEXT,
  paid INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS admin (
  username TEXT PRIMARY KEY,
  password_hash TEXT
);
`);

const insert = db.prepare('INSERT OR REPLACE INTO products (id,name,price,category,description,image,weight,promo_price) VALUES (@id,@name,@price,@category,@description,@image,@weight,@promo_price)');
const demo = [
  { id: 'P1', name: 'Thịt gác bếp - 200g', price: 120000, category: 'Thịt Gác Bếp', description: 'Thịt gác bếp truyền thống Tây Bắc, được hun khói bằng gỗ keo tươi.', image: '/images/products/trau_gac_bep.jpg', weight: '200g', promo_price: 100000 },
  { id: 'P2', name: 'Măng khô - 500g', price: 80000, category: 'Đồ Khô', description: 'Măng khô chọn lọc, ngon ngọt, giàu chất xơ và khoáng chất.', image: '/images/products/mang_kho.jpg', weight: '500g', promo_price: 68000 },
  { id: 'P3', name: 'Tiêu rừng - 100g', price: 50000, category: 'Rau Rừng – Gia Vị', description: 'Tiêu rừng thơm ngon, hương vị đặc biệt của rừng núi Tây Bắc.', image: '/images/products/trau_gac_bep.jpg', weight: '100g', promo_price: 42500 },
  { id: 'P4', name: 'Rượu Mơ - 375ml', price: 220000, category: 'Rượu – Đồ Uống', description: 'Rượu mơ bản địa, mùi hương dễ chịu, rất phù hợp làm quà tặng.', image: '/images/products/ruou_mo.jpg', weight: '375ml', promo_price: 187000 }
];
const insertMany = db.transaction((rows) => {
  for (const r of rows) insert.run(r);
});
insertMany(demo);

// create default admin
const cfgUser = process.env.ADMIN_USERNAME || 'admin';
const cfgPass = process.env.ADMIN_PASSWORD || 'password123';
const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(cfgPass, salt);
db.prepare('INSERT OR REPLACE INTO admin (username, password_hash) VALUES (?,?)').run(cfgUser, hash);

console.log('Database initialized with demo data. Default admin:', cfgUser);