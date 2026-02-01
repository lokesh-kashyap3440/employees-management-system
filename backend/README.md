# Employee Management Backend (TS-Mongo-CRUD)

A TypeScript-based Express API for managing employees with JWT authentication and role-based authorization.

## Features

- **CRUD Operations**: Create, Read, Update, and Delete employees.
- **JWT Authentication**: Secure endpoints using JSON Web Tokens.
- **User Management**: Registration and Login with password hashing (bcrypt).
- **Authorization**: 
  - **Admin**: Can view, edit, and delete all employees.
  - **User**: Can only manage employees they have created.
- **Caching**: Redis-based caching for employee list and individual employee data to improve performance.
- **Persistent Notifications**: Storing admin notifications in Redis for persistence across server restarts.
- **Swagger Documentation**: Interactive API documentation available at `/api-docs`.
- **Automatic Timestamps**: Tracks `createdAt` and `updatedAt` for all records.
- **Sorting**: Employees are sorted by last updated date by default.
- **Real-time Notifications**: Integrated Socket.io to notify admin users of any employee-related actions (create, update, delete) performed by regular users.

## Real-time Notifications (Socket.io)

The backend uses WebSockets to provide instant feedback to admin users:
- **Room Joining**: Users with the `admin` role automatically join a protected `admin-room`.
- **Event Emission**: The server emits a `notification` event whenever a regular user performs a write operation on the employee collection.
- **Payload**: Includes the action type, a descriptive message, the affected data, and a timestamp.
- **Persistence**: Notifications are also pushed to a Redis list and can be retrieved via the `/notifications` endpoint.

## Prerequisites

- Node.js (v18+)
- MongoDB (Atlas or Local)
- Redis (Local or Cloud)

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Configure Environment**:
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   REDIS_URL=redis://localhost:6379
   PORT=3000
   JWT_SECRET=your_secret_key
   GOOGLE_CLIENT_ID=your_google_client_id
   ```

3. **Run the Application**:
   ```bash
   npm run dev
   ```
   The server will start at `http://localhost:3000`.

4. **API Documentation**:
   Visit `http://localhost:3000/api-docs` to view the Swagger UI.

## Testing

Run all tests:
```bash
npm test
```

## Tech Stack
- Express.js
- TypeScript
- MongoDB Driver
- JSON Web Token (JWT)
- bcryptjs
- Swagger JSDoc / UI
- Jest / Supertest
- esbuild (for production builds)
