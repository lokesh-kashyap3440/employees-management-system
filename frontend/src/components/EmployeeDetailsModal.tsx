import React from 'react';
import { motion } from 'framer-motion';
import { X, User, Briefcase, Building2, Calendar, Wallet, ShieldCheck } from 'lucide-react';
import type { Employee } from '../types/employee';

interface EmployeeDetailsModalProps {
  employee: Employee;
  onClose: () => void;
}

export const EmployeeDetailsModal: React.FC<EmployeeDetailsModalProps> = ({ employee, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-[2.5rem] shadow-2xl p-8 max-w-lg w-full relative z-10 overflow-hidden"
      >
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-br from-blue-500 to-blue-600" />

        <div className="relative">
            <button
                onClick={onClose}
                className="absolute top-0 right-0 p-2 bg-white/20 hover:bg-white/30 text-white rounded-xl transition-colors backdrop-blur-md"
            >
                <X size={20} />
            </button>

            <div className="flex flex-col items-center mt-4">
                <div className="h-24 w-24 rounded-[2rem] bg-white p-1 shadow-xl mb-4">
                    <div className="h-full w-full rounded-[1.8rem] bg-blue-50 flex items-center justify-center text-blue-600 font-black text-3xl">
                        {employee.name.charAt(0)}
                    </div>
                </div>
                <h2 className="text-2xl font-black text-gray-900 text-center">{employee.name}</h2>
                <p className="text-gray-500 font-medium">{employee.position}</p>
            </div>

            <div className="mt-8 space-y-4">
                <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4">
                    <div className="bg-white p-2 rounded-xl text-blue-500 shadow-sm">
                        <Building2 size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Department</p>
                        <p className="text-gray-900 font-semibold">{employee.department}</p>
                    </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-2xl flex items-center gap-4">
                    <div className="bg-white p-2 rounded-xl text-green-500 shadow-sm">
                        <Wallet size={20} />
                    </div>
                    <div>
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Salary</p>
                        <p className="text-gray-900 font-semibold">${employee.salary.toLocaleString()}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1 text-gray-400">
                            <User size={14} />
                            <span className="text-[10px] font-bold uppercase">Added By</span>
                        </div>
                        <p className="text-gray-900 font-semibold text-sm">{employee.createdBy}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-2xl">
                        <div className="flex items-center gap-2 mb-1 text-gray-400">
                            <Calendar size={14} />
                            <span className="text-[10px] font-bold uppercase">Joined</span>
                        </div>
                        <p className="text-gray-900 font-semibold text-sm">
                            {employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
      </motion.div>
    </div>
  );
};
