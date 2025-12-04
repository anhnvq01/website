const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

function ensureImagesArray(value, fallback) {
  if (Array.isArray(value)) {
    return value.filter(Boolean);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) {
      return fallback ? ensureImagesArray(fallback) : [];
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    } catch (e) {
      // fall through to handle comma separated strings
    }
    if (trimmed.includes(',')) {
      return trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
    return [trimmed];
  }
  if (value) {
    return [value];
  }
  if (fallback) {
    return ensureImagesArray(fallback);
  }
  return [];
}

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Missing' });
  const row = db.prepare('SELECT * FROM admin WHERE username = ?').get(username);
  if (!row) return res.status(401).json({ error: 'Invalid' });
  const ok = bcrypt.compareSync(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid' });
  const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// middleware
function auth(req, res, next) {
  const hdr = req.headers.authorization;
  if (!hdr) return res.status(401).json({ error: 'Unauthorized' });
  const parts = hdr.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'Unauthorized' });
  try {
    const payload = jwt.verify(parts[1], JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    res.status(401).json({ error: 'Unauthorized' });
  }
}

router.get('/me', auth, (req, res) => {
  res.json({ username: req.user.username });
});

router.post('/products', auth, (req, res) => {
  const { id, name, price, category, description, image, images, weight, promo_price } = req.body;
  const pid = id || 'P' + Date.now();
  const gallery = ensureImagesArray(images, image);
  const mainImage = image || gallery[0] || '';
  db.prepare('INSERT OR REPLACE INTO products (id,name,price,category,description,image,weight,promo_price,images) VALUES (?,?,?,?,?,?,?,?,?)')
    .run(pid, name, price, category, description, mainImage, weight || null, promo_price ?? null, JSON.stringify(gallery));
  res.json({ ok: true, id: pid });
});

// Upload image endpoint
router.post('/upload-image', auth, (req, res) => {
  const upload = req.app.locals.upload;
  if (!upload) {
    return res.status(500).json({ error: 'Upload service not configured' });
  }
  
  upload.single('image')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: err.message });
    } else if (err) {
      return res.status(400).json({ error: err.message });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Return relative path for the image
    const imageUrl = `/images/products/${req.file.filename}`;
    res.json({ ok: true, imageUrl });
  });
});

// Get all products
router.get('/products', auth, (req, res) => {
  const products = db.prepare('SELECT * FROM products ORDER BY id DESC').all();
  const normalized = products.map(p => ({
    ...p,
    images: ensureImagesArray(p.images, p.image)
  }));
  res.json(normalized);
});

// Get single product
router.get('/products/:id', auth, (req, res) => {
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!product) return res.status(404).json({ error: 'Not found' });
  res.json({
    ...product,
    images: ensureImagesArray(product.images, product.image)
  });
});

// Update product
router.put('/products/:id', auth, (req, res) => {
  const { name, price, category, description, image, images, weight, promo_price } = req.body;
  const id = req.params.id;
  const gallery = ensureImagesArray(images, image);
  const mainImage = image || gallery[0] || '';

  db.prepare(`
    UPDATE products 
    SET name = ?, price = ?, category = ?, description = ?, image = ?, weight = ?, promo_price = ?, images = ?
    WHERE id = ?
  `).run(name, price, category, description, mainImage, weight || null, promo_price ?? null, JSON.stringify(gallery), id);
  
  res.json({ ok: true });
});

