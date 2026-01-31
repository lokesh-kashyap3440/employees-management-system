import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AuthForm } from '../AuthForm';

describe('AuthForm', () => {
  it('renders correctly', () => {
    render(
      <AuthForm
        title="Login"
        onSubmit={() => {}}
        buttonText="Sign In"
      />
    );
    
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
  });

  it('submits with data', () => {
    const handleSubmit = vi.fn();
    render(
      <AuthForm
        title="Login"
        onSubmit={handleSubmit}
        buttonText="Sign In"
      />
    );

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'testuser' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));

    expect(handleSubmit).toHaveBeenCalledWith({
      username: 'testuser',
      password: 'password123',
    });
  });

  it('displays error message', () => {
    render(
      <AuthForm
        title="Login"
        onSubmit={() => {}}
        buttonText="Sign In"
        error="Invalid credentials"
      />
    );

    expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
  });
});
