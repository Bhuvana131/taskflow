// backend/src/controllers/tasksController.js
const { query } = require('../config/db');

const TASK_SELECT = `
  SELECT
    t.*,
    p.name  AS project_name,
    a.name  AS assignee_name,
    a.email AS assignee_email,
    a.color AS assignee_color,
    c.name  AS creator_name
  FROM tasks t
  JOIN projects p ON p.id = t.project_id
  LEFT JOIN users a ON a.id = t.assignee_id
  JOIN users c ON c.id = t.created_by
`;

const formatTask = (row) => ({
  id:          row.id,
  title:       row.title,
  description: row.description,
  status:      row.status,
  priority:    row.priority,
  dueDate:     row.due_date,
  projectId:   row.project_id,
  projectName: row.project_name,
  assignee: row.assignee_id ? {
    id:    row.assignee_id,
    name:  row.assignee_name,
    email: row.assignee_email,
    color: row.assignee_color,
  } : null,
  createdBy:   row.created_by,
  creatorName: row.creator_name,
  createdAt:   row.created_at,
  updatedAt:   row.updated_at,
  isOverdue:   row.due_date && row.status !== 'done' && new Date(row.due_date) < new Date(),
});

// GET /api/tasks  (optional ?projectId=, ?status=, ?assignee=, ?priority=)
const getTasks = async (req, res, next) => {
  try {
    const { projectId, status, assigneeId, priority } = req.query;

    let where = [];
    let values = [];
    let i = 1;

    // Non-admins only see tasks in their projects
    if (req.user.role !== 'admin') {
      where.push(`t.project_id IN (
        SELECT project_id FROM project_members WHERE user_id = $${i++}
      )`);
      values.push(req.user.id);
    }

    if (projectId)  { where.push(`t.project_id  = $${i++}`); values.push(projectId); }
    if (status)     { where.push(`t.status       = $${i++}`); values.push(status); }
    if (assigneeId) { where.push(`t.assignee_id  = $${i++}`); values.push(assigneeId); }
    if (priority)   { where.push(`t.priority     = $${i++}`); values.push(priority); }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const { rows } = await query(
      `${TASK_SELECT} ${whereClause} ORDER BY t.created_at DESC`,
      values
    );

    res.json({ tasks: rows.map(formatTask) });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/:id
const getTaskById = async (req, res, next) => {
  try {
    const { rows } = await query(`${TASK_SELECT} WHERE t.id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: 'Task not found.' });

    const task = formatTask(rows[0]);

    // Members can only see tasks in their projects
    if (req.user.role !== 'admin') {
      const { rows: mem } = await query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [task.projectId, req.user.id]
      );
      if (!mem.length) return res.status(403).json({ message: 'Access denied.' });
    }

    res.json({ task });
  } catch (err) {
    next(err);
  }
};

// POST /api/tasks  — Admin only
const createTask = async (req, res, next) => {
  try {
    const { title, description, status = 'todo', priority = 'medium', dueDate, projectId, assigneeId } = req.body;

    // Verify project exists
    const { rows: proj } = await query('SELECT id FROM projects WHERE id = $1', [projectId]);
    if (!proj.length) return res.status(404).json({ message: 'Project not found.' });

    const { rows } = await query(`
      INSERT INTO tasks (title, description, status, priority, due_date, project_id, assignee_id, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id
    `, [title.trim(), description?.trim() || null, status, priority, dueDate || null, projectId, assigneeId || null, req.user.id]);

    const { rows: full } = await query(`${TASK_SELECT} WHERE t.id = $1`, [rows[0].id]);
    res.status(201).json({ task: formatTask(full[0]) });
  } catch (err) {
    next(err);
  }
};

// PUT /api/tasks/:id  — Admin or assigned member can update status
const updateTask = async (req, res, next) => {
  try {
    const { rows: existing } = await query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (!existing.length) return res.status(404).json({ message: 'Task not found.' });

    const task = existing[0];

    // Members can only update status of their own tasks
    if (req.user.role !== 'admin') {
      if (task.assignee_id !== req.user.id) {
        return res.status(403).json({ message: 'Only admins or the assigned user can update this task.' });
      }
      // Members can only change status
      const { status } = req.body;
      if (!status) return res.status(400).json({ message: 'Members can only update task status.' });
      const { rows } = await query(
        `UPDATE tasks SET status = $1 WHERE id = $2 RETURNING id`,
        [status, req.params.id]
      );
      const { rows: full } = await query(`${TASK_SELECT} WHERE t.id = $1`, [rows[0].id]);
      return res.json({ task: formatTask(full[0]) });
    }

    // Admin: full update
    const { title, description, status, priority, dueDate, projectId, assigneeId } = req.body;
    const updates = [];
    const values = [];
    let i = 1;

    if (title       !== undefined) { updates.push(`title       = $${i++}`); values.push(title?.trim()); }
    if (description !== undefined) { updates.push(`description = $${i++}`); values.push(description?.trim() || null); }
    if (status      !== undefined) { updates.push(`status      = $${i++}`); values.push(status); }
    if (priority    !== undefined) { updates.push(`priority    = $${i++}`); values.push(priority); }
    if (dueDate     !== undefined) { updates.push(`due_date    = $${i++}`); values.push(dueDate || null); }
    if (projectId   !== undefined) { updates.push(`project_id  = $${i++}`); values.push(projectId); }
    if (assigneeId  !== undefined) { updates.push(`assignee_id = $${i++}`); values.push(assigneeId || null); }

    if (!updates.length) return res.status(400).json({ message: 'Nothing to update.' });

    values.push(req.params.id);
    const { rows } = await query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = $${i} RETURNING id`,
      values
    );

    const { rows: full } = await query(`${TASK_SELECT} WHERE t.id = $1`, [rows[0].id]);
    res.json({ task: formatTask(full[0]) });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/tasks/:id  — Admin only
const deleteTask = async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Task not found.' });
    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/tasks/dashboard  — summary stats for current user
const getDashboardStats = async (req, res, next) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const uid = req.user.id;

    const projectFilter = isAdmin ? '' : `
      AND t.project_id IN (
        SELECT project_id FROM project_members WHERE user_id = '${uid}'
      )
    `;

    const { rows: stats } = await query(`
      SELECT
        COUNT(*)                                             AS total,
        COUNT(*) FILTER (WHERE t.status = 'todo')           AS todo,
        COUNT(*) FILTER (WHERE t.status = 'in_progress')    AS in_progress,
        COUNT(*) FILTER (WHERE t.status = 'done')           AS done,
        COUNT(*) FILTER (
          WHERE t.due_date < CURRENT_DATE AND t.status != 'done'
        )                                                    AS overdue
      FROM tasks t
      WHERE 1=1 ${projectFilter}
    `);

    const { rows: myTasks } = await query(`
      ${TASK_SELECT}
      WHERE t.assignee_id = $1
      ORDER BY t.created_at DESC LIMIT 10
    `, [uid]);

    res.json({
      stats: stats[0],
      myTasks: myTasks.map(formatTask),
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getTasks, getTaskById, createTask, updateTask, deleteTask, getDashboardStats };
