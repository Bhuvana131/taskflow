// backend/src/controllers/projectsController.js
const { query, getClient } = require('../config/db');

// Attach members array to each project
const attachMembers = async (projects) => {
  if (!projects.length) return projects;
  const ids = projects.map(p => p.id);
  const { rows: members } = await query(`
    SELECT pm.project_id, u.id, u.name, u.email, u.role, u.color
    FROM project_members pm
    JOIN users u ON u.id = pm.user_id
    WHERE pm.project_id = ANY($1::uuid[])
  `, [ids]);

  return projects.map(p => ({
    ...p,
    members: members.filter(m => m.project_id === p.id).map(m => ({
      id: m.id, name: m.name, email: m.email, role: m.role, color: m.color,
    })),
  }));
};

// GET /api/projects
const getProjects = async (req, res, next) => {
  try {
    let rows;
    if (req.user.role === 'admin') {
      ({ rows } = await query(`
        SELECT p.*, u.name AS owner_name
        FROM projects p
        JOIN users u ON u.id = p.owner_id
        ORDER BY p.created_at DESC
      `));
    } else {
      ({ rows } = await query(`
        SELECT p.*, u.name AS owner_name
        FROM projects p
        JOIN users u ON u.id = p.owner_id
        JOIN project_members pm ON pm.project_id = p.id
        WHERE pm.user_id = $1
        ORDER BY p.created_at DESC
      `, [req.user.id]));
    }
    const projects = await attachMembers(rows);
    res.json({ projects });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id
const getProjectById = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT p.*, u.name AS owner_name
      FROM projects p JOIN users u ON u.id = p.owner_id
      WHERE p.id = $1
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ message: 'Project not found.' });

    // Members check for non-admin
    if (req.user.role !== 'admin') {
      const { rows: mem } = await query(
        'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
        [req.params.id, req.user.id]
      );
      if (!mem.length) return res.status(403).json({ message: 'Access denied.' });
    }

    const [project] = await attachMembers(rows);
    res.json({ project });
  } catch (err) {
    next(err);
  }
};

// POST /api/projects  — Admin only
const createProject = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { name, description, memberIds = [] } = req.body;

    const { rows } = await client.query(
      `INSERT INTO projects (name, description, owner_id)
       VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), description?.trim() || null, req.user.id]
    );
    const project = rows[0];

    // Always add creator as member
    const allMembers = [...new Set([req.user.id, ...memberIds])];
    for (const uid of allMembers) {
      await client.query(
        'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [project.id, uid]
      );
    }

    await client.query('COMMIT');

    const [full] = await attachMembers([project]);
    res.status(201).json({ project: full });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// PUT /api/projects/:id  — Admin only
const updateProject = async (req, res, next) => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { name, description, memberIds } = req.body;
    const updates = [];
    const values = [];
    let i = 1;

    if (name)        { updates.push(`name = $${i++}`);        values.push(name.trim()); }
    if (description !== undefined) { updates.push(`description = $${i++}`); values.push(description?.trim() || null); }

    if (updates.length) {
      values.push(req.params.id);
      const { rows } = await client.query(
        `UPDATE projects SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
        values
      );
      if (!rows.length) {
        await client.query('ROLLBACK');
        return res.status(404).json({ message: 'Project not found.' });
      }
    }

    // Sync members
    if (Array.isArray(memberIds)) {
      await client.query('DELETE FROM project_members WHERE project_id = $1', [req.params.id]);
      const allMembers = [...new Set([req.user.id, ...memberIds])];
      for (const uid of allMembers) {
        await client.query(
          'INSERT INTO project_members (project_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [req.params.id, uid]
        );
      }
    }

    await client.query('COMMIT');

    const { rows: updated } = await query(`
      SELECT p.*, u.name AS owner_name FROM projects p
      JOIN users u ON u.id = p.owner_id WHERE p.id = $1
    `, [req.params.id]);

    const [project] = await attachMembers(updated);
    res.json({ project });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// DELETE /api/projects/:id  — Admin only
const deleteProject = async (req, res, next) => {
  try {
    const { rowCount } = await query('DELETE FROM projects WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ message: 'Project not found.' });
    res.json({ message: 'Project deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

// GET /api/projects/:id/stats
const getProjectStats = async (req, res, next) => {
  try {
    const { rows } = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'todo')        AS todo,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress,
        COUNT(*) FILTER (WHERE status = 'done')        AS done,
        COUNT(*) FILTER (WHERE due_date < NOW() AND status != 'done') AS overdue,
        COUNT(*)                                       AS total
      FROM tasks WHERE project_id = $1
    `, [req.params.id]);
    res.json({ stats: rows[0] });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProjects, getProjectById, createProject, updateProject, deleteProject, getProjectStats };