// Delete product
router.delete('/products/:id', auth, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Get all orders
router.get('/orders', auth, (req, res) => {
  const orders = db.prepare(`
    SELECT * FROM orders ORDER BY createdAt DESC
  `).all();
  
  const mapped = orders.map(o => ({
    ...o,
    items_json: o.items_json ? JSON.parse(o.items_json) : [],
    paid: o.paid === 1
  }));
  
  res.json(mapped);
});

// Create order (admin) - MUST be before /:id routes
router.post('/orders', auth, (req, res) => {
  const { customer_name, customer_phone, customer_address, items_json, subtotal, shipping, discount, total, method, paid } = req.body;
  const id = 'ORD' + Date.now();
  
  db.prepare(`
    INSERT INTO orders (id, createdAt, customer_name, customer_phone, customer_address, items_json, subtotal, shipping, discount, total, method, paid)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, new Date().toISOString(), customer_name, customer_phone, customer_address, JSON.stringify(items_json), subtotal, shipping, discount, total, method, paid ? 1 : 0);
  
  res.json({ ok: true, id });
});

// Get single order
router.get('/orders/:id', auth, (req, res) => {
  const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!order) return res.status(404).json({ error: 'Not found' });
  
  res.json({
    ...order,
    items_json: order.items_json ? JSON.parse(order.items_json) : [],
    paid: order.paid === 1
  });
});

// Mark order as paid
router.patch('/orders/:id/mark-paid', auth, (req, res) => {
  db.prepare('UPDATE orders SET paid = 1 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Mark order as unpaid
router.patch('/orders/:id/mark-unpaid', auth, (req, res) => {
  db.prepare('UPDATE orders SET paid = 0 WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Delete order
router.delete('/orders/:id', auth, (req, res) => {
  db.prepare('DELETE FROM orders WHERE id = ?').run(req.params.id);
  res.json({ ok: true });
});

// Update order
router.patch('/orders/:id', auth, (req, res) => {
  const id = req.params.id;
  const body = req.body;

  try {
    // Build dynamic UPDATE statement
    const fields = [];
    const values = [];

    // Map of allowed fields to update
    const allowedFields = {
      customer_name: 'customer_name',
      customer_phone: 'customer_phone', 
      customer_address: 'customer_address',
      items_json: 'items_json',
      subtotal: 'subtotal',
      shipping: 'shipping',
      discount: 'discount',
      total: 'total',
      method: 'method',
      paid: 'paid',
      status: 'status'
    };

    for (const [key, dbField] of Object.entries(allowedFields)) {
      if (key in body) {
        fields.push(`${dbField} = ?`);
        
        if (key === 'items_json') {
          values.push(JSON.stringify(body[key] || []));
        } else if (key === 'paid') {
          values.push(body[key] ? 1 : 0);
        } else {
          values.push(body[key]);
        }
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    
    const sql = `UPDATE orders SET ${fields.join(', ')} WHERE id = ?`;
    db.prepare(sql).run(...values);

    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Stats endpoint: revenue and profit for a period (day|week|month)
router.get('/stats', auth, (req, res) => {
  const period = req.query.period || 'day';
  const now = new Date();
  let start;

  if (period === 'day') {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  } else if (period === 'week') {
    // start of ISO week (Monday)
    const day = now.getDay(); // 0 (Sun) - 6
    const diff = (day === 0 ? -6 : 1) - day; // shift to Monday
    start = new Date(now);
    start.setDate(now.getDate() + diff);
    start.setHours(0,0,0,0);
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
  } else if (period === 'year') {
    start = new Date(now.getFullYear(), 0, 1);
  } else {
    return res.status(400).json({ error: 'Invalid period' });
  }

  const startIso = start.toISOString();
  const end = new Date();
  const endIso = end.toISOString();

  const row = db.prepare(`SELECT SUM(total) as revenue FROM orders WHERE createdAt >= ? AND createdAt <= ?`).get(startIso, endIso);
  const revenue = row && row.revenue ? Number(row.revenue) : 0;

  // Profit margin percent from env or default to 30%
  const marginPercent = Number(process.env.PROFIT_MARGIN_PERCENT || 30);
  const profit = Math.round(revenue * (marginPercent / 100));

  // Additional metrics
  const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count || 0;
  const totalOrders = db.prepare('SELECT COUNT(*) as count FROM orders').get().count || 0;
  
  // Đơn chưa giao (status = 'undelivered' hoặc không có status hoặc status khác delivered/cancelled)
  const undeliveredOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE COALESCE(status, 'undelivered') = 'undelivered'`).get().count || 0;
  
  // Đơn đã giao nhưng chưa thanh toán (status = 'delivered' và paid = 0)
  const unpaidDeliveredOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'delivered' AND paid = 0`).get().count || 0;
  
  // Đơn bom (status = 'bom')
  const bomOrders = db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'bom'`).get().count || 0;

  res.json({ 
    period, 
    revenue, 
    profit, 
    marginPercent,
    totalProducts,
    totalOrders,
    undeliveredOrders,
    unpaidDeliveredOrders,
    bomOrders
  });
});

// Category management
router.get('/categories', auth, (req, res) => {
  const categories = db.prepare('SELECT rowid, category FROM categories ORDER BY category').all();
  res.json(categories);
});

router.post('/categories', auth, (req, res) => {
  const { category } = req.body;
  if (!category || !category.trim()) return res.status(400).json({ error: 'Category name required' });
  db.prepare('INSERT OR IGNORE INTO categories (category) VALUES (?)').run(category.trim());
  res.json({ ok: true, category: category.trim() });
});

router.put('/categories/:id', auth, (req, res) => {
  const { id } = req.params;
  const { category } = req.body;
  if (!category || !category.trim()) return res.status(400).json({ error: 'Category name required' });
  db.prepare('UPDATE categories SET category = ? WHERE rowid = ?').run(category.trim(), id);
  res.json({ ok: true, category: category.trim() });
});

router.delete('/categories/:id', auth, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM categories WHERE rowid = ?').run(id);
  res.json({ ok: true });
});

module.exports = router;