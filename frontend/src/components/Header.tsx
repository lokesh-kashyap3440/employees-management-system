import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/authSlice';
import { markAllAsRead, clearNotifications } from '../store/notificationSlice';
import type { Notification } from '../store/notificationSlice';
import type { RootState } from '../store';
import { LogOut, Users, Settings, Bell, Clock, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProfileModal } from './ProfileModal';

export const Header: React.FC = () => {
  const dispatch = useDispatch();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [showProfileModal, setShowProfileModal] = React.useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const { notifications, unreadCount } = useSelector((state: RootState) => state.notification);

  const handleLogout = () => {
    dispatch(logout());
  };

  const handleClearNotifications = (e: React.MouseEvent) => {
    e.stopPropagation();
    dispatch(clearNotifications());
  };

  const toggleNotifications = () => {
    if (!showNotifications && unreadCount > 0) {
      dispatch(markAllAsRead());
    }
    setShowNotifications(!showNotifications);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-xl text-white">
              <Users size={24} />
            </div>
            <h1 className="text-2xl font-black text-gray-900 tracking-tight">
              EMS<span className="text-blue-600">.</span>
            </h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4">
              <div className="relative">
                <button 
                  onClick={toggleNotifications}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors relative"
                >
                  <Bell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowNotifications(false)}
                        className="fixed inset-0 z-10"
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-gray-100 py-4 z-20"
                      >
                        <div className="px-6 py-2 border-b border-gray-50 flex justify-between items-center mb-2">
                          <h3 className="font-black text-gray-900 text-sm">Notifications</h3>
                          {notifications.length > 0 && (
                            <button 
                              onClick={handleClearNotifications}
                              className="flex items-center gap-1 text-[10px] text-red-500 hover:text-red-700 font-bold uppercase transition-colors"
                            >
                              <Trash2 size={10} />
                              Clear All
                            </button>
                          )}
                        </div>
                        <div className="max-h-[400px] overflow-y-auto px-2">
                          {notifications.length === 0 ? (
                            <div className="py-10 text-center text-gray-400 text-sm italic">
                              No new messages
                            </div>
                          ) : (
                            notifications.map((n: Notification) => (
                              <div key={n.id} className="p-4 hover:bg-gray-50 rounded-2xl transition-colors cursor-pointer group">
                                <p className="text-sm text-gray-700 font-medium mb-1">{n.message}</p>
                                <div className="flex items-center gap-2 text-gray-400">
                                  <Clock size={10} />
                                  <span className="text-[10px] font-bold uppercase">{new Date(n.timestamp).toLocaleTimeString()}</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
              <button 
                onClick={() => setShowProfileModal(true)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Settings size={20} />
              </button>
            </div>
            
            <div className="h-8 w-[1px] bg-gray-100 hidden md:block" />

            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end mr-2 hidden sm:flex">
                <span className="text-sm font-bold text-gray-900">{user}</span>
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Active Now</span>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2.5 px-5 rounded-xl transition-all"
              >
                <LogOut size={18} />
                <span className="hidden sm:inline">Logout</span>
              </motion.button>
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showProfileModal && (
          <ProfileModal onClose={() => setShowProfileModal(false)} />
        )}
      </AnimatePresence>
    </header>
  );
};