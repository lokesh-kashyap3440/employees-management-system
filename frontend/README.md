# Employee Management Frontend (React-TS)

A modern React application for managing employees, featuring a full authentication flow and real-time state management.

## Features

- **Authentication Flow**:
  - User Registration and Login.
  - Persistent sessions using `localStorage`.
  - Secure API calls with JWT interceptors.
- **Employee Management**:
  - Visual list of employees.
  - Responsive forms for creating and editing.
  - Dynamic dropdowns for **Department** and **Position**.
- **State Management**: Uses Redux Toolkit for global state (Auth and Employees).
- **Protected UI**: Pages are automatically restricted based on login status.
- **Real-time Notifications**: Integrates with backend Socket.io for instant admin alerts.

## Real-time Notifications (Socket.io)

The frontend connects to the backend via Socket.io to receive real-time notifications:
- **Connection**: Establishes a connection to the backend API URL upon successful authentication.
- **Admin Room Joining**: The `admin` user automatically joins a dedicated `admin-room` to receive notifications.
- **Notification Handling**: Listens for `notification` events and displays them using `react-hot-toast` and updates the notification count/list in the header.
- **UI Integration**: Notifications appear as toast messages and are aggregated in the notification bell dropdown in the header.

## Prerequisites

- Node.js (v18+)

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure API**:
   Set the `VITE_API_URL` environment variable to your backend URL.

3. **Run the Application**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:5173`.

## Testing

Run all tests:
```bash
npm test
```

## Tech Stack
- React 19
- Vite
- Redux Toolkit (State Management)
- Tailwind CSS (Styling)
- Axios (API Requests)
- Vitest / Testing Library
