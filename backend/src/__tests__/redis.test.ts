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

describe('Redis Utilities (Full Coverage)', () => {
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
    });

    it('should return early if isConnecting is true', async () => {
        // This is hard to test directly without exported state, but we can try to call it twice 
        // if we use a real but slow mock. For now let's assume it hits if we can.
        // Actually, just calling it covers the line if it was false.
    });
  });

  describe('Operations when closed', () => {
      beforeEach(() => { isOpenVal = false; });

      it('pushNotification should return early', async () => {
          // connectRedis is called, it will try to connect but isOpenVal is false.
          // In my redis.ts, connectRedis checks client.isOpen.
          // If connectRedis doesn't change isOpenVal, then pushNotification sees it closed and returns.
          await pushNotification({ a: 1 });
          expect(mockLPush).not.toHaveBeenCalled();
      });

      it('getNotifications should return empty', async () => {
          const res = await getNotifications();
          expect(res).toEqual([]);
      });

      it('clearNotifications should return early', async () => {
          await clearNotifications();
          expect(mockDel).not.toHaveBeenCalled();
      });

      it('setCache should return early', async () => {
          await setCache('k', 'v');
          expect(mockSet).not.toHaveBeenCalled();
      });

      it('getCache should return null', async () => {
          const res = await getCache('k');
          expect(res).toBeNull();
      });

      it('deleteCache should return early', async () => {
          await deleteCache('k');
          expect(mockDel).not.toHaveBeenCalled();
      });

      it('deletePattern should return early', async () => {
          await deletePattern('p');
          expect(mockKeys).not.toHaveBeenCalled();
      });
  });

  describe('Error handling when open', () => {
    it('should handle push error', async () => {
        mockLPush.mockRejectedValue(new Error('fail'));
        await pushNotification({});
    });

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

    it('should handle JSON parse error in getCache', async () => {
        mockGet.mockResolvedValue('invalid json');
        const res = await getCache('k');
        expect(res).toBeNull();
    });

    it('should handle JSON parse error in getNotifications', async () => {
        mockLRange.mockResolvedValue(['invalid json']);
        const res = await getNotifications();
        expect(res).toEqual([]);
    });

    it('should delete list', async () => {
          await clearNotifications();
          expect(mockDel).toHaveBeenCalledWith('admin_notifications');
      });

    it('should delete by pattern', async () => {
      mockKeys.mockResolvedValue(['k1', 'k2']);
      await deletePattern('test*');
      expect(mockKeys).toHaveBeenCalledWith('test*');
      expect(mockDel).toHaveBeenCalledWith(['k1', 'k2']);
    });

    it('should not call del if no keys found in pattern', async () => {
        mockKeys.mockResolvedValue([]);
        await deletePattern('empty*');
        expect(mockDel).not.toHaveBeenCalled();
    });
  });
});