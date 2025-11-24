const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', (req, res) => {
  const q = req.query.q || '';
  const category = req.query.category || '';
  let sql = 'SELECT * FROM products';
  const params = [];
  const clauses = [];
  if (q) { clauses.push('(name LIKE ? OR description LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (category) { clauses.push('category = ?'); params.push(category); }
  if (clauses.length) sql += ' WHERE ' + clauses.join(' AND ');
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

router.get('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

module.exports = router;