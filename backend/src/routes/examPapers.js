const express = require('express');
const { v4: uuidv4 } = require('uuid');
const multer = require('multer');
const path = require('path');
const pool = require('../config/database');
const { authenticate, optionalAuth } = require('../middleware/auth');
const { isLibrarian } = require('../middleware/roleCheck');
const { publicUploadUrl } = require('../utils/publicUrl');

const router = express.Router();

// Configure multer for PDF uploads (reuse uploads folder)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `exam-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Only PDF files are allowed'));
  },
  limits: { fileSize: 10 * 1024 * 1024 },
});

// List exam papers
// - Students: only approved
// - Librarian/Admin: can see all with ?all=1
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const wantsAll = req.query.all === '1' || req.query.all === 'true';
    const canSeeAll =
      wantsAll && req.user && (req.user.role === 'admin' || req.user.role === 'librarian');

    const [rows] = await pool.query(
      `
      SELECT ep.*, uu.name as uploadedByName, au.name as approvedByName
      FROM exam_papers ep
      LEFT JOIN users uu ON ep.uploaded_by = uu.id
      LEFT JOIN users au ON ep.approved_by = au.id
      WHERE (? = 1) OR ep.is_approved = TRUE
      ORDER BY ep.uploaded_at DESC
      `,
      [canSeeAll ? 1 : 0]
    );

    const data = rows.map(r => ({
      id: r.id,
      title: r.title,
      course: r.course || undefined,
      year: r.year || undefined,
      semester: r.semester || undefined,
      fileUrl: publicUploadUrl(r.file_path),
      isApproved: !!r.is_approved,
      uploadedBy: r.uploaded_by,
      uploadedByName: r.uploadedByName,
      approvedBy: r.approved_by || undefined,
      approvedByName: r.approvedByName || undefined,
      uploadedAt: r.uploaded_at ? new Date(r.uploaded_at).toISOString() : new Date().toISOString(),
      approvedAt: r.approved_at ? new Date(r.approved_at).toISOString() : undefined,
    }));

    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// Upload exam paper (admin/librarian only)
router.post('/', authenticate, isLibrarian, upload.single('pdfFile'), async (req, res, next) => {
  try {
    const { title, course, year, semester } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'PDF file is required' });
    }
    if (!title) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const id = uuidv4();
    const filePath = `/uploads/${req.file.filename}`;
    const now = new Date().toISOString();

    await pool.query(
      `
      INSERT INTO exam_papers
        (id, title, course, year, semester, file_path, is_approved, uploaded_by, uploaded_at)
      VALUES (?, ?, ?, ?, ?, ?, FALSE, ?, ?)
      `,
      [
        id,
        title,
        course || null,
        year ? Number(year) : null,
        semester || null,
        filePath,
        req.user.id,
        now,
      ]
    );

    res.status(201).json({
      success: true,
      data: {
        id,
        title,
        course: course || undefined,
        year: year ? Number(year) : undefined,
        semester: semester || undefined,
        fileUrl: publicUploadUrl(filePath),
        isApproved: false,
        uploadedBy: req.user.id,
        uploadedAt: now,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Approve / unapprove (admin/librarian only)
router.post('/:id/approve', authenticate, isLibrarian, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    const isApproved = approved === true || approved === 'true' || approved === 1 || approved === '1';

    const [existing] = await pool.query('SELECT id FROM exam_papers WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'Exam paper not found' });
    }

    await pool.query(
      `
      UPDATE exam_papers
      SET is_approved = ?,
          approved_by = ?,
          approved_at = ?
      WHERE id = ?
      `,
      [isApproved ? 1 : 0, isApproved ? req.user.id : null, isApproved ? new Date().toISOString() : null, id]
    );

    res.json({ success: true, data: { id, isApproved } });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

