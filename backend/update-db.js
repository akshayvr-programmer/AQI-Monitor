const Database = require('better-sqlite3');
const db = new Database('auth.db');

// Add expires_at column if it doesn't exist
try {
  db.prepare(`
    ALTER TABLE pending_users 
    ADD COLUMN expires_at DATETIME NOT NULL DEFAULT (datetime('now', '+30 minutes'))
  `).run();
  console.log('✅ Added expires_at column');
} catch (err) {
  if (err.message.includes('duplicate column')) {
    console.log('✅ Column already exists');
  } else {
    console.error('Error:', err.message);
  }
}

db.close();