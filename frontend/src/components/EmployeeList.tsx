import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, User, Briefcase, Building2, DollarSign } from 'lucide-react';
import type { AppDispatch, RootState } from '../store';
import { fetchEmployees, deleteEmployee, setSelectedEmployee } from '../store/employeeSlice';
import type { Employee } from '../types/employee';
import toast from 'react-hot-toast';

interface EmployeeListProps {
  onEdit: (employee: Employee) => void;
  onAdd: () => void;
}

export function EmployeeList({ onEdit, onAdd }: EmployeeListProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { employees, loading } = useSelector((state: RootState) => state.employee);

  useEffect(() => {
    dispatch(fetchEmployees());
  }, [dispatch]);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this employee?')) {
      try {
        await dispatch(deleteEmployee(id)).unwrap();
        toast.success('Employee deleted successfully');
      } catch (err) {
        toast.error('Failed to delete employee');
      }
    }
  };

  const handleEdit = (employee: Employee) => {
    dispatch(setSelectedEmployee(employee));
    onEdit(employee);
  };

  if (loading && employees.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-96 space-y-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="rounded-full h-16 w-12 border-t-4 border-blue-600"
        />
        <p className="text-gray-500 font-medium animate-pulse">Loading amazing people...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Team Members</h1>
          <p className="text-gray-500 mt-1">Manage and organize your workforce effortlessly.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onAdd}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-blue-200 transition-all"
        >
          <Plus size={20} />
          <span>Add Member</span>
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode='popLayout'>
          {employees.length === 0 && !loading ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100"
            >
              <User className="mx-auto text-gray-200 mb-4" size={64} />
              <p className="text-gray-400 text-lg font-medium">No team members found yet.</p>
            </motion.div>
          ) : (
            employees.map((employee, index) => (
              <motion.div
                key={employee._id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-blue-100/30 hover:border-blue-100 transition-all group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-blue-50 p-3 rounded-2xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <User size={24} />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(employee)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(employee._id!)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-800 mb-4">{employee.name}</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Briefcase size={16} className="text-gray-400" />
                    <span className="text-sm">{employee.position || 'No Position'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Building2 size={16} className="text-gray-400" />
                    <span className="text-sm">{employee.department || 'General'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <DollarSign size={16} className="text-gray-400" />
                    <span className="text-sm font-semibold text-gray-900">
                      {employee.salary ? `$${employee.salary.toLocaleString()}` : 'N/A'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-between text-[10px] text-gray-400 uppercase tracking-widest font-bold">
                  <span>ID: {employee._id?.slice(-6)}</span>
                  {employee.createdBy && (
                    <span className="bg-gray-100 px-2 py-1 rounded-md text-gray-500">By {employee.createdBy}</span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
