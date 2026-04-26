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
    <aside className={`fixed left-0 top-0 h-screen bg-[rgb(var(--bg-800))] border-r border-[var(--border-color)] flex flex-col transition-all duration-300 z-50 ${collapsed ? 'w-20' : 'w-64'}`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-[var(--border-color)]">
        <div className="w-9 h-9 bg-accent rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-accent/20">
          <Zap size={20} className="text-white" />
        </div>
        {!collapsed && <span className="text-lg font-black text-[var(--text-primary)] whitespace-nowrap tracking-tight">DataCompare AI</span>}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            end={path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 text-sm font-bold ${
                isActive
                  ? 'bg-accent text-white shadow-lg shadow-accent/20'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgb(var(--bg-700))]'
              } ${collapsed ? 'justify-center px-0' : ''}`
            }
            title={collapsed ? label : ''}
          >
            <Icon size={20} className="flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-14 border-none text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[rgb(var(--bg-700))] transition-all"
      >
        <ChevronLeft size={20} className={`transition-transform duration-500 ${collapsed ? 'rotate-180' : ''}`} />
      </button>
    </aside>
  );
}
