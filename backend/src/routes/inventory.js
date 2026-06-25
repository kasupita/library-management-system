const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { isLibrarian } = require('../middleware/roleCheck');

const router = express.Router();

// View inventory removals (admin/librarian)
router.get('/removals', authenticate, isLibrarian, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT ir.*, u.name as removedByName
      FROM inventory_removals ir
      LEFT JOIN users u ON ir.removed_by = u.id
      ORDER BY ir.removed_at DESC
      LIMIT 500
    `);

    const data = rows.map(r => ({
      id: r.id,
      bookId: r.book_id,
      bookTitle: r.book_title,
      removedBy: r.removed_by,
      removedByName: r.removedByName,
      reason: r.reason || undefined,
      removedAt: r.removed_at ? new Date(r.removed_at).toISOString() : new Date().toISOString(),
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

