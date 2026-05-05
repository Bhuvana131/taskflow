// backend/src/routes/userRoutes.js
const router = require('express').Router();
const { body } = require('express-validator');
const { getUsers, getUserById, updateUser, deleteUser } = require('../controllers/usersController');
const { protect, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

// All routes require auth
router.use(protect);

// GET /api/users
router.get('/', getUsers);

// GET /api/users/:id
router.get('/:id', getUserById);

// PUT /api/users/:id  — Admin only
router.put(
  '/:id',
  adminOnly,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('role').optional().isIn(['admin', 'member']).withMessage('Role must be admin or member'),
    body('password').optional().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validate,
  updateUser
);

// DELETE /api/users/:id  — Admin only
router.delete('/:id', adminOnly, deleteUser);

module.exports = router;
