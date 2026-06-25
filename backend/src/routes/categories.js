const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { isLibrarian, isAdmin } = require('../middleware/roleCheck');

const router = express.Router();

// Get all categories
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const [categories] = await pool.query(
      'SELECT * FROM categories ORDER BY name ASC'
    );

    const transformedCategories = categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      description: cat.description,
      color: cat.color,
      bookCount: cat.book_count,
      createdAt: cat.created_at,
    }));

    res.json({ success: true, data: transformedCategories });
  } catch (error) {
    next(error);
  }
});

// Create category
router.post('/', authenticate, isLibrarian, async (req, res, next) => {
  try {
    const { name, description, color } = req.body;
    const id = uuidv4();
    const now = new Date().toISOString();

    await pool.query(
      'INSERT INTO categories (id, name, description, color, book_count, created_at) VALUES (?, ?, ?, ?, 0, ?)',
      [id, name, description, color, now]
    );

    const [categories] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    const cat = categories[0];

    res.status(201).json({
      success: true,
      data: {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        color: cat.color,
        bookCount: cat.book_count,
        createdAt: cat.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update category
router.put('/:id', authenticate, isLibrarian, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, color } = req.body;

    const fields = [];
    const values = [];

    if (name !== undefined) { fields.push('name = ?'); values.push(name); }
    if (description !== undefined) { fields.push('description = ?'); values.push(description); }
    if (color !== undefined) { fields.push('color = ?'); values.push(color); }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    values.push(id);
    await pool.query(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`, values);

    const [categories] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    if (categories.length === 0) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }

    const cat = categories[0];
    res.json({
      success: true,
      data: {
        id: cat.id,
        name: cat.name,
        description: cat.description,
        color: cat.color,
        bookCount: cat.book_count,
        createdAt: cat.created_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete category (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if category has books
    const [books] = await pool.query('SELECT COUNT(*) as count FROM books WHERE category_id = ?', [id]);
    if (books[0].count > 0) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete category with associated books' 
      });
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
