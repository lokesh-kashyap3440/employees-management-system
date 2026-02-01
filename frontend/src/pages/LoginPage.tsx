import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { AuthForm } from '../components/AuthForm';
import { authApi } from '../services/api';
import { setCredentials } from '../store/authSlice';
import { GoogleLogin } from '@react-oauth/google';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth';
import { Capacitor } from '@capacitor/core';

interface LoginPageProps {
  onLoginSuccess: () => void;
  onNavigateToRegister: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigateToRegister }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isNative, setIsNative] = useState(false);
  const dispatch = useDispatch();

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
    if (Capacitor.isNativePlatform()) {
        GoogleAuth.initialize();
    }
  }, []);

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

  const processGoogleLogin = async (idToken: string, email: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authApi.googleLogin(idToken);
      dispatch(setCredentials({ 
        user: email, 
        token: response.accessToken,
        role: response.role 
      }));
      onLoginSuccess();
    } catch (err: any) {
      console.error('Google Login Error:', err);
      setError(err.response?.data || 'Google Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNativeGoogleLogin = async () => {
    try {
      const user = await GoogleAuth.signIn();
      if (user.authentication.idToken) {
        await processGoogleLogin(user.authentication.idToken, user.email);
      }
    } catch (err: any) {
      console.error('Native Google Login Error:', err);
      setError('Native Google Login Failed');
    }
  };

  const handleWebGoogleSuccess = async (credentialResponse: any) => {
    const decodedToken = JSON.parse(atob(credentialResponse.credential.split('.')[1]));
    await processGoogleLogin(credentialResponse.credential, decodedToken.email);
  };

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  return (
    <AuthForm
      title="Login"
      onSubmit={handleLogin}
      isLoading={isLoading}
      error={error}
      buttonText="Sign In"
    >
      {error && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono text-gray-600 break-all">
          <p><strong>Debug Info:</strong></p>
          <p>API: {API_URL}</p>
          <p>Client ID: {CLIENT_ID ? 'Set ✅' : 'Missing ❌'}</p>
          <p>Platform: {isNative ? 'Native 📱' : 'Web 🌐'}</p>
        </div>
      )}
      <div className="flex flex-col gap-4 mt-4">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500 font-bold uppercase">Or continue with</span>
          </div>
        </div>

        <div className="flex justify-center min-h-[44px]">
          {isNative ? (
            <button
              onClick={handleNativeGoogleLogin}
              className="flex items-center gap-3 px-6 py-2 bg-white border border-gray-300 rounded-full shadow-sm hover:bg-gray-50 transition-colors"
            >
              <img src="https://www.gstatic.com/firebase/anonymous-logos/google.png" alt="Google" className="w-5 h-5" />
              <span className="text-sm font-semibold text-gray-700">Sign in with Google</span>
            </button>
          ) : (
            <GoogleLogin
              onSuccess={handleWebGoogleSuccess}
              onError={() => {
                console.error('Google Login Component Error');
                setError('Google Login Failed');
              }}
              useOneTap={false}
              theme="filled_blue"
              shape="pill"
            />
          )}
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