import type { Employee } from '../types/employee';
interface EmployeeFormProps {
    employee?: Employee | null;
    onClose: () => void;
}
export declare function EmployeeForm({ employee, onClose }: EmployeeFormProps): import("react/jsx-runtime").JSX.Element;
export {};
