import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { AuthForm } from '../components/AuthForm';
import { authApi } from '../services/api';
import { setCredentials } from '../store/authSlice';
import { GoogleLogin } from '@react-oauth/google';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigateToRegister }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();

  const handleLogin = async (data: { username: string; password?: string }) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.login(data);
      dispatch(setCredentials({ 
        user: data.username, 
        token: response.accessToken,
        role: response.role 
      }));
      onLoginSuccess();
    } catch (err: any) {
      setError(err.response?.data || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.googleLogin(credentialResponse.credential);
      // For Google login, we use the email as the username
      const decodedToken = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
      dispatch(setCredentials({ 
        user: decodedToken.email, 
        token: response.accessToken,
        role: response.role 
      }));
      onLoginSuccess();
    } catch (err: any) {
      setError(err.response?.data || 'Google Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthForm
      title="Login"
      onSubmit={handleLogin}
      isLoading={isLoading}
      error={error}
      buttonText="Sign In"
    >
      <div className="flex flex-col gap-4 mt-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 font-bold uppercase">Or continue with</span>
          </div>
        </div>

        <div className="flex justify-center">
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setError('Google Login Failed')}
            useOneTap
            theme="filled_blue"
            shape="pill"
          />
        </div>

        <div className="text-center mt-2">
          <p className="text-gray-600 text-sm">
            Don't have an account?{' '}
            <button 
              onClick={onNavigateToRegister}
              className="text-blue-500 hover:text-blue-700 font-semibold"
            >
              Register
            </button>
          </p>
        </div>
      </div>
    </AuthForm>
  );
};
