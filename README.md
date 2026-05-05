# TaskFlow — Team Task Manager

A full-stack web application where teams can create projects, assign tasks, and track progress with **role-based access control** (Admin / Member).

---

## Features

- **Authentication** — JWT-based signup & login
- **Role-based access** — Admins manage everything; Members view and update their tasks
- **Projects** — Create projects, add members, track overall progress
- **Tasks** — Kanban board + list view with status, priority, due date, and assignee
- **Dashboard** — Live metrics: total tasks, in-progress, overdue; personal task feed
- **Team** — View all members, completion stats, role management

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, React Router v6, Axios    |
| Backend   | Node.js, Express.js                 |
| Database  | PostgreSQL                          |
| Auth      | JWT (jsonwebtoken) + bcryptjs       |
| Deployment| Railway                             |

---

## Project Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js          # PostgreSQL connection pool
│   │   │   ├── migrate.js     # Creates all tables
│   │   │   └── seed.js        # Demo data
│   │   ├── controllers/
│   │   │   ├── authController.js
│   │   │   ├── usersController.js
│   │   │   ├── projectsController.js
│   │   │   └── tasksController.js
│   │   ├── middleware/
│   │   │   ├── auth.js         # JWT protect, adminOnly, projectMember
│   │   │   └── errorHandler.js # Global error handler + validator
│   │   ├── routes/
│   │   │   ├── authRoutes.js
│   │   │   ├── userRoutes.js
│   │   │   ├── projectRoutes.js
│   │   │   └── taskRoutes.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── api/
│   │   │   ├── axios.js        # Axios instance + interceptors
│   │   │   └── services.js     # All API call functions
│   │   ├── components/
│   │   │   ├── UI.js           # Reusable: Button, Modal, Badge, Avatar...
│   │   │   ├── Layout.js       # Page shell with sidebar
│   │   │   ├── Sidebar.js      # Navigation
│   │   │   └── ProtectedRoute.js
│   │   ├── context/
│   │   │   └── AuthContext.js  # Global auth state
│   │   ├── pages/
│   │   │   ├── AuthPage.js
│   │   │   ├── DashboardPage.js
│   │   │   ├── ProjectsPage.js
│   │   │   ├── TasksPage.js
│   │   │   └── TeamPage.js
│   │   ├── utils/
│   │   │   └── helpers.js
│   │   ├── App.js
│   │   ├── index.js
│   │   └── index.css
│   ├── .env.example
│   └── package.json
│
├── .gitignore
├── railway.toml
└── README.md
```

---

## Local Setup

### Prerequisites
- Node.js v18+
- PostgreSQL v14+

### 1. Clone the repo
```bash
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow
```

### 2. Setup Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env — set your DATABASE_URL and JWT_SECRET
npm run migrate    # creates tables
npm run seed       # loads demo data
npm run dev        # starts on port 5000
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
cp .env.example .env
# For local dev, leave REACT_APP_API_URL blank (proxy handles it)
npm start          # starts on port 3000
```

### 4. Open browser
```
http://localhost:3000
```

### Demo Accounts
| Email             | Password   | Role   |
|-------------------|------------|--------|
| admin@demo.com    | admin123   | Admin  |
| alice@demo.com    | member123  | Member |
| bob@demo.com      | member123  | Member |

---

## REST API Endpoints

### Auth
| Method | Endpoint           | Access  | Description        |
|--------|--------------------|---------|--------------------|
| POST   | /api/auth/register | Public  | Create account     |
| POST   | /api/auth/login    | Public  | Login, get JWT     |
| GET    | /api/auth/me       | Any     | Get current user   |
| PUT    | /api/auth/profile  | Any     | Update profile     |

### Users
| Method | Endpoint        | Access | Description       |
|--------|-----------------|--------|-------------------|
| GET    | /api/users      | Any    | List users        |
| GET    | /api/users/:id  | Any    | Get user          |
| PUT    | /api/users/:id  | Admin  | Update user/role  |
| DELETE | /api/users/:id  | Admin  | Remove user       |

### Projects
| Method | Endpoint              | Access | Description       |
|--------|-----------------------|--------|-------------------|
| GET    | /api/projects         | Any    | List projects     |
| GET    | /api/projects/:id     | Any    | Get project       |
| GET    | /api/projects/:id/stats | Any  | Project stats     |
| POST   | /api/projects         | Admin  | Create project    |
| PUT    | /api/projects/:id     | Admin  | Update project    |
| DELETE | /api/projects/:id     | Admin  | Delete project    |

### Tasks
| Method | Endpoint              | Access       | Description         |
|--------|-----------------------|--------------|---------------------|
| GET    | /api/tasks            | Any          | List tasks (filter) |
| GET    | /api/tasks/dashboard  | Any          | Dashboard stats     |
| GET    | /api/tasks/:id        | Any          | Get task            |
| POST   | /api/tasks            | Admin        | Create task         |
| PUT    | /api/tasks/:id        | Admin/Assignee | Update task       |
| DELETE | /api/tasks/:id        | Admin        | Delete task         |

---

## Deployment on Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Add a **PostgreSQL** plugin to your project
4. Create **two services** from the same repo:

**Backend service:**
- Root directory: `/backend`
- Start command: `npm start`
- Environment variables:
  ```
  DATABASE_URL   = (auto-filled by Railway PostgreSQL plugin)
  JWT_SECRET     = your_random_secret_here
  CLIENT_URL     = https://your-frontend.up.railway.app
  NODE_ENV       = production
  ```
- After deploy: run migrations via Railway shell → `npm run migrate && npm run seed`

**Frontend service:**
- Root directory: `/frontend`
- Build command: `npm run build`
- Start command: `npx serve -s build`
- Environment variables:
  ```
  REACT_APP_API_URL = https://your-backend.up.railway.app
  ```

5. Submit your live URL + GitHub repo link

---

## Database Schema

```sql
users            → id, name, email, password, role, color
projects         → id, name, description, owner_id
project_members  → project_id, user_id  (many-to-many)
tasks            → id, title, description, status, priority,
                   due_date, project_id, assignee_id, created_by
```

---

## Author

Built as part of a full-stack internship assignment.
