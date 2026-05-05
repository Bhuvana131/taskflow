// backend/src/config/migrate.js
// Run: node src/config/migrate.js
require('dotenv').config();
const { query } = require('./db');

const migrate = async () => {
  try {
    console.log('🔄 Running migrations...');

    // Enable UUID extension
    await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    // USERS table
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name        VARCHAR(100) NOT NULL,
        email       VARCHAR(150) UNIQUE NOT NULL,
        password    VARCHAR(255) NOT NULL,
        role        VARCHAR(20) NOT NULL DEFAULT 'member'
                    CHECK (role IN ('admin', 'member')),
        color       VARCHAR(20) DEFAULT '#185FA5',
        created_at  TIMESTAMP DEFAULT NOW(),
        updated_at  TIMESTAMP DEFAULT NOW()
      )
    `);

    // PROJECTS table
    await query(`
      CREATE TABLE IF NOT EXISTS projects (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        name        VARCHAR(200) NOT NULL,
        description TEXT,
        owner_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at  TIMESTAMP DEFAULT NOW(),
        updated_at  TIMESTAMP DEFAULT NOW()
      )
    `);

    // PROJECT_MEMBERS join table (many-to-many)
    await query(`
      CREATE TABLE IF NOT EXISTS project_members (
        project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at   TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (project_id, user_id)
      )
    `);

    // TASKS table
    await query(`
      CREATE TABLE IF NOT EXISTS tasks (
        id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        title       VARCHAR(300) NOT NULL,
        description TEXT,
        status      VARCHAR(30) NOT NULL DEFAULT 'todo'
                    CHECK (status IN ('todo', 'in_progress', 'done')),
        priority    VARCHAR(20) NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low', 'medium', 'high')),
        due_date    DATE,
        project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
        created_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at  TIMESTAMP DEFAULT NOW(),
        updated_at  TIMESTAMP DEFAULT NOW()
      )
    `);

    // Indexes for performance
    await query(`CREATE INDEX IF NOT EXISTS idx_tasks_project   ON tasks(project_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_tasks_assignee  ON tasks(assignee_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_tasks_status    ON tasks(status)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_pm_project      ON project_members(project_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_pm_user         ON project_members(user_id)`);

    // Updated_at auto-update trigger function
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql
    `);

    for (const table of ['users', 'projects', 'tasks']) {
      await query(`
        DROP TRIGGER IF EXISTS trg_${table}_updated ON ${table};
        CREATE TRIGGER trg_${table}_updated
        BEFORE UPDATE ON ${table}
        FOR EACH ROW EXECUTE FUNCTION update_updated_at()
      `);
    }

    console.log('✅ All migrations completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
};

migrate();
