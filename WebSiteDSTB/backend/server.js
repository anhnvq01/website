require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');
const products = require('./routes/products');
const orders = require('./routes/orders');
const admin = require('./routes/admin');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// API
app.use('/api/products', products);
app.use('/api/orders', orders);
app.use('/api/admin', admin);

// Simple health
app.get('/api/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log('Server listening on port', PORT);
});