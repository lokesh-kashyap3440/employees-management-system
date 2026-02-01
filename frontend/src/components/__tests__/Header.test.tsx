import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect } from 'vitest';
import { Header } from '../Header';
import authReducer from '../../store/authSlice';
import notificationReducer from '../../store/notificationSlice';

describe('Header', () => {
  const renderWithStore = (state: any) => {
    const store = configureStore({
      reducer: { 
        auth: authReducer,
        notification: notificationReducer
      },
      preloadedState: { 
        auth: state.auth || state,
        notification: state.notification || { notifications: [], unreadCount: 0, loading: false }
      },
    });
    return {
        ...render(
        <Provider store={store}>
            <Header />
        </Provider>
        ),
        store
    };
  };

  it('renders user name and logout button', () => {
    renderWithStore({ 
        auth: { user: 'testuser', isAuthenticated: true, token: 'token' }
    });

    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Logout/i })).toBeInTheDocument();
  });

  it('dispatches logout action on button click', () => {
    const { store } = renderWithStore({ 
        auth: { user: 'testuser', isAuthenticated: true, token: 'token' }
    });

    fireEvent.click(screen.getByRole('button', { name: /Logout/i }));

    const state = store.getState().auth;
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
