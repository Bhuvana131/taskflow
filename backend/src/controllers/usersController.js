// backend/src/controllers/usersController.js
const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

// GET /api/users  — Admin: all users; Member: users in shared projects
const getUsers = async (req, res, next) => {
  try {
    let rows;
    if (req.user.role === 'admin') {
      ({ rows } = await query(
        'SELECT id, name, email, role, color, created_at FROM users ORDER BY created_at ASC'
      ));
    } else {
      // Return users who share at least one project with the current user
      ({ rows } = await query(`
        SELECT DISTINCT u.id, u.name, u.email, u.role, u.color, u.created_at
        FROM users u
        JOIN project_members pm ON pm.user_id = u.id
        WHERE pm.project_id IN (
          SELECT project_id FROM project_members WHERE user_id = $1
        )
        ORDER BY u.created_at ASC
      `, [req.user.id]));
    }
    res.json({ users: rows });
  } catch (err) {
    next(err);
  }
};

// GET /api/users/:id
const getUserById = async (req, res, next) => {
  try {
    const { rows } = await query(
      'SELECT id, name, email, role, color, created_at FROM users WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
};

// PUT /api/users/:id  — Admin only
const updateUser = async (req, res, next) => {
  try {
    const { name, role, password } = req.body;
    const updates = [];
    const values = [];
    let i = 1;

    if (name)  { updates.push(`name = $${i++}`);  values.push(name.trim()); }
    if (role)  { updates.push(`role = $${i++}`);  values.push(role); }
    if (password) {
      const hashed = await bcrypt.hash(password, 12);
      updates.push(`password = $${i++}`);
      values.push(hashed);
    }

    if (!updates.length) return res.status(400).json({ message: 'Nothing to update.' });

    values.push(req.params.id);
    const { rows } = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${i}
       RETURNING id, name, email, role, color, created_at`,
      values
    );
    if (!rows.length) return res.status(404).json({ message: 'User not found.' });
    res.json({ user: rows[0] });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/users/:id  — Admin only
const deleteUser = async (req, res, next) => {
  try {
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }
    const { rowCount } = await query('DELETE FROM users WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'User not found.' });
    res.json({ message: 'User deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUserById, updateUser, deleteUser };
