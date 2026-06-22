const { query } = require('../config/db');

async function authenticate(req, res, next) {
  const userId = req.headers['x-user-id'];
  if (!userId || userId === 'Anonymous') {
    req.user = { id: null, role: 'anonymous' };
    return next();
  }

  try {
    const result = await query('SELECT id, name, email, role, wallet_balance FROM users WHERE id = $1', [parseInt(userId)]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid user session' });
    }
    req.user = result.rows[0];
    next();
  } catch (err) {
    res.status(500).json({ error: 'Auth middleware error: ' + err.message });
  }
}

function requireRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'Unauthorized. Sign-in required.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Forbidden. Insufficient permissions.' });
    }
    next();
  };
}

module.exports = { authenticate, requireRole };
