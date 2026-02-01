import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi } from 'vitest';
import { ProfileModal } from '../ProfileModal';
import authReducer from '../../store/authSlice';
import { authApi } from '../../services/api';

vi.mock('../../services/api', () => ({
  authApi: {
    changePassword: vi.fn(),
  },
}));

describe('ProfileModal', () => {
  const mockOnClose = vi.fn();

  const renderModal = (user: string) => {
    const store = configureStore({
      reducer: { auth: authReducer },
      preloadedState: { auth: { user, isAuthenticated: true, token: 't', role: 'user' } },
    });
    return render(
      <Provider store={store}>
        <ProfileModal onClose={mockOnClose} />
      </Provider>
    );
  };

  it('renders correctly', () => {
    renderModal('JohnDoe');
    expect(screen.getByText('Security')).toBeInTheDocument();
    // Multiple "Update Password" texts (header and button)
    expect(screen.getAllByText('Update Password').length).toBeGreaterThan(0);
  });

  it('calls changePassword on submit', async () => {
    (authApi.changePassword as any).mockResolvedValue(undefined);
    renderModal('JohnDoe');

    const inputs = screen.getAllByPlaceholderText('••••••••');
    
    fireEvent.change(inputs[0], { target: { value: 'old' } });
    fireEvent.change(inputs[1], { target: { value: 'new' } });
    fireEvent.change(inputs[2], { target: { value: 'new' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));

    await waitFor(() => {
      expect(authApi.changePassword).toHaveBeenCalledWith({
        oldPassword: 'old',
        newPassword: 'new',
      });
    });
  });
});
