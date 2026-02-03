# Employee Management System (Full Stack OIDC)

A robust, full-stack application for managing employees, featuring local authentication, Google OIDC login, Redis caching, real-time sync, and an AI Chatbot. Now fully optimized for **Bun**, **Mobile (Android)**, and **PWA**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-19-blue)
![Bun](https://img.shields.io/badge/Bun-1.1+-black)
![Capacitor](https://img.shields.io/badge/Capacitor-Android-blue)

## ⚡ Powered by Bun

This project has been migrated to [Bun](https://bun.sh) for lightning-fast installs, builds, and runtime execution.

- **Backend**: Runs natively on Bun (`bun src/server.ts`).
- **Frontend**: Dependencies and builds are managed by Bun.
- **Tests**: Compatible with `bun test` (Backend) and `vitest` (Frontend).

---

## 📱 Mobile & Android Development

This project uses **Capacitor** to bridge the web application into a native Android app.

### 1. Prerequisites
- **Bun 1.1+** (Install via `powershell -c "irm bun.sh/install.ps1 | iex"` on Windows).
- **Java JDK 17 or 21** (Set `JAVA_HOME` environment variable).
- **Android Studio** (For compiling the final APK).

### 2. Android Emulator Setup
To test locally on an Android emulator:
1.  **Backend Configuration**: Ensure your backend listens on `0.0.0.0` (configured in `server.ts`).
2.  **API URL**: Set `VITE_API_URL=http://10.0.2.2:3000` in `frontend/.env`. (The IP `10.0.2.2` is the special bridge to your computer's localhost).
3.  **Sync & Run**:
    ```bash
    cd frontend
    bun run build
    bunx cap sync android
    bunx cap run android
    ```

### 3. Production Render Setup (Android)
To use the Android app with your live **Render** deployment:
1.  **Find your Render URL**: Get your backend URL from the Render Dashboard (e.g., `https://your-app.onrender.com`).
2.  **Update Config**: In `frontend/src/services/api.ts`, update `PROD_BACKEND_URL` with your Render URL.
3.  **Build for Production**:
    ```bash
    cd frontend
    # Ensure .env VITE_API_URL is commented out or empty to force production URL
    bun run build
    bunx cap sync android
    ```
4.  **Generate APK**: In Android Studio, go to **Build > Build APK(s)**.

### 4. Native Google Login Configuration
For Google Sign-In to work on Android, you must:
1.  **Google Cloud Console**: Create an **Android Client ID**.
    *   Package Name: `com.ems.app`
    *   SHA-1 Fingerprint: Run `./gradlew signingReport` in `frontend/android` to get this.
2.  **Capacitor Config**: Update `frontend/capacitor.config.ts`:
    *   Set `serverClientId` to your **Web Client ID** (not the Android one).
3.  **Strings Resource**: Update `frontend/android/app/src/main/res/values/strings.xml`:
    *   Set `server_client_id` to your **Web Client ID**.

---

## 🏗 Architecture

- **`backend/`**: Bun/Express API with MongoDB, Redis, and Socket.io.
- **`frontend/`**: React (Vite) + Capacitor for Mobile.
- **`Infrastructure`**: Docker (Bun Image) and Render Blueprints.

## ✨ Features

- **Progressive Web App (PWA)**: Installable on Android/iOS home screens.
- **Google OIDC Login**: Secure third-party authentication.
- **Real-Time Sync**: Socket.io keeps all devices updated instantly.
- **Redis Caching**: High-performance data retrieval.
- **AI Chatbot**: Query your employee database using natural language.

---

## 🚀 Local Quick Start

### 1. Configuration (`.env`)

**Backend**:
```env
MONGODB_URI=mongodb://localhost:27017/ems
REDIS_URL=redis://localhost:6379
GOOGLE_CLIENT_ID=...
JWT_SECRET=...
```

**Frontend**:
```env
VITE_API_URL=http://localhost:3000
VITE_GOOGLE_CLIENT_ID=...
```

### 2. Run Servers
```bash
# Terminal 1: Backend
cd backend
bun install
bun run dev

# Terminal 2: Frontend
cd frontend
bun install
bun run dev
```

---

## ☁️ Deployment (Render.com)

1.  **Create Blueprint**: Use the `render.yaml` file in the root.
2.  **Environment**: The configuration is pre-set to use the `bun` environment.
3.  **Env Vars**: Enter your `MONGODB_URI` and `GOOGLE_CLIENT_ID` in the Render dashboard.

## 🧪 Testing

Both Frontend and Backend maintain **>90% code coverage**.
```bash
# Run tests with coverage
bun run test:coverage # (in either directory)
```

---

## 🛠 Tech Stack

| Component | Technologies |
|-----------|--------------|
| **Frontend** | React 19, Vite, Capacitor, Redux Toolkit, Tailwind CSS |
| **Backend** | Bun, Express, TypeScript, MongoDB, Redis, Socket.io |
| **Mobile** | PWA, Capacitor Android |
| **Cloud** | Render, Docker (Bun Images) |