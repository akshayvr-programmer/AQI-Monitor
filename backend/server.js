const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { v4: uuid } = require('uuid');
const db = require('./db'); // Your database file

const app = express();

// CORS - Allow requests from your React app
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'],
  credentials: true
}));

app.use(express.json());

const SECRET = 'supersecretkey';

/* ===================== HEALTH CHECK ===================== */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/* ===================== LOGIN ===================== */
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password required' });
  }

  try {
    const user = db
      .prepare('SELECT * FROM users WHERE email = ?')
      .get(email);

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      SECRET,
      { expiresIn: '1h' }
    );

    res.json({
      success: true,
      token,
      role: user.role,
      redirect: '/gov-dashboard'
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ===================== SIGNUP STEP 1 ===================== */
app.post('/api/signup/start', (req, res) => {
  const { email } = req.body;

  console.log('Signup request for:', email);

  if (!email) {
    return res.status(400).json({ message: 'Email required' });
  }

  if (!email.endsWith('@gov.in')) {
    return res.status(400).json({ message: 'Invalid government email. Must end with @gov.in' });
  }

  try {
    // Check if user already exists
    const exists = db
      .prepare('SELECT 1 FROM users WHERE email = ?')
      .get(email);

    if (exists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Check for existing pending signup
    const pendingExists = db
      .prepare('SELECT 1 FROM pending_users WHERE email = ?')
      .get(email);

    if (pendingExists) {
      db.prepare('DELETE FROM pending_users WHERE email = ?').run(email);
    }

    const token = uuid();
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();

    db.prepare(
      'INSERT INTO pending_users (token, email, expires_at) VALUES (?, ?, ?)'
    ).run(token, email, expiresAt);

    console.log('✅ Signup token created:', token);

    res.json({
      success: true,
      token,
      redirect: `/create-password?token=${token}`
    });
  } catch (err) {
    console.error('Signup start error:', err);
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

/* ===================== VERIFY TOKEN ===================== */
app.get('/api/verify-token/:token', (req, res) => {
  const { token } = req.params;

  try {
    const pending = db
      .prepare('SELECT * FROM pending_users WHERE token = ?')
      .get(token);

    if (!pending) {
      return res.status(400).json({ valid: false, message: 'Invalid token' });
    }

    const now = new Date();
    const expiresAt = new Date(pending.expires_at);
    
    if (now > expiresAt) {
      db.prepare('DELETE FROM pending_users WHERE token = ?').run(token);
      return res.status(400).json({ valid: false, message: 'Token expired' });
    }

    res.json({ valid: true, email: pending.email });
  } catch (err) {
    console.error('Token verification error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

/* ===================== SIGNUP STEP 2 ===================== */
app.post('/api/signup/complete', async (req, res) => {
  const { token, password } = req.body;

  console.log('Complete signup for token:', token);

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and password required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' });
  }

  // Validate password strength
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
    return res.status(400).json({ 
      message: 'Password must contain uppercase, lowercase, number, and special character' 
    });
  }

  try {
    const pending = db
      .prepare('SELECT * FROM pending_users WHERE token = ?')
      .get(token);

    if (!pending) {
      return res.status(400).json({ message: 'Invalid or expired signup token' });
    }

    // Check expiration
    const now = new Date();
    const expiresAt = new Date(pending.expires_at);
    
    if (now > expiresAt) {
      db.prepare('DELETE FROM pending_users WHERE token = ?').run(token);
      return res.status(400).json({ message: 'Signup token has expired' });
    }

    // Check if user exists
    const userExists = db
      .prepare('SELECT 1 FROM users WHERE email = ?')
      .get(pending.email);

    if (userExists) {
      db.prepare('DELETE FROM pending_users WHERE token = ?').run(token);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const hash = await bcrypt.hash(password, 10);

    db.prepare(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)'
    ).run(pending.email, hash, 'employee');

    // Clean up pending
    db.prepare('DELETE FROM pending_users WHERE token = ?').run(token);

    console.log('✅ User created:', pending.email);

    res.json({ 
      success: true,
      message: 'Account created successfully',
      redirect: '/'
    });
  } catch (err) {
    console.error('Signup complete error:', err);
    
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    res.status(500).json({ message: 'Server error: ' + err.message });
  }
});

/* ===================== CLEANUP EXPIRED TOKENS ===================== */
setInterval(() => {
  try {
    const now = new Date().toISOString();
    const result = db.prepare('DELETE FROM pending_users WHERE expires_at < ?').run(now);
    if (result.changes > 0) {
      console.log(`🧹 Cleaned up ${result.changes} expired tokens`);
    }
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}, 60 * 60 * 1000);

/* ===================== ERROR HANDLER ===================== */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal server error' });
});

/* ===================== START SERVER ===================== */
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════╗
║   🚀 Backend Server Running           ║
║   📍 http://localhost:${PORT}           ║
║   📊 Database: auth.db                ║
║   ✅ Ready to accept requests         ║
╚════════════════════════════════════════╝
  `);
});

module.exports = app;