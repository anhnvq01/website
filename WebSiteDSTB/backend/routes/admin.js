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
  const { id, name, price, category, description, image, images, weight, promo_price, sold_count, import_price, is_tet } = req.body;
  const pid = id || 'P' + Date.now();
  const gallery = ensureImagesArray(images, image);
  const mainImage = image || gallery[0] || '';
  db.prepare('INSERT OR REPLACE INTO products (id,name,price,category,description,image,weight,promo_price,images,sold_count,import_price,is_tet) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)')
    .run(pid, name, price, category, description, mainImage, weight || null, promo_price ?? null, JSON.stringify(gallery), sold_count || 0, import_price || 0, is_tet || 0);
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
  const { name, price, category, description, image, images, weight, promo_price, sold_count, import_price, is_tet } = req.body;
  const id = req.params.id;
  const gallery = ensureImagesArray(images, image);
  const mainImage = image || gallery[0] || '';

  db.prepare(`
    UPDATE products 
    SET name = ?, price = ?, category = ?, description = ?, image = ?, weight = ?, promo_price = ?, images = ?, sold_count = ?, import_price = ?, is_tet = ?
    WHERE id = ?
  `).run(name, price, category, description, mainImage, weight || null, promo_price ?? null, JSON.stringify(gallery), sold_count ?? 0, import_price || 0, is_tet || 0, id);
  
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

  // Calculate profit based on actual import_price
  const orders = db.prepare(`SELECT items_json FROM orders WHERE createdAt >= ? AND createdAt <= ?`).all(startIso, endIso);
  let totalProfit = 0;
  
  orders.forEach(order => {
    try {
      const items = JSON.parse(order.items_json || '[]');
      items.forEach(item => {
        // Get product details including import_price
        const product = db.prepare('SELECT import_price, promo_price, price FROM products WHERE id = ?').get(item.id);
        if (product) {
          const importPrice = Number(product.import_price || 0);
          const salePrice = Number(product.promo_price || product.price || 0);
          const quantity = Number(item.qty || 1);
          const itemProfit = (salePrice - importPrice) * quantity;
          totalProfit += itemProfit;
        }
      });
    } catch (e) {
      console.error('Error calculating profit for order:', e);
    }
  });
  
  const profit = Math.round(totalProfit);

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
    totalProducts,
    totalOrders,
    undeliveredOrders,
    unpaidDeliveredOrders,
    bomOrders
  });
});

// Category management
router.get('/categories', auth, (req, res) => {
  const categories = db.prepare('SELECT rowid, category, sort_order FROM categories ORDER BY COALESCE(sort_order, rowid)').all();
  res.json(categories);
});

router.post('/categories', auth, (req, res) => {
  const { category } = req.body;
  if (!category || !category.trim()) return res.status(400).json({ error: 'Category name required' });
  const nextOrderRow = db.prepare('SELECT IFNULL(MAX(sort_order), 0) as maxOrder FROM categories').get();
  const nextOrder = (nextOrderRow?.maxOrder || 0) + 1;
  db.prepare('INSERT OR IGNORE INTO categories (category, sort_order) VALUES (?, ?)').run(category.trim(), nextOrder);
  res.json({ ok: true, category: category.trim(), sort_order: nextOrder });
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

// Reorder categories: body { order: [rowid1, rowid2, ...] }
router.post('/categories/reorder', auth, (req, res) => {
  const { order } = req.body;
  if (!Array.isArray(order) || order.length === 0) {
    return res.status(400).json({ error: 'Order array required' });
  }

  const update = db.prepare('UPDATE categories SET sort_order = ? WHERE rowid = ?');
  const txn = db.transaction((ids) => {
    ids.forEach((id, idx) => update.run(idx + 1, id));
  });

  try {
    txn(order);
    res.json({ ok: true });
  } catch (e) {
    console.error('Reorder categories error:', e);
    res.status(500).json({ error: 'Reorder failed' });
  }
});

module.exports = router;