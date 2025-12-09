// Script drop và tạo lại tables
const { Client } = require('pg');
require('dotenv').config();

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
});

async function reset() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL');

    console.log('🗑️  Dropping old tables...');
    await client.query('DROP TABLE IF EXISTS order_items CASCADE');
    await client.query('DROP TABLE IF EXISTS orders CASCADE');
    await client.query('DROP TABLE IF EXISTS products CASCADE');
    await client.query('DROP TABLE IF EXISTS admins CASCADE');
    await client.query('DROP TABLE IF EXISTS categories CASCADE');
    
    console.log('✅ Tables dropped');
    console.log('');
    console.log('📝 Giờ chạy: node import-to-postgres.js');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.end();
  }
}

reset();
