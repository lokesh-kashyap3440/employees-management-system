import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import employeeRouter from './routes/employee.ts';
import authRouter from './routes/auth.ts';
import notificationsRouter from './routes/notifications.ts';
import chatbotRouter from './routes/chatbot.ts';
import { setupSwagger } from './swagger.ts';

const app = express();

// Middleware
app.use(cors({
  origin: true, // Reflects the request origin, allowing all
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Setup Swagger
setupSwagger(app);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRouter);
app.use('/employees', employeeRouter);
app.use('/notifications', notificationsRouter);
app.use('/chatbot', chatbotRouter);

export default app;