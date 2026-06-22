const express = require('express');
const router = express.Router();
const { query } = require('../config/db');
const { authenticate, requireRole } = require('../middlewares/auth');

// Get all bakery items (with filters)
router.get('/', async (req, res) => {
  try {
    const { category, search, eggless } = req.query;
    let sql = 'SELECT * FROM bakery_items WHERE status = $1';
    const params = ['available'];
    let paramIndex = 2;

    if (category) {
      sql += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (eggless === 'true') {
      sql += ` AND is_eggless = true`;
    }

    if (search) {
      sql += ` AND (name ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    sql += ' ORDER BY is_bestseller DESC, id ASC';
    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single bakery item details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query('SELECT * FROM bakery_items WHERE id = $1', [parseInt(id)]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Bakery item not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add bakery item (Admin only)
router.post('/', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { name, description, price, category, image_url, is_eggless, is_bestseller, stock_quantity } = req.body;
    
    // Check if name exists
    const exists = await query('SELECT id FROM bakery_items WHERE name = $1', [name]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ error: 'Bakery item with this name already exists' });
    }

    const result = await query(
      `INSERT INTO bakery_items (name, description, price, category, image_url, is_eggless, is_bestseller, stock_quantity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [name, description, parseFloat(price), category, image_url, is_eggless || false, is_bestseller || false, parseInt(stock_quantity || 10)]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update bakery item (Admin only)
router.put('/:id', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, image_url, is_eggless, is_bestseller, stock_quantity, status } = req.body;

    // Check if item exists
    const check = await query('SELECT id FROM bakery_items WHERE id = $1', [parseInt(id)]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Bakery item not found' });
    }

    const result = await query(
      `UPDATE bakery_items
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           price = COALESCE($3, price),
           category = COALESCE($4, category),
           image_url = COALESCE($5, image_url),
           is_eggless = COALESCE($6, is_eggless),
           is_bestseller = COALESCE($7, is_bestseller),
           stock_quantity = COALESCE($8, stock_quantity),
           status = COALESCE($9, status)
       WHERE id = $10
       RETURNING *`,
      [name, description, price ? parseFloat(price) : null, category, image_url, is_eggless, is_bestseller, stock_quantity ? parseInt(stock_quantity) : null, status, parseInt(id)]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete bakery item (Admin only)
router.delete('/:id', authenticate, requireRole(['admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const check = await query('SELECT id FROM bakery_items WHERE id = $1', [parseInt(id)]);
    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Bakery item not found' });
    }

    await query('DELETE FROM bakery_items WHERE id = $1', [parseInt(id)]);
    res.json({ message: 'Bakery item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
