import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import { createServer } from 'http';

// Mock redis
jest.unstable_mockModule('../redis.ts', () => ({
  connectRedis: jest.fn(),
  pushNotification: jest.fn(),
}));

const mockEmit = jest.fn();
const mockTo = jest.fn().mockReturnValue({ emit: mockEmit });
const mockJoin = jest.fn();

// Mock Socket.io
jest.unstable_mockModule('socket.io', () => ({
  Server: jest.fn().mockImplementation(() => ({
    on: jest.fn().mockImplementation((event, cb) => {
        if (event === 'connection') {
            const mockSocket = {
                id: 'socket-id',
                on: jest.fn(),
                join: mockJoin
            };
            cb(mockSocket);
        }
    }),
    to: mockTo,
    emit: mockEmit,
  }))
}));

const { initSocket, notifyAdmin, broadcastUpdate } = await import('../socket.ts');

describe('Socket Utilities', () => {
  let httpServer: any;

  beforeEach(() => {
    jest.clearAllMocks();
    httpServer = createServer();
  });

  it('should initialize socket and handle connection', () => {
    const io = initSocket(httpServer);
    expect(io).toBeDefined();
  });

  it('should handle notifyAdmin', () => {
    initSocket(httpServer);
    notifyAdmin({ message: 'alert' });
    expect(mockTo).toHaveBeenCalledWith('admin-room');
  });

  it('should handle broadcastUpdate', () => {
    initSocket(httpServer);
    broadcastUpdate('REFRESH');
    expect(mockEmit).toHaveBeenCalledWith('data_update', expect.anything());
  });
});
