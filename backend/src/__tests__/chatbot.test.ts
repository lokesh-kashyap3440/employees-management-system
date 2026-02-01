import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import request from 'supertest';

// Define mocks
const mockToArray = jest.fn();
const mockLimit = jest.fn().mockReturnThis();
const mockSort = jest.fn().mockReturnThis();
const mockFind = jest.fn().mockReturnValue({ 
  sort: mockSort,
  limit: mockLimit,
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

  it('should filter by salary range (between)', async () => {
    mockToArray.mockResolvedValue([{ name: 'Mid Range', salary: 150000 }]);

    const res = await request(app)
      .post('/chatbot/query')
      .send({ query: 'who earns between 100000 and 200000?' });

    expect(res.status).toBe(200);
    expect(mockFind).toHaveBeenCalledWith(expect.objectContaining({
      salary: { $gte: 100000, $lte: 200000 }
    }));
  });

  it('should find the highest salary', async () => {
    mockToArray.mockResolvedValue([{ name: 'CEO', salary: 500000 }]);

    const res = await request(app)
      .post('/chatbot/query')
      .send({ query: 'whose salary is the highest?' });

    expect(res.status).toBe(200);
    expect(mockSort).toHaveBeenCalledWith({ salary: -1, _id: 1 });
    expect(mockLimit).toHaveBeenCalledWith(1);
    expect(res.body.message).toContain('highest salary is CEO');
  });

  it('should answer which department an employee belongs to', async () => {
    mockToArray.mockResolvedValue([{ name: 'Ramesh', department: 'Sales' }]);

    const res = await request(app)
      .post('/chatbot/query')
      .send({ query: 'which department does Ramesh belongs to?' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBe('Ramesh is in the Sales department.');
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
    // For single word 'John', it uses $or
    expect(calledFilter.$or).toBeDefined();
    expect(calledFilter.$or).toHaveLength(3); 
  });

  it('should perform multi-term search using $and', async () => {
    mockToArray.mockResolvedValue([{ name: 'John Doe', department: 'Engineering' }]);

    const res = await request(app)
      .post('/chatbot/query')
      .send({ query: 'John Engineering' });

    expect(res.status).toBe(200);
    const calledFilter = mockFind.mock.calls[0][0] as any;
    expect(calledFilter.$and).toBeDefined();
    expect(calledFilter.$and).toHaveLength(2); // One for 'John', one for 'Engineering'
  });

  it('should return 400 if query is missing', async () => {
    const res = await request(app).post('/chatbot/query').send({});
    expect(res.status).toBe(400);
  });
});
