import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

export default function DashboardLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="min-h-screen bg-dark-900">
      <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
      <div className={`transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-56'}`}>
        <div className="sticky top-0 z-30 bg-dark-900/50 backdrop-blur-lg border-b border-dark-500/30 shadow-sm transition-all duration-300">
          <Topbar />
        </div>
        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
