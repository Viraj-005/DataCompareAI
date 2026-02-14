import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/Loader';
import { FolderKanban, FileSpreadsheet, GitCompare, AlertTriangle, Upload, Plus, Eye, ArrowRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Dashboard() {
  const [stats, setStats] = useState({ total_projects: 0, total_files: 0, total_comparisons: 0, total_anomalies: 0, critical_anomalies: 0 });
  const [recent, setRecent] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [statsRes, recentRes, activityRes] = await Promise.all([
                api.get('/dashboard/stats'),
                api.get('/dashboard/recent-comparisons'),
                api.get('/dashboard/activity')
            ]);
            setStats(statsRes.data);
            setRecent(recentRes.data);
            setActivity(activityRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  const statCards = [
    { label: 'Total Projects', value: stats.total_projects, sub: '↑ 12% this month', subColor: 'text-emerald-400', icon: FolderKanban, iconBg: 'bg-blue-500/10', iconColor: 'text-blue-400' },
    { label: 'Total Files', value: stats.total_files, sub: `↑ ${stats.total_files} new`, subColor: 'text-emerald-400', icon: FileSpreadsheet, iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400' },
    { label: 'Comparisons Run', value: stats.total_comparisons, sub: '↑ 23 this week', subColor: 'text-emerald-400', icon: GitCompare, iconBg: 'bg-purple-500/10', iconColor: 'text-purple-400' },
    { label: 'Anomalies Detected', value: stats.total_anomalies, sub: `↑ ${stats.critical_anomalies} critical`, subColor: 'text-red-400', icon: AlertTriangle, iconBg: 'bg-amber-500/10', iconColor: 'text-amber-400' },
  ];

  const quickActions = [
    { label: 'Upload Files', icon: Upload, path: '/files' },
    { label: 'New Comparison', icon: GitCompare, path: '/comparisons' },
    { label: 'View Anomalies', icon: AlertTriangle, path: '/anomalies' },
    { label: 'Create Project', icon: Plus, path: '/projects' },
  ];

  const statusBadge = (status) => {
    const cls = { completed: 'badge-completed', running: 'badge-running', failed: 'badge-failed', pending: 'badge-pending' };
    return <span className={cls[status] || 'badge-pending'}>{status}</span>;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">Overview of your data comparison activity</p>
        </div>
        <button onClick={() => navigate('/comparisons')} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Comparison
        </button>
      </div>

      {loading ? <Loader /> : (
      <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, i) => (
          <div key={i} className="glass-card p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-400">{card.label}</span>
              <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                <card.icon size={18} className={card.iconColor} />
              </div>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{card.value}</div>
            <span className={`text-xs ${card.subColor}`}>{card.sub}</span>
          </div>
        ))}
      </div>

      {/* Chart + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 glass-card p-5">
          <h3 className="text-base font-semibold text-white mb-4">Activity Overview</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={activity} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2633" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
              <Tooltip contentStyle={{ background: '#1a2633', border: '1px solid #2d3a4a', borderRadius: '8px', color: '#e2e8f0' }} />
              <Legend wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} />
              <Bar dataKey="comparisons" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Comparisons" />
              <Bar dataKey="anomalies" fill="#10b981" radius={[4, 4, 0, 0]} name="Anomalies" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-base font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            {quickActions.map((action, i) => (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className="w-full flex items-center justify-between p-3 bg-dark-600/50 hover:bg-dark-600 border border-dark-500/20 rounded-lg transition-smooth group"
              >
                <div className="flex items-center gap-3">
                  <action.icon size={16} className="text-accent" />
                  <span className="text-sm text-gray-300">{action.label}</span>
                </div>
                <ArrowRight size={14} className="text-gray-500 group-hover:text-accent transition-smooth" />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Comparisons */}
      <div className="glass-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-dark-500/30">
          <h3 className="text-base font-semibold text-white">Recent Comparisons</h3>
          <button onClick={() => navigate('/comparisons')} className="text-xs text-accent hover:text-accent-light">View all</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-500/20">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Name</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Project</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Date</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">Matched</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">Modified</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500 text-sm">No comparisons yet. Create your first one!</td></tr>
              )}
              {recent.map((c) => (
                <tr key={c.id} className="border-b border-dark-500/10 hover:bg-dark-600/30 cursor-pointer transition-smooth" onClick={() => navigate(`/comparisons/${c.id}`)}>
                  <td className="px-5 py-3.5 text-sm text-gray-200">{c.name}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">{c.project_name}</td>
                  <td className="px-5 py-3.5">{statusBadge(c.status)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">{c.date}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-200 text-right">{c.matched?.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-200 text-right">{c.modified}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
