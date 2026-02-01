import { jest, describe, beforeEach, it, expect } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth';

describe('Auth Middleware', () => {
  let mockReq: any;
  let mockRes: any;
  let nextFunction: any;

  beforeEach(() => {
    mockReq = {
      headers: {}
    };
    mockRes = {
      sendStatus: jest.fn()
    };
    nextFunction = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next() if token is valid', () => {
    const user = { username: 'test' };
    const token = jwt.sign(user, 'secret');
    mockReq.headers['authorization'] = `Bearer ${token}`;

    authenticateToken(mockReq, mockRes, nextFunction);

    expect(nextFunction).toHaveBeenCalled();
    expect(mockReq.user).toMatchObject(user);
  });

  it('should return 401 if no token provided', () => {
    authenticateToken(mockReq, mockRes, nextFunction);
    expect(mockRes.sendStatus).toHaveBeenCalledWith(401);
  });

  it('should return 403 if token is invalid', () => {
    mockReq.headers['authorization'] = 'Bearer invalid-token';
    authenticateToken(mockReq, mockRes, nextFunction);
    expect(mockRes.sendStatus).toHaveBeenCalledWith(403);
  });
});
