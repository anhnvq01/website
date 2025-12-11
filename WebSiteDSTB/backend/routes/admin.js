const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const ExcelJS = require('exceljs');

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

// Initialize database tables on startup
(async () => {
  try {
    // Ensure users table exists
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'admin',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `).run();
    
    // Ensure users table exists
    console.log('✅ Users table initialized');
  } catch (e) {
    console.error('⚠️ Database initialization error:', e.message);
  }
})();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing' });
    const row = await db.prepare('SELECT * FROM users WHERE username = $1').get(username);
    if (!row) return res.status(401).json({ error: 'Invalid' });
    const ok = bcrypt.compareSync(password, row.password_hash);
    if (!ok) return res.status(401).json({ error: 'Invalid' });
    const token = jwt.sign({ username, id: row.id, role: row.role }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
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

// Get all admins
router.get('/admins', auth, async (req, res) => {
  try {
    const admins = await db.prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json(admins);
  } catch (error) {
    console.error('Error fetching admins:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new admin
router.post('/admins', auth, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    
    const existingUser = await db.prepare('SELECT id FROM users WHERE username = $1').get(username);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    const passwordHash = bcrypt.hashSync(password, 10);
    const result = await db.prepare('INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role, created_at').run(username, passwordHash, role || 'admin');
    
    res.json(result);
  } catch (error) {
    console.error('Error creating admin:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update admin
router.put('/admins/:id', auth, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const id = req.params.id;
    
    if (!username) {
      return res.status(400).json({ error: 'Username required' });
    }
    
    // Check if username is already taken by another user
    const existingUser = await db.prepare('SELECT id FROM users WHERE username = $1 AND id != $2').get(username, id);
    if (existingUser) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    
    if (password) {
      const passwordHash = bcrypt.hashSync(password, 10);
      await db.prepare('UPDATE users SET username = $1, password_hash = $2, role = $3 WHERE id = $4').run(username, passwordHash, role || 'admin', id);
    } else {
      await db.prepare('UPDATE users SET username = $1, role = $2 WHERE id = $3').run(username, role || 'admin', id);
    }
    
    const updated = await db.prepare('SELECT id, username, role, created_at FROM users WHERE id = $1').get(id);
    res.json(updated);
  } catch (error) {
    console.error('Error updating admin:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete admin
router.delete('/admins/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Prevent deleting the last admin (if needed)
    const adminCount = await db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (adminCount.count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin account' });
    }
    
    await db.prepare('DELETE FROM users WHERE id = $1').run(id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error deleting admin:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

const toShipFlag = (value) => {
  // Accept boolean, numeric, or string representations
  if (value === 0 || value === '0' || value === false || value === 'false') return 0;
  return 1;
};

router.post('/products', auth, async (req, res) => {
  try {
    const { id, name, price, category, description, image, images, weight, promo_price, sold_count, import_price, is_tet, can_ship_province } = req.body;
    const pid = id || 'P' + Date.now();
    const gallery = ensureImagesArray(images, image);
    const mainImage = image || gallery[0] || '';
    const shipFlag = toShipFlag(can_ship_province);
    await db.prepare('INSERT INTO products (id,name,price,category,description,image,weight,promo_price,images,sold_count,import_price,is_tet,can_ship_province) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) ON CONFLICT (id) DO UPDATE SET name=$2,price=$3,category=$4,description=$5,image=$6,weight=$7,promo_price=$8,images=$9,sold_count=$10,import_price=$11,is_tet=$12,can_ship_province=$13')
      .run(pid, name, price, category, description, mainImage, weight || null, promo_price ?? null, JSON.stringify(gallery), sold_count || 0, import_price || 0, is_tet || 0, shipFlag);
    res.json({ ok: true, id: pid });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Server error' });
  }
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
    
    // Return URL - Cloudinary trả về full URL, local trả về relative path
    const imageUrl = req.file.path || `/images/products/${req.file.filename}`;
    res.json({ ok: true, imageUrl });
  });
});

// Get all products
router.get('/products', auth, async (req, res) => {
  try {
    const products = await db.prepare('SELECT * FROM products ORDER BY id DESC').all();
    // Load Cloudinary mapping
    const mapping = require('../cloudinary-mapping.json');
    const normalizeImageUrl = (url) => mapping[url] || url;
    const normalized = products.map(p => {
      const imagesArr = ensureImagesArray(p.images, p.image).map(normalizeImageUrl);
      return {
        ...p,
        images: imagesArr,
        image: imagesArr[0] || ''
      };
    });
    res.json(normalized);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single product
router.get('/products/:id', auth, async (req, res) => {
  try {
    const product = await db.prepare('SELECT * FROM products WHERE id = $1').get(req.params.id);
    if (!product) return res.status(404).json({ error: 'Not found' });
    const mapping = require('../cloudinary-mapping.json');
    const normalizeImageUrl = (url) => mapping[url] || url;
    const imagesArr = ensureImagesArray(product.images, product.image).map(normalizeImageUrl);
    res.json({
      ...product,
      images: imagesArr,
      image: imagesArr[0] || ''
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update product
router.put('/products/:id', auth, async (req, res) => {
  try {
    const { name, price, category, description, image, images, weight, promo_price, sold_count, import_price, is_tet, can_ship_province } = req.body;
    const id = req.params.id;
    const gallery = ensureImagesArray(images, image);
    const mainImage = image || gallery[0] || '';
    const shipFlag = toShipFlag(can_ship_province);

    await db.prepare(`
      UPDATE products 
      SET name = $1, price = $2, category = $3, description = $4, image = $5, weight = $6, promo_price = $7, images = $8, sold_count = $9, import_price = $10, is_tet = $11, can_ship_province = $12
      WHERE id = $13
    `).run(name, price, category, description, mainImage, weight ?? null, promo_price ?? null, JSON.stringify(gallery), sold_count ?? 0, import_price || 0, is_tet || 0, shipFlag, id);
    
    res.json({ ok: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete product
router.delete('/products/:id', auth, async (req, res) => {
  try {
    await db.prepare('DELETE FROM products WHERE id = $1').run(req.params.id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all orders
router.get('/orders', auth, async (req, res) => {
  try {
    const orders = await db.prepare(`
      SELECT * FROM orders ORDER BY createdat DESC
    `).all();
    
    const mapped = orders.map(o => ({
      ...o,
      items_json: o.items_json ? JSON.parse(o.items_json) : [],
      paid: !!o.paid
    }));
    
    res.json(mapped);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create order (admin) - MUST be before /:id routes
router.post('/orders', auth, async (req, res) => {
  try {
    const { customer_name, customer_phone, customer_address, items_json, subtotal, shipping, discount, total, method, paid, seller, extra_cost } = req.body;
    const id = 'ORD' + Date.now();
    
    await db.prepare(`
      INSERT INTO orders (id, createdat, customer_name, customer_phone, customer_address, items_json, subtotal, shipping, discount, total, method, paid, seller, extra_cost)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `).run(id, new Date().toISOString(), customer_name, customer_phone, customer_address, JSON.stringify(items_json), subtotal, shipping, discount, total, method, paid ? 1 : 0, seller || 'Quang Tâm', extra_cost || 0);
    
    // Update sold_count for each product
    for (const item of (items_json || [])) {
      if (item.id) {
        console.log(`Updating sold_count for product ${item.id}, adding ${item.qty || 1}`);
        await db.prepare('UPDATE products SET sold_count = sold_count + $1 WHERE id = $2').run(item.qty || 1, item.id);
      }
    }
    
    res.json({ ok: true, id });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single order
router.get('/orders/:id', auth, async (req, res) => {
  try {
    const order = await db.prepare('SELECT * FROM orders WHERE id = $1').get(req.params.id);
    if (!order) return res.status(404).json({ error: 'Not found' });
    
    res.json({
      ...order,
      items_json: order.items_json ? JSON.parse(order.items_json) : [],
      paid: !!order.paid
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark order as paid
router.patch('/orders/:id/mark-paid', auth, async (req, res) => {
  try {
    await db.prepare('UPDATE orders SET paid = TRUE WHERE id = $1').run(req.params.id);
    const updated = await db.prepare('SELECT * FROM orders WHERE id = $1').get(req.params.id);
    res.json({ paid: updated.paid });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark order as unpaid
router.patch('/orders/:id/mark-unpaid', auth, async (req, res) => {
  try {
    await db.prepare('UPDATE orders SET paid = FALSE WHERE id = $1').run(req.params.id);
    const updated = await db.prepare('SELECT * FROM orders WHERE id = $1').get(req.params.id);
    res.json({ paid: updated.paid });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete order
router.delete('/orders/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    
    // Get order details before deletion to reduce sold_count and notify
    const order = await db.prepare('SELECT id, customer_name, customer_phone, customer_address, customer_province, items_json FROM orders WHERE id = $1').get(id);
    
    if (order && order.items_json) {
      try {
        const items = JSON.parse(order.items_json);
        
        // Reduce sold_count for each product
        for (const item of items) {
          if (item.id) {
            const qty = item.qty || 1;
            console.log(`Reducing sold_count for product ${item.id}, subtracting ${qty}`);
            await db.prepare('UPDATE products SET sold_count = GREATEST(0, sold_count - $1) WHERE id = $2').run(qty, item.id);
          }
        }
      } catch (e) {
        console.error('Error reducing sold_count:', e);
      }
    }
    
    // Delete the order
    await db.prepare('DELETE FROM orders WHERE id = $1').run(id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update order
router.patch('/orders/:id', auth, async (req, res) => {
  try {
    const id = req.params.id;
    const body = req.body;

    // Build dynamic UPDATE statement
    const fields = [];
    const values = [];
    let paramIndex = 1;

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
      status: 'status',
      seller: 'seller',
      extra_cost: 'extra_cost'
    };

    for (const [key, dbField] of Object.entries(allowedFields)) {
      if (key in body) {
        fields.push(`${dbField} = $${paramIndex++}`);
        if (key === 'items_json') {
          values.push(JSON.stringify(body[key] || []));
        } else if (key === 'paid') {
          // Ensure boolean for PostgreSQL
          values.push(!!body[key]);
        } else {
          values.push(body[key]);
        }
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(id);
    
    const sql = `UPDATE orders SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
    await db.prepare(sql).run(...values);

    res.json({ ok: true });
  } catch (error) {
    console.error('Error updating order:', error);
    res.status(500).json({ error: 'Failed to update order' });
  }
});

