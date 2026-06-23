const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticate, requireRole } = require('../middlewares/auth');
const { sendBulkEnquiryEmail } = require('../utils/mailer');

// Create order (Customer/User only)
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'Please sign in to place an order.' });
    }

    const { items, totalPrice, deliveryType, address, paymentMethod, customerName, customerPhone, latitude, longitude } = req.body;

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

    // 2. Calculate dynamic discount and process payment (wallet-based simulation)
    const orderCountRes = await query('SELECT COUNT(*)::integer FROM orders WHERE user_id = $1', [userId]);
    const orderCount = parseInt(orderCountRes.rows[0]?.count || 0);

    let discountPercentage = 0;
    if (orderCount === 0) {
      discountPercentage = 10;
    } else if (orderCount === 4) {
      discountPercentage = 30;
    }

    let calculatedSubtotal = 0;
    for (const item of items) {
      const itemRes = await query('SELECT price FROM bakery_items WHERE id = $1', [item.id]);
      if (itemRes.rows.length === 0) {
        return res.status(404).json({ error: `Item ${item.name} not found.` });
      }
      const dbBasePrice = parseFloat(itemRes.rows[0].price);
      let expectedPrice = dbBasePrice;
      if (item.customizations && item.customizations.weight === '1 Kg') {
        expectedPrice += 400.00;
      }
      calculatedSubtotal += expectedPrice * item.quantity;
    }

    const deliveryCharge = deliveryType === 'Delivery' ? 40 : 0;
    const discountAmount = calculatedSubtotal * (discountPercentage / 100);
    const finalTotalPrice = parseFloat((calculatedSubtotal - discountAmount + deliveryCharge).toFixed(2));

    let paymentStatus = 'Pending';
    if (paymentMethod === 'Wallet') {
      if (parseFloat(req.user.wallet_balance) < finalTotalPrice) {
        return res.status(400).json({ error: 'Insufficient wallet balance for this simulated transaction.' });
      }
      
      // Deduct wallet balance
      await query('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2', [finalTotalPrice, userId]);
      paymentStatus = 'Paid';
    } else if (paymentMethod === 'Card' || paymentMethod === 'UPI') {
      // Card / UPI payments are simulated as Paid without wallet deductions
      paymentStatus = 'Paid';
    } else {
      // COD remains Pending without wallet deductions
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
      `INSERT INTO orders (user_id, items, total_price, status, delivery_type, address, payment_method, payment_status, customer_name, customer_phone, latitude, longitude)
       VALUES ($1, $2, $3, 'Placed', $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        userId,
        JSON.stringify(items),
        finalTotalPrice,
        deliveryType,
        address || 'Pickup Counter',
        paymentMethod,
        paymentStatus,
        customerName,
        customerPhone,
        latitude ? parseFloat(latitude) : null,
        longitude ? parseFloat(longitude) : null
      ]
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
    if (req.user.role === 'admin') {
      // Admin sees all orders
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

// Update order status (Admin only)
router.put('/:id/status', authenticate, requireRole(['admin']), async (req, res) => {
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

// Submit bulk order enquiry
router.post('/bulk-enquiry', async (req, res) => {
  try {
    const { name, email, phone, eventDate, quantity, notes } = req.body;
    if (!name || !email || !phone || !eventDate || !quantity) {
      return res.status(400).json({ error: 'All fields except notes are required.' });
    }

    const result = await query(
      `INSERT INTO bulk_enquiries (name, email, phone, event_date, quantity, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, email, phone, eventDate, parseInt(quantity), notes || '']
    );

    // Send confirmation email to the client
    await sendBulkEnquiryEmail(email, name, parseInt(quantity), eventDate);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all bulk enquiries (Admin only)
router.get('/bulk-enquiries', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const result = await query('SELECT * FROM bulk_enquiries ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
