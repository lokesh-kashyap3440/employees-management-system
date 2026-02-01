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

// Mock google-auth-library
const mockVerifyIdToken = jest.fn();
jest.unstable_mockModule('google-auth-library', () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    verifyIdToken: mockVerifyIdToken,
  })),
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

describe('Auth Routes (Comprehensive)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
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

    it('should return 500 on database error during register', async () => {
        mockFindOne.mockRejectedValue(new Error('fail'));
        const res = await request(app).post('/auth/register').send({ username: 'u', password: 'p' });
        expect(res.status).toBe(500);
    });

    it('should return 400 if missing body', async () => {
        const res = await request(app).post('/auth/register').send({});
        expect(res.status).toBe(400);
    });

    it('should return 500 on database error', async () => {
        mockFindOne.mockRejectedValue(new Error('DB Fail'));
        const res = await request(app).post('/auth/register').send({ username: 'u', password: 'p' });
        expect(res.status).toBe(500);
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully', async () => {
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

    it('should return 400 for wrong password', async () => {
        const hashedPassword = await bcrypt.hash('password123', 10);
        mockFindOne.mockResolvedValue({ username: 'u', password: hashedPassword });
        const res = await request(app).post('/auth/login').send({ username: 'u', password: 'wrong' });
        expect(res.status).toBe(400);
        expect(res.text).toBe('Not Allowed');
    });

    it('should return 500 on error', async () => {
        mockFindOne.mockRejectedValue(new Error('fail'));
        const res = await request(app).post('/auth/login').send({ username: 'u', password: 'p' });
        expect(res.status).toBe(500);
    });
  });

  describe('POST /auth/google', () => {
    it('should login with valid google token', async () => {
      mockVerifyIdToken.mockResolvedValue({
        getPayload: () => ({ email: 'google@test.com' })
      });
      mockFindOne.mockResolvedValue({ username: 'google@test.com', role: 'user' });

      const res = await request(app)
        .post('/auth/google')
        .send({ idToken: 'valid-token' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken');
    });

    it('should create user if not exists on google login', async () => {
        mockVerifyIdToken.mockResolvedValue({
          getPayload: () => ({ email: 'new@test.com' })
        });
        mockFindOne.mockResolvedValue(null);
        mockInsertOne.mockResolvedValue({ insertedId: '1' });
  
        const res = await request(app)
          .post('/auth/google')
          .send({ idToken: 'valid-token' });
  
        expect(res.status).toBe(200);
        expect(mockInsertOne).toHaveBeenCalled();
    });

    it('should return 400 if idToken missing', async () => {
        const res = await request(app).post('/auth/google').send({});
        expect(res.status).toBe(400);
    });

    it('should return 500 if client id missing', async () => {
        delete process.env.GOOGLE_CLIENT_ID;
        const res = await request(app).post('/auth/google').send({ idToken: 't' });
        expect(res.status).toBe(500);
    });

    it('should return 400 if token invalid', async () => {
        mockVerifyIdToken.mockRejectedValue(new Error('Invalid token'));
        const res = await request(app).post('/auth/google').send({ idToken: 'bad' });
        expect(res.status).toBe(400);
    });

    it('should return 400 if payload null', async () => {
        mockVerifyIdToken.mockResolvedValue({ getPayload: () => null });
        const res = await request(app).post('/auth/google').send({ idToken: 't' });
        expect(res.status).toBe(400);
    });

    it('should return 400 if email missing', async () => {
        mockVerifyIdToken.mockResolvedValue({ getPayload: () => ({ name: 'No Email' }) });
        const res = await request(app).post('/auth/google').send({ idToken: 't' });
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

    it('should return 401 if user not found', async () => {
        mockFindOne.mockResolvedValue(null);
        const res = await request(app).put('/auth/change-password').send({ oldPassword: 'o', newPassword: 'n' });
        expect(res.status).toBe(401);
    });

    it('should return 400 if old password wrong', async () => {
        const hashedPassword = await bcrypt.hash('real', 10);
        mockFindOne.mockResolvedValue({ username: 'u', password: hashedPassword });
        const res = await request(app).put('/auth/change-password').send({ oldPassword: 'wrong', newPassword: 'n' });
        expect(res.status).toBe(400);
    });

    it('should return 500 on error', async () => {
        mockFindOne.mockRejectedValue(new Error('fail'));
        const res = await request(app).put('/auth/change-password').send({ oldPassword: 'o', newPassword: 'n' });
        expect(res.status).toBe(500);
    });
  });
});