// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');

// Verify JWT token and attach user to req
const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No token provided. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Fetch fresh user data
    const { rows } = await query(
      'SELECT id, name, email, role, color, created_at FROM users WHERE id = $1',
      [decoded.id]
    );

    if (!rows.length) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ message: 'Invalid token.' });
  }
};

// Restrict to admin only
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Access denied. Admins only.' });
  }
  next();
};

// Check if user is member of a project
const projectMember = async (req, res, next) => {
  try {
    const projectId = req.params.projectId || req.body.projectId;
    if (!projectId) return next();

    if (req.user.role === 'admin') return next(); // Admins bypass

    const { rows } = await query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, req.user.id]
    );

    if (!rows.length) {
      return res.status(403).json({ message: 'You are not a member of this project.' });
    }
    next();
  } catch (err) {
    next(err);
  }
};

module.exports = { protect, adminOnly, projectMember };
