const express = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const pool = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { isLibrarian } = require('../middleware/roleCheck');
const { publicUploadUrl } = require('../utils/publicUrl');

const router = express.Router();

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

const excelUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Get all books
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const [books] = await pool.query(`
      SELECT b.*, c.name as categoryName 
      FROM books b 
      LEFT JOIN categories c ON b.category_id = c.id 
      ORDER BY b.created_at DESC
    `);

    // Transform snake_case to camelCase
    const transformedBooks = books.map(book => ({
      id: book.id,
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      categoryId: book.category_id,
      categoryName: book.categoryName,
      description: book.description,
      publishedYear: book.published_year,
      publisher: book.publisher,
      copies: book.copies,
      availableCopies: book.available_copies,
      coverImage: book.cover_image,
      digitalFile: publicUploadUrl(book.digital_file),
      isDonated: !!book.is_donated,
      donorName: book.donor_name,
      donorContact: book.donor_contact,
      donationDate: book.donation_date,
      createdAt: book.created_at,
      updatedAt: book.updated_at,
    }));

    res.json({ success: true, data: transformedBooks });
  } catch (error) {
    next(error);
  }
});

// Export books to Excel (admin/librarian only)
router.get('/export', authenticate, isLibrarian, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT b.title, b.author, b.isbn, c.name as category, b.description, b.published_year, b.publisher, b.copies
      FROM books b
      LEFT JOIN categories c ON b.category_id = c.id
      ORDER BY b.created_at DESC
    `);

    const worksheet = XLSX.utils.json_to_sheet(
      rows.map(r => ({
        title: r.title,
        author: r.author,
        isbn: r.isbn,
        category: r.category || '',
        publishedYear: r.published_year || '',
        publisher: r.publisher || '',
        copies: r.copies || 1,
        description: r.description || '',
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Books');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="books.xlsx"');
    res.send(buffer);
  } catch (error) {
    next(error);
  }
});

// Import books from Excel (admin/librarian only)
// Expected columns: title, author, isbn, category, publishedYear, publisher, copies, description
router.post('/import', authenticate, isLibrarian, excelUpload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Excel file is required' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    let created = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const title = String(r.title || '').trim();
      const author = String(r.author || '').trim();
      const isbn = String(r.isbn || '').trim();
      const categoryName = String(r.category || '').trim();
      const publishedYear = r.publishedYear !== '' ? Number(r.publishedYear) : null;
      const publisher = String(r.publisher || '').trim();
      const copies = r.copies !== '' ? Math.max(1, Number(r.copies)) : 1;
      const description = String(r.description || '').trim();

      if (!title || !author || !isbn) {
        errors.push({ row: i + 2, error: 'Missing required fields: title/author/isbn' });
        continue;
      }

      let categoryId = null;
      if (categoryName) {
        const [cats] = await pool.query('SELECT id FROM categories WHERE name = ? LIMIT 1', [categoryName]);
        if (cats.length > 0) categoryId = cats[0].id;
      }

      const id = uuidv4();
      const now = new Date().toISOString();
      await pool.query(
        `
        INSERT INTO books (
          id, title, author, isbn, category_id, description,
          published_year, publisher, copies, available_copies,
          cover_image, digital_file, is_donated, donor_name,
          donor_contact, donation_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
        [
          id,
          title,
          author,
          isbn,
          categoryId,
          description || null,
          Number.isFinite(publishedYear) ? publishedYear : null,
          publisher || null,
          copies,
          copies,
          null,
          null,
          false,
          null,
          null,
          null,
          now,
          now,
        ]
      );

      if (categoryId) {
        await pool.query('UPDATE categories SET book_count = book_count + 1 WHERE id = ?', [categoryId]);
      }

      created += 1;
    }

    res.json({ success: true, data: { created, errors } });
  } catch (error) {
    next(error);
  }
});

