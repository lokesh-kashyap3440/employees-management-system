import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { notificationApi } from '../services/api';

export interface Notification {
  id: string;
  type: string;
  message: string;
  data: any;
  timestamp: string;
  isRead: boolean;
}

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
};

export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async () => {
    const data = await notificationApi.getAll();
    return data;
  }
);

export const clearPersistentNotifications = createAsyncThunk(
  'notification/clearPersistentNotifications',
  async () => {
    await notificationApi.clearAll();
  }
);

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'isRead'>>) => {
      const newNotification: Notification = {
        ...action.payload,
        id: Math.random().toString(36).substr(2, 9),
        isRead: false,
      };
      state.notifications.unshift(newNotification);
      state.unreadCount += 1;
    },
    markAllAsRead: (state) => {
      state.notifications.forEach(n => n.isRead = true);
      state.unreadCount = 0;
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<any[]>) => {
        state.loading = false;
        // Map backend notifications to frontend format
        state.notifications = action.payload.map(n => ({
          ...n,
          id: n.id || Math.random().toString(36).substr(2, 9),
          isRead: false,
          timestamp: n.timestamp || new Date().toISOString(),
        }));
        state.unreadCount = state.notifications.filter(n => !n.isRead).length;
      })
      .addCase(fetchNotifications.rejected, (state) => {
        state.loading = false;
      })
      .addCase(clearPersistentNotifications.fulfilled, (state) => {
        state.notifications = [];
        state.unreadCount = 0;
      });
  },
});

export const { addNotification, markAllAsRead, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
