import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect } from 'vitest';
import { Header } from '../Header';
import authReducer from '../../store/authSlice';

describe('Header', () => {
  const renderWithStore = (state: any) => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: { auth: state },
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
    renderWithStore({ user: 'testuser', isAuthenticated: true, token: 'token' });

    expect(screen.getByText('Welcome, testuser')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Logout' })).toBeInTheDocument();
  });

  it('dispatches logout action on button click', () => {
    const { store } = renderWithStore({ user: 'testuser', isAuthenticated: true, token: 'token' });

    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));

    const state = store.getState().auth;
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });
});
