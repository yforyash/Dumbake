// middleware/rateLimiter.js
// Simple rate limiting for auth and payment routes using express-rate-limit

const rateLimit = require('express-rate-limit');

// General limiter – 100 requests per 15 minutes per IP
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Stricter limiter for auth routes – 20 requests per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many authentication attempts, please wait.' },
});

module.exports = {
  generalLimiter,
  authLimiter,
};
