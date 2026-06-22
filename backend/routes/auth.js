const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../config/db');
const { authenticate } = require('../middlewares/auth');

// Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, passwordHash } = req.body;
    
    // Check if user already exists
    const exists = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Default balance is 1000.00 to make simulated demo payments easy!
    // Every registered user starts as 'user' role
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, wallet_balance, is_verified, verification_code)
       VALUES ($1, $2, $3, 'user', 1000.00, FALSE, $4)
       RETURNING id, name, email, role, wallet_balance, is_verified`,
      [name, email, passwordHash, code]
    );

    console.log(`[Email Simulator] Verification code for ${email} is: ${code}`);

    res.status(201).json({
      ...result.rows[0],
      verificationCode: code // Send back code for convenient UI auto-fill or mock alerts
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify email
router.post('/verify', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) {
      return res.status(400).json({ error: 'Email and verification code are required' });
    }

    const result = await query('SELECT id, verification_code FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Email address not found' });
    }

    const user = result.rows[0];
    if (user.verification_code === code) {
      await query('UPDATE users SET is_verified = TRUE WHERE email = $1', [email]);
      res.json({ message: 'Email verified successfully!' });
    } else {
      res.status(400).json({ error: 'Invalid verification code' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { email, passwordHash } = req.body;
    
    const result = await query(
      'SELECT id, name, email, password_hash, role, wallet_balance, is_verified FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];
    if (user.password_hash !== passwordHash) {
      return res.status(400).json({ error: 'Invalid email or password' });
    }

    if (!user.is_verified) {
      return res.status(400).json({
        error: 'Email address not verified. Please verify your email first.',
        unverified: true
      });
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
