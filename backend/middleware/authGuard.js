// middleware/authGuard.js
// JWT verification and role‑based access control

const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'dumbake_fallback_secret_key_123';

/**
 * Unified authentication middleware.
 * Checks for JWT cookie first, then falls back to x-user-id header.
 */
async function verifyToken(req, res, next) {
  const token = req.cookies?.auth_token;
  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      // Fetch fresh details from DB
      const result = await db.query('SELECT id, name, email, role, wallet_balance, phone FROM users WHERE id = $1', [decoded.id]);
      if (result.rows.length > 0) {
        req.user = result.rows[0];
        return next();
      }
    } catch (err) {
      logger.warn('Invalid JWT cookie, falling back to header', err.message);
    }
  }

  // Fallback to x-user-id header
  const userId = req.headers['x-user-id'];
  if (userId && userId !== 'Anonymous') {
    try {
      const result = await db.query('SELECT id, name, email, role, wallet_balance, phone FROM users WHERE id = $1', [parseInt(userId)]);
      if (result.rows.length > 0) {
        req.user = result.rows[0];
        return next();
      }
    } catch (err) {
      logger.error('Failed to authenticate via x-user-id header', err.message);
    }
  }

  // Fallback to anonymous
  req.user = { id: null, role: 'anonymous' };
  next();
}

/**
 * Role‑based guard – pass allowed roles array
 */
function requireRoles(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || req.user.role === 'anonymous') {
      return res.status(401).json({ error: 'Unauthenticated. Sign-in required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden: insufficient role' });
    }
    next();
  };
}

module.exports = {
  verifyToken,
  requireRoles,
};
