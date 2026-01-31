import authReducer, { setCredentials, logout } from '../authSlice';
import { describe, it, expect } from 'vitest';

describe('authSlice', () => {
  const initialState = {
    user: null,
    role: null,
    token: null,
    isAuthenticated: false,
  };

  it('should handle initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setCredentials', () => {
    const actual = authReducer(
      initialState,
      setCredentials({ user: 'testuser', token: 'token123', role: 'user' })
    );
    expect(actual.user).toEqual('testuser');
    expect(actual.token).toEqual('token123');
    expect(actual.role).toEqual('user');
    expect(actual.isAuthenticated).toEqual(true);
  });

  it('should handle logout', () => {
    const loggedInState = {
      user: 'testuser',
      role: 'user',
      token: 'token123',
      isAuthenticated: true,
    };
    const actual = authReducer(loggedInState, logout());
    expect(actual).toEqual(initialState);
  });
});
