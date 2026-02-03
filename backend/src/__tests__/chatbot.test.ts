import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import request from 'supertest';
import { ObjectId } from 'mongodb';

// Define mocks
const mockToArray = jest.fn();
const mockProject = jest.fn().mockReturnThis();
const mockFind = jest.fn().mockReturnValue({ 
  project: mockProject,
  toArray: mockToArray 
});
const mockFindOne = jest.fn();
const mockInsertOne = jest.fn();
const mockUpdateOne = jest.fn();
const mockDeleteOne = jest.fn();

const mockCollection = jest.fn().mockReturnValue({ 
    find: mockFind,
    findOne: mockFindOne,
    insertOne: mockInsertOne,
    updateOne: mockUpdateOne,
    deleteOne: mockDeleteOne
});
const mockGetDb = jest.fn().mockReturnValue({ collection: mockCollection });

// Mock dependencies
jest.unstable_mockModule('../db.ts', () => ({
  connectToDatabase: jest.fn(),
  getDb: mockGetDb,
  closeDB: jest.fn(),
}));

jest.unstable_mockModule('../redis.ts', () => ({
  connectRedis: jest.fn(),
  getRedisClient: jest.fn(),
  pushNotification: jest.fn(),
  getNotifications: jest.fn(),
  clearNotifications: jest.fn(),
  setCache: jest.fn(),
  getCache: jest.fn(),
  deleteCache: jest.fn(),
  deletePattern: jest.fn(),
}));

jest.unstable_mockModule('../socket.ts', () => ({
  notifyAdmin: jest.fn(),
  broadcastUpdate: jest.fn(),
  initSocket: jest.fn(),
  getIO: jest.fn(),
}));

let mockUser: { username: string; role: string } | undefined;
jest.unstable_mockModule('../middleware/auth.ts', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = mockUser;
    next();
  },
}));

// Mock global fetch
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

const { default: app } = await import('../app.ts');

describe('LLM Chatbot CRUD logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { username: 'admin', role: 'admin' };
    mockToArray.mockResolvedValue([]);
  });

  it('should handle intent: create', async () => {
    mockInsertOne.mockResolvedValue({ insertedId: new ObjectId() });
    mockUpdateOne.mockResolvedValue({ modifiedCount: 1 });
    mockDeleteOne.mockResolvedValue({ deletedCount: 1 });
    mockFindOne.mockResolvedValue(null); // Default to not found, override in tests if needed

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({
          intent: 'create',
          data: { name: 'ChatBot User', salary: '50000' }
        }) } }]
      })
    });

    const res = await request(app)
      .post('/chatbot/query')
      .send({ query: 'Add new user' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Successfully created');
    expect(mockInsertOne).toHaveBeenCalled();
  });

  it('should handle intent: update', async () => {
    const targetId = new ObjectId().toString();
    // Context needs to have this user
    mockToArray.mockResolvedValue([{ _id: new ObjectId(targetId), name: 'Target' }]);

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({
          intent: 'update',
          target_id: targetId,
          update_fields: { salary: '99000' }
        }) } }]
      })
    });

    const res = await request(app)
      .post('/chatbot/query')
      .send({ query: 'Give Target a raise' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Updated details');
    expect(mockUpdateOne).toHaveBeenCalled();
  });

  it('should handle intent: delete', async () => {
    const targetId = new ObjectId().toString();
    mockToArray.mockResolvedValue([{ _id: new ObjectId(targetId), name: 'FiredUser' }]);

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({
          intent: 'delete',
          target_id: targetId
        }) } }]
      })
    });

    const res = await request(app)
      .post('/chatbot/query')
      .send({ query: 'Fire FiredUser' });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('Deleted employee');
    expect(mockDeleteOne).toHaveBeenCalled();
  });

  it('should handle intent: query', async () => {
    const id = new ObjectId().toString();
    mockToArray.mockResolvedValue([{ _id: new ObjectId(id), name: 'Found' }]);

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: JSON.stringify({
          intent: 'query',
          message: 'Found one!',
          matching_ids: [id]
        }) } }]
      })
    });

    const res = await request(app)
      .post('/chatbot/query')
      .send({ query: 'Find Found' });

    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].name).toBe('Found');
  });
});