const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { isLibrarian } = require('../middleware/roleCheck');

const router = express.Router();

function isStaff(role) {
  return role === 'admin' || role === 'librarian';
}

function mapRequest(row) {
  return {
    id: row.id,
    bookId: row.book_id,
    bookTitle: row.bookTitle,
    userId: row.user_id,
    userName: row.userName,
    requestType: row.request_type,
    status: row.status,
    createdAt: row.created_at,
    processedAt: row.processed_at || undefined,
    processedBy: row.processed_by || undefined,
    borrowRecordId: row.borrow_record_id || undefined,
  };
}

async function issueBorrow(bookId, userId) {
  const [books] = await pool.query(
    'SELECT available_copies FROM books WHERE id = ?',
    [bookId]
  );
  if (books.length === 0) {
    return { error: 'Book not found', status: 404 };
  }
  if (books[0].available_copies <= 0) {
    return { error: 'No copies available', status: 400 };
  }

  const id = uuidv4();
  const borrowDate = new Date();
  const dueDate = new Date(borrowDate);
  dueDate.setDate(dueDate.getDate() + 14);

  await pool.query(
    `
    INSERT INTO borrow_records (id, book_id, user_id, borrow_date, due_date, status)
    VALUES (?, ?, ?, ?, ?, 'borrowed')
    `,
    [id, bookId, userId, borrowDate.toISOString(), dueDate.toISOString()]
  );

  await pool.query(
    'UPDATE books SET available_copies = available_copies - 1 WHERE id = ?',
    [bookId]
  );

  return { borrowRecordId: id };
}

// List requests: staff see all (optional ?status=pending), students see own
router.get('/', authenticate, async (req, res, next) => {
  try {
    const staff = isStaff(req.user.role);
    const statusFilter = req.query.status;

    let sql = `
      SELECT brq.*, b.title as bookTitle, u.name as userName
      FROM book_requests brq
      LEFT JOIN books b ON brq.book_id = b.id
      LEFT JOIN users u ON brq.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (!staff) {
      sql += ' AND brq.user_id = ?';
      params.push(req.user.id);
    }
    if (statusFilter) {
      sql += ' AND brq.status = ?';
      params.push(statusFilter);
    }

    sql += ' ORDER BY brq.created_at DESC';

    const [rows] = await pool.query(sql, params);
    res.json({ success: true, data: rows.map(mapRequest) });
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(503).json({
        success: false,
        error: 'Book requests not set up. Run: cd backend && node src/config/migrate.js',
      });
    }
    next(error);
  }
});

// Student: request borrow or reserve
router.post('/', authenticate, async (req, res, next) => {
  try {
    const { bookId } = req.body;
    if (!bookId) {
      return res.status(400).json({ success: false, error: 'bookId is required' });
    }

    const [books] = await pool.query(
      'SELECT id, title, available_copies FROM books WHERE id = ?',
      [bookId]
    );
    if (books.length === 0) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const [activeBorrow] = await pool.query(
      `SELECT id FROM borrow_records
       WHERE book_id = ? AND user_id = ? AND status IN ('borrowed', 'overdue')`,
      [bookId, req.user.id]
    );
    if (activeBorrow.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'You already have an active loan for this book',
      });
    }

    const [pendingReq] = await pool.query(
      `SELECT id FROM book_requests
       WHERE book_id = ? AND user_id = ? AND status = 'pending'`,
      [bookId, req.user.id]
    );
    if (pendingReq.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'You already have a pending request for this book',
      });
    }

    const requestType = books[0].available_copies > 0 ? 'borrow' : 'reserve';
    const id = uuidv4();

    await pool.query(
      `
      INSERT INTO book_requests (id, book_id, user_id, request_type, status)
      VALUES (?, ?, ?, ?, 'pending')
      `,
      [id, bookId, req.user.id, requestType]
    );

    const [rows] = await pool.query(
      `
      SELECT brq.*, b.title as bookTitle, u.name as userName
      FROM book_requests brq
      LEFT JOIN books b ON brq.book_id = b.id
      LEFT JOIN users u ON brq.user_id = u.id
      WHERE brq.id = ?
      `,
      [id]
    );

    res.status(201).json({
      success: true,
      data: mapRequest(rows[0]),
      message:
        requestType === 'borrow'
          ? 'Borrow request submitted. A librarian will approve it soon.'
          : 'Reservation submitted. You will be notified when a copy is available.',
    });
  } catch (error) {
    if (error.code === 'ER_NO_SUCH_TABLE') {
      return res.status(503).json({
        success: false,
        error: 'Book requests not set up. Run: cd backend && node src/config/migrate.js',
      });
    }
    next(error);
  }
});

// Student: cancel own pending request
router.post('/:id/cancel', authenticate, async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM book_requests WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const reqRow = rows[0];
    if (reqRow.user_id !== req.user.id && !isStaff(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Not allowed' });
    }
    if (reqRow.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Only pending requests can be cancelled' });
    }

    await pool.query(
      `UPDATE book_requests SET status = 'cancelled', processed_at = ? WHERE id = ?`,
      [new Date().toISOString(), id]
    );

    res.json({ success: true, data: { id, status: 'cancelled' } });
  } catch (error) {
    next(error);
  }
});

// Librarian: approve request → issue loan if copy available
router.post('/:id/approve', authenticate, isLibrarian, async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM book_requests WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const reqRow = rows[0];
    if (reqRow.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Request is not pending' });
    }

    const issued = await issueBorrow(reqRow.book_id, reqRow.user_id);
    if (issued.error) {
      return res.status(issued.status).json({ success: false, error: issued.error });
    }

    const now = new Date().toISOString();
    await pool.query(
      `
      UPDATE book_requests
      SET status = 'approved', processed_at = ?, processed_by = ?, borrow_record_id = ?
      WHERE id = ?
      `,
      [now, req.user.id, issued.borrowRecordId, id]
    );

    res.json({
      success: true,
      data: { id, status: 'approved', borrowRecordId: issued.borrowRecordId },
    });
  } catch (error) {
    next(error);
  }
});

// Librarian: reject request
router.post('/:id/reject', authenticate, isLibrarian, async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM book_requests WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Request not found' });
    }

    const reqRow = rows[0];
    if (reqRow.status !== 'pending') {
      return res.status(400).json({ success: false, error: 'Request is not pending' });
    }

    await pool.query(
      `
      UPDATE book_requests
      SET status = 'rejected', processed_at = ?, processed_by = ?
      WHERE id = ?
      `,
      [new Date().toISOString(), req.user.id, id]
    );

    res.json({ success: true, data: { id, status: 'rejected' } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
