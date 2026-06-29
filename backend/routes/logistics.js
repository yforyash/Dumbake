// routes/logistics.js
// Logistics endpoints for kitchen order readiness, rider location updates, and order tracking

const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authGuard');
const { isWithinServiceArea } = require('../services/geofenceService');
const { emitKitchenAlarm } = require('../services/notificationService');
const db = require('../config/db');
const logger = require('../utils/logger');

/**
 * POST /order/:id/ready
 * Kitchen marks an order as ready – triggers alarm for riders/admins
 */
router.post('/order/:id/ready', verifyToken, async (req, res, next) => {
  const orderId = req.params.id;
  // Ensure only kitchen role can call this endpoint
  if (req.user.role !== 'KitchenPartner') {
    return res.status(403).json({ error: 'Forbidden: kitchen role required' });
  }
  try {
    await db.query('UPDATE orders SET status=$1 WHERE id=$2', ['READY', orderId]);
    // Emit real‑time alarm via Socket.io (io instance will be attached to req.app)
    const io = req.app.get('io');
    emitKitchenAlarm(io, orderId);
    res.json({ message: 'Order marked ready and alarm emitted' });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /rider/location
 * Rider pushes GPS coordinates every 10 seconds
 */
router.post('/rider/location', verifyToken, async (req, res, next) => {
  const { lat, lng } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }
  try {
    // Update rider's latest location (optional persistence)
    await db.query(
      `INSERT INTO rider_locations (rider_id, lat, lng, updated_at) VALUES ($1,$2,$3,NOW())
       ON CONFLICT (rider_id) DO UPDATE SET lat=$2, lng=$3, updated_at=NOW()`,
      [req.user.id, lat, lng]
    );
    // Broadcast to interested clients via Socket.io
    const io = req.app.get('io');
    io.emit('rider:update', { riderId: req.user.id, lat, lng });
    res.json({ message: 'Location updated' });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /order/:id/tracking
 * Returns latest rider location for a given order (if assigned)
 */
router.get('/order/:id/tracking', verifyToken, async (req, res, next) => {
  const orderId = req.params.id;
  try {
    const result = await db.query(
      `SELECT rl.rider_id, rl.lat, rl.lng, rl.updated_at
       FROM orders o
       JOIN rider_assignments ra ON ra.order_id = o.id
       JOIN rider_locations rl ON rl.rider_id = ra.rider_id
       WHERE o.id = $1`,
      [orderId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'No rider assigned or location missing' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /checkout/validate-address
 * Validate that a delivery address lies within the geofence radius.
 * Expects { lat, lng } in body.
 */
router.post('/checkout/validate-address', verifyToken, (req, res) => {
  const { lat, lng } = req.body;
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }
  const inside = isWithinServiceArea(lat, lng);
  if (!inside) {
    return res.status(400).json({ error: 'Delivery address outside service area' });
  }
  res.json({ message: 'Address within service area' });
});

module.exports = router;
