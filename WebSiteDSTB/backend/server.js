require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const db = require('./db');
const products = require('./routes/products');
const orders = require('./routes/orders');
const admin = require('./routes/admin');

const app = express();

// Configure CORS to allow Vercel frontend
const corsOptions = {
  origin: [
    'https://dacsansachtaybac.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Multer configuration for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../frontend/public/images/products'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images are allowed.'));
    }
  }
});

// Make upload middleware available to routes
app.locals.upload = upload;

// Serve static files from frontend/public
app.use(express.static(path.join(__dirname, '../frontend/public')));

// Download database backup (must be before /api routes)
app.get('/api/download-db', (req, res) => {
  const dbPath = path.join(__dirname, 'taybac.db');
  res.download(dbPath, 'taybac.db');
});

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