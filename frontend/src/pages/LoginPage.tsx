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
      // On Android, sometimes only idToken is returned, sometimes accessToken.
      // We prioritize idToken but fallback if needed.
      const token = user.authentication.idToken || user.authentication.accessToken;
      
      if (token) {
        await processGoogleLogin(token, user.email);
      } else {
        throw new Error('No token received from Google');
      }
    } catch (err: any) {
      console.error('Native Google Login Error:', err);
      setError(`Native Login Failed: ${err.message || JSON.stringify(err)}`);
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
              {/* Using a reliable SVG for the Google Icon */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
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