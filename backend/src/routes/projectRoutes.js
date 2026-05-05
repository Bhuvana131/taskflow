// backend/src/routes/projectRoutes.js
const router = require('express').Router();
const { body } = require('express-validator');
const {
  getProjects, getProjectById, createProject,
  updateProject, deleteProject, getProjectStats,
} = require('../controllers/projectsController');
const { protect, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

router.use(protect);

// GET /api/projects
router.get('/', getProjects);

// GET /api/projects/:id
router.get('/:id', getProjectById);

// GET /api/projects/:id/stats
router.get('/:id/stats', getProjectStats);

// POST /api/projects  — Admin only
router.post(
  '/',
  adminOnly,
  [
    body('name').trim().notEmpty().withMessage('Project name is required'),
    body('memberIds').optional().isArray().withMessage('memberIds must be an array'),
  ],
  validate,
  createProject
);

// PUT /api/projects/:id  — Admin only
router.put(
  '/:id',
  adminOnly,
  [
    body('name').optional().trim().notEmpty().withMessage('Project name cannot be empty'),
    body('memberIds').optional().isArray().withMessage('memberIds must be an array'),
  ],
  validate,
  updateProject
);

// DELETE /api/projects/:id  — Admin only
router.delete('/:id', adminOnly, deleteProject);

module.exports = router;
