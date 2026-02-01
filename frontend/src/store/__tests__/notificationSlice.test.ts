import { vi, describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import notificationReducer, {
  addNotification,
  markAllAsRead,
  clearNotifications,
  fetchNotifications,
  clearPersistentNotifications,
} from '../notificationSlice';
import { notificationApi } from '../../services/api';

// Mock the API service
vi.mock('../../services/api', () => ({
  notificationApi: {
    getAll: vi.fn(),
    clearAll: vi.fn(),
  },
}));

describe('notificationSlice', () => {
  let store: any;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        notification: notificationReducer,
      },
    });
    vi.clearAllMocks();
  });

  it('should return the initial state', () => {
    const state = store.getState().notification;
    expect(state).toEqual({
      notifications: [],
      unreadCount: 0,
      loading: false,
    });
  });

  it('should handle addNotification', () => {
    const newNotification = {
      type: 'INFO',
      message: 'Test message',
      data: {},
      timestamp: new Date().toISOString(),
    };

    store.dispatch(addNotification(newNotification));

    const state = store.getState().notification;
    expect(state.notifications).toHaveLength(1);
    expect(state.unreadCount).toBe(1);
    expect(state.notifications[0]).toMatchObject({
        message: 'Test message',
        isRead: false
    });
  });

  it('should handle markAllAsRead', () => {
    // Add a notification first
    store.dispatch(addNotification({
        type: 'INFO',
        message: 'Test',
        data: {},
        timestamp: new Date().toISOString()
    }));

    store.dispatch(markAllAsRead());

    const state = store.getState().notification;
    expect(state.unreadCount).toBe(0);
    expect(state.notifications[0].isRead).toBe(true);
  });

  it('should handle clearNotifications', () => {
    store.dispatch(addNotification({
        type: 'INFO',
        message: 'Test',
        data: {},
        timestamp: new Date().toISOString()
    }));

    store.dispatch(clearNotifications());

    const state = store.getState().notification;
    expect(state.notifications).toHaveLength(0);
    expect(state.unreadCount).toBe(0);
  });

  describe('async thunks', () => {
    it('should handle fetchNotifications.fulfilled', async () => {
      const mockData = [
        { id: '1', message: 'Test 1', timestamp: new Date().toISOString() },
        { id: '2', message: 'Test 2', timestamp: new Date().toISOString() },
      ];
      (notificationApi.getAll as any).mockResolvedValue(mockData);

      await store.dispatch(fetchNotifications());

      const state = store.getState().notification;
      expect(state.loading).toBe(false);
      expect(state.notifications).toHaveLength(2);
      expect(state.unreadCount).toBe(2);
      expect(state.notifications[0].message).toBe('Test 1');
    });

    it('should handle fetchNotifications.rejected', async () => {
      (notificationApi.getAll as any).mockRejectedValue(new Error('Failed'));

      await store.dispatch(fetchNotifications());

      const state = store.getState().notification;
      expect(state.loading).toBe(false);
      expect(state.notifications).toHaveLength(0);
    });

    it('should handle clearPersistentNotifications.fulfilled', async () => {
      (notificationApi.clearAll as any).mockResolvedValue(undefined);

      // Pre-populate state
      store.dispatch(addNotification({ message: 'Old' } as any));
      
      await store.dispatch(clearPersistentNotifications());

      const state = store.getState().notification;
      expect(state.notifications).toHaveLength(0);
      expect(state.unreadCount).toBe(0);
    });
  });
});
