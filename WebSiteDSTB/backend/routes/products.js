const express = require('express');
const router = express.Router();
const db = require('../db');

// Simple in-memory cache
let productsCache = null;
let productsCacheTime = 0;
const CACHE_DURATION = 60000; // 1 minute

router.get('/', async (req, res) => {
  try {
    const q = req.query.q || '';
    const category = req.query.category || '';
    
    // Use cache if no filters and cache is fresh
    if (!q && !category && productsCache && (Date.now() - productsCacheTime < CACHE_DURATION)) {
      return res.json(productsCache);
    }
    
    let sql = 'SELECT * FROM products';
    const params = [];
    const clauses = [];
    if (q) { clauses.push('(name ILIKE $' + (params.length + 1) + ' OR description ILIKE $' + (params.length + 2) + ')'); params.push(`%${q}%`, `%${q}%`); }
    if (category) { clauses.push('category = $' + (params.length + 1)); params.push(category); }
    if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
    
    const rows = await db.prepare(sql).all(...params);
    
    // normalize images field: ensure an array is provided and include mainImage for frontend convenience
    const mapped = rows.map(r => {
      const out = Object.assign({}, r);
      try{
        if(out.images){
          out.images = JSON.parse(out.images);
        } else if(out.image){
          out.images = [out.image];
        } else {
          out.images = [];
        }
      }catch(e){
        out.images = out.image ? [out.image] : [];
      }
      out.mainImage = out.images.length ? out.images[0] : null;
      return out;
    })
    
    // Cache if no filters
    if (!q && !category) {
      productsCache = mapped;
      productsCacheTime = Date.now();
    }
    
    res.json(mapped);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public endpoint to get all categories
let categoriesCache = null;
let categoriesCacheTime = 0;

router.get('/categories', async (req, res) => {
  try {
    // Use cache if fresh
    if (categoriesCache && (Date.now() - categoriesCacheTime < CACHE_DURATION)) {
      return res.json(categoriesCache);
    }
    
    const rows = await db.prepare('SELECT id, category, sort_order FROM categories ORDER BY COALESCE(sort_order, id)').all();
    categoriesCache = rows;
    categoriesCacheTime = Date.now();
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Cache individual products
let productCache = {};
let productCacheTime = {};

router.get('/:id', async (req, res) => {
  try {
    const productId = req.params.id;
    
    // Use cache if fresh
    if (productCache[productId] && (Date.now() - productCacheTime[productId] < CACHE_DURATION)) {
      return res.json(productCache[productId]);
    }
    
    const row = await db.prepare('SELECT * FROM products WHERE id = $1').get(productId);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const out = Object.assign({}, row);
    try{
      if(out.images){ out.images = JSON.parse(out.images) }
      else if(out.image){ out.images = [out.image] }
      else out.images = []
    }catch(e){ out.images = out.image ? [out.image] : [] }
    out.mainImage = out.images.length ? out.images[0] : null
    
    // Cache result
    productCache[productId] = out;
    productCacheTime[productId] = Date.now();
    
    res.json(out);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Clear cache function (called when admin updates products)
router.clearCache = function() {
  productsCache = null;
  productsCacheTime = 0;
  categoriesCache = null;
  categoriesCacheTime = 0;
  productCache = {};
  productCacheTime = {};
};

module.exports = router;