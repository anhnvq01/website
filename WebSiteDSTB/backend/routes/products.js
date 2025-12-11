const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const q = req.query.q || '';
    const category = req.query.category || '';
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
    res.json(mapped);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Public endpoint to get all categories
router.get('/categories', async (req, res) => {
  try {
    const rows = await db.prepare('SELECT id, category, sort_order FROM categories ORDER BY COALESCE(sort_order, id)').all();
    res.json(rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const row = await db.prepare('SELECT * FROM products WHERE id = $1').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    const out = Object.assign({}, row);
    try{
      if(out.images){ out.images = JSON.parse(out.images) }
      else if(out.image){ out.images = [out.image] }
      else out.images = []
    }catch(e){ out.images = out.image ? [out.image] : [] }
    out.mainImage = out.images.length ? out.images[0] : null
    res.json(out);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;