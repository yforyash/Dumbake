// routes/auth.js
// Authentication routes: register, verify, login, logout, profile, forgot-password, reset-password, subscribe

const express = require('express');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const router = express.Router();
const db = require('../config/db');
const { signToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const rateLimiter = require('../middleware/rateLimiter');
const { sendEmail } = require('../services/notificationService');
const { verifyToken } = require('../middleware/authGuard');

// Helper to generate 6‑digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * POST /register
 * Expected body: { name, email, passwordHash, role, phone }
 */
router.post('/register', rateLimiter.authLimiter, async (req, res, next) => {
  const { name, email, passwordHash, role, phone } = req.body;
  if (!name || !email || !passwordHash || !phone || !role) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const lowerEmail = email.toLowerCase();
    // Check if user already exists
    const checkUser = await db.query('SELECT id FROM users WHERE email = $1', [lowerEmail]);
    if (checkUser.rows.length > 0) {
      return res.status(400).json({ error: 'Email address already registered' });
    }

    const hashed = await bcrypt.hash(passwordHash, 12);
    const otp = generateOTP();
    
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role, wallet_balance, is_verified, verification_code, phone) 
       VALUES ($1, $2, $3, $4, 1000.00, false, $5, $6) RETURNING id, name, email, role`,
      [name, lowerEmail, hashed, role, otp, phone]
    );
    const user = result.rows[0];
    
    // Send OTP email
    try {
      await sendEmail(email, 'Your DumBake OTP', `Your verification code is: ${otp}`);
    } catch (mailErr) {
      logger.error('Failed to send verification email during signup', mailErr);
    }
    
    res.status(201).json({ message: 'User created, OTP sent to email', userId: user.id });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /verify
 * Expected body: { email, code }
 */
router.post('/verify', async (req, res, next) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required' });
  }
  try {
    const lowerEmail = email.toLowerCase();
    const result = await db.query('SELECT id, verification_code FROM users WHERE email = $1', [lowerEmail]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Email not found' });
    }
    const user = result.rows[0];
    const isMock = db.getIsMock();
    if (user.verification_code === code || isMock) {
      await db.query('UPDATE users SET is_verified = true, verification_code = null WHERE id = $1', [user.id]);
      
      const orderCountRes = await db.query('SELECT COUNT(*)::integer FROM orders WHERE user_id = $1', [user.id]);
      const orderCount = parseInt(orderCountRes.rows[0]?.count || 0);

      // Fetch verified user details
      const userRes = await db.query('SELECT id, name, email, role, wallet_balance, phone FROM users WHERE id = $1', [user.id]);
      const verifiedUser = userRes.rows[0];

      // Sign JWT and set cookie
      const token = signToken({ id: verifiedUser.id, role: verifiedUser.role, email: verifiedUser.email });
      res.cookie('auth_token', token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });

      res.json({
        message: 'Email verified successfully!',
        user: {
          id: verifiedUser.id,
          name: verifiedUser.name,
          email: verifiedUser.email,
          role: verifiedUser.role,
          wallet_balance: parseFloat(verifiedUser.wallet_balance),
          phone: verifiedUser.phone,
          order_count: orderCount
        }
      });
    } else {
      res.status(400).json({ error: 'Invalid verification code' });
    }
  } catch (err) {
    next(err);
  }
});

/**
 * POST /login
 * Expected body: { email, passwordHash }
 */
router.post('/login', rateLimiter.authLimiter, async (req, res, next) => {
  const { email, passwordHash } = req.body;
  if (!email || !passwordHash) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const lowerEmail = email.toLowerCase();
    const result = await db.query('SELECT * FROM users WHERE email = $1', [lowerEmail]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });
    
    // Compare password hashes
    const match = await bcrypt.compare(passwordHash, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    if (!user.is_verified) {
      const code = generateOTP();
      await db.query('UPDATE users SET verification_code = $1 WHERE email = $2', [code, lowerEmail]);
      try {
        await sendEmail(email, 'Your DumBake OTP', `Your verification code is: ${code}`);
      } catch (mailErr) {
        logger.error('Failed to send verification email during login', mailErr);
      }
      return res.status(400).json({
        error: 'Email address not verified. Please verify your email/phone first.',
        unverified: true,
        verificationCode: code
      });
    }

    const orderCountRes = await db.query('SELECT COUNT(*)::integer FROM orders WHERE user_id = $1', [user.id]);
    const orderCount = parseInt(orderCountRes.rows[0]?.count || 0);

    // Create JWT payload
    const token = signToken({ id: user.id, role: user.role, email: user.email });
    // Set httpOnly cookie
    res.cookie('auth_token', token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
    
    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      wallet_balance: parseFloat(user.wallet_balance),
      phone: user.phone,
      order_count: orderCount
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /logout
 */
router.post('/logout', (req, res) => {
  res.clearCookie('auth_token');
  res.json({ message: 'Logged out' });
});

/**
 * GET /profile – returns basic profile (protected)
 */
router.get('/profile', verifyToken, async (req, res, next) => {
  if (req.user.role === 'anonymous') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const orderCountRes = await db.query('SELECT COUNT(*)::integer FROM orders WHERE user_id = $1', [req.user.id]);
    const orderCount = parseInt(orderCountRes.rows[0]?.count || 0);
    res.json({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      wallet_balance: parseFloat(req.user.wallet_balance),
      phone: req.user.phone,
      order_count: orderCount
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /forgot-password
 */
router.post('/forgot-password', async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  try {
    const lowerEmail = email.toLowerCase();
    const result = await db.query('SELECT id FROM users WHERE email = $1', [lowerEmail]);
    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Email address not found' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    await db.query(
      `INSERT INTO password_resets (email, token, expires_at)
       VALUES ($1, $2, $3)
       ON CONFLICT (email) DO UPDATE SET token = EXCLUDED.token, expires_at = EXCLUDED.expires_at`, 
      [lowerEmail, token, expiresAt]
    );
    
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/login?token=${token}&email=${encodeURIComponent(email)}`;

    try {
      await sendEmail(email, 'DumBake Password Reset', `<p>You requested a password reset. Please click the link below to reset your password:</p><p><a href="${resetLink}">${resetLink}</a></p>`);
    } catch (mailErr) {
      logger.error('Failed to send reset link email', mailErr);
    }

    res.json({ 
      message: 'Password reset link generated successfully.',
      link: resetLink 
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /reset-password
 */
router.post('/reset-password', async (req, res, next) => {
  const { email, token, newPasswordHash } = req.body;
  if (!email || !token || !newPasswordHash) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const lowerEmail = email.toLowerCase();
    const resetResult = await db.query(
      'SELECT id FROM password_resets WHERE email = $1 AND token = $2 AND expires_at > NOW()',
      [lowerEmail, token]
    );

    if (resetResult.rows.length === 0) {
      return res.status(400).json({ error: 'Expired or invalid token' });
    }

    const bcryptHash = await bcrypt.hash(newPasswordHash, 12);
    await db.query('UPDATE users SET password_hash = $1 WHERE email = $2', [bcryptHash, lowerEmail]);
    await db.query('DELETE FROM password_resets WHERE email = $1', [lowerEmail]);
    
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /subscribe
 */
router.post('/subscribe', async (req, res, next) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  try {
    const lowerEmail = email.toLowerCase();
    await db.query(
      `INSERT INTO subscribers (email) VALUES ($1) ON CONFLICT (email) DO NOTHING`,
      [lowerEmail]
    );
    try {
      await sendEmail(email, 'Subscribed to DumBake Newsletter!', `<p>Thank you for subscribing to our newsletter! Get ready for fresh artisan bakery deals.</p>`);
    } catch (mailErr) {
      logger.error('Failed to send subscription confirmation email', mailErr);
    }
    res.status(201).json({ message: 'Subscribed successfully' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
