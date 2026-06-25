const express = require('express');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { isLibrarian } = require('../middleware/roleCheck');

const router = express.Router();

// Get all donations
router.get('/', authenticate, async (req, res, next) => {
  try {
    const [donations] = await pool.query(`
      SELECT d.*, b.title as bookTitle 
      FROM donations d 
      LEFT JOIN books b ON d.book_id = b.id 
      ORDER BY d.created_at DESC
    `);

    const transformedDonations = donations.map(don => ({
      id: don.id,
      bookId: don.book_id,
      bookTitle: don.bookTitle,
      donorName: don.donor_name,
      donorEmail: don.donor_email,
      donorPhone: don.donor_phone,
      donorAddress: don.donor_address,
      quantity: don.quantity,
      notes: don.notes,
      status: don.status,
      createdAt: don.created_at,
      processedAt: don.processed_at,
      processedBy: don.processed_by,
    }));

    res.json({ success: true, data: transformedDonations });
  } catch (error) {
    next(error);
  }
});

// Create donation
router.post('/', optionalAuth, async (req, res, next) => {
  try {
    const {
      bookId, donorName, donorEmail, donorPhone,
      donorAddress, quantity, notes
    } = req.body;

    const id = uuidv4();
    const now = new Date().toISOString();
    const sanitizedBookId = (bookId && String(bookId).trim()) ? bookId : null;

    await pool.query(`
      INSERT INTO donations (
        id, book_id, donor_name, donor_email, donor_phone,
        donor_address, quantity, notes, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)
    `, [id, sanitizedBookId, donorName, donorEmail, donorPhone || null, donorAddress || null, quantity || 1, notes || null, now]);

    const [donations] = await pool.query('SELECT * FROM donations WHERE id = ?', [id]);
    const don = donations[0];

    res.status(201).json({
      success: true,
      data: {
        id: don.id,
        bookId: don.book_id,
        donorName: don.donor_name,
        donorEmail: don.donor_email,
        donorPhone: don.donor_phone,
        donorAddress: don.donor_address,
        quantity: don.quantity,
        notes: don.notes,
        status: don.status,
        createdAt: don.created_at,
        processedAt: don.processed_at,
        processedBy: don.processed_by,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update donation
router.put('/:id', authenticate, isLibrarian, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const fieldMap = {
      donorName: 'donor_name',
      donorEmail: 'donor_email',
      donorPhone: 'donor_phone',
      donorAddress: 'donor_address',
      quantity: 'quantity',
      notes: 'notes',
    };

    const fields = [];
    const values = [];

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        fields.push(`${dbField} = ?`);
        values.push(updates[key]);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    values.push(id);
    await pool.query(`UPDATE donations SET ${fields.join(', ')} WHERE id = ?`, values);

    const [donations] = await pool.query('SELECT * FROM donations WHERE id = ?', [id]);
    if (donations.length === 0) {
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }

    const don = donations[0];
    res.json({
      success: true,
      data: {
        id: don.id,
        bookId: don.book_id,
        donorName: don.donor_name,
        donorEmail: don.donor_email,
        donorPhone: don.donor_phone,
        donorAddress: don.donor_address,
        quantity: don.quantity,
        notes: don.notes,
        status: don.status,
        createdAt: don.created_at,
        processedAt: don.processed_at,
        processedBy: don.processed_by,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Process donation (accept/reject)
router.post('/:id/process', authenticate, isLibrarian, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const now = new Date().toISOString();

    await pool.query(
      'UPDATE donations SET status = ?, processed_at = ?, processed_by = ? WHERE id = ?',
      [status, now, req.user.id, id]
    );

    const [donations] = await pool.query('SELECT * FROM donations WHERE id = ?', [id]);
    if (donations.length === 0) {
      return res.status(404).json({ success: false, error: 'Donation not found' });
    }

    const don = donations[0];

    // If accepted, update book copies
    if (status === 'accepted' && don.book_id) {
      await pool.query(
        'UPDATE books SET copies = copies + ?, available_copies = available_copies + ? WHERE id = ?',
        [don.quantity, don.quantity, don.book_id]
      );
    }

    res.json({
      success: true,
      data: {
        id: don.id,
        bookId: don.book_id,
        donorName: don.donor_name,
        donorEmail: don.donor_email,
        donorPhone: don.donor_phone,
        donorAddress: don.donor_address,
        quantity: don.quantity,
        notes: don.notes,
        status: don.status,
        createdAt: don.created_at,
        processedAt: don.processed_at,
        processedBy: don.processed_by,
      },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
