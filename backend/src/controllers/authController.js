// backend/src/controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

const COLORS = ['#185FA5', '#0F6E56', '#993C1D', '#533AB7', '#993556', '#854F0B'];

// Generate signed JWT
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

// Format user for response (strip password)
const formatUser = (user) => ({
  id:        user.id,
  name:      user.name,
  email:     user.email,
  role:      user.role,
  color:     user.color,
  createdAt: user.created_at,
});

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'member' } = req.body;

    // Check duplicate email
    const existing = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) {
      return res.status(409).json({ message: 'Email already registered.' });
    }

    // Assign a color based on total user count
    const countResult = await query('SELECT COUNT(*) FROM users');
    const count = parseInt(countResult.rows[0].count, 10);
    const color = COLORS[count % COLORS.length];

    // Hash password
    const hashed = await bcrypt.hash(password, 12);

    const { rows } = await query(
      `INSERT INTO users (name, email, password, role, color)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), email.toLowerCase().trim(), hashed, role, color]
    );

    const token = signToken(rows[0].id);
    res.status(201).json({ token, user: formatUser(rows[0]) });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const { rows } = await query('SELECT * FROM users WHERE email = $1', [
      email.toLowerCase().trim(),
    ]);

    if (!rows.length || !(await bcrypt.compare(password, rows[0].password))) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    const token = signToken(rows[0].id);
    res.json({ token, user: formatUser(rows[0]) });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  res.json({ user: formatUser(req.user) });
};

// PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, currentPassword, newPassword } = req.body;

    // If changing password, verify current one
    if (newPassword) {
      const { rows } = await query('SELECT password FROM users WHERE id = $1', [req.user.id]);
      const match = await bcrypt.compare(currentPassword || '', rows[0].password);
      if (!match) {
        return res.status(400).json({ message: 'Current password is incorrect.' });
      }
      const hashed = await bcrypt.hash(newPassword, 12);
      await query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
    }

    if (name) {
      await query('UPDATE users SET name = $1 WHERE id = $2', [name.trim(), req.user.id]);
    }

    const { rows } = await query(
      'SELECT id, name, email, role, color, created_at FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json({ user: formatUser(rows[0]) });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, getMe, updateProfile };
