# Employee Management System (Full Stack OIDC)

A robust, full-stack application for managing employees, featuring local authentication, Google OIDC login, Redis caching, real-time sync, and an AI Chatbot. Now fully optimized for **Mobile (Android/iOS)** and **PWA**.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![React](https://img.shields.io/badge/React-19-blue)
![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![Capacitor](https://img.shields.io/badge/Capacitor-Android-blue)

## 📱 Mobile & Android Development

This project uses **Capacitor** to bridge the web application into a native Android app.

### 1. Prerequisites
- **Java JDK 17 or 21** (Set `JAVA_HOME` environment variable).
- **Android Studio** (For compiling the final APK).

### 2. Android Emulator Setup
To test locally on an Android emulator:
1.  **Backend Configuration**: Ensure your backend listens on `0.0.0.0` (configured in `server.ts`).
2.  **API URL**: Set `VITE_API_URL=http://10.0.2.2:3000` in `frontend/.env`. (The IP `10.0.2.2` is the special bridge to your computer's localhost).
3.  **Sync & Run**:
    ```bash
    cd frontend
    npm run build
    npx cap sync android
    npx cap run android
    ```

### 3. Production Render Setup (Android)
To use the Android app with your live **Render** deployment:
1.  **Find your Render URL**: Get your backend URL from the Render Dashboard (e.g., `https://your-app.onrender.com`).
2.  **Update Config**: In `frontend/src/services/api.ts`, the app is configured to automatically use the production URL when not on `localhost`.
3.  **Build for Production**:
    ```bash
    cd frontend
    # Ensure .env is empty or points to Render
    npm run build
    npx cap sync android
    ```
4.  **Generate APK**: In Android Studio, go to **Build > Build APK(s)**.

---

## 🏗 Architecture

- **`backend/`**: Express.js API with MongoDB, Redis, and Socket.io.
- **`frontend/`**: React (Vite) + Capacitor for Mobile.
- **`Infrastructure`**: Docker Compose and Render Blueprints.

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
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev
```

---

## ☁️ Deployment (Render.com)

1.  **Create Blueprint**: Use the `render.yaml` file in the root.
2.  **Env Vars**: Enter your `MONGODB_URI` and `GOOGLE_CLIENT_ID` in the Render dashboard.
3.  **CORS**: The backend is pre-configured to allow requests from `capacitor://localhost` (Android).

## 🧪 Testing

Both Frontend and Backend maintain **>90% code coverage**.
```bash
# Run tests with coverage
npm run test:coverage # (in either directory)
```

---

## 🛠 Web vs. Mobile Logic (Safe Coexistence)

The application is built to detect its environment automatically:
- **API Routing**: Automatically switches between `localhost` (Web dev), `10.0.2.2` (Android Emulator), and `Render` (Production).
- **Google Login**: Uses the standard `@react-oauth/google` for Web and the native `@codetrix-studio/capacitor-google-auth` for Android/iOS to ensure maximum reliability.
- **CORS**: The backend is configured to trust both standard browsers and the `capacitor://localhost` origin used by mobile apps.

---

## 🔧 Troubleshooting & Known Patches

### Gradle build failures (Google Auth Plugin)
Newer versions of Android Studio/Gradle may fail on the `@codetrix-studio/capacitor-google-auth` plugin due to deprecated methods. If you see errors regarding `jcenter()` or `proguard-android.txt`, run these PowerShell commands to patch the plugin:

```powershell
# Fix jcenter() error
(Get-Content "frontend/node_modules/@codetrix-studio/capacitor-google-auth/android/build.gradle") -replace 'jcenter\(\)', 'mavenCentral()' | Set-Content "frontend/node_modules/@codetrix-studio/capacitor-google-auth/android/build.gradle"

# Fix proguard-android.txt error
(Get-Content "frontend/node_modules/@codetrix-studio/capacitor-google-auth/android/build.gradle") -replace 'proguard-android\.txt', 'proguard-android-optimize.txt' | Set-Content "frontend/node_modules/@codetrix-studio/capacitor-google-auth/android/build.gradle"
```

---

## 🛠 Tech Stack

| Component | Technologies |
|-----------|--------------|
| **Frontend** | React 19, Vite, Capacitor, Redux Toolkit, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript, MongoDB, Redis, Socket.io |
| **Mobile** | PWA, Capacitor Android |
| **Cloud** | Render, Docker |