import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import request from 'supertest';

// Define mocks
const mockGetNotifications = jest.fn();
const mockClearNotifications = jest.fn();

// Mock dependencies
jest.unstable_mockModule('../redis.ts', () => ({
  connectRedis: jest.fn(),
  getNotifications: mockGetNotifications,
  clearNotifications: mockClearNotifications,
  pushNotification: jest.fn(),
  getRedisClient: jest.fn(),
  setCache: jest.fn(),
  getCache: jest.fn(),
  deleteCache: jest.fn(),
  deletePattern: jest.fn(),
}));

// Mock db.ts (required by app.ts -> auth.ts)
const mockGetDb = jest.fn();
jest.unstable_mockModule('../db.ts', () => ({
  connectToDatabase: jest.fn(),
  getDb: mockGetDb,
  closeDB: jest.fn(),
}));

// Mock authentication middleware
// We'll change the implementation per test case
let mockUser: { username: string; role: string } | undefined;

jest.unstable_mockModule('../middleware/auth.ts', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = mockUser;
    next();
  },
}));

// Import app AFTER mocking
const { default: app } = await import('../app.ts');

describe('Notification Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDb.mockReturnValue({
        collection: jest.fn().mockReturnThis(),
    });
  });

  describe('GET /notifications', () => {
    it('should return notifications for admin', async () => {
      mockUser = { username: 'admin', role: 'admin' };
      const notifications = [
        { message: 'Test Notification', timestamp: new Date().toISOString() }
      ];
      mockGetNotifications.mockResolvedValue(notifications);

      const res = await request(app).get('/notifications');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(notifications);
      expect(mockGetNotifications).toHaveBeenCalled();
    });

    it('should deny access for non-admin users', async () => {
      mockUser = { username: 'user', role: 'user' };

      const res = await request(app).get('/notifications');

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Access denied. Admins only.' });
      expect(mockGetNotifications).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /notifications', () => {
    it('should clear notifications for admin', async () => {
      mockUser = { username: 'admin', role: 'admin' };
      mockClearNotifications.mockResolvedValue(undefined);

      const res = await request(app).delete('/notifications');

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: 'Notifications cleared' });
      expect(mockClearNotifications).toHaveBeenCalled();
    });

    it('should deny access for non-admin users', async () => {
      mockUser = { username: 'user', role: 'user' };

      const res = await request(app).delete('/notifications');

      expect(res.status).toBe(403);
      expect(res.body).toEqual({ error: 'Access denied. Admins only.' });
      expect(mockClearNotifications).not.toHaveBeenCalled();
    });
  });
});
