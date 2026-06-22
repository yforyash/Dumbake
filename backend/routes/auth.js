const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../config/db');
const { authenticate } = require('../middlewares/auth');

// Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, passwordHash, role } = req.body;
    
    // Check if user already exists
    const exists = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Default balance is 1000.00 to make simulated demo payments easy!
    const userRole = role || 'user';
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, wallet_balance)
       VALUES ($1, $2, $3, $4, 1000.00)
       RETURNING id, name, email, role, wallet_balance`,
      [name, email, passwordHash, userRole]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, passwordHash } = req.body;
    
    const result = await query(
      'SELECT id, name, email, password_hash, role, wallet_balance FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    if (user.password_hash !== passwordHash) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      wallet_balance: user.wallet_balance
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    const result = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Email address not found' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await query(
      `INSERT INTO password_resets (email, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`, // simplified, delete old resets would be cleaner but this works
      [email, token, expiresAt]
    );
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/login?token=${token}&email=${encodeURIComponent(email)}`;
    
    // Simulate sending email: return resetLink directly for testing!
    res.json({ 
      message: 'Password reset link generated successfully.',
      link: resetLink 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
  try {
    const { email, token, newPasswordHash } = req.body;
    
    // Check if token exists and is valid
    const resetResult = await query(
      'SELECT id FROM password_resets WHERE email = $1 AND token = $2 AND expires_at > NOW()',
      [email, token]
    );

    if (resetResult.rows.length === 0) {
      return res.status(400).json({ error: 'Expired or invalid token' });
    }

    // Update password
    await query('UPDATE users SET password_hash = $1 WHERE email = $2', [newPasswordHash, email]);
    
    // Delete password reset token
    await query('DELETE FROM password_resets WHERE email = $1', [email]);
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get user profile
router.get('/profile', authenticate, (req, res) => {
  if (req.user.role === 'anonymous') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json(req.user);
});

// Newsletter subscription
router.post('/subscribe', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }
    
    await query(
      `INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
      [email]
    );

    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
