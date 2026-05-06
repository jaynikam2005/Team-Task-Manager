# Team Task Manager

A full-stack web application for managing projects and tasks with role-based access control (Admin/Member).

## Live Demo
🔗 [https://team-task-manager-production-f954.up.railway.app](https://team-task-manager-production-f954.up.railway.app)

## Features
- Authentication (Signup/Login) with JWT
- Project & team management
- Task creation, assignment & status tracking
- Dashboard with task stats (total, in progress, completed, overdue)
- Role-based access control (Admin/Member)

## Tech Stack
- **Frontend:** Next.js 14, Tailwind CSS, shadcn/ui
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL + Prisma ORM
- **Auth:** JWT + bcrypt
- **Deployment:** Railway

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL

### Installation

1. Clone the repository
```bash
   git clone https://github.com/jaynikam2005/team-task-manager.git
   cd team-task-manager
```

2. Install dependencies
```bash
   npm install
```

3. Set up environment variables
```bash
   cp .env.example .env
```
Fill in your `DATABASE_URL` and `JWT_SECRET` in `.env`

4. Run database migrations
```bash
   npx prisma migrate dev
```

5. Start the development server
```bash
   npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000)

## API Endpoints

### Auth
- `POST /api/auth/register` — Register a new user
- `POST /api/auth/login` — Login
- `POST /api/auth/logout` — Logout

### Projects
- `GET /api/projects` — Get all projects
- `POST /api/projects` — Create a project
- `GET /api/projects/:id` — Get a project
- `DELETE /api/projects/:id` — Delete a project

### Tasks
- `GET /api/tasks` — Get all tasks
- `POST /api/tasks` — Create a task
- `PATCH /api/tasks/:id` — Update a task
- `DELETE /api/tasks/:id` — Delete a task

## Deployment
Deployed on Railway with PostgreSQL add-on.