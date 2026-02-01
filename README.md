# Employee Management System (Full Stack OIDC)

A robust, full-stack application for managing employees, featuring local authentication, Google OIDC (OpenID Connect) login, role-based access control, Redis-powered caching, and real-time synchronization.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-19-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%2FLocal-green)
![Redis](https://img.shields.io/badge/Redis-Latest-red)

## 🏗 Architecture

This project is a monorepo containing:
- **`backend/`**: Express.js API with MongoDB, Redis, JWT, and Socket.io.
- **`frontend/`**: React (Vite) application with Redux Toolkit and Socket.io client.
- **`Infrastructure`**: Docker Compose for local services and Render Blueprints for cloud deployment.

## ✨ Features

### 🔐 Authentication & Security
- **Google OIDC Login**: Seamless "Sign in with Google" integration.
- **Local Auth**: Traditional Username/Password registration and login.
- **JWT Sessions**: Secure, stateless authentication using JSON Web Tokens.
- **Role-Based Access**:
  - **Admin**: Full access to all records. Receives real-time alerts and history.
  - **User**: Restricted to managing their own created records.

### 👥 Employee Management
- **CRUD Operations**: Create, Read, Update, Delete employee records.
- **Caching**: Redis-based caching for list and individual records to ensure high performance.
- **Real-Time Data Sync**: All connected clients automatically refresh their view when data is modified anywhere.

### ⚡ Real-Time & Notifications
- **Socket.io Integration**: Instant alerts for Admin users.
- **Persistent Notifications**: Admin notifications are stored in Redis and persist across server restarts.
- **Live Sync**: Silent background synchronization for all users.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or via Atlas)
- Redis (Running locally)
- Google Cloud Project (for Client ID)

### 1. Clone & Install
```bash
git clone <repository-url>
cd ts-mongo-oidc

# Install Backend
cd backend
npm install

# Install Frontend
cd ../frontend
npm install
```

### 2. Configuration (`.env`)

#### Backend (`backend/.env`)
```env
MONGODB_URI=mongodb://localhost:27017/employee_management
REDIS_URL=redis://localhost:6379
PORT=3000
JWT_SECRET=your_super_secret_key
GOOGLE_CLIENT_ID=your_google_client_id_from_gcp
```

#### Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=your_google_client_id_from_gcp
```

### 3. Run Development Servers

**Option A: Using Docker (Recommended for DB/Cache)**
```bash
cd backend
docker-compose -f docker-compose.mongo.yml up -d
```

**Option B: Run App Separately**
```bash
# Terminal 1 (Backend)
cd backend && npm run dev

# Terminal 2 (Frontend)
cd frontend && npm run dev
```

The app will be available at **`http://localhost:5173`**.

---

## ☁️ Deployment (Render.com)

This project includes a `render.yaml` Blueprint for one-click deployment including **Redis**.

1.  **Push to GitHub/GitLab**.
2.  **Login to [Render Dashboard](https://dashboard.render.com/)**.
3.  **New > Blueprint**.
4.  Select your repository.
5.  **Fill Environment Variables**:
    *   `MONGODB_URI`: Your production database URL.
    *   `GOOGLE_CLIENT_ID`: Your GCP Client ID.
6.  **Deploy!**

## 📚 API Documentation

When the backend is running, full Swagger documentation is available at:
`http://localhost:3000/api-docs`

---

## 🧪 Testing & Code Coverage

The project includes a comprehensive testing suite with code coverage reporting.

### Running Tests
```bash
# Backend
cd backend && npm test

# Frontend
cd frontend && npm test
```

### Generating Coverage Reports
Detailed reports are generated in the `coverage/` directory of each service.
```bash
# Backend
cd backend && npm run test:coverage

# Frontend
cd frontend && npm run test:coverage
```

---

## 🛠 Tech Stack

| Component | Technologies |
|-----------|--------------|
| **Frontend** | React 19, Vite, Redux Toolkit, Tailwind CSS, Framer Motion, Socket.io Client |
| **Backend** | Node.js, Express, TypeScript, MongoDB, Redis, Socket.io, Google Auth Library |
| **DevOps** | Render (Blueprints), Docker, Swagger |
