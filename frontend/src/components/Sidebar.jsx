import { NavLink, useLocation } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, FolderKanban, FileSpreadsheet, GitCompare,
  AlertTriangle, Shield, FileBarChart, Settings, ChevronLeft, Zap
} from 'lucide-react';

const navItems = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/files', icon: FileSpreadsheet, label: 'Files' },
  { path: '/comparisons', icon: GitCompare, label: 'Comparisons' },
  { path: '/anomalies', icon: AlertTriangle, label: 'Anomalies' },
  { path: '/rules', icon: Shield, label: 'Rules' },
  { path: '/reports', icon: FileBarChart, label: 'Reports' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  return (
    <aside className={`fixed left-0 top-0 h-screen bg-dark-800 border-r border-dark-500/30 flex flex-col transition-all duration-300 z-50 ${collapsed ? 'w-16' : 'w-56'}`}>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-16 border-b border-dark-500/30">
        <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center flex-shrink-0">
          <Zap size={18} className="text-white" />
        </div>
        {!collapsed && <span className="text-base font-bold text-white whitespace-nowrap">DataCompare AI</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-smooth text-sm font-medium ${
                isActive
                  ? 'bg-accent/15 text-accent border border-accent/20'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-dark-600/50'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? label : ''}
          >
            <Icon size={18} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-dark-500/30 text-gray-500 hover:text-gray-300 transition-smooth"
      >
        <ChevronLeft size={18} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
      </button>
    </aside>
  );
}
