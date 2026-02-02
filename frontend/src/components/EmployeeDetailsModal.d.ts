import React from 'react';
import type { Employee } from '../types/employee';
interface EmployeeDetailsModalProps {
    employee: Employee;
    onClose: () => void;
}
export declare const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps>;
export {};
