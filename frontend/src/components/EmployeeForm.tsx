import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { X, Save, User, Briefcase, Building2, DollarSign } from 'lucide-react';
import type { AppDispatch, RootState } from '../store';
import { createEmployee, updateEmployee } from '../store/employeeSlice';
import type { Employee } from '../types/employee';
import toast from 'react-hot-toast';

interface EmployeeFormProps {
  employee?: Employee | null;
  onClose: () => void;
}

export function EmployeeForm({ employee, onClose }: EmployeeFormProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { loading } = useSelector((state: RootState) => state.employee);
  const isEditing = !!employee;

  const [formData, setFormData] = useState({
    name: '',
    position: '',
    department: '',
    salary: '',
  });

  const departments = [
    'Engineering', 'Product', 'Data', 'Human Resources', 'Sales', 
    'Marketing', 'Design', 'Operations', 'Quality Assurance', 'Business'
  ];

  const positions = [
    'Software Engineer', 'Senior Software Engineer', 'Product Manager', 
    'Data Scientist', 'HR Specialist', 'Sales Representative', 
    'Marketing Manager', 'Designer', 'DevOps Engineer', 'QA Engineer', 
    'Business Analyst', 'Intern'
  ];

  useEffect(() => {
    if (employee) {
      setFormData({
        name: employee.name || '',
        position: employee.position || '',
        department: employee.department || '',
        salary: employee.salary?.toString() || '',
      });
    }
  }, [employee]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    const employeeData = {
      name: formData.name.trim(),
      position: formData.position.trim() || undefined,
      department: formData.department.trim() || undefined,
      salary: formData.salary ? parseFloat(formData.salary) : undefined,
    };

    try {
      if (isEditing && employee?._id) {
        await dispatch(updateEmployee({ id: employee._id, employee: employeeData })).unwrap();
        toast.success('Employee updated!');
      } else {
        await dispatch(createEmployee(employeeData)).unwrap();
        toast.success('New employee added!');
      }
      onClose();
    } catch (err: any) {
      toast.error(err || 'Operation failed');
    }
  };

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
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-md w-full relative z-10"
      >
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Profile' : 'New Profile'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">Fill in the details below.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="text-gray-400" size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase ml-1">
              <User size={12} /> Full Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all"
              placeholder="e.g. John Doe"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase ml-1">
                <Briefcase size={12} /> Position
              </label>
              <select
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
              >
                <option value="">Select...</option>
                {positions.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase ml-1">
                <Building2 size={12} /> Dept
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
              >
                <option value="">Select...</option>
                {departments.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase ml-1">
              <DollarSign size={12} /> Annual Salary
            </label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
              <input
                type="number"
                name="salary"
                value={formData.salary}
                onChange={handleChange}
                className="w-full pl-10 pr-5 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="0.00"
              />
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50 mt-4"
          >
            <Save size={20} />
            {loading ? 'Saving Changes...' : (isEditing ? 'Save Changes' : 'Create Profile')}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
