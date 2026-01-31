import { useState, useEffect } from 'react';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { store } from './store';
import type { RootState, AppDispatch } from './store';
import { EmployeeList } from './components/EmployeeList';
import { EmployeeForm } from './components/EmployeeForm';
import { Header } from './components/Header';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import type { Employee } from './types/employee';
import { Toaster, toast } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import { addNotification } from './store/notificationSlice';

function AppContent() {
  const dispatch = useDispatch<AppDispatch>();
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);
  const [currentPage, setCurrentPage] = useState<'login' | 'register'>('login');

  useEffect(() => {
    if (isAuthenticated) {
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      const socket = io(API_BASE_URL);

      socket.on('connect', () => {
        console.log('🔌 Connected to Socket.io');
        if (user === 'admin') {
          console.log('👑 Joining admin room...');
          socket.emit('join-admin');
        }
      });

      socket.on('notification', (data) => {
        dispatch(addNotification(data));
        toast.custom((t) => (
          <div className={`${t.visible ? 'animate-enter' : 'animate-leave'} max-w-md w-full bg-white shadow-2xl rounded-[2rem] pointer-events-auto flex ring-1 ring-black ring-opacity-5 border border-blue-50`}>
            <div className="flex-1 w-0 p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 pt-0.5">
                  <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white font-black">
                    !
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-black text-gray-900 uppercase tracking-tight">Admin Alert</p>
                  <p className="mt-1 text-sm text-gray-500 font-medium">{data.message}</p>
                </div>
              </div>
            </div>
            <div className="flex border-l border-gray-100">
              <button
                onClick={() => toast.dismiss(t.id)}
                className="w-full border border-transparent rounded-none rounded-r-2xl p-4 flex items-center justify-center text-sm font-bold text-blue-600 hover:text-blue-500 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        ));
      });

      return () => {
        socket.disconnect();
      };
    }
  }, [isAuthenticated, user, dispatch]);

  const handleAdd = () => {
    setEditingEmployee(null);
    setShowForm(true);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingEmployee(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-[#f8faff] min-h-screen">
        <Toaster position="top-right" />
        {currentPage === 'login' ? (
          <LoginPage 
            onLoginSuccess={() => {}} 
            onNavigateToRegister={() => setCurrentPage('register')} 
          />
        ) : (
          <RegisterPage 
            onRegisterSuccess={() => setCurrentPage('login')} 
            onNavigateToLogin={() => setCurrentPage('login')} 
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8faff] pb-20">
      <Toaster position="top-right" />
      <Header />
      <main>
        <EmployeeList onEdit={handleEdit} onAdd={handleAdd} />
        <AnimatePresence>
          {showForm && (
            <EmployeeForm
              employee={editingEmployee}
              onClose={handleCloseForm}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <Provider store={store}>
        <AppContent />
      </Provider>
    </GoogleOAuthProvider>
  );
}

export default App;
