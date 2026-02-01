import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import request from 'supertest';

// Define mocks
const mockToArray = jest.fn();
const mockFind = jest.fn().mockReturnValue({ toArray: mockToArray });
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

const { default: app } = await import('../app.ts');

describe('Chatbot Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { username: 'admin', role: 'admin' };
  });

  it('should filter by salary more than X', async () => {
    mockToArray.mockResolvedValue([{ name: 'Rich Employee', salary: 100000 }]);

    const res = await request(app)
      .post('/chatbot/query')
      .send({ query: 'Who earns more than 90000?' });

    expect(res.status).toBe(200);
    expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({
      salary: { $gt: 90000 }
    }));
    expect(res.body.results).toHaveLength(1);
  });

  it('should filter by department', async () => {
    mockToArray.mockResolvedValue([{ name: 'Engineer', department: 'Engineering' }]);

    const res = await request(app)
      .post('/chatbot/query')
      .send({ query: 'Who is in the Engineering department?' });

    expect(res.status).toBe(200);
    // It uses a Regex for department
    const calledFilter = mockFind.mock.calls[0][0] as any;
    expect(calledFilter.department).toBeInstanceOf(RegExp);
    expect(calledFilter.department.source.toLowerCase()).toBe('engineering');
  });

  it('should perform broad search if no patterns match', async () => {
    mockToArray.mockResolvedValue([{ name: 'John Doe' }]);

    const res = await request(app)
      .post('/chatbot/query')
      .send({ query: 'John' });

    expect(res.status).toBe(200);
    const calledFilter = mockFind.mock.calls[0][0] as any;
    expect(calledFilter.$or).toBeDefined();
    expect(calledFilter.$or).toHaveLength(3); // name, dept, pos
  });

  it('should return 400 if query is missing', async () => {
    const res = await request(app).post('/chatbot/query').send({});
    expect(res.status).toBe(400);
  });
});
