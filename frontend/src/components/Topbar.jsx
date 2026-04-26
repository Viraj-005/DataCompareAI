import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Search, Bell, X, Settings, LogOut, User, Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const pageTitles = {
  '/': 'Dashboard',
  '/projects': 'Projects',
  '/files': 'Files',
  '/comparisons': 'Comparisons',
  '/anomalies': 'Anomalies',
  '/rules': 'Rules',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export default function Topbar() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const title = pageTitles[location.pathname] || 'DataCompare AI';
  
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');
  
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else {
      document.body.classList.remove('light-mode');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('notifications');
    if (saved) return JSON.parse(saved);
    return [
      { id: 1, title: 'Comparison Completed', message: 'Sales Q1 vs Q2 finished successfully.', time: '2 min ago', type: 'success' },
      { id: 2, title: 'Anomalies Detected', message: 'Found 12 anomalies in "Employee_Data.csv".', time: '1 hour ago', type: 'warning' },
      { id: 3, title: 'Welcome!', message: 'Welcome to DataCompare AI.', time: '1 day ago', type: 'info' }
    ];
  });

  const markAllAsRead = () => {
    setNotifications([]);
    localStorage.setItem('notifications', JSON.stringify([]));
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
        if (notifRef.current && !notifRef.current.contains(event.target)) {
            setShowNotifications(false);
        }
        if (profileRef.current && !profileRef.current.contains(event.target)) {
            setShowProfileMenu(false);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="h-16 bg-[rgb(var(--bg-800))] border-b border-[var(--border-color)] flex items-center justify-between px-6 z-20 relative transition-colors duration-300">
      <div className="flex items-center gap-4">
        <h2 className="text-base font-bold text-[var(--text-primary)]">{title}</h2>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search Intelligence..."
            className="pl-9 pr-4 py-2 bg-[rgb(var(--bg-700))] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] placeholder-gray-500 focus:border-accent/50 focus:outline-none w-64 transition-all duration-300"
          />
        </div>

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          className="p-2 text-[var(--text-secondary)] hover:text-accent bg-[rgb(var(--bg-700))] border border-[var(--border-color)] rounded-xl transition-all hover:scale-110 active:scale-95"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
            <button 
                className={`relative p-2 transition-all rounded-xl border border-[var(--border-color)] ${showNotifications ? 'bg-accent text-white' : 'bg-[rgb(var(--bg-700))] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                onClick={() => setShowNotifications(!showNotifications)}
            >
            <Bell size={18} />
            {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-[rgb(var(--bg-800))]"></span>
            )}
            </button>

            <AnimatePresence>
                {showNotifications && (
                    <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-80 bg-[rgb(var(--bg-800))] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden z-50"
                    >
                        <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-[rgb(var(--bg-700))]">
                            <h3 className="font-bold text-sm text-[var(--text-primary)] uppercase tracking-widest">Notifications</h3>
                            <button onClick={() => setShowNotifications(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={14} /></button>
                        </div>
                        <div className="max-h-96 overflow-y-auto custom-scrollbar">
                            {notifications.length === 0 ? (
                                <div className="p-10 text-center text-[var(--text-secondary)] text-sm italic">Clean slate. No alerts.</div>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.id} className="p-4 border-b border-[var(--border-color)] hover:bg-[rgb(var(--bg-700))] transition-colors flex gap-3 group">
                                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.type === 'success' ? 'bg-green-500' : n.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                        <div>
                                            <p className="text-sm font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors">{n.title}</p>
                                            <p className="text-xs text-[var(--text-secondary)] mt-1 leading-relaxed">{n.message}</p>
                                            <p className="text-[10px] text-[var(--text-secondary)] font-mono mt-2 opacity-60">{n.time}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        {notifications.length > 0 && (
                            <div className="p-3 text-center bg-[rgb(var(--bg-700))]">
                                <button 
                                    onClick={markAllAsRead}
                                    className="text-[10px] font-black uppercase text-accent hover:text-accent-light tracking-widest transition-colors"
                                >
                                    Clear All Intelligence
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
             <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2.5 bg-[rgb(var(--bg-700))] hover:bg-[rgb(var(--bg-600))] p-1 pr-3 rounded-xl transition-all border border-[var(--border-color)]"
             >
                <div className="w-8 h-8 rounded-lg bg-accent text-white flex items-center justify-center font-black text-xs shadow-lg shadow-accent/20">
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-xs font-bold text-[var(--text-primary)] hidden sm:block">{user?.full_name || 'User Account'}</span>
             </button>

             <AnimatePresence>
                 {showProfileMenu && (
                     <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-3 w-56 bg-[rgb(var(--bg-800))] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden z-50"
                     >
                         <div className="p-2">
                             <div className="px-3 py-2 mb-2">
                                <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">Active User</p>
                                <p className="text-sm font-bold text-[var(--text-primary)] truncate">{user?.email}</p>
                             </div>
                             <a href="/settings" className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-accent/10 hover:text-accent rounded-xl transition-all font-medium">
                                 <User size={16} /> Identity Profile
                             </a>
                             <a href="/settings" className="flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-accent/10 hover:text-accent rounded-xl transition-all font-medium">
                                 <Settings size={16} /> Preferences
                             </a>
                             <div className="h-px bg-[var(--border-color)] my-2"></div>
                             <button 
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-xl transition-all font-bold text-left"
                             >
                                 <LogOut size={16} /> Terminate Session
                             </button>
                         </div>
                     </motion.div>
                 )}
             </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
