// Database Adapter - Tự động switch giữa SQLite (dev) và PostgreSQL (production)
const path = require('path');
const { Pool } = require('pg');
const Database = require('better-sqlite3');

// Kiểm tra môi trường
const isProduction = process.env.NODE_ENV === 'production';
const usePostgres = process.env.DATABASE_URL || isProduction;

let db;
let dbType;

if (usePostgres) {
  // PostgreSQL cho production
  console.log('🐘 Using PostgreSQL database');
  dbType = 'postgres';
  
  db = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : {
      rejectUnauthorized: false
    }
  });
  
  // Test connection
  db.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ PostgreSQL connection error:', err.message);
    } else {
      console.log('✅ PostgreSQL connected successfully');
    }
  });
  
} else {
  // SQLite cho development
  console.log('📦 Using SQLite database (development mode)');
  dbType = 'sqlite';
  
  const dbPath = path.join(__dirname, 'taybac.db');
  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
}

// Helper functions để làm việc với cả 2 loại DB
const query = async (sql, params = []) => {
  if (dbType === 'postgres') {
    // PostgreSQL sử dụng $1, $2, $3...
    const pgSql = sql.replace(/\?/g, (match, index) => {
      const paramIndex = sql.substring(0, sql.indexOf(match)).split('?').length;
      return `$${paramIndex}`;
    });
    
    try {
      const result = await db.query(pgSql, params);
      return result.rows;
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  } else {
    // SQLite
    try {
      const stmt = db.prepare(sql);
      return stmt.all(...params);
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }
};

const queryOne = async (sql, params = []) => {
  const rows = await query(sql, params);
  return rows[0] || null;
};

const run = async (sql, params = []) => {
  if (dbType === 'postgres') {
    const pgSql = sql.replace(/\?/g, (match, index) => {
      const paramIndex = sql.substring(0, sql.indexOf(match)).split('?').length;
      return `$${paramIndex}`;
    });
    
    try {
      const result = await db.query(pgSql, params);
      return {
        lastID: result.rows[0]?.id,
        changes: result.rowCount
      };
    } catch (error) {
      console.error('Run error:', error);
      throw error;
    }
  } else {
    try {
      const stmt = db.prepare(sql);
      return stmt.run(...params);
    } catch (error) {
      console.error('Run error:', error);
      throw error;
    }
  }
};

module.exports = {
  db,
  dbType,
  query,
  queryOne,
  run
};
