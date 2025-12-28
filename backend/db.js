const Database = require('better-sqlite3');

const db = new Database('auth.db');

// Users table
db.prepare(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'employee',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`).run();

// Pending signup table
db.prepare(`
  CREATE TABLE IF NOT EXISTS pending_users (
    token TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL
  )
`).run();

// Create indexes for better query performance
db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
`).run();

db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_pending_users_email ON pending_users(email)
`).run();

db.prepare(`
  CREATE INDEX IF NOT EXISTS idx_pending_users_expires ON pending_users(expires_at)
`).run();

console.log('Database initialized successfully');

module.exports = db;