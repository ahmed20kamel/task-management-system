# Task Management System

A full-stack task management application with role-based access control, team management, and multi-criteria evaluation system.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Django 4.2, Django REST Framework |
| Frontend | React 18, Material-UI 5 |
| Database | SQLite (dev) / PostgreSQL (prod) |
| Auth | Token-based Authentication |
| i18n | Arabic (RTL) + English (LTR) |

## Features

- **Role-based access**: Admin, Supervisor, Employee hierarchy
- **Task management**: CRUD with status tracking, priorities, due dates
- **Team management**: Create teams, assign leaders, manage members
- **Multi-criteria evaluation**: Quality, Speed, Communication, Problem Solving, Teamwork
- **Threaded comments** on tasks with edit/delete
- **Task images**: Upload and manage attachments
- **Notifications**: Real-time notification system with polling
- **Task history**: Full audit trail of all changes
- **Statistics dashboard**: Comprehensive analytics per role
- **Bilingual UI**: Arabic/English with full RTL support

## Quick Start

### Backend

```bash
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend

```bash
cd frontend
npm install
npm start
```

Backend runs on `http://localhost:8000` | Frontend on `http://localhost:3000`

## Project Structure

```
backend/
  accounts/       # User management, teams, authentication
  tasks/          # Tasks, comments, evaluations, history
  notifications/  # Notification system
  taskapp/        # Django settings

frontend/src/
  components/     # Layout, Sidebar, NotificationPanel
  context/        # AuthContext (state management)
  pages/          # Dashboard, TaskDetail, Teams, Ratings, Profile
  services/       # API client (Axios)
  i18n/           # Translations (ar/en)
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register/` | Register |
| POST | `/api/auth/login/` | Login |
| POST | `/api/auth/logout/` | Logout |
| GET | `/api/auth/profile/` | Get profile |
| PUT | `/api/auth/profile/update/` | Update profile |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/tasks/` | List / Create tasks |
| GET/PUT/DELETE | `/api/tasks/{id}/` | Task detail |
| GET | `/api/tasks/{id}/history/` | Task history |
| POST | `/api/tasks/{id}/images/` | Upload image |
| GET/POST | `/api/tasks/{id}/comments/` | Comments |
| GET/POST | `/api/tasks/evaluations/` | Evaluations |
| GET | `/api/tasks/statistics/` | Dashboard stats |

### Teams & Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/auth/teams/` | List / Create teams |
| GET | `/api/notifications/` | List notifications |
| GET | `/api/notifications/unread-count/` | Unread count |

## License

MIT
