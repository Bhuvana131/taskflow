// backend/src/routes/taskRoutes.js
const router = require('express').Router();
const { body } = require('express-validator');
const {
  getTasks, getTaskById, createTask,
  updateTask, deleteTask, getDashboardStats,
} = require('../controllers/tasksController');
const { protect, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

router.use(protect);

// GET /api/tasks/dashboard
router.get('/dashboard', getDashboardStats);

// GET /api/tasks
router.get('/', getTasks);

// GET /api/tasks/:id
router.get('/:id', getTaskById);

// POST /api/tasks  — Admin only
router.post(
  '/',
  adminOnly,
  [
    body('title').trim().notEmpty().withMessage('Task title is required'),
    body('projectId').isUUID().withMessage('Valid project ID is required'),
    body('status').optional().isIn(['todo', 'in_progress', 'done']).withMessage('Invalid status'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Due date must be a valid date'),
    body('assigneeId').optional({ nullable: true }).isUUID().withMessage('Assignee must be a valid UUID'),
  ],
  validate,
  createTask
);

// PUT /api/tasks/:id
router.put(
  '/:id',
  [
    body('status').optional().isIn(['todo', 'in_progress', 'done']).withMessage('Invalid status'),
    body('priority').optional().isIn(['low', 'medium', 'high']).withMessage('Invalid priority'),
    body('dueDate').optional({ nullable: true }).isISO8601().withMessage('Due date must be a valid date'),
  ],
  validate,
  updateTask
);

// DELETE /api/tasks/:id  — Admin only
router.delete('/:id', adminOnly, deleteTask);

module.exports = router;
