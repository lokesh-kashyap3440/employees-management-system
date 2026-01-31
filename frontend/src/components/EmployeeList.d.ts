import type { Employee } from '../types/employee';
interface EmployeeListProps {
    onEdit: (employee: Employee) => void;
    onAdd: () => void;
}
export declare function EmployeeList({ onEdit, onAdd }: EmployeeListProps): import("react/jsx-runtime").JSX.Element;
export {};
