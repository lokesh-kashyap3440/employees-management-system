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
// We default to a regular user for these tests
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
  broadcastUpdate: jest.fn(), // If this is in redis.ts? No, it's in socket.ts. Wait.
}));

// Mock socket.ts to avoid real socket connections
jest.unstable_mockModule('../socket.ts', () => ({
  notifyAdmin: jest.fn(),
  broadcastUpdate: jest.fn(),
  initSocket: jest.fn(),
  getIO: jest.fn(),
}));

// Import app AFTER mocking
const { default: app } = await import('../app.ts');

describe('Employee Routes (Role: User)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSort.mockReturnValue({ toArray: mockToArray });
    mockFind.mockReturnValue({ sort: mockSort });

    mockGetDb.mockReturnValue({
        collection: () => ({
            insertOne: mockInsertOne,
            find: mockFind,
            findOne: mockFindOne,
            updateOne: mockUpdateOne,
            deleteOne: mockDeleteOne,
        })
    });
  });

  describe('GET /employees', () => {
    it('should filter employees by creator for regular user', async () => {
      const employees = [{ name: 'John Doe', createdBy: 'testuser' }];
      mockToArray.mockResolvedValue(employees);

      const res = await request(app).get('/employees');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(employees);
      expect(mockFind).toHaveBeenCalledWith({ createdBy: 'testuser' });
    });
  });

  describe('GET /employees/:id', () => {
    it('should return employee if created by user', async () => {
      const employee = { _id: new ObjectId(), name: 'John Doe', createdBy: 'testuser' };
      mockFindOne.mockResolvedValue(employee);

      const res = await request(app).get(`/employees/${employee._id}`);

      expect(res.status).toBe(200);
      expect(res.body.name).toBe(employee.name);
    });

    it('should return 403 if employee created by another user', async () => {
      const employee = { _id: new ObjectId(), name: 'Jane Doe', createdBy: 'otheruser' };
      mockFindOne.mockResolvedValue(employee);

      const res = await request(app).get(`/employees/${employee._id}`);

      expect(res.status).toBe(403);
    });
  });

  describe('POST /employees', () => {
    it('should create a new employee with createdBy field', async () => {
      mockInsertOne.mockResolvedValue({ insertedId: 'new-id' });
      const newEmployee = { name: 'John Doe' };

      const res = await request(app)
        .post('/employees')
        .send(newEmployee);

      expect(res.status).toBe(201);
      // Verify that createdBy was added to the object passed to insertOne
      const insertedDoc = mockInsertOne.mock.calls[0][0];
      expect(insertedDoc.createdBy).toBe('testuser');
    });
  });

  describe('PUT /employees/:id', () => {
    it('should update own employee', async () => {
        // First findOne call for auth check
        mockFindOne.mockResolvedValue({ createdBy: 'testuser' });
        // Update result
        mockUpdateOne.mockResolvedValue({ matchedCount: 1, modifiedCount: 1 });
        
        const id = new ObjectId();
        const res = await request(app)
            .put(`/employees/${id}`)
            .send({ position: 'Senior' });

        expect(res.status).toBe(200);
        expect(mockUpdateOne).toHaveBeenCalled();
    });

    it('should return 403 when updating others employee', async () => {
        mockFindOne.mockResolvedValue({ createdBy: 'otheruser' });
        
        const id = new ObjectId();
        const res = await request(app)
            .put(`/employees/${id}`)
            .send({ position: 'Senior' });

        expect(res.status).toBe(403);
        expect(mockUpdateOne).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /employees/:id', () => {
     it('should return 403 when deleting others employee', async () => {
        mockFindOne.mockResolvedValue({ createdBy: 'otheruser' });
        
        const id = new ObjectId();
        const res = await request(app).delete(`/employees/${id}`);

        expect(res.status).toBe(403);
        expect(mockDeleteOne).not.toHaveBeenCalled();
    });
  });
});