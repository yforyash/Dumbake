const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { query } = require('../config/db');
const { authenticate } = require('../middlewares/auth');
const { sendVerificationCode, sendNewsletterWelcome } = require('../utils/notifications');

// Register user
router.post('/register', async (req, res) => {
  try {
    const { name, email, passwordHash, phone } = req.body;
    
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@dumbake.com';
    const role = (email.toLowerCase() === adminEmail.toLowerCase()) ? 'admin' : 'user';

    // Check if user already exists
    const exists = await query('SELECT id, is_verified FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      const existingUser = exists.rows[0];
      if (existingUser.is_verified) {
        return res.status(400).json({ error: 'Email already registered' });
      } else {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const result = await query(
          `UPDATE users 
           SET name = $1, password_hash = $2, verification_code = $3, role = $4, phone = $5
           WHERE email = $6 
           RETURNING id, name, email, role, wallet_balance, is_verified, phone`,
          [name, passwordHash, code, role, phone || null, email]
        );
        await sendVerificationCode(email, phone || null, code);
        return res.status(201).json({
          ...result.rows[0]
        });
      }
    }

    // Generate 6-digit verification code
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Default balance is 1000.00
    const result = await query(
      `INSERT INTO users (name, email, password_hash, role, wallet_balance, is_verified, verification_code, phone)
       VALUES ($1, $2, $3, $4, 1000.00, FALSE, $5, $6)
       RETURNING id, name, email, role, wallet_balance, is_verified, phone`,
      [name, email, passwordHash, role, code, phone || null]
    );

    // Send verification code (email + SMS if phone is provided)
    await sendVerificationCode(email, phone || null, code);

    res.status(201).json({
      ...result.rows[0]
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

    const { pool } = require('../config/db');
    const isMock = !pool;

    if (isMock) {
      // In serverless mock sandbox fallback, auto-create the user if missing due to container reset
      const { mockState } = require('../config/db'); // wait, let's check if db.js exports mockState
      // Let's import mockState if needed, or we can just access it. Let's make sure db.js exports it or we can resolve it.
      // Wait, let's look at db.js exports: module.exports = { pool, query };
      // Ah! db.js does not export mockState!
      // Let's see: we can query the database or check db.js.
      // Wait! Since query() handles everything in db.js, we can just run queries!
      // In db.js, query('SELECT ...') returns rows from mockState.users.
      // And query('UPDATE users ...') updates mockState.users!
      // So we can just run query() commands to select and update, and it will automatically handle it!
      // This is much cleaner!
    }

    const result = await query('SELECT id, name, email, role, wallet_balance, verification_code FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Email address not found' });
    }

    const user = result.rows[0];
    if (user.verification_code === code) {
      await query('UPDATE users SET is_verified = TRUE WHERE email = $1', [email]);
      
      const userResult = await query('SELECT id, name, email, role, wallet_balance FROM users WHERE email = $1', [email]);
      const orderCountRes = await query('SELECT COUNT(*)::integer FROM orders WHERE user_id = $1', [userResult.rows[0].id]);
      const orderCount = parseInt(orderCountRes.rows[0]?.count || 0);
      res.json({
        message: 'Email verified successfully!',
        user: {
          ...userResult.rows[0],
          order_count: orderCount
        }
      });
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
      'SELECT id, name, email, password_hash, role, wallet_balance, is_verified, phone FROM users WHERE email = $1',
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
      const code = Math.floor(100000 + Math.random() * 900000).toString();
      await query('UPDATE users SET verification_code = $1 WHERE email = $2', [code, email]);
      await sendVerificationCode(email, user.phone, code);
      return res.status(400).json({
        error: 'Email address not verified. Please verify your email/phone first.',
        unverified: true
      });
    }
    
    const orderCountRes = await query('SELECT COUNT(*)::integer FROM orders WHERE user_id = $1', [user.id]);
    const orderCount = parseInt(orderCountRes.rows[0]?.count || 0);

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      wallet_balance: user.wallet_balance,
      order_count: orderCount
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
router.get('/profile', authenticate, async (req, res) => {
  if (req.user.role === 'anonymous') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const orderCountRes = await query('SELECT COUNT(*)::integer FROM orders WHERE user_id = $1', [req.user.id]);
    const orderCount = parseInt(orderCountRes.rows[0]?.count || 0);
    res.json({
      ...req.user,
      order_count: orderCount
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

    // Send newsletter subscription confirmation email
    await sendNewsletterSubscriptionEmail(email);

    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Send/Resend OTP (API-based OTP generation)
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address format.' });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // Check if user exists
    const exists = await query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (exists.rows.length > 0) {
      await query('UPDATE users SET verification_code = $1 WHERE email = $2', [code, email]);
    } else {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@dumbake.com';
      const role = (email.toLowerCase() === adminEmail.toLowerCase()) ? 'admin' : 'user';
      
      await query(
        `INSERT INTO users (name, email, password_hash, role, wallet_balance, is_verified, verification_code)
         VALUES ($1, $2, 'stub_hash', $3, 1000.00, FALSE, $4)`,
        [email.split('@')[0], email, role, code]
      );
    }

    // Send the verification OTP email
    await sendVerificationEmail(email, code);

    res.json({ message: 'Verification OTP sent successfully to ' + email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
