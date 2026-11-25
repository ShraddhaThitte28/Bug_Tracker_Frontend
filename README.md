# Bug Tracker / Issue Tracker — Frontend Client Application

> **Live Application:** [https://bugtrackerfrontend-production.up.railway.app](https://bugtrackerfrontend-production.up.railway.app)  
> **Backend API:** [https://web-production-3d715c7b.up.railway.app](https://web-production-3d715c7b.up.railway.app)  
> **Frontend Repository:** [https://github.com/ShraddhaThitte28/Bug_Tracker_Frontend](https://github.com/ShraddhaThitte28/Bug_Tracker_Frontend)  
> **Backend Repository:** [https://github.com/ShraddhaThitte28/Bug_Tracker_Backend](https://github.com/ShraddhaThitte28/Bug_Tracker_Backend)

---

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Key Features](#2-key-features)
3. [Technology Stack & Dependencies](#3-technology-stack--dependencies)
4. [Project Folder Structure](#4-project-folder-structure)
5. [Backend API Integration](#5-backend-api-integration)
6. [Installation & Setup](#6-installation--setup)
7. [Environment Configuration](#7-environment-configuration)
8. [Available Scripts & Commands](#8-available-scripts--commands)
9. [Deployment](#9-deployment)

---

## 1. Project Overview
The **Bug Tracker / Issue Tracker** frontend is a single-page web application (SPA) built with **React 19**, **Vite**, and **Tailwind CSS**. It provides a clean, responsive interface for agile teams to manage software projects, track issues, assign tasks, collaborate through comments, and visualize workflows on a Kanban board.

---

## 2. Key Features

- **Authentication & User Management:**
  - User registration and login forms with password visibility toggles.
  - JWT storage in `localStorage` with automatic Authorization header injection.
  - Automatic session cleanup and redirect to `/login` upon receiving `401 Unauthorized` responses.
  - Role-based UI visibility distinguishing **Admin**, **Developer**, and **Viewer** accounts.

- **Operational Dashboard:**
  - Real-time ticket count metrics (**Total**, **To Do**, **In Progress**, **Done**).
  - Breakdown of tickets by priority (**High**, **Medium**, **Low**).
  - Quick-navigation cards for creating tickets, browsing the list, or opening the Kanban board.

- **Interactive Kanban Board:**
  - Three workflow columns: `To Do`, `In Progress`, and `Done`.
  - Drag-and-drop card movement powered by `@dnd-kit/core` and `@dnd-kit/utilities`.
  - Immediate optimistic status update with backend synchronization (`PUT /tickets/{id}`).

- **Ticket Directory & Filtering:**
  - Filterable list of tickets with project selection, search, and status badges.
  - Ticket authoring form supporting project selection, title, description, issue type, priority, and assignee.

- **Ticket Detail & In-Page Lightbox Modal:**
  - Detailed ticket metadata view (status, priority, project, reporter, assignee, timestamps).
  - Status and priority updating, ticket editing, and deletion (restricted by role).
  - Screenshot attachment preview with an in-page modal lightbox supporting centered full-size viewing, backdrop click-to-close, visible close button, and `Escape` key dismissal.

- **Ticket Comments & Activity Feed:**
  - Chronological comment list for each ticket.
  - Top-level comment submission.
  - One-level threaded replies under top-level comments (`parent_id`).

---

## 3. Technology Stack & Dependencies

### Production Dependencies (`package.json`)

| Package | Version | Purpose |
|---|---|---|
| **react** | `^19.3.1` | Core UI component library |
| **react-dom** | `^19.3.1` | React DOM rendering bindings |
| **react-router-dom** | `^7.18.5` | Client-side routing and protected route wrappers |
| **@dnd-kit/core** | `^6.3.1` | Drag-and-drop sensors, collision detection, and drop targets |
| **@dnd-kit/utilities** | `^3.2.2` | CSS transform and coordinate utilities for draggable cards |
| **axios** | `^1.21.1` | Promise-based HTTP client with request/response interceptors |
| **tailwindcss** | `^4.3.5` | Utility-first CSS framework |
| **@tailwindcss/vite** | `^4.3.5` | Tailwind CSS v4 compiler plugin for Vite |
| **serve** | `^14.2.8` | Static web server used for production hosting |

### Development Dependencies (`devDependencies`)

| Package | Version | Purpose |
|---|---|---|
| **vite** | `^8.3.6` | Development server and production bundler |
| **@vitejs/plugin-react** | `^6.1.2` | React Fast Refresh support for Vite |
| **eslint** | `^10.14.0` | JavaScript code linter |
| **eslint-plugin-react-hooks** | `^7.1.1` | Linting rules for React Hooks |
| **eslint-plugin-react-refresh** | `^0.5.7` | Fast refresh validation |
| **@eslint/js** | `^10.0.1` | ESLint recommended configuration rules |
| **@types/react** | `^19.3.0` | TypeScript definitions for React |
| **@types/react-dom** | `^19.3.0` | TypeScript definitions for React DOM |
| **globals** | `^17.13.0` | Global browser identifiers for ESLint |

---

## 4. Project Folder Structure

```text
frontend/
├── dist/                          # Production build output
├── public/                        # Static assets served as-is
├── src/
│   ├── api/                       # API client and domain endpoint modules
│   │   ├── auth.js                # Authentication API calls (login, register, me)
│   │   ├── axios.js               # Central Axios instance with interceptors
│   │   ├── comments.js            # Comments and threaded replies API calls
│   │   ├── projects.js            # Projects and project membership API calls
│   │   └── tickets.js             # Tickets and attachment management API calls
│   ├── assets/                    # Static image assets (hero, icons)
│   │   ├── hero.png
│   │   ├── react.svg
│   │   └── vite.svg
│   ├── components/                # Reusable presentation components
│   │   ├── Navbar.jsx             # Top navigation bar with active session info
│   │   ├── ProtectedRoute.jsx     # Route wrapper verifying authentication
│   │   └── StatusBadge.jsx        # Colored badges for ticket status and priority
│   ├── context/                   # Global state management
│   │   ├── AuthContext.jsx        # Context provider managing auth state and tokens
│   │   ├── AuthContext.js         # Context definition
│   │   └── useAuth.js             # Custom hook to consume AuthContext
│   ├── pages/                     # Routed view components
│   │   ├── DashboardPage.jsx      # Overview statistics and quick navigation
│   │   ├── KanbanBoardPage.jsx    # Drag-and-drop workflow board
│   │   ├── LoginPage.jsx          # Login form with validation
│   │   ├── RegisterPage.jsx       # User registration form
│   │   ├── TicketCreatePage.jsx   # Ticket authoring view
│   │   ├── TicketDetailPage.jsx   # Ticket inspector, screenshot lightbox, and comments
│   │   └── TicketListPage.jsx     # Filterable ticket directory table
│   ├── App.css                    # Component layout styles
│   ├── App.jsx                    # Root router configuration
│   ├── index.css                  # Tailwind CSS root imports
│   └── main.jsx                   # React application entry point
├── .env.example                   # Example environment variable template
├── index.html                     # HTML entry point
├── package.json                   # Project dependencies and script declarations
├── package-lock.json              # Dependency lockfile
└── vite.config.js                 # Vite bundler configuration
```

---

## 5. Backend API Integration

The frontend connects to the backend REST API via Axios.

### Axios Instance (`src/api/axios.js`)
Configured with base URL handling, automatic JWT Bearer token attachment, multipart boundary management for file uploads, and global 401 handling:

```javascript
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Bearer token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Let the browser set multipart boundary for FormData uploads
  if (config.data instanceof FormData) {
    if (typeof config.headers.delete === 'function') {
      config.headers.delete('Content-Type');
    } else {
      delete config.headers['Content-Type'];
    }
  }
  return config;
});

// Clear expired session and redirect on 401
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!error.config.url.includes('/auth/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

### Domain API Modules
- `src/api/auth.js`: Handles `POST /auth/login`, `POST /auth/register`, and `GET /auth/me`.
- `src/api/projects.js`: Handles project retrieval, creation, updates, and member management.
- `src/api/tickets.js`: Handles ticket listing, creation, updates, deletion, and screenshot attachments.
- `src/api/comments.js`: Handles fetching comments (`GET /tickets/{id}/comments`) and posting top-level comments or replies (`POST /tickets/{id}/comments`).

---

## 6. Installation & Setup

### Prerequisites
- **Node.js:** `v18.0.0` or higher (Node 20+ recommended)
- **npm:** `v9.0.0` or higher

### Steps
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

## 7. Environment Configuration

Create a `.env` file in the `frontend/` directory (or copy from `.env.example`):

```ini
# Backend API Base URL
# For local backend (FastAPI on port 8000):
VITE_API_BASE_URL=http://127.0.0.1:8000

# For production deployment:
# VITE_API_BASE_URL=https://web-production-3d715c7b.up.railway.app
```

> **Note:** If `VITE_API_BASE_URL` is left empty, requests will be routed to the same origin or handled via the Vite development server proxy.

---

## 8. Available Scripts & Commands

Run these scripts from the `frontend/` directory:

| Command | Action |
|---|---|
| `npm run dev` | Starts the Vite local development server (default: `http://127.0.0.1:5173`) with Hot Module Replacement. |
| `npm run build` | Compiles and minifies the application into the `dist/` directory for production. |
| `npm run preview` | Runs a local web server to preview the built `dist/` production files. |
| `npm run lint` | Runs ESLint across the source code to check for syntax and formatting errors. |
| `npm run start` | Starts a static web server with `serve -s dist -l $PORT` (used in containerized deployments). |

---

## 9. Deployment

- **Production Frontend:** [https://bugtrackerfrontend-production.up.railway.app](https://bugtrackerfrontend-production.up.railway.app)
- **Deployment Platform:** Railway (Static SPA hosting via `serve`)
- **Production Build Command:** `npm run build`
- **Start Command:** `serve -s dist -l $PORT`
