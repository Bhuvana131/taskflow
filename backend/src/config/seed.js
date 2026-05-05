// backend/src/config/seed.js
// Run: node src/config/seed.js
require('dotenv').config();
const bcrypt = require('bcryptjs');
const { query } = require('./db');

const seed = async () => {
  try {
    console.log('🌱 Seeding database...');

    // Clear existing data (order matters for FK constraints)
    await query('DELETE FROM tasks');
    await query('DELETE FROM project_members');
    await query('DELETE FROM projects');
    await query('DELETE FROM users');

    // Create users
    const adminHash  = await bcrypt.hash('admin123', 10);
    const memberHash = await bcrypt.hash('member123', 10);

    const { rows: [admin] } = await query(`
      INSERT INTO users (name, email, password, role, color)
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      ['Admin User', 'admin@demo.com', adminHash, 'admin', '#185FA5']
    );

    const { rows: [alice] } = await query(`
      INSERT INTO users (name, email, password, role, color)
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      ['Alice Johnson', 'alice@demo.com', memberHash, 'member', '#0F6E56']
    );

    const { rows: [bob] } = await query(`
      INSERT INTO users (name, email, password, role, color)
      VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      ['Bob Smith', 'bob@demo.com', memberHash, 'member', '#993C1D']
    );

    // Create projects
    const { rows: [proj1] } = await query(`
      INSERT INTO projects (name, description, owner_id)
      VALUES ($1, $2, $3) RETURNING *`,
      ['Website Redesign', 'Redesign the company website with modern UI/UX', admin.id]
    );

    const { rows: [proj2] } = await query(`
      INSERT INTO projects (name, description, owner_id)
      VALUES ($1, $2, $3) RETURNING *`,
      ['Mobile App MVP', 'Build the first version of the mobile application', admin.id]
    );

    // Add members to projects
    await query(`INSERT INTO project_members VALUES ($1,$2)`, [proj1.id, admin.id]);
    await query(`INSERT INTO project_members VALUES ($1,$2)`, [proj1.id, alice.id]);
    await query(`INSERT INTO project_members VALUES ($1,$2)`, [proj1.id, bob.id]);
    await query(`INSERT INTO project_members VALUES ($1,$2)`, [proj2.id, admin.id]);
    await query(`INSERT INTO project_members VALUES ($1,$2)`, [proj2.id, bob.id]);

    // Create tasks
    const tasksData = [
      ['Design homepage mockup',   'Create Figma mockup for the new homepage', 'done',        'high',   '2025-01-15', proj1.id, alice.id,  admin.id],
      ['Implement header nav',     'Build responsive navigation component',     'in_progress', 'high',   '2025-02-10', proj1.id, bob.id,    admin.id],
      ['Write content copy',       'Draft copy for all landing page sections',  'todo',        'medium', '2025-02-20', proj1.id, alice.id,  admin.id],
      ['SEO optimization',         'Add meta tags and structured data',          'todo',        'low',    '2025-03-01', proj1.id, bob.id,    admin.id],
      ['Setup React Native',       'Initialize RN project with navigation',     'done',        'high',   '2025-01-20', proj2.id, bob.id,    admin.id],
      ['Auth screens',             'Build login, signup, forgot password',      'in_progress', 'high',   '2025-02-15', proj2.id, bob.id,    admin.id],
      ['API integration layer',    'Connect mobile app to REST APIs',           'todo',        'high',   '2025-02-25', proj2.id, admin.id,  admin.id],
      ['Push notifications',       'Implement FCM push notifications',          'todo',        'medium', '2025-03-10', proj2.id, bob.id,    admin.id],
    ];

    for (const [title, desc, status, priority, due, pid, assignee, creator] of tasksData) {
      await query(`
        INSERT INTO tasks (title, description, status, priority, due_date, project_id, assignee_id, created_by)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [title, desc, status, priority, due, pid, assignee, creator]
      );
    }

    console.log('✅ Seed completed:');
    console.log('   admin@demo.com   / admin123  (Admin)');
    console.log('   alice@demo.com   / member123 (Member)');
    console.log('   bob@demo.com     / member123 (Member)');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
