import React, { useState } from 'react';
import { AuthForm } from '../components/AuthForm';
import { authApi } from '../services/api';

interface RegisterPageProps {
  onRegisterSuccess: () => void;
  onNavigateToLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onRegisterSuccess, onNavigateToLogin }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (data: { username: string; password?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      await authApi.register(data);
      alert('Registration successful! Please login.');
      onRegisterSuccess();
    } catch (err: any) {
      setError(err.response?.data || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      title="Register"
      onSubmit={handleRegister}
      isLoading={isLoading}
      error={error}
      buttonText="Sign Up"
    >
      <div className="text-center">
        <p className="text-gray-600 text-sm">
          Already have an account?{' '}
          <button
            onClick={onNavigateToLogin}
            className="text-blue-500 hover:text-blue-700 font-semibold"
          >
            Login
          </button>
        </p>
      </div>
    </AuthForm>
  );
};
