import React from 'react';
interface AuthFormProps {
    title: string;
    onSubmit: (data: {
        username: string;
        password?: string;
    }) => void;
    isLoading?: boolean;
    error?: string | null;
    buttonText: string;
    children?: React.ReactNode;
}
export declare const AuthForm: React.FC<AuthFormProps>;
export {};
