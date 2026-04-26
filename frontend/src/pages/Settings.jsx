import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import api from '../api/axios';

export default function Settings() {
  const { user, logout, updateUser } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem('settings_notifications');
    return saved ? JSON.parse(saved) : { email: true, comparison: true, anomaly: true, weekly: false };
  });

  const handleNotificationChange = (key) => {
    const newSettings = { ...notifications, [key]: !notifications[key] };
    setNotifications(newSettings);
    localStorage.setItem('settings_notifications', JSON.stringify(newSettings));
  };

  const handleLogout = () => {
    if (confirm('Are you sure you want to log out?')) {
      logout();
      window.location.href = '/login';
    }
  };

  const handleSaveProfile = async (e) => {
      e.preventDefault();
      const form = e.target;
      try {
          const res = await api.put('/auth/me', {
              full_name: form.full_name.value,
              email: form.email.value
          });
          updateUser(res.data);
          alert('Profile updated successfully');
      } catch (err) {
          console.error(err);
          alert('Failed to update profile: ' + (err.response?.data?.detail || err.message));
      }
  };

  const handleSavePassword = async (e) => {
      e.preventDefault();
      const form = e.target;
      if (form.new_password.value !== form.confirm_password.value) {
          alert("New passwords do not match");
          return;
      }
      
      try {
          await api.post('/auth/password', {
              current_password: form.current_password.value,
              new_password: form.new_password.value
          });
          alert('Password updated successfully');
          form.reset();
      } catch (err) {
          console.error(err);
          alert('Failed to update password: ' + (err.response?.data?.detail || err.message));
      }
  };

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'password', label: 'Password' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'information', label: 'Information' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] transition-colors">Settings</h1>
        <p className="text-[var(--text-secondary)] text-sm mt-1 transition-colors">Manage your account preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[var(--border-color)] mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-3 text-sm font-medium transition-all relative ${
              activeTab === tab.id ? 'text-accent' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-accent rounded-t-full"></span>}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="glass-card max-w-4xl">
        
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Profile Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Full Name</label>
                <input name="full_name" defaultValue={user?.full_name || ''} className="input-dark" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
                <input name="email" type="email" defaultValue={user?.email || ''} className="input-dark" />
              </div>
            </div>
            <div className="pt-2">
                <button type="submit" className="btn-primary text-sm">Save Changes</button>
            </div>
          </form>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <form onSubmit={handleSavePassword} className="p-6 space-y-6">
             <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Change Password</h3>
             <div className="space-y-4 max-w-md">
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Current Password</label>
                <input name="current_password" type="password" required className="input-dark" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">New Password</label>
                <input name="new_password" type="password" required className="input-dark" />
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Confirm New Password</label>
                <input name="confirm_password" type="password" required className="input-dark" />
              </div>
            </div>
            <div className="pt-2">
                <button type="submit" className="btn-primary text-sm">Update Password</button>
            </div>
          </form>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="p-6 space-y-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Notification Preferences</h3>
            <div className="space-y-4">
                {[
                    { key: 'email', label: 'Email Notifications', desc: 'Receive emails about your account activity.' },
                    { key: 'comparison', label: 'Comparison Notifications', desc: 'Get notified when comparisons finish.' },
                    { key: 'anomaly', label: 'Anomaly Notifications', desc: 'Get notified when anomalies are detected.' },
                    { key: 'weekly', label: 'Weekly Reports', desc: 'Receive a weekly summary of your data health.' },
                ].map(item => (
                    <div key={item.key} className="flex items-center justify-between py-3 border-b border-[var(--border-color)] last:border-0">
                        <div>
                            <p className="text-sm font-medium text-[var(--text-primary)]">{item.label}</p>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{item.desc}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={notifications[item.key]} 
                                onChange={() => handleNotificationChange(item.key)}
                                className="sr-only peer" 
                            />
                            <div className="w-11 h-6 bg-[rgb(var(--bg-600))] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                        </label>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* Information Tab */}
        {activeTab === 'information' && (
          <div className="p-6 space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Settings Guide</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[rgb(var(--bg-700))]">
                  <h4 className="font-medium text-[var(--text-primary)] mb-1">Profile Tab</h4>
                  <p className="text-sm text-[var(--text-secondary)]">Update your personal information such as name and email address.</p>
                </div>
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[rgb(var(--bg-700))]">
                  <h4 className="font-medium text-[var(--text-primary)] mb-1">Password Tab</h4>
                  <p className="text-sm text-[var(--text-secondary)]">Securely change your account password to protect your data.</p>
                </div>
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[rgb(var(--bg-700))]">
                   <h4 className="font-medium text-[var(--text-primary)] mb-1">Notifications Tab</h4>
                   <p className="text-sm text-[var(--text-secondary)]">Customize which alerts and reports you want to receive via email or in-app.</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Glossary of Terms</h3>
              <div className="space-y-4">
                {[
                  { term: 'Anomaly', def: 'A data point that deviates significantly from the expected pattern or distribution in your dataset.' },
                  { term: 'Comparison', def: 'The process of analyzing two datasets (Source vs Target) to identify added, removed, or modified records.' },
                  { term: 'Z-Score', def: 'A statistical score that indicates how many standard deviations an element is from the mean. High Z-scores indicate anomalies.' },
                  { term: 'IQR (Interquartile Range)', def: 'A measure of statistical dispersion used to identify outliers by looking at the middle 50% of your data.' },
                  { term: 'Primary Key', def: 'A unique identifier (like an ID column) used to match rows between two files during comparison.' },
                ].map((item, i) => (
                  <div key={i} className="pb-4 border-b border-[var(--border-color)] last:border-0 last:pb-0">
                    <h4 className="font-medium text-accent text-sm mb-1">{item.term}</h4>
                    <p className="text-sm text-[var(--text-secondary)]">{item.def}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
      
      {/* Logout Button */}
      <div className="mt-6 flex justify-end">
           <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-smooth border border-red-500/20 text-sm">
             <LogOut size={16} /> Sign out
           </button>
      </div>
    </div>
  );
}
