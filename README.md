# DevTasks AI Platform 🚀

> Modern task management platform with AI-powered task generation, Kanban boards, and analytics.

![DevTasks](https://img.shields.io/badge/Stack-MERN-blue) ![AI](https://img.shields.io/badge/AI-OpenAI%20GPT--4o-green) ![License](https://img.shields.io/badge/License-MIT-yellow)

## ✨ Features

- **🔐 Authentication** — JWT-based login/register with persistent sessions
- **📁 Project Management** — Create, edit, delete projects with custom colors & icons
- **✅ Task Management** — Full CRUD with priorities, due dates, and tags
- **🎨 Kanban Board** — Drag & drop tasks across columns (To Do → In Progress → Review → Completed)
- **🤖 AI Task Generator** — Describe a goal, get a full task roadmap powered by GPT-4o-mini
- **📊 Dashboard Analytics** — Weekly productivity charts, task stats, progress tracking (Recharts)
- **🌙 Dark Mode** — System-aware theme with manual toggle
- **🛡️ Admin Panel** — User management, global metrics, role control
- **📱 Responsive** — Works on desktop, tablet, and mobile

## 🏗️ Tech Stack

**Frontend:** React + Vite, TailwindCSS, React Router, React Hook Form, @hello-pangea/dnd, Recharts, react-hot-toast  
**Backend:** Node.js, Express, MongoDB + Mongoose, JWT, bcryptjs  
**AI:** OpenAI API (gpt-4o-mini)  
**Deploy:** Vercel (frontend) + Render (backend) + MongoDB Atlas

## 📦 Project Structure

```
devtasks/
├── client/                 # React frontend
│   └── src/
│       ├── pages/          # LoginPage, RegisterPage, DashboardPage, ProjectsPage, KanbanPage, AdminPage
│       ├── layouts/        # AppLayout (sidebar)
│       ├── context/        # AuthContext, ThemeContext
│       ├── services/       # API service layer (axios)
│       └── ...
└── server/                 # Express backend
    ├── controllers/        # authController, projectController, taskController, aiController, adminController
    ├── routes/             # auth, projects, tasks, ai, admin
    ├── models/             # User, Project, Task (Mongoose)
    ├── middleware/         # auth.js (JWT protect, adminOnly)
    └── server.js
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier works)
- OpenAI API key

### 1. Clone and install

```bash
# Backend
cd server
npm install
cp .env.example .env   # Fill in your values

# Frontend
cd ../client
npm install
cp .env.example .env
```

### 2. Configure environment

**server/.env:**
```
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
OPENAI_API_KEY=sk-...
CLIENT_URL=http://localhost:5173
```

**client/.env:**
```
VITE_API_URL=http://localhost:5000/api
```

### 3. Run development servers

```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

App runs at `http://localhost:5173` 🎉

## 🌐 API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | /api/auth/register | ❌ | Register user |
| POST | /api/auth/login | ❌ | Login |
| GET | /api/auth/me | ✅ | Current user |
| GET | /api/projects | ✅ | List projects |
| POST | /api/projects | ✅ | Create project |
| PUT | /api/projects/:id | ✅ | Update project |
| DELETE | /api/projects/:id | ✅ | Delete project |
| GET | /api/tasks?projectId= | ✅ | List tasks |
| POST | /api/tasks | ✅ | Create task |
| PUT | /api/tasks/:id | ✅ | Update task |
| DELETE | /api/tasks/:id | ✅ | Delete task |
| PATCH | /api/tasks/:id/status | ✅ | Update status (Kanban) |
| GET | /api/tasks/stats | ✅ | Dashboard stats |
| POST | /api/ai/generate-tasks | ✅ | AI task generation |
| GET | /api/admin/users | 🔒 | Admin: list users |
| GET | /api/admin/metrics | 🔒 | Admin: global stats |

## ☁️ Deploy

### Backend → Render
1. Push `server/` to GitHub
2. Create new Web Service on Render
3. Set environment variables
4. Build: `npm install`, Start: `node server.js`

### Frontend → Vercel
1. Push `client/` to GitHub
2. Import project on Vercel
3. Set `VITE_API_URL` to your Render URL
4. Deploy!

### Database → MongoDB Atlas
1. Create free cluster at mongodb.com
2. Add your IP to Network Access
3. Copy connection string to `MONGO_URI`

## 🤖 AI Feature

The Smart Task Generator (`POST /api/ai/generate-tasks`) takes a natural language prompt and returns structured tasks with priorities and roadmap order.

**Example:**
```json
{
  "prompt": "Necesito aprender redes de computadoras",
  "projectId": "..."
}
```
Returns 5-8 tasks with titles, descriptions, priorities, and estimated durations — automatically saved to the project.

---

Built with ❤️ — DevTasks Solutions SAS
