import axios from 'axios';
import type { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '../types/employee';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_BASE_URL = envUrl.startsWith('http') ? envUrl : `https://${envUrl}`;

console.log('API_BASE_URL:', API_BASE_URL); // Debug log

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
  // Get all employees
  getAll: async (): Promise<Employee[]> => {
    const response = await apiClient.get<Employee[]>('/employees');
    return response.data;
  },

  // Get employee by ID
  getById: async (id: string): Promise<Employee> => {
    const response = await apiClient.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  // Create new employee
  create: async (employee: CreateEmployeeRequest): Promise<{ insertedId: string }> => {
    const response = await apiClient.post<{ insertedId: string }>('/employees', employee);
    return response.data;
  },

  // Update employee
  update: async (id: string, employee: UpdateEmployeeRequest): Promise<{ modifiedCount: number }> => {
    const response = await apiClient.put<{ modifiedCount: number }>(`/employees/${id}`, employee);
    return response.data;
  },

  // Delete employee
  delete: async (id: string): Promise<{ deletedCount: number }> => {
    const response = await apiClient.delete<{ deletedCount: number }>(`/employees/${id}`);
    return response.data;
  },
};