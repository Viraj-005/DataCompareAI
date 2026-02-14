import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLocation } from 'react-router-dom';
import { Search, Bell, X, Settings, LogOut, User } from 'lucide-react';

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
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Mock notifications state with persistence
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
    <header className="h-16 bg-dark-800 border-b border-dark-500/30 flex items-center justify-between px-6 z-20 relative transition-colors duration-300">
      <h2 className="text-base font-semibold text-[var(--text-primary)]">{title}</h2>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search..."
            className="pl-9 pr-4 py-2 bg-dark-700 border border-dark-500/30 rounded-lg text-sm text-[var(--text-primary)] placeholder-gray-500 focus:border-accent/50 focus:outline-none w-48 transition-colors duration-300"
          />
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
            <button 
                className={`relative p-2 transition-smooth rounded-lg ${showNotifications ? 'bg-dark-700 text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-dark-700/50'}`}
                onClick={() => setShowNotifications(!showNotifications)}
            >
            <Bell size={18} />
            {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
            )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-dark-800 border border-dark-500 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-dark-500/50 flex justify-between items-center">
                        <h3 className="font-semibold text-sm text-[var(--text-primary)]">Notifications</h3>
                        <button onClick={() => setShowNotifications(false)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"><X size={14} /></button>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-[var(--text-secondary)] text-sm">No new notifications</div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className="p-3 border-b border-dark-500/30 hover:bg-dark-700/50 transition-colors flex gap-3">
                                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.type === 'success' ? 'bg-green-500' : n.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'}`}></div>
                                    <div>
                                        <p className="text-sm font-medium text-[var(--text-primary)]">{n.title}</p>
                                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">{n.message}</p>
                                        <p className="text-[10px] text-[var(--text-secondary)] mt-1.5">{n.time}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {notifications.length > 0 && (
                        <div className="p-2 text-center border-t border-dark-500/30">
                            <button 
                                onClick={markAllAsRead}
                                className="text-xs text-accent hover:text-accent-light w-full py-1"
                            >
                                Mark all as read
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
             <button 
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2.5 hover:bg-dark-700 p-1.5 pr-3 rounded-lg transition-colors border border-transparent hover:border-dark-500/50"
             >
                <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold text-sm">
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <span className="text-sm font-medium text-[var(--text-primary)] hidden sm:block">{user?.full_name || 'User'}</span>
             </button>

             {showProfileMenu && (
                 <div className="absolute right-0 top-full mt-2 w-48 bg-dark-800 border border-dark-500 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 z-50">
                     <div className="p-1">
                         <a href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-dark-700 hover:text-[var(--text-primary)] rounded-md transition-colors">
                             <User size={16} /> Profile
                         </a>
                         <a href="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-dark-700 hover:text-[var(--text-primary)] rounded-md transition-colors">
                             <Settings size={16} /> Settings
                         </a>
                         <div className="h-px bg-dark-500/50 my-1"></div>
                         <button 
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors text-left"
                         >
                             <LogOut size={16} /> Sign out
                         </button>
                     </div>
                 </div>
             )}
        </div>
      </div>
    </header>
  );
}
