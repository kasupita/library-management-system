const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const pool = require('../config/database');

const router = express.Router();

function normalizeStudentId(studentId) {
  if (typeof studentId !== 'string') return null;
  const trimmed = studentId.trim();
  if (!trimmed) return null;
  return trimmed.toLowerCase();
}

// Example: bscwd234008 (5 letters + 6 digits)
function isValidSibaStudentId(studentId) {
  const normalized = normalizeStudentId(studentId);
  if (!normalized) return false;
  return /^[a-z]{5}\d{6}$/.test(normalized);
}

// Register
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password, department, studentId } = req.body;
    const normalizedStudentId = normalizeStudentId(studentId);

    if (normalizedStudentId && !isValidSibaStudentId(normalizedStudentId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid Student ID format. Example: bscwd234008',
      });
    }

    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(400).json({ success: false, error: 'Email already registered' });
    }

    if (normalizedStudentId) {
      const [existingStudentId] = await pool.query('SELECT id FROM users WHERE student_id = ?', [normalizedStudentId]);
      if (existingStudentId.length > 0) {
        return res.status(400).json({ success: false, error: 'Student ID already registered' });
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = uuidv4();
    const now = new Date().toISOString();

    // Create user
    await pool.query(
      'INSERT INTO users (id, name, email, student_id, password, department, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, name, email, normalizedStudentId || null, hashedPassword, department || null, now]
    );

    // Assign default role (student)
    await pool.query(
      'INSERT INTO user_roles (id, user_id, role) VALUES (?, ?, ?)',
      [uuidv4(), userId, 'student']
    );

    // Generate token
    const token = jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Fetch created user
    const [users] = await pool.query(
      'SELECT u.id, u.name, u.email, u.student_id, u.department, u.avatar, u.created_at, ur.role FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id WHERE u.id = ?',
      [userId]
    );
    const u = users[0];
    const formattedUser = {
      id: u.id,
      name: u.name,
      email: u.email,
      studentId: u.student_id || undefined,
      role: u.role,
      department: u.department || undefined,
      avatar: u.avatar || undefined,
      createdAt: u.created_at ? new Date(u.created_at).toISOString() : new Date().toISOString(),
    };

    res.status(201).json({
      success: true,
      data: { token, user: formattedUser },
    });
  } catch (error) {
    next(error);
  }
});

// Login
router.post('/login', async (req, res, next) => {
  try {
    const { identifier, email, studentId, password } = req.body;
    const loginIdRaw = identifier ?? email ?? studentId;
    const loginId = typeof loginIdRaw === 'string' ? loginIdRaw.trim() : '';

    if (!loginId || !password) {
      return res.status(400).json({ success: false, error: 'Identifier and password are required' });
    }

    const normalizedStudentId = normalizeStudentId(loginId);

    // Find user
    const [users] = await pool.query(
      'SELECT u.*, ur.role FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id WHERE u.email = ? OR u.student_id = ?',
      [loginId, normalizedStudentId]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    const user = users[0];

    // Check password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Remove password and format user for frontend (camelCase)
    delete user.password;
    const formattedUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      studentId: user.student_id || undefined,
      role: user.role,
      department: user.department || undefined,
      avatar: user.avatar || undefined,
      createdAt: user.created_at ? new Date(user.created_at).toISOString() : new Date().toISOString(),
    };

    res.json({
      success: true,
      data: { token, user: formattedUser },
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
