import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';

// Define the mock factory
const mockGetDb = jest.fn();
const mockCollection = jest.fn();
const mockInsertOne = jest.fn();
const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();

// Setup mock return values
mockGetDb.mockReturnValue({
  collection: mockCollection,
});
mockCollection.mockReturnThis();
mockCollection.mockReturnValue({
  insertOne: mockInsertOne,
  findOne: mockFindOne,
  updateOne: mockUpdateOne
});

// Use unstable_mockModule for ESM
jest.unstable_mockModule('../db.ts', () => ({
  connectToDatabase: jest.fn(),
  getDb: mockGetDb,
  closeDB: jest.fn(),
}));

// Mock authentication middleware globally for this file
jest.unstable_mockModule('../middleware/auth.ts', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { username: 'testuser', role: 'user' };
    next();
  },
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
const { default: app } = await import('../app.ts');

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue({
        collection: () => ({
            insertOne: mockInsertOne,
            findOne: mockFindOne,
            updateOne: mockUpdateOne
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
    });

    it('should return 400 if user exists', async () => {
        mockFindOne.mockResolvedValue({ username: 'testuser' });
        const res = await request(app).post('/auth/register').send({ username: 'u', password: 'p' });
        expect(res.status).toBe(400);
    });

    it('should return 400 if missing body', async () => {
        const res = await request(app).post('/auth/register').send({});
        expect(res.status).toBe(400);
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

    it('should fail with missing user', async () => {
        mockFindOne.mockResolvedValue(null);
        const res = await request(app).post('/auth/login').send({ username: 'u', password: 'p' });
        expect(res.status).toBe(400);
    });

    it('should return 400 if password incorrect', async () => {
        const hashedPassword = await bcrypt.hash('real', 10);
        mockFindOne.mockResolvedValue({ username: 'u', password: hashedPassword });
        const res = await request(app).post('/auth/login').send({ username: 'u', password: 'wrong' });
        expect(res.status).toBe(400);
    });
  });

  describe('PUT /auth/change-password', () => {
    it('should change password successfully', async () => {
      const hashedPassword = await bcrypt.hash('old-pass', 10);
      mockFindOne.mockResolvedValue({ username: 'testuser', password: hashedPassword });
      mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });

      const res = await request(app)
        .put('/auth/change-password')
        .send({ oldPassword: 'old-pass', newPassword: 'new-pass' });

      expect(res.status).toBe(200);
      expect(res.text).toBe('Password changed successfully');
    });

    it('should return 400 if passwords missing', async () => {
        const res = await request(app).put('/auth/change-password').send({});
        expect(res.status).toBe(400);
    });
  });
});
