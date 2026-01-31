import { configureStore } from '@reduxjs/toolkit';
import employeeReducer from './employeeSlice';
import authReducer from './authSlice';
import notificationReducer from './notificationSlice';

export const store = configureStore({
  reducer: {
    employee: employeeReducer,
    auth: authReducer,
    notification: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;