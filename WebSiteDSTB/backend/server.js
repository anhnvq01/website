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
const { v2: cloudinary } = require('cloudinary');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();

// Configure CORS - allow both production and local development
const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['https://dacsansachtaybac.vercel.app', 'http://localhost:3000', 'http://localhost:5173'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

// Cloudinary configuration
const useCloudinary = process.env.CLOUDINARY_CLOUD_NAME && 
                      process.env.CLOUDINARY_API_KEY && 
                      process.env.CLOUDINARY_API_SECRET;

if (useCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
  console.log('☁️  Using Cloudinary for image storage');
}

// Multer storage configuration - tự động switch local/cloud
const storage = useCloudinary
  ? new CloudinaryStorage({
      cloudinary: cloudinary,
      params: {
        folder: 'taybac-products',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [{ width: 2000, height: 2000, crop: 'limit', quality: 'auto' }]
      }
    })
  : multer.diskStorage({
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
      cb(new Error('Chỉ cho phép upload file ảnh!'));
    }
  }
});

if (!useCloudinary) {
  console.log('📁 Using local storage for images (dev mode)');
}

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
try {
  const server = app.listen(PORT, () => {
    console.log('Server listening on port', PORT);
  });

  // Handle errors
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });

  server.on('error', (err) => {
    console.error('Server error:', err);
    process.exit(1);
  });
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}