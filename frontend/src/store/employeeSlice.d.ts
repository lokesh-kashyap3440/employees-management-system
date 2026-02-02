import type { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '../types/employee';
export interface EmployeeState {
    employees: Employee[];
    selectedEmployee: Employee | null;
    loading: boolean;
    error: string | null;
    searchQuery: string;
}
export declare const fetchEmployees: import("@reduxjs/toolkit").AsyncThunk<Employee[], void, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const fetchEmployeeById: import("@reduxjs/toolkit").AsyncThunk<Employee, string, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const createEmployee: import("@reduxjs/toolkit").AsyncThunk<Employee[], CreateEmployeeRequest, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const updateEmployee: import("@reduxjs/toolkit").AsyncThunk<Employee[], {
    id: string;
    employee: UpdateEmployeeRequest;
}, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const deleteEmployee: import("@reduxjs/toolkit").AsyncThunk<Employee[], string, import("@reduxjs/toolkit").AsyncThunkConfig>;
export declare const clearError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"employee/clearError">, clearSelectedEmployee: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"employee/clearSelectedEmployee">, setSelectedEmployee: import("@reduxjs/toolkit").ActionCreatorWithPayload<Employee | null, "employee/setSelectedEmployee">, setSearchQuery: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "employee/setSearchQuery">;
declare const _default: import("redux").Reducer<EmployeeState>;
export default _default;
