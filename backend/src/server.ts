import 'dotenv/config';
import { createServer } from 'http';
import { connectToDatabase } from './db.ts';
import app from './app.ts';
import { initSocket } from './socket.ts';
import { connectRedis } from './redis.ts';

const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

async function startServer() {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://root:example@localhost:27017';
    await connectToDatabase(mongoUri);
    console.log('✅ MongoDB connection established');

    await connectRedis();

    httpServer.listen(port, () => {
      console.log(`🚀 Server listening at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
