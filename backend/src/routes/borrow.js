const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { isLibrarian } = require('../middleware/roleCheck');

const router = express.Router();

function isStaff(role) {
  return role === 'admin' || role === 'librarian';
}

function effectiveStatus(rec) {
  if (rec.status === 'returned') return 'returned';
  if (
    (rec.status === 'borrowed' || rec.status === 'overdue') &&
    rec.due_date &&
    new Date(rec.due_date) < new Date()
  ) {
    return 'overdue';
  }
  return rec.status;
}

function estimatedFine(rec) {
  const paid = Number(rec.fine || 0);
  if (rec.status === 'returned') return paid;
  if (effectiveStatus(rec) !== 'overdue' || !rec.due_date) return 0;
  const daysOverdue = Math.ceil(
    (Date.now() - new Date(rec.due_date).getTime()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, daysOverdue) * 1;
}

function mapBorrowRecord(rec) {
  const status = effectiveStatus(rec);
  return {
    id: rec.id,
    bookId: rec.book_id,
    bookTitle: rec.bookTitle,
    userId: rec.user_id,
    userName: rec.userName,
    borrowDate: rec.borrow_date,
    dueDate: rec.due_date,
    returnDate: rec.return_date,
    status,
    fine: rec.fine,
    estimatedFine: estimatedFine(rec),
  };
}

// Get borrow records (staff: all, students/HOD: own only)
router.get('/', authenticate, async (req, res, next) => {
  try {
    const staff = isStaff(req.user.role);
    let sql = `
      SELECT br.*, b.title as bookTitle, u.name as userName 
      FROM borrow_records br 
      LEFT JOIN books b ON br.book_id = b.id 
      LEFT JOIN users u ON br.user_id = u.id 
    `;
    const params = [];
    if (!staff) {
      sql += ' WHERE br.user_id = ?';
      params.push(req.user.id);
    }
    sql += ' ORDER BY br.borrow_date DESC';

    const [records] = await pool.query(sql, params);
    res.json({ success: true, data: records.map(mapBorrowRecord) });
  } catch (error) {
    next(error);
  }
});

// Issue loan (librarian/admin only — students use book-requests)
router.post('/', authenticate, isLibrarian, async (req, res, next) => {
  try {
    const { bookId, userId } = req.body;
    if (!bookId || !userId) {
      return res.status(400).json({ success: false, error: 'bookId and userId are required' });
    }
    const borrowUserId = userId;

    // Check book availability
    const [books] = await pool.query(
      'SELECT available_copies FROM books WHERE id = ?',
      [bookId]
    );

    if (books.length === 0) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    if (books[0].available_copies <= 0) {
      return res.status(400).json({ success: false, error: 'No copies available' });
    }

    const id = uuidv4();
    const borrowDate = new Date();
    const dueDate = new Date(borrowDate);
    dueDate.setDate(dueDate.getDate() + 14); // 2 weeks

    // Create borrow record
    await pool.query(`
      INSERT INTO borrow_records (id, book_id, user_id, borrow_date, due_date, status)
      VALUES (?, ?, ?, ?, ?, 'borrowed')
    `, [id, bookId, borrowUserId, borrowDate.toISOString(), dueDate.toISOString()]);

    // Decrease available copies
    await pool.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?',
      [bookId]
    );

    const [records] = await pool.query(`
      SELECT br.*, b.title as bookTitle, u.name as userName 
      FROM borrow_records br 
      LEFT JOIN books b ON br.book_id = b.id 
      LEFT JOIN users u ON br.user_id = u.id 
      WHERE br.id = ?
    `, [id]);

    res.status(201).json({
      success: true,
      data: mapBorrowRecord(records[0]),
    });
  } catch (error) {
    next(error);
  }
});

// Return a book (librarian/admin only)
router.post('/:id/return', authenticate, isLibrarian, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get borrow record
    const [records] = await pool.query(
      'SELECT * FROM borrow_records WHERE id = ?',
      [id]
    );

    if (records.length === 0) {
      return res.status(404).json({ success: false, error: 'Borrow record not found' });
    }

    const record = records[0];

    if (record.status === 'returned') {
      return res.status(400).json({ success: false, error: 'Book already returned' });
    }

    const returnDate = new Date();
    let fine = 0;

    // Calculate fine if overdue (1 per day)
    if (returnDate > new Date(record.due_date)) {
      const daysOverdue = Math.ceil(
        (returnDate.getTime() - new Date(record.due_date).getTime()) / (1000 * 60 * 60 * 24)
      );
      fine = daysOverdue * 1; // $1 per day
    }

    // Update borrow record
    await pool.query(
      'UPDATE borrow_records SET return_date = ?, status = ?, fine = ? WHERE id = ?',
      [returnDate.toISOString(), 'returned', fine, id]
    );

    // Increase available copies
    await pool.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = ?',
      [record.book_id]
    );

    const [updatedRecords] = await pool.query(`
      SELECT br.*, b.title as bookTitle, u.name as userName 
      FROM borrow_records br 
      LEFT JOIN books b ON br.book_id = b.id 
      LEFT JOIN users u ON br.user_id = u.id 
      WHERE br.id = ?
    `, [id]);

    res.json({
      success: true,
      data: mapBorrowRecord(updatedRecords[0]),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
