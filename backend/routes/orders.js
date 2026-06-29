const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticate, requireRole } = require('../middlewares/auth');
const { sendBulkEnquiryEmail } = require('../utils/mailer');
const { sendCheckoutReceipt, sendOrderStatusAlert, sendBulkEnquiryAlert } = require('../utils/notifications');

router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'Please sign in to place an order.' });
    }

    const { items, totalPrice, deliveryType, address, paymentMethod, customerName, customerPhone, latitude, longitude, payWithWallet } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in the cart.' });
    }

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
    const userWalletBalance = parseFloat(req.user.wallet_balance || 0);
    
    let walletDeducted = 0;
    let remainingPayable = finalTotalPrice;

    if (payWithWallet) {
      if (userWalletBalance >= finalTotalPrice) {
        walletDeducted = finalTotalPrice;
        remainingPayable = 0;
      } else {
        walletDeducted = userWalletBalance;
        remainingPayable = parseFloat((finalTotalPrice - walletDeducted).toFixed(2));
      }
    }

    if (walletDeducted > 0) {
      await query('UPDATE users SET wallet_balance = wallet_balance - $1 WHERE id = $2', [walletDeducted, userId]);
    }

    if (remainingPayable === 0) {
      paymentStatus = 'Paid';
    } else {
      const secondaryMethod = paymentMethod.includes(' + ') ? paymentMethod.split(' + ')[1] : paymentMethod;
      if (secondaryMethod === 'Card' || secondaryMethod === 'UPI') {
        paymentStatus = 'Paid';
      } else {
        paymentStatus = 'Pending';
      }
    }

    for (const item of items) {
      await query(
        `UPDATE bakery_items
         SET stock_quantity = stock_quantity - $1,
             status = CASE WHEN stock_quantity - $1 = 0 THEN 'out_of_stock' ELSE status END
         WHERE id = $2`,
        [item.quantity, item.id]
      );
    }

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

    const order = orderRes.rows[0];

    sendCheckoutReceipt({
      ...order,
      customer_email: req.user.email
    }).catch(err => {
      console.error('[Notifications] Failed to send checkout receipt:', err.message);
    });

    res.status(201).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'anonymous') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let result;
    if (req.user.role === 'admin') {
      result = await query('SELECT * FROM orders ORDER BY created_at DESC');
    } else {
      result = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/history', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'anonymous') {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const result = await query('SELECT * FROM orders WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const handleStatusUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, payment_status } = req.body;

    const check = await query('SELECT id, payment_method, total_price, user_id FROM orders WHERE id = $1', [parseInt(id)]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = check.rows[0];

    let updateSql = 'UPDATE orders SET status = COALESCE($1, status)';
    const params = [status];
    let paramIndex = 2;

    if (payment_status) {
      updateSql += `, payment_status = $${paramIndex}`;
      params.push(payment_status);
      paramIndex++;
    }

    updateSql += ` WHERE id = $${paramIndex} RETURNING *`;
    params.push(parseInt(id));

    const result = await query(updateSql, params);
    const updatedOrder = result.rows[0];

    if (updatedOrder && status) {
      sendOrderStatusAlert(updatedOrder, status).catch(err => {
        console.error('[Notifications] Failed to send status alert:', err.message);
      });
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

router.put('/:id/status', authenticate, requireRole(['admin']), handleStatusUpdate);
router.put('/:id', authenticate, requireRole(['admin']), handleStatusUpdate);

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

    await sendBulkEnquiryEmail(email, name, parseInt(quantity), eventDate);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/bulk-enquiries', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const result = await query('SELECT * FROM bulk_enquiries ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/rider-location', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude } = req.body;
    if (latitude === undefined || longitude === undefined) {
      return res.status(400).json({ error: 'Latitude and longitude coordinates are required.' });
    }
    const result = await query(
      'UPDATE orders SET rider_latitude = $1, rider_longitude = $2 WHERE id = $3 RETURNING *',
      [parseFloat(latitude), parseFloat(longitude), parseInt(id)]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id/rider-status', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['Dispatched', 'Delivered'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status update for rider console.' });
    }

    const orderCheck = await query('SELECT payment_method FROM orders WHERE id = $1', [parseInt(id)]);
    if (orderCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    
    const order = orderCheck.rows[0];
    let paymentStatusQuery = '';
    if (status === 'Delivered' && (order.payment_method.includes('COD') || order.payment_method === 'COD')) {
      paymentStatusQuery = `, payment_status = 'Paid'`;
    }

    const result = await query(
      `UPDATE orders SET status = $1 ${paymentStatusQuery} WHERE id = $2 RETURNING *`,
      [status, parseInt(id)]
    );

    const updatedOrder = result.rows[0];
    if (updatedOrder) {
      sendOrderStatusAlert(updatedOrder, status, req.user?.name).catch(err => {
        console.error('[Notifications] Failed to send rider status alert:', err.message);
      });
    }

    res.json(updatedOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
