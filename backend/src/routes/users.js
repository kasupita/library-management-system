const express = require('express');
const pool = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { isAdmin } = require('../middleware/roleCheck');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
const validRoles = ['admin', 'librarian', 'hod', 'student'];

function normalizeStudentId(studentId) {
  if (typeof studentId !== 'string') return null;
  const trimmed = studentId.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

function isValidSibaStudentId(studentId) {
  const normalized = normalizeStudentId(studentId);
  if (!normalized) return false;
  return /^[a-z]{5}\d{6}$/.test(normalized);
}

// Get current user
router.get('/me', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.email, u.student_id, u.department, u.avatar, u.created_at, ur.role 
      FROM users u 
      LEFT JOIN user_roles ur ON u.id = ur.user_id 
      WHERE u.id = ?
    `, [req.user.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const u = rows[0];
    res.json({
      success: true,
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        studentId: u.student_id || undefined,
        role: u.role,
        department: u.department || undefined,
        avatar: u.avatar || undefined,
        createdAt: u.created_at ? new Date(u.created_at).toISOString() : new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Create user (admin only)
router.post('/', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { name, email, password, department, role, studentId } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, error: 'name, email, password, role are required' });
    }
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const normalizedStudentId = normalizeStudentId(studentId);
    if (role === 'student') {
      if (!normalizedStudentId) {
        return res.status(400).json({ success: false, error: 'Student ID is required for student accounts' });
      }
      if (!isValidSibaStudentId(normalizedStudentId)) {
        return res.status(400).json({ success: false, error: 'Invalid Student ID format. Example: bscwd234008' });
      }
    } else {
      // only students should have studentId
      if (normalizedStudentId) {
        return res.status(400).json({ success: false, error: 'Student ID can only be set for student accounts' });
      }
    }

    const [dupEmail] = await pool.query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
    if (dupEmail.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }

    if (normalizedStudentId) {
      const [dupSid] = await pool.query('SELECT id FROM users WHERE student_id = ? LIMIT 1', [normalizedStudentId]);
      if (dupSid.length > 0) {
        return res.status(400).json({ success: false, error: 'Student ID already registered' });
      }
    }

    const userId = uuidv4();
    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    await pool.query(
      'INSERT INTO users (id, name, email, student_id, password, department, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, name, email, normalizedStudentId || null, hashedPassword, department || null, now]
    );
    await pool.query(
      'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
      [uuidv4(), userId, role]
    );

    res.status(201).json({
      success: true,
      data: {
        id: userId,
        name,
        email,
        studentId: normalizedStudentId || undefined,
        role,
        department: department || undefined,
        createdAt: now,
      },
    });
  } catch (error) {
    next(error);
  }
});

// Get all users (admin only)
router.get('/', authenticate, isAdmin, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.email, u.student_id, u.department, u.avatar, u.created_at, ur.role 
      FROM users u 
      LEFT JOIN user_roles ur ON u.id = ur.user_id 
      ORDER BY u.created_at DESC
    `);

    const users = rows.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      studentId: u.student_id || undefined,
      role: u.role,
      department: u.department || undefined,
      avatar: u.avatar || undefined,
      createdAt: u.created_at ? new Date(u.created_at).toISOString() : new Date().toISOString(),
    }));
    res.json({ success: true, data: users });
  } catch (error) {
    next(error);
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.email, u.student_id, u.department, u.avatar, u.created_at, ur.role 
      FROM users u 
      LEFT JOIN user_roles ur ON u.id = ur.user_id 
      WHERE u.id = ?
    `, [req.params.id]);

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const u = rows[0];
    res.json({
      success: true,
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        studentId: u.student_id || undefined,
        role: u.role,
        department: u.department || undefined,
        avatar: u.avatar || undefined,
        createdAt: u.created_at ? new Date(u.created_at).toISOString() : new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Update user (admin only)
router.put('/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, department, role } = req.body;

    const [existing] = await pool.query('SELECT id FROM users WHERE id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (email) {
      const [dup] = await pool.query('SELECT id FROM users WHERE email = ? AND id != ?', [email, id]);
      if (dup.length > 0) {
        return res.status(400).json({ success: false, error: 'Email already in use' });
      }
    }

    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (email !== undefined) { updates.push('email = ?'); values.push(email); }
    if (department !== undefined) { updates.push('department = ?'); values.push(department || null); }

    if (updates.length > 0) {
      values.push(id);
      await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    }

    if (role && validRoles.includes(role)) {
      await pool.query('UPDATE user_roles SET role = ? WHERE user_id = ?', [role, id]);
    }

    const [rows] = await pool.query(`
      SELECT u.id, u.name, u.email, u.student_id, u.department, u.avatar, u.created_at, ur.role 
      FROM users u 
      LEFT JOIN user_roles ur ON u.id = ur.user_id 
      WHERE u.id = ?
    `, [id]);

    const u = rows[0];
    res.json({
      success: true,
      data: {
        id: u.id,
        name: u.name,
        email: u.email,
        studentId: u.student_id || undefined,
        role: u.role,
        department: u.department || undefined,
        avatar: u.avatar || undefined,
        createdAt: u.created_at ? new Date(u.created_at).toISOString() : new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, isAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ success: false, error: 'You cannot delete your own account' });
    }

    const [existing] = await pool.query(
      `SELECT u.id, ur.role FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.id = ?`,
      [id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (existing[0].role === 'admin') {
      const [[{ adminCount }]] = await pool.query(
        "SELECT COUNT(*) as adminCount FROM user_roles WHERE role = 'admin'"
      );
      if (parseInt(adminCount) <= 1) {
        return res.status(400).json({ success: false, error: 'Cannot delete the last administrator' });
      }
    }

    const [[{ activeLoans }]] = await pool.query(
      `SELECT COUNT(*) as activeLoans FROM borrow_records
       WHERE user_id = ? AND status IN ('borrowed', 'overdue')`,
      [id]
    );
    if (parseInt(activeLoans) > 0) {
      return res.status(400).json({
        success: false,
        error: 'User has active loans. Return all books before deleting this account.',
      });
    }

    const [[{ pendingRequests }]] = await pool.query(
      "SELECT COUNT(*) as pendingRequests FROM book_requests WHERE user_id = ? AND status = 'pending'",
      [id]
    );
    if (parseInt(pendingRequests) > 0) {
      return res.status(400).json({
        success: false,
        error: 'User has pending book requests. Cancel or process them before deleting.',
      });
    }

    const [[{ examPaperCount }]] = await pool.query(
      'SELECT COUNT(*) as examPaperCount FROM exam_papers WHERE uploaded_by = ?',
      [id]
    );
    if (parseInt(examPaperCount) > 0) {
      return res.status(400).json({
        success: false,
        error: 'User uploaded exam papers. Reassign or remove those records before deleting.',
      });
    }

    await pool.query('DELETE FROM users WHERE id = ?', [id]);

    res.json({ success: true, data: null });
  } catch (error) {
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.errno === 1451) {
      return res.status(400).json({
        success: false,
        error: 'User is linked to other records and cannot be deleted.',
      });
    }
    next(error);
  }
});

module.exports = router;
