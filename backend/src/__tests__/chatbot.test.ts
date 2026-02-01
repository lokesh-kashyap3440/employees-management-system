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

describe('LLM Chatbot Route (Refined JSON Parsing)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { username: 'admin', role: 'admin' };
    
    // Default fetch mock response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: JSON.stringify({
              message: 'LLM Response',
              matching_employee_ids: ['some-id']
            })
          }
        }]
      })
    });
  });

  it('should filter results based on returned IDs', async () => {
    const employees = [{ _id: { toString: () => 'some-id' }, name: 'John', salary: 50000 }];
    mockToArray.mockResolvedValue(employees);

    const res = await request(app)
      .post('/chatbot/query')
      .send({ query: 'How much does John earn?' });

    expect(res.status).toBe(200);
    expect(res.body.results).toHaveLength(1);
    expect(res.body.results[0].name).toBe('John');
  });

  it('should filter by createdBy for non-admin user', async () => {
    mockUser = { username: 'regular', role: 'user' };
    mockToArray.mockResolvedValue([]);

    await request(app)
      .post('/chatbot/query')
      .send({ query: 'who am i?' });

    expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({
      createdBy: 'regular'
    }));
  });

  it('should return results snippets in the response', async () => {
    const employees = [{ _id: { toString: () => 'id123' }, name: 'Markdown User' }];
    mockToArray.mockResolvedValue(employees);
    
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{
          message: {
            content: '```json\n{\"message\": \"wrapped\", \"matching_employee_ids\": [\"id123\"]}\n```'
          }
        }]
      })
    });

    const res = await request(app)
      .post('/chatbot/query')
      .send({ query: 'markdown' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('wrapped');
    expect(res.body.results).toHaveLength(1);
  });

  it('should fallback to plain text if JSON parsing fails', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Not a JSON' } }]
      })
    });

    const res = await request(app)
      .post('/chatbot/query')
      .send({ query: 'plain' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Not a JSON');
    expect(res.body.results).toHaveLength(0);
  });

  it('should handle empty message from LLM', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [] })
    });

    const res = await request(app)
      .post('/chatbot/query')
      .send({ query: 'any' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe("I've processed your query.");
  });
});
