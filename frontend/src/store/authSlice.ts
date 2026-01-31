import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export interface AuthState {
  user: string | null;
  role: string | null;
  token: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: localStorage.getItem('user'),
  role: localStorage.getItem('role'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (
      state,
      action: PayloadAction<{ user: string; token: string; role: string }>
    ) => {
      const { user, token, role } = action.payload;
      state.user = user;
      state.role = role;
      state.token = token;
      state.isAuthenticated = true;
      localStorage.setItem('user', user);
      localStorage.setItem('role', role);
      localStorage.setItem('token', token);
    },
    logout: (state) => {
      state.user = null;
      state.role = null;
      state.token = null;
      state.isAuthenticated = false;
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      localStorage.removeItem('token');
    },
  },
});

export const { setCredentials, logout } = authSlice.actions;
export default authSlice.reducer;
