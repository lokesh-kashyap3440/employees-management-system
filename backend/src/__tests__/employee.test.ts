import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import request from 'supertest';
import { ObjectId } from 'mongodb';

// Define the mock factory
const mockGetDb = jest.fn();
const mockCollection = jest.fn();
const mockInsertOne = jest.fn();
const mockFind = jest.fn();
const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockDeleteOne = jest.fn();
const mockToArray = jest.fn();
const mockSort = jest.fn();

// Setup mock return values
mockGetDb.mockReturnValue({
  collection: mockCollection,
});
mockCollection.mockReturnThis();
mockCollection.mockReturnValue({
  insertOne: mockInsertOne,
  find: mockFind,
  findOne: mockFindOne,
  updateOne: mockUpdateOne,
  deleteOne: mockDeleteOne,
});
mockSort.mockReturnValue({
  toArray: mockToArray,
});
mockFind.mockReturnValue({
  sort: mockSort,
});

// Use unstable_mockModule for ESM
jest.unstable_mockModule('../db.ts', () => ({
  connectToDatabase: jest.fn(),
  getDb: mockGetDb,
  closeDB: jest.fn(),
}));

// Mock authentication middleware
let mockUser: any = { username: 'testuser', role: 'user' };
jest.unstable_mockModule('../middleware/auth.ts', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = mockUser;
    next();
  },
}));

