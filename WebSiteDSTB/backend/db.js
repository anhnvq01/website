// Database connection - SQLite with Cloudinary images
const Database = require('better-sqlite3');
const path = require('path');

console.log('📦 Using SQLite database with Cloudinary images');
const db = new Database(path.join(__dirname, 'taybac.db'));
db.pragma('journal_mode = WAL');

module.exports = db;