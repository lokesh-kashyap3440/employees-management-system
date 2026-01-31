import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import employeeRouter from './routes/employee.ts';
import authRouter from './routes/auth.ts';
import { setupSwagger } from './swagger.ts';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Setup Swagger
setupSwagger(app);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Routes
app.use('/auth', authRouter);
app.use('/employees', employeeRouter);

export default app;
