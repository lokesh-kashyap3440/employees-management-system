import React from 'react';
import type { Employee } from '../types/employee';
interface EmployeeListProps {
    onEdit: (employee: Employee) => void;
    onAdd: () => void;
    onView: (employee: Employee) => void;
}
export declare const EmployeeList: React.FC<EmployeeListProps>;
export {};
