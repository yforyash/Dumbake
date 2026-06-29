// utils/jwt.js
// Helper functions for signing and verifying JWT tokens

const jwt = require('jsonwebtoken');
const logger = require('./logger');

const JWT_SECRET = process.env.JWT_SECRET || 'dumbake_fallback_secret_key_123';

/**
 * Sign a payload into a JWT token
 * @param {Object} payload - token payload (e.g., {id, email, role})
 * @param {Object} [options] - jwt sign options (expiresIn etc.)
 * @returns {string} signed token
 */
function signToken(payload, options = { expiresIn: '7d' }) {
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Verify a JWT token and return the decoded payload
 * @param {string} token - JWT token string
 * @returns {Object} decoded payload
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    logger.warn('JWT verification failed', err.message);
    throw err;
  }
}

module.exports = {
  signToken,
  verifyToken,
};
