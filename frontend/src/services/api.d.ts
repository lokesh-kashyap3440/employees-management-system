import type { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '../types/employee';
import type { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';
export declare const API_BASE_URL: any;
export declare const authApi: {
    login: (credentials: LoginRequest) => Promise<AuthResponse>;
    googleLogin: (idToken: string) => Promise<AuthResponse>;
    register: (credentials: RegisterRequest) => Promise<void>;
    changePassword: (passwords: {
        oldPassword: string;
        newPassword: string;
    }) => Promise<void>;
};
export declare const employeeApi: {
    getAll: () => Promise<Employee[]>;
    getById: (id: string) => Promise<Employee>;
    create: (employee: CreateEmployeeRequest) => Promise<{
        insertedId: string;
    }>;
    update: (id: string, employee: UpdateEmployeeRequest) => Promise<{
        modifiedCount: number;
    }>;
    delete: (id: string) => Promise<{
        deletedCount: number;
    }>;
};
export declare const notificationApi: {
    getAll: () => Promise<any[]>;
    clearAll: () => Promise<void>;
};
export declare const chatbotApi: {
    query: (query: string) => Promise<{
        results: any[];
        message: string;
    }>;
};
