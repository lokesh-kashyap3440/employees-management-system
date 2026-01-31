# Employee Management System (Full Stack OIDC)

A robust, full-stack application for managing employees, featuring local authentication, Google OIDC (OpenID Connect) login, role-based access control, and real-time notifications.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-19-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%2FLocal-green)

## 🏗 Architecture

This project is a monorepo containing two distinct services:
- **`backend/`**: Express.js API with MongoDB, JWT, and Google Auth Library.
- **`frontend/`**: React (Vite) application with Redux Toolkit and Google OAuth.

## ✨ Features

### 🔐 Authentication & Security
- **Google OIDC Login**: Seamless "Sign in with Google" integration.
- **Local Auth**: Traditional Username/Password registration and login.
- **JWT Sessions**: Secure, stateless authentication using JSON Web Tokens.
- **Role-Based Access**:
  - **Admin**: Full access to all records. Receives real-time alerts.
  - **User**: Restricted to managing their own created records.

### 👥 Employee Management
- **CRUD Operations**: Create, Read, Update, Delete employee records.
- **Rich UI**: Responsive tables, modal forms, and dynamic dropdowns.
- **Validation**: Form validation for data integrity.

### ⚡ Real-Time Features
- **Socket.io Integration**: Instant notifications for Admin users.
- **Live Alerts**: Toast notifications appear whenever a user modifies data.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+)
- MongoDB (Running locally or via Atlas)
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

**Option A: Run Separately (Two Terminals)**
```bash
# Terminal 1 (Backend)
cd backend && npm run dev

# Terminal 2 (Frontend)
cd frontend && npm run dev
```

The app will be available at **`http://localhost:5173`**.

---

## ☁️ Deployment (Render.com)

This project includes a `render.yaml` Blueprint for one-click deployment.

1.  **Push to GitHub/GitLab**.
2.  **Login to [Render Dashboard](https://dashboard.render.com/)**.
3.  **New > Blueprint**.
4.  Select your repository.
5.  **Fill Environment Variables**:
    *   `MONGODB_URI`: Your production database URL.
    *   `GOOGLE_CLIENT_ID`: Your GCP Client ID.
    *   `VITE_GOOGLE_CLIENT_ID`: Your GCP Client ID.
6.  **Deploy!**

### ⚠️ Google Cloud Config for Production
Once deployed, update your Google Cloud Console Credentials:
- **Authorized JavaScript Origins**: `https://<your-frontend-app>.onrender.com`
- **Authorized Redirect URIs**: `https://<your-frontend-app>.onrender.com`

---

## 📚 API Documentation

When the backend is running, full Swagger documentation is available at:
`http://localhost:3000/api-docs`

---

## 🛠 Tech Stack

| Component | Technologies |
|-----------|--------------|
| **Frontend** | React 19, Vite, Redux Toolkit, Tailwind CSS, Framer Motion, Socket.io Client, React OAuth/Google |
| **Backend** | Node.js, Express, TypeScript, MongoDB, Mongoose, Socket.io, Google Auth Library |
| **DevOps** | Render (Blueprints), Docker, Swagger |
