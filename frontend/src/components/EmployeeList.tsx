import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { motion } from 'framer-motion';
import { Edit2, Trash2, Plus, User, Building2, Wallet, Search } from 'lucide-react';
import type { RootState, AppDispatch } from '../store';
import { fetchEmployees, deleteEmployee, setSearchQuery } from '../store/employeeSlice';
import type { Employee } from '../types/employee';

interface EmployeeListProps {
  onEdit: (employee: Employee) => void;
  onAdd: () => void;
  onView: (employee: Employee) => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({ onEdit, onAdd, onView }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { employees, loading, error, searchQuery } = useSelector((state: RootState) => state.employee);
  const { user, role } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this employee?')) {
      await dispatch(deleteEmployee(id));
    }
  };

  const handleEdit = (e: React.MouseEvent, employee: Employee) => {
    e.stopPropagation();
    onEdit(employee);
  };

  const filteredEmployees = employees.filter((emp) =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && employees.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 text-red-500 bg-red-50 rounded-xl m-4 border border-red-100">
        <p className="font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Team</h1>
          <p className="text-gray-500 font-medium mt-1">Manage your workforce</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
          {/* Search Bar */}
          <div className="relative group w-full md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search employees..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-shadow shadow-sm"
              value={searchQuery}
              onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            />
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onAdd}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all w-full sm:w-auto"
          >
            <Plus size={20} />
            Add Member
          </motion.button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee, index) => (
          <motion.div
            key={employee._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onView(employee)}
            className="bg-white rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all border border-gray-100 group relative overflow-hidden cursor-pointer hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2 z-10">
              <button
                onClick={(e) => handleEdit(e, employee)}
                className="p-2 bg-gray-100 hover:bg-blue-50 text-gray-600 hover:text-blue-600 rounded-xl transition-colors"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={(e) => handleDelete(e, employee._id!)}
                className="p-2 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 rounded-xl transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex items-start gap-4 mb-4">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-200">
                {employee.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg">{employee.name}</h3>
                <p className="text-gray-400 text-sm font-medium">{employee.position}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl">
                <Building2 size={18} className="text-blue-500" />
                <span className="text-sm font-semibold">{employee.department}</span>
              </div>
              
              {(role === 'admin' || user === employee.createdBy) && (
                <div className="flex items-center gap-3 text-gray-600 bg-gray-50 p-3 rounded-xl">
                  <Wallet size={18} className="text-green-500" />
                  <span className="text-sm font-semibold">${(employee.salary || 0).toLocaleString()}</span>
                </div>
              )}

              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mt-4 pl-1">
                <User size={12} />
                <span className="uppercase tracking-wider">Added by {employee.createdBy}</span>
              </div>
            </div>
          </motion.div>
        ))}
        
        {filteredEmployees.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400">
            <p className="font-medium">No team members found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
};