# 📱 Android Build & Troubleshooting Guide

This guide covers how to build, run, and troubleshoot the Android version of the Employee Management System (EMS).

## 🛠 Prerequisites

1.  **Node.js** (v18+)
2.  **Android Studio** (Latest version recommended)
3.  **Java JDK 17 or 21** (Critical for modern Android Gradle builds)

---

## 🚀 Quick Start (Local Development)

### 1. Configure the API URL
For the Android app to talk to your local backend, it cannot use `localhost`. It must use the special Android bridge IP.

**File:** `frontend/.env`
```env
# For Emulator
VITE_API_URL=http://10.0.2.2:3000

# For Physical Device (same Wi-Fi)
VITE_API_URL=http://YOUR_LOCAL_PC_IP:3000
# Example: http://192.168.1.5:3000
```

### 2. Build the Web App
```bash
cd frontend
npm run build
```

### 3. Sync to Android
This command copies your built web assets into the native Android project.
```bash
npx cap sync android
```

### 4. Run in Android Studio
```bash
npx cap open android
```
*   Wait for Gradle Sync to finish (bottom right bar).
*   Click the **Green Play Button** to launch on an Emulator or connected Phone.

---

## 🔐 Google Login Configuration (Native)

To make "Sign in with Google" work on Android, you need a specific setup separate from the web login.

### 1. Google Cloud Console
1.  Go to **APIs & Services > Credentials**.
2.  Create a **New Credential** -> **OAuth Client ID** -> **Android**.
3.  **Package Name:** `com.ems.app`
4.  **SHA-1 Certificate Fingerprint:** See below how to generate this.

### 2. Generate SHA-1 Fingerprint
Run this command in your terminal (inside `frontend/android`):
```powershell
./gradlew signingReport
```
*   Look for the `SHA1` under the **`debug`** variant.
*   Copy this string and paste it into the Google Cloud Console.

### 3. Project Configuration
**File:** `frontend/capacitor.config.ts`
```typescript
plugins: {
  GoogleAuth: {
    scopes: ['profile', 'email'],
    // Use your WEB Client ID here, NOT the Android one!
    serverClientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    forceCodeForRefreshToken: true,
  },
}
```

**File:** `frontend/android/app/src/main/res/values/strings.xml`
```xml
<string name="server_client_id">YOUR_WEB_CLIENT_ID.apps.googleusercontent.com</string>
```

---

## 🔧 Common Troubleshooting

### Error: "Gradle requires JVM 17 or later"
Your terminal is using an old Java version (or one that is too new, like Java 25).
**Fix:** Use the JDK bundled with Android Studio (Java 21).
```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
```

### Error: "Manifest merger failed : uses-sdk:minSdkVersion 22..."
Some libraries require a newer Android version.
**Fix:**
Check `frontend/android/variables.gradle` and ensure:
```groovy
minSdkVersion = 24
cordovaAndroidVersion = '13.0.0'
```

### Error: "Duplicate class kotlin..."
Conflicting Kotlin versions from different plugins.
**Fix:**
Add this to `frontend/android/build.gradle` (Root level):
```groovy
allprojects {
    configurations.all {
        exclude group: 'org.jetbrains.kotlin', module: 'kotlin-stdlib-jdk7'
        exclude group: 'org.jetbrains.kotlin', module: 'kotlin-stdlib-jdk8'
    }
}
```

### Error: "Cleartext HTTP traffic to ... not permitted"
Android blocks HTTP by default.
**Fix:**
Ensure `frontend/android/app/src/main/AndroidManifest.xml` has:
```xml
<application ... android:usesCleartextTraffic="true">
```

### Error: "Mixed Content" (HTTPS page calling HTTP API)
**Fix:**
Ensure `frontend/capacitor.config.ts` has:
```typescript
server: {
  androidScheme: 'http'
}
```

---

## 📦 Building for Production (Release APK)

1.  Update `frontend/.env` with your **Production URL**:
    ```env
    VITE_API_URL=https://your-app.onrender.com
    ```
2.  Run `npm run build && npx cap sync android`.
3.  In Android Studio: **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
4.  The file will be at `frontend/android/app/build/outputs/apk/debug/app-debug.apk`.
