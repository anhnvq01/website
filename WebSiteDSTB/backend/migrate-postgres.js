// Migration script cho PostgreSQL
// Chạy: node migrate-postgres.js

const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
});

async function migrate() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    // 1. Create products table
    console.log('📦 Creating products table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        price INTEGER NOT NULL,
        description TEXT,
        image VARCHAR(255),
        stock INTEGER DEFAULT 0,
        unit VARCHAR(50) DEFAULT 'kg',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Create orders table
    console.log('📦 Creating orders table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20) NOT NULL,
        customer_address TEXT NOT NULL,
        total_amount INTEGER NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        payment_proof VARCHAR(255),
        status VARCHAR(50) DEFAULT 'pending',
        notes TEXT,
        shipping_cost INTEGER DEFAULT 30000,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Create order_items table
    console.log('📦 Creating order_items table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES products(id),
        product_name VARCHAR(255) NOT NULL,
        quantity INTEGER NOT NULL,
        price INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 4. Create users table (admin)
    console.log('📦 Creating users table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 5. Insert default admin user
    const bcrypt = require('bcrypt');
    const adminPassword = await bcrypt.hash('admin123', 10);
    
    await client.query(`
      INSERT INTO users (username, password, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (username) DO NOTHING
    `, ['admin', adminPassword, 'admin']);

    console.log('✅ Default admin created (username: admin, password: admin123)');

    // 6. Insert sample products
    console.log('📦 Inserting sample products...');
    const sampleProducts = [
      ['Mật ong rừng Tây Bắc', 'mat-ong', 350000, 'Mật ong rừng nguyên chất, không pha trộn', '/images/products/mat-ong-1.jpg', 50, 'kg'],
      ['Thịt trâu gác bếp', 'thit-kho', 450000, 'Thịt trâu gác bếp truyền thống người Thái', '/images/products/thit-trau-1.jpg', 30, 'kg'],
      ['Gạo nếp Tú Lệ', 'gao-nep', 120000, 'Gạo nếp Tú Lệ đặc sản', '/images/products/gao-nep-1.jpg', 100, 'kg']
    ];

    for (const product of sampleProducts) {
      await client.query(`
        INSERT INTO products (name, category, price, description, image, stock, unit)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT DO NOTHING
      `, product);
    }

    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('📝 Database tables created:');
    console.log('   - products');
    console.log('   - orders');
    console.log('   - order_items');
    console.log('   - users');
    console.log('');
    console.log('👤 Admin login: admin / admin123');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
