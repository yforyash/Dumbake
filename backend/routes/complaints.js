// routes/complaints.js
// Support complaints management & real-time user-admin chat box

const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { verifyToken } = require('../middleware/authGuard');
const { sendEmail } = require('../services/notificationService');
const logger = require('../utils/logger');

/**
 * POST /
 * Create a new complaint for an order.
 * Expected body: { orderId, subject, description, fileId }
 */
router.post('/', verifyToken, async (req, res, next) => {
  const { orderId, subject, description, fileId } = req.body;
  if (!orderId || !subject || !description) {
    return res.status(400).json({ error: 'Order ID, subject, and description are required' });
  }

  try {
    // Check if order exists and belongs to the user
    const orderCheck = await db.query('SELECT id, user_id FROM orders WHERE id = $1', [parseInt(orderId)]);
    if (orderCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = orderCheck.rows[0];
    const userRole = (req.user.role || '').toLowerCase();
    if (userRole !== 'admin' && order.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized order reference' });
    }

    // Insert complaint
    const complaintRes = await db.query(
      `INSERT INTO complaints (order_id, user_id, subject, description, status) 
       VALUES ($1, $2, $3, $4, 'Open') RETURNING *`,
      [parseInt(orderId), order.user_id, subject, description]
    );
    const complaint = complaintRes.rows[0];

    // If an initial file was uploaded, save it as the first message
    if (fileId) {
      await db.query(
        `INSERT INTO complaint_messages (complaint_id, sender_id, message, file_id)
         VALUES ($1, $2, $3, $4)`,
        [complaint.id, req.user.id, 'Attachment upload', parseInt(fileId)]
      );
    } else {
      // Create first text message
      await db.query(
        `INSERT INTO complaint_messages (complaint_id, sender_id, message)
         VALUES ($1, $2, $3)`,
        [complaint.id, req.user.id, description]
      );
    }

    // Notify admin via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('new_complaint', complaint);
    }

    res.status(201).json(complaint);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /my
 * Fetch complaints raised by the logged-in customer.
 */
router.get('/my', verifyToken, async (req, res, next) => {
  try {
    const result = await db.query(
      `SELECT c.*, o.created_at as order_date, o.total_price as order_price 
       FROM complaints c 
       JOIN orders o ON c.order_id = o.id 
       WHERE c.user_id = $1 
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /all
 * Fetch all complaints (Admin only).
 */
router.get('/all', verifyToken, async (req, res, next) => {
  const userRole = (req.user.role || '').toLowerCase();
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }

  try {
    const result = await db.query(
      `SELECT c.*, u.name as customer_name, u.email as customer_email, o.created_at as order_date 
       FROM complaints c
       JOIN users u ON c.user_id = u.id
       JOIN orders o ON c.order_id = o.id
       ORDER BY c.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /:id
 * Fetch detailed complaint with messages list.
 */
router.get('/:id', verifyToken, async (req, res, next) => {
  const { id } = req.params;
  try {
    const complaintCheck = await db.query('SELECT * FROM complaints WHERE id = $1', [parseInt(id)]);
    if (complaintCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = complaintCheck.rows[0];
    const userRole = (req.user.role || '').toLowerCase();
    if (userRole !== 'admin' && complaint.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized complaint access' });
    }

    // Fetch messages with files joined
    const messagesRes = await db.query(
      `SELECT m.*, u.name as sender_name, u.role as sender_role,
              f.filename as file_name, f.mime_type as file_type, f.size as file_size
       FROM complaint_messages m
       JOIN users u ON m.sender_id = u.id
       LEFT JOIN uploaded_files f ON m.file_id = f.id
       WHERE m.complaint_id = $1
       ORDER BY m.created_at ASC`,
      [complaint.id]
    );

    res.json({
      ...complaint,
      messages: messagesRes.rows
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /:id/messages
 * Add a new message (text or file attachment) to the complaint chat.
 * Expected body: { message, fileId }
 */
router.post('/:id/messages', verifyToken, async (req, res, next) => {
  const { id } = req.params;
  const { message, fileId } = req.body;

  if (!message && !fileId) {
    return res.status(400).json({ error: 'Message text or file attachment is required' });
  }

  try {
    const complaintCheck = await db.query('SELECT * FROM complaints WHERE id = $1', [parseInt(id)]);
    if (complaintCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = complaintCheck.rows[0];
    const userRole = (req.user.role || '').toLowerCase();
    if (userRole !== 'admin' && complaint.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized complaint access' });
    }

    // Insert message
    const msgInsert = await db.query(
      `INSERT INTO complaint_messages (complaint_id, sender_id, message, file_id)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [complaint.id, req.user.id, message || null, fileId ? parseInt(fileId) : null]
    );
    const newMessage = msgInsert.rows[0];

    // Fetch full message details with sender name for WebSocket/HTTP response
    const msgDetails = await db.query(
      `SELECT m.*, u.name as sender_name, u.role as sender_role,
              f.filename as file_name, f.mime_type as file_type, f.size as file_size
       FROM complaint_messages m
       JOIN users u ON m.sender_id = u.id
       LEFT JOIN uploaded_files f ON m.file_id = f.id
       WHERE m.id = $1`,
      [newMessage.id]
    );
    const detailedMessage = msgDetails.rows[0];

    // Broadcast Socket.io message to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit(`complaint_message_${complaint.id}`, detailedMessage);
      io.emit('complaint_message_global', { complaintId: complaint.id, message: detailedMessage });
    }

    res.status(201).json(detailedMessage);
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /:id/status
 * Update complaint status (Open, In Progress, Resolved).
 * Expected body: { status }
 */
router.post('/:id/status', verifyToken, async (req, res, next) => {
  const { id } = req.params;
  const { status } = req.body;
  if (!status) return res.status(400).json({ error: 'Status is required' });

  try {
    const complaintCheck = await db.query('SELECT * FROM complaints WHERE id = $1', [parseInt(id)]);
    if (complaintCheck.rowCount === 0) {
      return res.status(404).json({ error: 'Complaint not found' });
    }

    const complaint = complaintCheck.rows[0];
    const userRole = (req.user.role || '').toLowerCase();
    if (userRole !== 'admin' && complaint.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }

    const result = await db.query(
      'UPDATE complaints SET status = $1 WHERE id = $2 RETURNING *',
      [status, complaint.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /:id/send-email
 * Send a direct email to the customer's registered email ID.
 * Expected body: { body } (Admin only)
 */
router.post('/:id/send-email', verifyToken, async (req, res, next) => {
  const userRole = (req.user.role || '').toLowerCase();
  if (userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin role required' });
  }

  const { id } = req.params;
  const { body } = req.body;
  if (!body) return res.status(400).json({ error: 'Email body is required' });

  try {
    const complaintRes = await db.query(
      `SELECT c.id, c.subject, u.email as customer_email, u.name as customer_name 
       FROM complaints c
       JOIN users u ON c.user_id = u.id
       WHERE c.id = $1`,
      [parseInt(id)]
    );
    if (complaintRes.rowCount === 0) {
      return res.status(404).json({ error: 'Complaint references not found' });
    }

    const { subject, customer_email, customer_name } = complaintRes.rows[0];

    // Format email content
    const emailSubject = `Update regarding your DumBake Complaint: ${subject}`;
    const emailHtml = `
      <p>Hello ${customer_name},</p>
      <p>Our support team has reviewed your complaint regarding order #${id} and sent the following update:</p>
      <hr />
      <div style="background: #f7f7f7; padding: 15px; border-radius: 6px; font-family: monospace;">
        ${body.replace(/\n/g, '<br />')}
      </div>
      <hr />
      <p>You can also view the support history or chat with us directly by visiting the My Orders section on the website.</p>
      <p>Best regards,<br/>DumBake Support Team</p>
    `;

    await sendEmail(customer_email, emailSubject, emailHtml);
    res.json({ success: true, message: `Email successfully delivered to ${customer_email}` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
