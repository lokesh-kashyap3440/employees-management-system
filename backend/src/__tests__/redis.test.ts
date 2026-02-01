import { jest, describe, beforeEach, it, expect } from '@jest/globals';

// Define mocks first
const mockSet = jest.fn();
const mockGet = jest.fn();
const mockDel = jest.fn();
const mockLPush = jest.fn();
const mockLRange = jest.fn();
const mockLTrim = jest.fn();
const mockKeys = jest.fn();
const mockConnect = jest.fn();

let isOpenVal = true;

// Mock the redis package BEFORE importing redis.ts
jest.unstable_mockModule('redis', () => ({
  createClient: () => ({
    on: jest.fn(),
    connect: mockConnect,
    set: mockSet,
    get: mockGet,
    del: mockDel,
    lPush: mockLPush,
    lRange: mockLRange,
    lTrim: mockLTrim,
    keys: mockKeys,
    get isOpen() { return isOpenVal; },
  })
}));

const { connectRedis, pushNotification, getNotifications, setCache, getCache, deleteCache, deletePattern, clearNotifications } = await import('../redis.ts');

describe('Redis Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    isOpenVal = true;
  });

  describe('connectRedis', () => {
    it('should connect if not open', async () => {
      isOpenVal = false;
      await connectRedis();
      expect(mockConnect).toHaveBeenCalled();
    });

    it('should handle connection error', async () => {
        isOpenVal = false;
        mockConnect.mockRejectedValue(new Error('conn fail'));
        await connectRedis();
        // Should catch and log error
    });
  });

  describe('pushNotification', () => {
    it('should return early if not open', async () => {
        isOpenVal = false;
        await pushNotification({});
        expect(mockLPush).not.toHaveBeenCalled();
    });

    it('should handle error', async () => {
        mockLPush.mockRejectedValue(new Error('fail'));
        await pushNotification({});
        // Should catch
    });
  });

  describe('Caching', () => {
    it('should handle set error', async () => {
        mockSet.mockRejectedValue(new Error('fail'));
        await setCache('k', 'v');
    });

    it('should handle delete error', async () => {
        mockDel.mockRejectedValue(new Error('fail'));
        await deleteCache('k');
    });

    it('should handle pattern error', async () => {
        mockKeys.mockRejectedValue(new Error('fail'));
        await deletePattern('p');
    });

    it('should return null on get error', async () => {
        mockGet.mockRejectedValue(new Error('fail'));
        const res = await getCache('k');
        expect(res).toBeNull();
    });
  });

  describe('clearNotifications', () => {
      it('should delete list', async () => {
          await clearNotifications();
          expect(mockDel).toHaveBeenCalledWith('admin_notifications');
      });

      it('should handle error', async () => {
          mockDel.mockRejectedValue(new Error('fail'));
          await clearNotifications();
      });
  });
});
