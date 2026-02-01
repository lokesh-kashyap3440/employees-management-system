import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Define the mock factory
const mockGetDb = jest.fn();
const mockCollection = jest.fn();
const mockInsertOne = jest.fn();
const mockFindOne = jest.fn();

// Setup mock return values
mockGetDb.mockReturnValue({
  collection: mockCollection,
});
mockCollection.mockReturnThis();
mockCollection.mockReturnValue({
  insertOne: mockInsertOne,
  findOne: mockFindOne,
});

// Use unstable_mockModule for ESM
jest.unstable_mockModule('../db.ts', () => ({
  connectToDatabase: jest.fn(),
  getDb: mockGetDb,
  closeDB: jest.fn(),
}));

// Mock redis.ts
jest.unstable_mockModule('../redis.ts', () => ({
  connectRedis: jest.fn(),
  getRedisClient: jest.fn(),
  pushNotification: jest.fn(),
  getNotifications: jest.fn().mockResolvedValue([]),
  clearNotifications: jest.fn(),
  setCache: jest.fn(),
  getCache: jest.fn().mockResolvedValue(null),
  deleteCache: jest.fn(),
  deletePattern: jest.fn(),
}));

// Mock socket.ts
jest.unstable_mockModule('../socket.ts', () => ({
  notifyAdmin: jest.fn(),
  broadcastUpdate: jest.fn(),
  initSocket: jest.fn(),
  getIO: jest.fn(),
}));

// Import app AFTER mocking
// Note: We need to use dynamic import for app because static imports are evaluated before code execution
const { default: app } = await import('../app.ts');

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset default mock implementations if needed
    mockGetDb.mockReturnValue({
        collection: () => ({
            insertOne: mockInsertOne,
            findOne: mockFindOne
        })
    });
  });

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      mockFindOne.mockResolvedValue(null);
      mockInsertOne.mockResolvedValue({ insertedId: 'some-id' });

      const res = await request(app)
        .post('/auth/register')
        .send({ username: 'testuser', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.text).toBe('User registered successfully');
      expect(mockInsertOne).toHaveBeenCalled();
    });

    it('should return 400 if user already exists', async () => {
      mockFindOne.mockResolvedValue({ username: 'testuser' });

      const res = await request(app)
        .post('/auth/register')
        .send({ username: 'testuser', password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.text).toBe('User already exists');
    });
  });

  describe('POST /auth/login', () => {
    it('should login with correct credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockFindOne.mockResolvedValue({ 
        username: 'testuser', 
        password: hashedPassword 
      });

      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('should fail with incorrect password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      mockFindOne.mockResolvedValue({ 
        username: 'testuser', 
        password: hashedPassword 
      });

      const res = await request(app)
        .post('/auth/login')
        .send({ username: 'testuser', password: 'wrongpassword' });

      expect(res.status).toBe(400);
      expect(res.text).toBe('Not Allowed');
    });
  });
});