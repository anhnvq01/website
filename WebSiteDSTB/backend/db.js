// Database connection - PostgreSQL with Cloudinary images
require('dotenv').config();
const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
    rejectUnauthorized: false
  }
});

// Helper to normalize column names from lowercase back to camelCase for API responses
function normalizeRow(row) {
  if (!row) return row;
  const normalized = { ...row };
  if (normalized.createdat) {
    normalized.createdAt = normalized.createdat;
    delete normalized.createdat;
  }
  return normalized;
}

// Wrapper to make PostgreSQL work like SQLite for our queries
class Database {
  prepare(sql) {
    return {
      all: async (...params) => {
        try {
          // Convert SQLite placeholders (?) to PostgreSQL ($1, $2, ...)
          let psqlSql = sql;
          let paramIndex = 1;
          psqlSql = psqlSql.replace(/\?/g, () => `$${paramIndex++}`);
          
          const result = await pool.query(psqlSql, params);
          return result.rows.map(normalizeRow);
        } catch (error) {
          console.error('Database query error:', error);
          throw error;
        }
      },
      get: async (...params) => {
        try {
          // Convert SQLite placeholders (?) to PostgreSQL ($1, $2, ...)
          let psqlSql = sql;
          let paramIndex = 1;
          psqlSql = psqlSql.replace(/\?/g, () => `$${paramIndex++}`);
          
          const result = await pool.query(psqlSql, params);
          return normalizeRow(result.rows[0]);
        } catch (error) {
          console.error('Database query error:', error);
          throw error;
        }
      },
      run: async (...params) => {
        try {
          // Convert SQLite placeholders (?) to PostgreSQL ($1, $2, ...)
          let psqlSql = sql;
          let paramIndex = 1;
          psqlSql = psqlSql.replace(/\?/g, () => `$${paramIndex++}`);
          
          const result = await pool.query(psqlSql, params);
          return { changes: result.rowCount };
        } catch (error) {
          console.error('Database query error:', error);
          throw error;
        }
      }
    };
  }

  exec(sql) {
    return pool.query(sql);
  }
}

const db = new Database();

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

console.log('📦 Using PostgreSQL database with Cloudinary images');

module.exports = db;