import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight } from 'lucide-react';

interface AuthFormProps {
  title: string;
  onSubmit: (data: { username: string; password?: string }) => void;
  isLoading?: boolean;
  error?: string | null;
  buttonText: string;
  children?: React.ReactNode;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  title,
  onSubmit,
  isLoading,
  error,
  buttonText,
  children,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ username, password });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8faff] px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="bg-white p-10 rounded-[2.5rem] shadow-xl shadow-blue-100/50 border border-blue-50/50">
          <div className="text-center mb-10">
            <h2 className="text-4xl font-black text-gray-900 mb-2">{title}</h2>
            <p className="text-gray-400 font-medium">Welcome to the future of EMS.</p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100 text-center"
            >
              {error}
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="username" className="text-xs font-black text-gray-400 uppercase ml-1 tracking-widest">Username</label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input
                  id="username"
                  className="w-full pl-14 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-700 placeholder:text-gray-300"
                  type="text"
                  placeholder="Your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="text-xs font-black text-gray-400 uppercase ml-1 tracking-widest">Password</label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                <input
                  id="password"
                  className="w-full pl-14 pr-5 py-4 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 transition-all font-medium text-gray-700 placeholder:text-gray-300"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-black py-5 rounded-2xl shadow-lg shadow-blue-200 transition-all disabled:opacity-50"
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : buttonText}
              {!isLoading && <ArrowRight size={20} />}
            </motion.button>
          </form>

          {children && <div className="mt-8 pt-8 border-t border-gray-50">{children}</div>}
        </div>
      </motion.div>
    </div>
  );
};