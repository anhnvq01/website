const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { sendTelegramNotification } = require('../telegram');

// Ensure customers table + owner columns
;(async () => {
  try {
    await db.exec(`
      CREATE TABLE IF NOT EXISTS customers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        normalized_phone TEXT NOT NULL UNIQUE,
        owner TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await db.exec('ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_owner TEXT');
    await db.exec('ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_normalized_phone TEXT');
    await db.exec('ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_id INTEGER');
  } catch (e) {
    console.error('Init customers table error:', e.message);
  }
})();

const normalizePhone = (p) => {
  if (!p) return '';
  let phone = String(p).replace(/\s/g, '').replace(/\D/g, '');
  if (phone.startsWith('84')) phone = '0' + phone.slice(2);
  return phone;
};

async function findCustomerByPhone(phone) {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return db.prepare('SELECT * FROM customers WHERE normalized_phone = $1').get(normalized);
}

router.post('/', async (req, res) => {
  try {
    const { customer, items, subtotal, shipping, discount, total, method } = req.body;
    if (!customer || !items) return res.status(400).json({ error: 'Missing' });
    const id = 'TB' + Date.now();
    const normalizedPhone = normalizePhone(customer.phone);
    const matchedCustomer = await findCustomerByPhone(customer.phone);
    const customerOwner = matchedCustomer?.owner || null;
    const customerId = matchedCustomer?.id || null;
    
    // Insert order
    await db.prepare(`INSERT INTO orders (id, createdat, customer_name, customer_phone, customer_address, customer_province, items_json, subtotal, shipping, discount, total, method, paid, customer_owner, customer_normalized_phone, customer_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`).run(
      id, new Date().toISOString(), customer.name, customer.phone, customer.address, customer.province || 'Hà Nội', JSON.stringify(items), subtotal, shipping, discount, total, method, 0, customerOwner, normalizedPhone, customerId
    );
    
    // Update sold_count for each product
    for (const item of items) {
      await db.prepare('UPDATE products SET sold_count = sold_count + $1 WHERE id = $2').run(item.qty || 1, item.id);
    }
    
    // Send Telegram notification (async, don't wait for it)
    sendTelegramNotification(id, customer, items, total, method).catch(err => {
      console.error('Telegram notification failed:', err);
    });
    
    res.json({ id, invoiceUrl: `/invoice/${id}` });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const rows = await db.prepare('SELECT id, createdat, customer_name, customer_phone, customer_owner, subtotal, shipping, discount, total, method, paid FROM orders ORDER BY createdat DESC').all();
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Lookup orders by phone number - MUST be before /:id route
router.get('/lookup/:phone', async (req, res) => {
  try {
    const phone = req.params.phone.replace(/\s/g, '');
    // Normalize phone number: remove common formatting, convert to standard format
    // Accept both 84... and 0... formats
    const normalizePhone = (p) => {
      p = p.replace(/\s/g, '').replace(/\D/g, ''); // Remove all non-digits and spaces
      // Handle 84 prefix (convert to 0)
      if (p.startsWith('84')) {
        p = '0' + p.substring(2);
      }
      return p;
    };
    
    const normalizedPhone = normalizePhone(phone);
    
    // Search with multiple patterns to handle different formats
    const rows = await db.prepare(`
      SELECT * FROM orders 
      WHERE 
        customer_phone LIKE $1 
        OR customer_phone LIKE $2
        OR REPLACE(REPLACE(customer_phone, ' ', ''), '+', '') LIKE $3
      ORDER BY createdat DESC
    `).all(
      `%${phone}%`,  // Original format with wildcards
      `%${normalizedPhone}%`,  // Normalized format with wildcards
      `%${normalizedPhone}%`  // Alternative normalization
    );
    
    const orders = rows.map(row => {
      try {
        return {
          ...row,
          items: JSON.parse(row.items_json || '[]')
        };
      } catch (e) {
        console.error('Error parsing items_json for order', row.id, e);
        return {
          ...row,
          items: []
        };
      }
    });
    res.json(orders);
  } catch (error) {
    console.error('Error in lookup:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await db.prepare('SELECT * FROM orders WHERE id = $1').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    row.items = JSON.parse(row.items_json);
    delete row.items_json;
    res.json(row);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:id/mark-paid', async (req, res) => {
  try {
    await db.prepare('UPDATE orders SET paid = 1 WHERE id = $1').run(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;