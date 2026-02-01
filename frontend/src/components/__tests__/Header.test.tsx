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

  it('toggles notifications on click', async () => {
    renderWithStore({ 
        auth: { user: 'admin', role: 'admin', isAuthenticated: true },
        notification: { notifications: [{ id: '1', message: 'Hi', timestamp: new Date().toISOString(), isRead: false }], unreadCount: 1, loading: false }
    });

    fireEvent.click(screen.getByLabelText(/Toggle notifications/i));
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Hi')).toBeInTheDocument();
  });

  it('calls clear persistent notifications for admin', async () => {
    renderWithStore({ 
        auth: { user: 'admin', role: 'admin', isAuthenticated: true },
        notification: { notifications: [{ id: '1', message: 'Hi', timestamp: new Date().toISOString(), isRead: false }], unreadCount: 1, loading: false }
    });

    fireEvent.click(screen.getByLabelText(/Toggle notifications/i));
    fireEvent.click(screen.getByRole('button', { name: /Clear All/i }));
    // Verify action dispatched or state updated
  });

  it('opens profile modal on click', () => {
    renderWithStore({ 
        auth: { user: 'testuser', isAuthenticated: true, token: 'token' }
    });

    fireEvent.click(screen.getByLabelText(/Open profile settings/i));
    expect(screen.getByText('Security')).toBeInTheDocument();
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