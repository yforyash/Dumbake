const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticate, requireRole } = require('../middlewares/auth');

// Create order (Customer/User only)
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'Please sign in to place an order.' });
    }

    const { items, totalPrice, deliveryType, address, paymentMethod, customerName, customerPhone } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in the cart.' });
    }

    // 1. Verify item stock quantities
    for (const item of items) {
      const itemRes = await query('SELECT stock_quantity, status FROM bakery_items WHERE id = $1', [item.id]);
      if (itemRes.rows.length === 0) {
        return res.status(404).json({ error: `Item ${item.name} not found.` });
      }
      const itemData = itemRes.rows[0];
      if (itemData.status !== 'available' || itemData.stock_quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${item.name}. Only ${itemData.stock_quantity} left.` });
      }
    }

    // 2. Process payment (if wallet-based payment simulation)
    let paymentStatus = 'Pending';
    if (paymentMethod === 'Card' || paymentMethod === 'UPI') {
      // Simulate real-time payment gateway logic
      // In production, verify transaction from Stripe/Razorpay
      // Demos deduct from user wallet balance
      if (parseFloat(req.user.wallet_balance) < parseFloat(totalPrice)) {
        return res.status(400).json({ error: 'Insufficient wallet balance for this simulated transaction.' });
      }
      
      // Deduct wallet balance
      await query('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2', [parseFloat(totalPrice), userId]);
      paymentStatus = 'Paid';
    } else {
      // COD remains Pending
      paymentStatus = 'Pending';
    }

    // 3. Decrement stock quantities
    for (const item of items) {
      await query(
        `UPDATE bakery_items
         SET stock_quantity = stock_quantity - $1,
             status = CASE WHEN stock_quantity - $1 = 0 THEN 'out_of_stock' ELSE status END
         WHERE id = $2`,
        [item.quantity, item.id]
      );
    }

    // 4. Save order to database
    const orderRes = await query(
      `INSERT INTO orders (user_id, items, total_price, status, delivery_type, address, payment_method, payment_status, customer_name, customer_phone)
       VALUES ($1, $2, $3, 'Placed', $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [userId, JSON.stringify(items), parseFloat(totalPrice), deliveryType, address || 'Pickup Counter', paymentMethod, paymentStatus, customerName, customerPhone]
    );

    res.status(201).json(orderRes.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get orders (Authenticated only)
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'anonymous') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let result;
    if (req.user.role === 'admin' || req.user.role === 'bakery_owner') {
      // Admin and owner see all orders
      result = await query('SELECT * FROM orders ORDER BY created_at DESC');
    } else {
      // Regular customer sees only their own orders
      result = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    }
    
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update order status (Admin & Owner only)
router.put('/:id/status', authenticate, requireRole(['admin', 'bakery_owner']), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status } = req.body;

    const check = await query('SELECT id, payment_method, total_price, user_id FROM orders WHERE id = $1', [parseInt(id)]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = check.rows[0];
    
    // Update query
    let updateSql = 'UPDATE orders SET status = COALESCE($1, status)';
    const params = [status];
    let paramIndex = 2;

    if (payment_status) {
      updateSql += `, payment_status = $${paramIndex}`;
      params.push(payment_status);
      paramIndex++;

      // If status is updated to Paid (e.g. COD collected), check wallet deductions if applicable (none for COD, but clean representation)
    }

    updateSql += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(parseInt(id));

    const result = await query(updateSql, params);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
