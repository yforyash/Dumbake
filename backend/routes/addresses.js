const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticate } = require('../middlewares/auth');

router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'Sign in required' });
    }
    const result = await query(
      'SELECT id, label, address_line, latitude, longitude FROM user_addresses WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'Sign in required' });
    }
    const { label, address_line, latitude, longitude } = req.body;
    if (!label || !address_line) {
      return res.status(400).json({ error: 'Label and address details are required' });
    }
    const result = await query(
      'INSERT INTO user_addresses (user_id, label, address_line, latitude, longitude) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, label, address_line, latitude, longitude]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'Sign in required' });
    }
    const { id } = req.params;
    await query(
      'DELETE FROM user_addresses WHERE id = $1 AND user_id = $2',
      [parseInt(id), userId]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