// Get book by ID
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const [books] = await pool.query(
      'SELECT * FROM books WHERE id = ?',
      [req.params.id]
    );

    if (books.length === 0) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const book = books[0];
    res.json({
      success: true,
      data: {
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        categoryId: book.category_id,
        description: book.description,
        publishedYear: book.published_year,
        publisher: book.publisher,
        copies: book.copies,
        availableCopies: book.available_copies,
        coverImage: book.cover_image,
        digitalFile: publicUploadUrl(book.digital_file),
        isDonated: !!book.is_donated,
        donorName: book.donor_name,
        donorContact: book.donor_contact,
        donationDate: book.donation_date,
        createdAt: book.created_at,
        updatedAt: book.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create book (admin/librarian only)
router.post('/', upload.single('pdfFile'), async (req, res, next) => {
  try {
    const {
      title, author, isbn, categoryId, description,
      publishedYear, publisher, copies, availableCopies,
      coverImage, isDonated, donorName,
      donorContact, donationDate
    } = req.body;

    // Handle uploaded file
    let digitalFile = null;
    if (req.file) {
      digitalFile = `/uploads/${req.file.filename}`;
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    await pool.query(`
      INSERT INTO books (
        id, title, author, isbn, category_id, description,
        published_year, publisher, copies, available_copies,
        cover_image, digital_file, is_donated, donor_name,
        donor_contact, donation_date, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, title, author, isbn, categoryId, description,
      publishedYear, publisher, copies, availableCopies ?? copies,
      coverImage || null, digitalFile, isDonated || false,
      donorName || null, donorContact || null, donationDate || null,
      now, now
    ]);

    // Update category book count
    if (categoryId) {
      await pool.query(
        'UPDATE categories SET book_count = book_count + 1 WHERE id = ?',
        [categoryId]
      );
    }

    const [newBooks] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    const book = newBooks[0];

    res.status(201).json({
      success: true,
      data: {
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        categoryId: book.category_id,
        description: book.description,
        publishedYear: book.published_year,
        publisher: book.publisher,
        copies: book.copies,
        availableCopies: book.available_copies,
        coverImage: book.cover_image,
        digitalFile: publicUploadUrl(book.digital_file),
        isDonated: !!book.is_donated,
        donorName: book.donor_name,
        donorContact: book.donor_contact,
        donationDate: book.donation_date,
        createdAt: book.created_at,
        updatedAt: book.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update book
router.put('/:id', authenticate, isLibrarian, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const now = new Date().toISOString();

    // Build dynamic update query
    const fields = [];
    const values = [];

    const fieldMap = {
      title: 'title',
      author: 'author',
      isbn: 'isbn',
      categoryId: 'category_id',
      description: 'description',
      publishedYear: 'published_year',
      publisher: 'publisher',
      copies: 'copies',
      availableCopies: 'available_copies',
      coverImage: 'cover_image',
      digitalFile: 'digital_file',
      isDonated: 'is_donated',
      donorName: 'donor_name',
      donorContact: 'donor_contact',
      donationDate: 'donation_date',
    };

    for (const [key, dbField] of Object.entries(fieldMap)) {
      if (updates[key] !== undefined) {
        fields.push(`${dbField} = ?`);
        values.push(updates[key]);
      }
    }

    fields.push('updated_at = ?');
    values.push(now);
    values.push(id);

    await pool.query(
      `UPDATE books SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedBooks] = await pool.query('SELECT * FROM books WHERE id = ?', [id]);
    if (updatedBooks.length === 0) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const book = updatedBooks[0];
    res.json({
      success: true,
      data: {
        id: book.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        categoryId: book.category_id,
        description: book.description,
        publishedYear: book.published_year,
        publisher: book.publisher,
        copies: book.copies,
        availableCopies: book.available_copies,
        coverImage: book.cover_image,
        digitalFile: publicUploadUrl(book.digital_file),
        isDonated: !!book.is_donated,
        donorName: book.donor_name,
        donorContact: book.donor_contact,
        donationDate: book.donation_date,
        createdAt: book.created_at,
        updatedAt: book.updated_at,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete book
router.delete('/:id', authenticate, isLibrarian, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Get book to update category count
    const [books] = await pool.query('SELECT id, title, category_id FROM books WHERE id = ?', [id]);
    if (books.length === 0) {
      return res.status(404).json({ success: false, error: 'Book not found' });
    }

    const categoryId = books[0].category_id;
    const bookTitle = books[0].title;

    // Log removal to inventory log (before deleting book row)
    await pool.query(
      'INSERT INTO inventory_removals (id, book_id, book_title, removed_by, reason) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), id, bookTitle, req.user.id, req.query.reason || null]
    );

    await pool.query('DELETE FROM books WHERE id = ?', [id]);

    // Update category book count
    if (categoryId) {
      await pool.query(
        'UPDATE categories SET book_count = GREATEST(0, book_count - 1) WHERE id = ?',
        [categoryId]
      );
    }

    res.json({ success: true, data: null });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