// Stats endpoint: revenue and profit for a period (day|week|month)
router.get('/stats', auth, async (req, res) => {
  try {
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

    // Calculate revenue: total - shipping - extra_cost
    const row = await db.prepare(`SELECT COALESCE(SUM(total - COALESCE(shipping, 0) - COALESCE(extra_cost, 0)), 0) as revenue FROM orders WHERE createdat >= $1 AND createdat <= $2`).get(startIso, endIso);
    const revenue = row && row.revenue ? Number(row.revenue) : 0;

    // Calculate stats by seller
    const quangTamRow = await db.prepare(`SELECT COALESCE(SUM(total - COALESCE(shipping, 0) - COALESCE(extra_cost, 0)), 0) as revenue FROM orders WHERE createdat >= $1 AND createdat <= $2 AND (seller = $3 OR seller IS NULL)`).get(startIso, endIso, 'Quang Tâm');
    const meHangRow = await db.prepare(`SELECT COALESCE(SUM(total - COALESCE(shipping, 0) - COALESCE(extra_cost, 0)), 0) as revenue FROM orders WHERE createdat >= $1 AND createdat <= $2 AND seller = $3`).get(startIso, endIso, 'Mẹ Hằng');
    
    const revenueQuangTam = quangTamRow && quangTamRow.revenue ? Number(quangTamRow.revenue) : 0;
    const revenueMeHang = meHangRow && meHangRow.revenue ? Number(meHangRow.revenue) : 0;

    // Calculate profit: revenue - total import cost - extra_cost
    const orders = await db.prepare(`SELECT items_json, seller, COALESCE(extra_cost, 0) as extra_cost FROM orders WHERE createdat >= $1 AND createdat <= $2`).all(startIso, endIso);
    let totalProfit = 0;
    let profitQuangTam = 0;
    let profitMeHang = 0;
    
    for (const order of orders) {
      try {
        const items = JSON.parse(order.items_json || '[]');
        let orderProfit = 0;
        for (const item of items) {
          // Get product details including import_price
          const product = await db.prepare('SELECT import_price, promo_price, price FROM products WHERE id = $1').get(item.id);
          if (product) {
            const importPrice = Number(product.import_price || 0);
            const salePrice = Number(product.promo_price || product.price || 0);
            const quantity = Number(item.qty || 1);
            const itemProfit = (salePrice - importPrice) * quantity;
            orderProfit += itemProfit;
          }
        }
        
        // Subtract extra_cost from profit
        orderProfit -= Number(order.extra_cost || 0);
        totalProfit += orderProfit;
        
        // Distribute profit by seller
        if (order.seller === 'Mẹ Hằng') {
          profitMeHang += orderProfit;
        } else {
          profitQuangTam += orderProfit; // Default to Quang Tâm
        }
      } catch (e) {
        console.error('Error calculating profit for order:', e);
      }
    }
    
    const profit = Math.round(totalProfit);
    profitQuangTam = Math.round(profitQuangTam);
    profitMeHang = Math.round(profitMeHang);

    // Additional metrics
    const totalProductsRow = await db.prepare('SELECT COUNT(*) as count FROM products').get();
    const totalOrdersRow = await db.prepare('SELECT COUNT(*) as count FROM orders').get();
    
    // Đơn chưa giao (status = 'undelivered' hoặc không có status hoặc status khác delivered/cancelled)
    const undeliveredOrdersRow = await db.prepare(`SELECT COUNT(*) as count FROM orders WHERE COALESCE(status, 'undelivered') = 'undelivered'`).get();
    
    // Đơn đã giao nhưng chưa thanh toán (status = 'delivered' và paid = 0)
    const unpaidDeliveredOrdersRow = await db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'delivered' AND paid = FALSE`).get();
    
    // Đơn bom (status = 'bom')
    const bomOrdersRow = await db.prepare(`SELECT COUNT(*) as count FROM orders WHERE status = 'bom'`).get();

    res.json({ 
      period, 
      revenue, 
      profit,
      revenueQuangTam,
      revenueMeHang,
      profitQuangTam,
      profitMeHang,
      totalProducts: totalProductsRow?.count || 0,
      totalOrders: totalOrdersRow?.count || 0,
      undeliveredOrders: undeliveredOrdersRow?.count || 0,
      unpaidDeliveredOrders: unpaidDeliveredOrdersRow?.count || 0,
      bomOrders: bomOrdersRow?.count || 0
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Category management
router.get('/categories', auth, async (req, res) => {
  try {
    const categories = await db.prepare('SELECT id, category, sort_order FROM categories ORDER BY COALESCE(sort_order, id)').all();
    res.json(categories);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/categories', auth, async (req, res) => {
  try {
    const { category } = req.body;
    if (!category || !category.trim()) return res.status(400).json({ error: 'Category name required' });
    const nextOrderRow = await db.prepare('SELECT COALESCE(MAX(sort_order), 0) as maxOrder FROM categories').get();
    const nextOrder = (nextOrderRow?.maxOrder || 0) + 1;
    await db.prepare('INSERT INTO categories (category, sort_order) VALUES ($1, $2) ON CONFLICT (category) DO NOTHING').run(category.trim(), nextOrder);
    res.json({ ok: true, category: category.trim(), sort_order: nextOrder });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/categories/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { category } = req.body;
    if (!category || !category.trim()) return res.status(400).json({ error: 'Category name required' });
    await db.prepare('UPDATE categories SET category = $1 WHERE id = $2').run(category.trim(), id);
    res.json({ ok: true, category: category.trim() });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/categories/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.prepare('DELETE FROM categories WHERE id = $1').run(id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reorder categories: body { order: [id1, id2, ...] }
router.post('/categories/reorder', auth, async (req, res) => {
  try {
    const { order } = req.body;
    if (!Array.isArray(order) || order.length === 0) {
      return res.status(400).json({ error: 'Order array required' });
    }

    for (let idx = 0; idx < order.length; idx++) {
      await db.prepare('UPDATE categories SET sort_order = $1 WHERE id = $2').run(idx + 1, order[idx]);
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('Reorder categories error:', e);
    res.status(500).json({ error: 'Reorder failed' });
  }
});

// Admin management endpoints
router.get('/admins', auth, async (req, res) => {
  try {
    const admins = await db.prepare('SELECT id, username, role, created_at FROM users ORDER BY created_at DESC').all();
    res.json(admins);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/admins', auth, async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });
    
    // Check if username already exists
    const existing = await db.prepare('SELECT id FROM users WHERE username = $1').get(username);
    if (existing) return res.status(400).json({ error: 'Username already exists' });
    
    const passwordHash = bcrypt.hashSync(password, 10);
    await db.prepare('INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)').run(username, passwordHash, role || 'admin');
    res.json({ ok: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/admins/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, password, role } = req.body;
    
    if (!username) return res.status(400).json({ error: 'Username required' });
    
    // Check if username is taken by another user
    const existing = await db.prepare('SELECT id FROM users WHERE username = $1 AND id != $2').get(username, id);
    if (existing) return res.status(400).json({ error: 'Username already exists' });
    
    if (password && password.trim()) {
      // Update with new password
      const passwordHash = bcrypt.hashSync(password, 10);
      await db.prepare('UPDATE users SET username = $1, password_hash = $2, role = $3 WHERE id = $4').run(username, passwordHash, role || 'admin', id);
    } else {
      // Update without changing password
      await db.prepare('UPDATE users SET username = $1, role = $2 WHERE id = $3').run(username, role || 'admin', id);
    }
    
    res.json({ ok: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/admins/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting yourself
    if (req.user.id == id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    // Prevent deleting last admin
    const adminCount = await db.prepare('SELECT COUNT(*) as count FROM users').get();
    if (adminCount.count <= 1) {
      return res.status(400).json({ error: 'Cannot delete the last admin account' });
    }
    
    await db.prepare('DELETE FROM users WHERE id = $1').run(id);
    res.json({ ok: true });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Export orders with status "tomorrow_delivery" to Excel
router.get('/export-ngay-mai-giao', auth, async (req, res) => {
  try {
    // Get all orders with status "tomorrow_delivery"
    const orders = await db.prepare(`
      SELECT * FROM orders 
      WHERE status = 'tomorrow_delivery'
      ORDER BY createdat DESC
    `).all();

    if (orders.length === 0) {
      return res.status(404).json({ error: 'Không có đơn hàng nào với trạng thái "Giao ngày mai"' });
    }

    // Create workbook and worksheet
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Ngày mai giao');

    // Define columns matching the Excel template
    worksheet.columns = [
      { header: 'Địa chỉ', key: 'address', width: 50 },
      { header: 'Tên người nhận', key: 'name', width: 20 },
      { header: 'Số điện thoại', key: 'phone', width: 15 },
      { header: 'Tiền thu hộ (COD)', key: 'cod', width: 15 },
      { header: 'Giá trị hàng hóa', key: 'value', width: 15 },
      { header: 'Khối lượng (kg)', key: 'weight', width: 15 },
      { header: 'Ghi chú', key: 'note', width: 30 }
    ];

    // Style the header row
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    for (const order of orders) {
      let totalWeight = 0;
      
      // Parse items to calculate total weight
      try {
        const items = JSON.parse(order.items_json || '[]');
        for (const item of items) {
          // Get product weight
          const product = await db.prepare('SELECT weight FROM products WHERE id = $1').get(item.id);
          if (product && product.weight) {
            totalWeight += product.weight * (item.qty || 1); // Weight is already in kg
          }
        }
      } catch (e) {
        console.error('Error calculating weight:', e);
      }

      // Round weight up to nearest 0.5kg
      let roundedWeight = '';
      if (totalWeight > 0) {
        roundedWeight = Math.ceil(totalWeight * 2) / 2; // Round up to nearest 0.5
      }

      worksheet.addRow({
        address: order.customer_address || '',
        name: order.customer_name || '',
        phone: order.customer_phone || '',
        cod: order.total || 0,
        value: order.total || 0,
        weight: roundedWeight,
        note: ''
      });
    }

    // Set response headers for file download
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=DonHang_NgayMaiGiao_${new Date().toISOString().slice(0, 10)}.xlsx`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error('Error exporting Excel:', error);
    res.status(500).json({ error: 'Lỗi khi xuất file Excel: ' + error.message });
  }
});

module.exports = router;
