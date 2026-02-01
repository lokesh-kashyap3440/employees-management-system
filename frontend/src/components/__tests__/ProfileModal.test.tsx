import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProfileModal } from '../ProfileModal';
import authReducer from '../../store/authSlice';
import { authApi } from '../../services/api';
import toast from 'react-hot-toast';

vi.mock('../../services/api', () => ({
  authApi: {
    changePassword: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
    default: {
        error: vi.fn(),
        success: vi.fn(),
    },
}));

describe('ProfileModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

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
      expect(toast.success).toHaveBeenCalledWith('Password changed successfully!');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('shows error if passwords do not match', async () => {
    renderModal('JohnDoe');
    const inputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(inputs[0], { target: { value: 'old' } });
    fireEvent.change(inputs[1], { target: { value: 'new' } });
    fireEvent.change(inputs[2], { target: { value: 'diff' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));
    expect(toast.error).toHaveBeenCalledWith('New passwords do not match');
  });

  it('shows error on API failure', async () => {
    (authApi.changePassword as any).mockRejectedValue({
        response: { data: 'Invalid old password' }
    });
    renderModal('JohnDoe');
    const inputs = screen.getAllByPlaceholderText('••••••••');
    fireEvent.change(inputs[0], { target: { value: 'wrong' } });
    fireEvent.change(inputs[1], { target: { value: 'new' } });
    fireEvent.change(inputs[2], { target: { value: 'new' } });
    fireEvent.click(screen.getByRole('button', { name: /Update Password/i }));
    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid old password');
    });
  });
});