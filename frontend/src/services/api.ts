import axios from 'axios';
import type { LoginRequest, AuthResponse, RegisterRequest } from '../types/auth';
import type { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '../types/employee';

// Detect if we are running in a Capacitor/Android environment
const isAndroid = window.location.href.includes('capacitor://') || 
                  (window.location.hostname === 'localhost' && /Android/i.test(navigator.userAgent));

const PROD_URL = 'https://ts-mongo-oidc-backend.onrender.com';
const EMULATOR_URL = 'http://10.0.2.2:3000';

// Logic:
// 1. If explicit env var exists, use it.
// 2. If we detect Android Emulator, use 10.0.2.2.
// 3. If we are on desktop localhost, use localhost.
// 4. Otherwise, use Production.
export const API_BASE_URL = import.meta.env.VITE_API_URL || 
                     (isAndroid ? EMULATOR_URL : 
                     (window.location.hostname === 'localhost' ? 'http://localhost:3000' : PROD_URL));

console.log('App environment:', { isAndroid, hostname: window.location.hostname });
console.log('API_BASE_URL:', API_BASE_URL);

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },
  googleLogin: async (idToken: string): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/google', { idToken });
    return response.data;
  },
  register: async (credentials: RegisterRequest): Promise<void> => {
    await apiClient.post('/auth/register', credentials);
  },
  changePassword: async (passwords: { oldPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.put('/auth/change-password', passwords);
  },
};

export const employeeApi = {
  getAll: async (): Promise<Employee[]> => {
    const response = await apiClient.get<Employee[]>('/employees');
    return response.data;
  },
  getById: async (id: string): Promise<Employee> => {
    const response = await apiClient.get<Employee>(`/employees/${id}`);
    return response.data;
  },
  create: async (employee: CreateEmployeeRequest): Promise<{ insertedId: string }> => {
    const response = await apiClient.post<{ insertedId: string }>('/employees', employee);
    return response.data;
  },
  update: async (id: string, employee: UpdateEmployeeRequest): Promise<{ modifiedCount: number }> => {
    const response = await apiClient.put<{ modifiedCount: number }>(`/employees/${id}`, employee);
    return response.data;
  },
  delete: async (id: string): Promise<{ deletedCount: number }> => {
    const response = await apiClient.delete<{ deletedCount: number }>(`/employees/${id}`);
    return response.data;
  },
};

export const notificationApi = {
  getAll: async (): Promise<any[]> => {
    const response = await apiClient.get<any[]>('/notifications');
    return response.data;
  },
  clearAll: async (): Promise<void> => {
    await apiClient.delete('/notifications');
  },
};

export const chatbotApi = {
  query: async (query: string): Promise<{ results: any[]; message: string }> => {
    const response = await apiClient.post<{ results: any[]; message: string }>('/chatbot/query', { query });
    return response.data;
  },
};
