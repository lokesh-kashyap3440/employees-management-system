import express from 'express';
import cors from 'cors';
import type { Request, Response } from 'express';
import { connectToDatabase } from './db.ts';
import employeeRouter from './routes/employee.ts';
import authRouter from './routes/auth.ts';
import { setupSwagger } from './swagger.ts';

const app = express();
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Setup Swagger
setupSwagger(app);

// Health check
app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
async function startServer() {
  try {
const mongoUri = process.env.MONGODB_URI || 'mongodb://root:example@localhost:27017';
    await connectToDatabase(mongoUri);
    console.log('✅ MongoDB connection established');

    // Routes
    app.use('/auth', authRouter);
    app.use('/employees', employeeRouter);

    app.listen(port, () => {
      console.log(`🚀 Server listening at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();