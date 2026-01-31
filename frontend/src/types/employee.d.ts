export interface Employee {
    _id?: string;
    name: string;
    position?: string;
    department?: string;
    salary?: number;
    createdBy?: string;
}
export interface CreateEmployeeRequest {
    name: string;
    position?: string;
    department?: string;
    salary?: number;
}
export interface UpdateEmployeeRequest {
    name?: string;
    position?: string;
    department?: string;
    salary?: number;
}
export interface ApiResponse<T> {
    data?: T;
    error?: string;
}
