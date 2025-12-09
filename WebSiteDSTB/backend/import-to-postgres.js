// Script import data từ JSON vào PostgreSQL
// Chạy: node import-to-postgres.js

const { Client } = require('pg');
const fs = require('fs');
const bcrypt = require('bcrypt');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('❌ Chưa set DATABASE_URL trong .env');
  console.log('');
  console.log('Thêm vào file .env:');
  console.log('DATABASE_URL=postgresql://username:password@localhost:5432/taybac');
  process.exit(1);
}

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
});

async function importData() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // 1. Create tables first
    console.log('📦 Creating tables...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        price INTEGER NOT NULL,
        description TEXT,
        image VARCHAR(255),
        weight DECIMAL(10,2),
        promo_price INTEGER,
        images TEXT,
        sold_count INTEGER DEFAULT 0,
        import_price INTEGER,
        is_tet BOOLEAN DEFAULT false,
        can_ship_province VARCHAR(10),
        discount_percent INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_address TEXT NOT NULL,
        customer_province VARCHAR(100),
        items_json TEXT NOT NULL,
        subtotal INTEGER NOT NULL,
        shipping INTEGER DEFAULT 30000,
        discount INTEGER DEFAULT 0,
        total INTEGER NOT NULL,
        method VARCHAR(50) NOT NULL,
        paid BOOLEAN DEFAULT false,
        seller VARCHAR(100) DEFAULT 'Quang Tâm',
        extra_cost INTEGER DEFAULT 0,
        notes TEXT
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        category VARCHAR(100) UNIQUE NOT NULL,
        sort_order INTEGER
      )
    `);

    console.log('✅ Tables created');

    // 2. Import products
    if (fs.existsSync('export-products.json')) {
      const products = JSON.parse(fs.readFileSync('export-products.json', 'utf8'));
      console.log(`📦 Importing ${products.length} products...`);
      
      for (const p of products) {
        await client.query(`
          INSERT INTO products (id, name, category, price, description, image, weight, promo_price, images, sold_count, import_price, is_tet, can_ship_province, discount_percent)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
          ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            category = EXCLUDED.category,
            price = EXCLUDED.price,
            description = EXCLUDED.description,
            image = EXCLUDED.image,
            weight = EXCLUDED.weight,
            promo_price = EXCLUDED.promo_price,
            images = EXCLUDED.images,
            sold_count = EXCLUDED.sold_count,
            import_price = EXCLUDED.import_price,
            is_tet = EXCLUDED.is_tet,
            can_ship_province = EXCLUDED.can_ship_province,
            discount_percent = EXCLUDED.discount_percent
        `, [
          p.id,
          p.name,
          p.category,
          p.price,
          p.description,
          p.image,
          p.weight,
          p.promo_price,
          p.images,
          p.sold_count || 0,
          p.import_price || 0,
          p.is_tet ? true : false,
          p.can_ship_province ? String(p.can_ship_province) : null,
          p.discount_percent || 0
        ]);
      }
      
      console.log(`✅ Imported ${products.length} products`);
    }

    // 3. Import orders
    if (fs.existsSync('export-orders.json')) {
      const orders = JSON.parse(fs.readFileSync('export-orders.json', 'utf8'));
      console.log(`📦 Importing ${orders.length} orders...`);
      
      for (const o of orders) {
        await client.query(`
          INSERT INTO orders (id, createdAt, customer_name, customer_phone, customer_address, customer_province, items_json, subtotal, shipping, discount, total, method, paid, seller, extra_cost, notes)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET
            customer_name = EXCLUDED.customer_name,
            customer_phone = EXCLUDED.customer_phone,
            customer_address = EXCLUDED.customer_address,
            customer_province = EXCLUDED.customer_province,
            items_json = EXCLUDED.items_json,
            subtotal = EXCLUDED.subtotal,
            shipping = EXCLUDED.shipping,
            discount = EXCLUDED.discount,
            total = EXCLUDED.total,
            method = EXCLUDED.method,
            paid = EXCLUDED.paid,
            seller = EXCLUDED.seller,
            extra_cost = EXCLUDED.extra_cost,
            notes = EXCLUDED.notes
        `, [
          o.id,
          o.createdAt,
          o.customer_name,
          o.customer_phone,
          o.customer_address,
          o.customer_province,
          o.items_json,
          o.subtotal,
          o.shipping || 30000,
          o.discount || 0,
          o.total,
          o.method,
          o.paid ? true : false,
          o.seller || 'Quang Tâm',
          o.extra_cost || 0,
          o.notes
        ]);
      }
      
      console.log(`✅ Imported ${orders.length} orders`);
    }

    // 4. Import admins
    if (fs.existsSync('export-admins.json')) {
      const admins = JSON.parse(fs.readFileSync('export-admins.json', 'utf8'));
      console.log(`📦 Importing ${admins.length} admins...`);
      
      for (const a of admins) {
        await client.query(`
          INSERT INTO admins (username, password_hash, role)
          VALUES ($1, $2, $3)
          ON CONFLICT (username) DO UPDATE SET
            password_hash = EXCLUDED.password_hash,
            role = EXCLUDED.role
        `, [a.username, a.password_hash, a.role]);
      }
      
      console.log(`✅ Imported ${admins.length} admins`);
    } else {
      // Create default admin
      const adminPassword = await bcrypt.hash('admin123', 10);
      await client.query(`
        INSERT INTO admins (username, password_hash, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (username) DO NOTHING
      `, ['admin', adminPassword, 'admin']);
      console.log('✅ Created default admin (admin/admin123)');
    }

    // 5. Import categories
    if (fs.existsSync('export-categories.json')) {
      const categories = JSON.parse(fs.readFileSync('export-categories.json', 'utf8'));
      console.log(`📦 Importing ${categories.length} categories...`);
      
      for (const c of categories) {
        await client.query(`
          INSERT INTO categories (category, sort_order)
          VALUES ($1, $2)
          ON CONFLICT (category) DO UPDATE SET
            sort_order = EXCLUDED.sort_order
        `, [c.category, c.sort_order]);
      }
      
      console.log(`✅ Imported ${categories.length} categories`);
    }

    console.log('');
    console.log('🎉 Import hoàn tất!');
    console.log('');
    console.log('📝 Bước tiếp theo:');
    console.log('   1. Thêm NODE_ENV=production vào .env');
    console.log('   2. Restart backend: npm start');

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

importData();
