const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret';

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
  const { id, name, price, category, description, image } = req.body;
  const pid = id || 'P' + Date.now();
  db.prepare('INSERT OR REPLACE INTO products (id,name,price,category,description,image) VALUES (?,?,?,?,?,?)').run(pid, name, price, category, description, image);
  res.json({ ok: true, id: pid });
});

module.exports = router;