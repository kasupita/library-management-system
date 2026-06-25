const express = require('express');
const pool = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');

const router = express.Router();

// Get dashboard statistics
router.get('/dashboard', optionalAuth, async (req, res, next) => {
  try {
    // Total books (sum of copies)
    const [[{ totalBooks }]] = await pool.query(
      'SELECT COALESCE(SUM(copies), 0) as totalBooks FROM books'
    );

    // Available books (sum of available copies)
    const [[{ availableBooks }]] = await pool.query(
      'SELECT COALESCE(SUM(available_copies), 0) as availableBooks FROM books'
    );

    // Borrowed books count
    const [[{ borrowedBooks }]] = await pool.query(
      "SELECT COUNT(*) as borrowedBooks FROM borrow_records WHERE status = 'borrowed'"
    );

    // Total categories
    const [[{ totalCategories }]] = await pool.query(
      'SELECT COUNT(*) as totalCategories FROM categories'
    );

    // Total donations
    const [[{ totalDonations }]] = await pool.query(
      'SELECT COUNT(*) as totalDonations FROM donations'
    );

    // Pending donations
    const [[{ pendingDonations }]] = await pool.query(
      "SELECT COUNT(*) as pendingDonations FROM donations WHERE status = 'pending'"
    );

    // Total users
    const [[{ totalUsers }]] = await pool.query(
      'SELECT COUNT(*) as totalUsers FROM users'
    );

    // Overdue books
    const [[{ overdueBooks }]] = await pool.query(
      "SELECT COUNT(*) as overdueBooks FROM borrow_records WHERE status = 'borrowed' AND due_date < NOW()"
    );

    let pendingBookRequests = 0;
    try {
      const [[row]] = await pool.query(
        "SELECT COUNT(*) as pendingBookRequests FROM book_requests WHERE status = 'pending'"
      );
      pendingBookRequests = parseInt(row.pendingBookRequests) || 0;
    } catch {
      pendingBookRequests = 0;
    }

    res.json({
      success: true,
      data: {
        totalBooks: parseInt(totalBooks) || 0,
        availableBooks: parseInt(availableBooks) || 0,
        borrowedBooks: parseInt(borrowedBooks) || 0,
        totalCategories: parseInt(totalCategories) || 0,
        totalDonations: parseInt(totalDonations) || 0,
        pendingDonations: parseInt(pendingDonations) || 0,
        totalUsers: parseInt(totalUsers) || 0,
        overdueBooks: parseInt(overdueBooks) || 0,
        pendingBookRequests,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
