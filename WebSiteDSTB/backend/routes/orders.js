const express = require('express');
const router = express.Router();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');
const { sendTelegramNotification } = require('../telegram');

router.post('/', async (req, res) => {
  try {
    const { customer, items, subtotal, shipping, discount, total, method } = req.body;
    if (!customer || !items) return res.status(400).json({ error: 'Missing' });
    const id = 'TB' + Date.now();
    
    // Insert order
    await db.prepare(`INSERT INTO orders (id, createdat, customer_name, customer_phone, customer_address, customer_province, items_json, subtotal, shipping, discount, total, method, paid)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`).run(
      id, new Date().toISOString(), customer.name, customer.phone, customer.address, customer.province || 'Hà Nội', JSON.stringify(items), subtotal, shipping, discount, total, method, 0
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
    const rows = await db.prepare('SELECT id, createdat, customer_name, customer_phone, subtotal, shipping, discount, total, method, paid FROM orders ORDER BY createdat DESC').all();
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
    const rows = await db.prepare('SELECT * FROM orders WHERE customer_phone LIKE $1 ORDER BY createdat DESC').all(`%${phone}%`);
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