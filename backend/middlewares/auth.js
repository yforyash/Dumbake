// middlewares/auth.js
// Legacy auth wrapper to route to unified authGuard middleware

const { verifyToken, requireRoles } = require('../middleware/authGuard');

module.exports = {
  authenticate: verifyToken,
  requireRole: requireRoles,
};
