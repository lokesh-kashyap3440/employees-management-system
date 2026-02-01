import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import request from 'supertest';

// Define mocks
const mockToArray = jest.fn();
const mockProject = jest.fn().mockReturnThis();
const mockFind = jest.fn().mockReturnValue({ 
  project: mockProject,
  toArray: mockToArray 
});
const mockCollection = jest.fn().mockReturnValue({ find: mockFind });
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

describe('LLM Chatbot Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { username: 'admin', role: 'admin' };
    
    // Default fetch mock response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'LLM Response' } }]
      })
    });
  });

  it('should call the LLM with employee data as context', async () => {
    const employees = [{ name: 'John', salary: 50000 }];
    mockToArray.mockResolvedValue(employees);

    const res = await request(app)
      .post('/chatbot/query')
      .send({ query: 'How much does John earn?' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('LLM Response');
    expect(mockFetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('John')
      })
    );
  });

  it('should return results snippets in the response', async () => {
    mockToArray.mockResolvedValue([{ name: 'Snippet' }]);

    const res = await request(app)
      .post('/chatbot/query')
      .send({ query: 'any' });

    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].name).toBe('Snippet');
  });

  it('should return 400 if query is missing', async () => {
    const res = await request(app).post('/chatbot/query').send({});
    expect(res.status).toBe(400);
  });

  it('should handle LLM API errors gracefully', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error'
    });

    const res = await request(app)
      .post('/chatbot/query')
      .send({ query: 'any' });

    expect(res.status).toBe(500);
    expect(res.body.error).toBe('Failed to process chat query with LLM');
  });
});