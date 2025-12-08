const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { sendTelegramNotification } = require('../telegram');

router.post('/', async (req, res) => {
  const { customer, items, subtotal, shipping, discount, total, method } = req.body;
  if (!customer || !items) return res.status(400).json({ error: 'Missing' });
  const id = 'TB' + Date.now();
  
  // Insert order
  db.prepare(`INSERT INTO orders (id, createdAt, customer_name, customer_phone, customer_address, customer_province, items_json, subtotal, shipping, discount, total, method, paid)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, new Date().toISOString(), customer.name, customer.phone, customer.address, customer.province || 'Hà Nội', JSON.stringify(items), subtotal, shipping, discount, total, method, 0
  );
  
  // Update sold_count for each product
  const updateSold = db.prepare('UPDATE products SET sold_count = sold_count + ? WHERE id = ?');
  items.forEach(item => {
    updateSold.run(item.qty || 1, item.id);
  });
  
  // Send Telegram notification (async, don't wait for it)
  sendTelegramNotification(id, customer, items, total, method).catch(err => {
    console.error('Telegram notification failed:', err);
  });
  
  res.json({ id, invoiceUrl: `/invoice/${id}` });
});

router.get('/', (req, res) => {
  const rows = db.prepare('SELECT id, createdAt, customer_name, customer_phone, subtotal, shipping, discount, total, method, paid FROM orders ORDER BY createdAt DESC').all();
  res.json(rows);
});

// Lookup orders by phone number - MUST be before /:id route
router.get('/lookup/:phone', (req, res) => {
  try {
    const phone = req.params.phone.replace(/\s/g, '');
    const rows = db.prepare('SELECT * FROM orders WHERE customer_phone LIKE ? ORDER BY createdAt DESC').all(`%${phone}%`);
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

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  row.items = JSON.parse(row.items_json);
  delete row.items_json;
  res.json(row);
});

router.post('/:id/mark-paid', (req, res) => {
  db.prepare('UPDATE orders SET paid = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

module.exports = router;