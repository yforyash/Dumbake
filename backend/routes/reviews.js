const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticate } = require('../middlewares/auth');

// Get all reviews (capped to latest 1000 for display/aggregation)
router.get('/', async (req, res) => {
  try {
    const result = await query(`
      SELECT r.*, b.name AS item_name 
      FROM reviews r 
      LEFT JOIN bakery_items b ON r.item_id = b.id 
      ORDER BY r.created_at DESC 
      LIMIT 1000
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Post review (Authenticated only)
router.post('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    if (!userId) {
      return res.status(401).json({ error: 'Please sign in to leave a review.' });
    }

    const { reviewerName, rating, comment, itemId } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be an integer between 1 and 5.' });
    }

    const result = await query(
      `INSERT INTO reviews (user_id, reviewer_name, rating, comment, item_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, reviewerName || req.user.name, rating, comment, itemId ? parseInt(itemId) : null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