// Mock redis.ts
const mockGetCache = jest.fn();
jest.unstable_mockModule('../redis.ts', () => ({
  connectRedis: jest.fn(),
  getRedisClient: jest.fn(),
  pushNotification: jest.fn(),
  getNotifications: jest.fn(),
  clearNotifications: jest.fn(),
  setCache: jest.fn(),
  getCache: mockGetCache,
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

describe('Employee Routes (Deep Coverage)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { username: 'testuser', role: 'user' };
    mockGetCache.mockResolvedValue(null);
    mockToArray.mockResolvedValue([]);
    mockFindOne.mockResolvedValue(null);
  });

  describe('GET /employees', () => {
    it('should serve from cache if available', async () => {
      mockGetCache.mockResolvedValue([{ name: 'Cached' }]);
      const res = await request(app).get('/employees');
      expect(res.status).toBe(200);
      expect(res.body[0].name).toBe('Cached');
      expect(mockFind).not.toHaveBeenCalled();
    });

    it('should serve from DB for admin and store in cache', async () => {
        mockUser = { username: 'admin', role: 'admin' };
        const emps = [{ name: 'DB' }];
        mockToArray.mockResolvedValue(emps);
        const res = await request(app).get('/employees');
        expect(res.status).toBe(200);
        expect(res.body[0].name).toBe('DB');
    });

    it('should return 500 on error', async () => {
        mockGetCache.mockRejectedValue(new Error('fail'));
        const res = await request(app).get('/employees');
        expect(res.status).toBe(500);
    });
  });

  describe('GET /employees/:id', () => {
    it('should serve single employee from cache', async () => {
        const id = new ObjectId().toString();
        mockGetCache.mockResolvedValue({ _id: id, name: 'C', createdBy: 'testuser' });
        const res = await request(app).get(`/employees/${id}`);
        expect(res.status).toBe(200);
        expect(mockFindOne).not.toHaveBeenCalled();
    });

    it('should serve from DB if cache miss', async () => {
        const id = new ObjectId().toString();
        mockFindOne.mockResolvedValue({ _id: id, name: 'DB', createdBy: 'testuser' });
        const res = await request(app).get(`/employees/${id}`);
        expect(res.status).toBe(200);
        expect(mockFindOne).toHaveBeenCalled();
    });

    it('should return 403 if cached employee belongs to other', async () => {
        const id = new ObjectId().toString();
        mockGetCache.mockResolvedValue({ _id: id, name: 'C', createdBy: 'other' });
        const res = await request(app).get(`/employees/${id}`);
        expect(res.status).toBe(403);
    });

    it('should return 404 if not found in DB', async () => {
        const id = new ObjectId().toString();
        const res = await request(app).get(`/employees/${id}`);
        expect(res.status).toBe(404);
    });

    it('should return 500 on error', async () => {
        mockFindOne.mockRejectedValue(new Error('fail'));
        const res = await request(app).get(`/${new ObjectId()}`);
        // Wait, app.use('/employees', employeeRouter)
        const res2 = await request(app).get(`/employees/${new ObjectId()}`);
        expect(res2.status).toBe(500);
    });
  });

  describe('POST /employees', () => {
    it('should fail if name missing', async () => {
        const res = await request(app).post('/employees').send({});
        expect(res.status).toBe(400);
    });

    it('should create employee successfully', async () => {
        mockInsertOne.mockResolvedValue({ insertedId: '1' });
        const res = await request(app).post('/employees').send({ name: 'John', salary: "50000" });
        expect(res.status).toBe(201);
    });
  });

  describe('PUT /employees/:id', () => {
    it('should update own employee', async () => {
        mockFindOne.mockResolvedValue({ createdBy: 'testuser' });
        mockUpdateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
        const res = await request(app).put(`/employees/${new ObjectId()}`).send({ name: 'U' });
        expect(res.status).toBe(200);
    });

    it('should return 403 for other employee', async () => {
        mockFindOne.mockResolvedValue({ createdBy: 'other' });
        const res = await request(app).put(`/employees/${new ObjectId()}`).send({ name: 'U' });
        expect(res.status).toBe(403);
    });

    it('should handle updates where no fields are actually changed', async () => {
        mockFindOne.mockResolvedValue({ createdBy: 'testuser' });
        mockUpdateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 0 });
        const res = await request(app).put(`/employees/${new ObjectId()}`).send({ name: 'U' });
        expect(res.status).toBe(200);
    });

    it('should return 404 if employee not found during update', async () => {
        mockFindOne.mockResolvedValue({ createdBy: 'testuser' });
        mockUpdateOne.mockResolvedValue({ matchedCount: 0 });
        const res = await request(app).put(`/employees/${new ObjectId()}`).send({ name: 'U' });
        expect(res.status).toBe(404);
    });
  });

  describe('DELETE /employees/:id', () => {
    it('should delete successfully', async () => {
        mockFindOne.mockResolvedValue({ createdBy: 'testuser' });
        mockDeleteOne.mockResolvedValue({ deletedCount: 1 });
        const res = await request(app).delete(`/employees/${new ObjectId()}`);
        expect(res.status).toBe(200);
    });

    it('should return 404 if nothing deleted', async () => {
        mockFindOne.mockResolvedValue({ createdBy: 'testuser' });
        mockDeleteOne.mockResolvedValue({ deletedCount: 0 });
        const res = await request(app).delete(`/employees/${new ObjectId()}`);
        expect(res.status).toBe(404);
    });

    it('should return 500 on server error', async () => {
        mockFindOne.mockRejectedValue(new Error('fail'));
        const res = await request(app).delete(`/employees/${new ObjectId()}`);
        expect(res.status).toBe(500);
    });
  });

  describe('PUT /employees/:id - error branches', () => {
      it('should return 500 on server error', async () => {
          mockFindOne.mockRejectedValue(new Error('fail'));
          const res = await request(app).put(`/employees/${new ObjectId()}`).send({ name: 'U' });
          expect(res.status).toBe(500);
      });
  });

  describe('app middleware', () => {
      it('should log requests', async () => {
          const res = await request(app).get('/health');
          expect(res.status).toBe(200);
      });
  });

  describe('Authorization logic', () => {
      it('should allow admin to update any employee', async () => {
          mockUser = { username: 'admin', role: 'admin' };
          mockUpdateOne.mockResolvedValue({ matchedCount: 1 });
          const res = await request(app).put(`/employees/${new ObjectId()}`).send({ name: 'A' });
          expect(res.status).toBe(200);
      });
  });
});
