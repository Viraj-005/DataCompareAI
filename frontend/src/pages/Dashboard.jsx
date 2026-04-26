import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api/axios';
import Loader from '../components/Loader';
import StatsGauge from '../components/StatsGauge';
import { FolderKanban, FileSpreadsheet, GitCompare, AlertTriangle, Upload, Plus, ArrowRight, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area } from 'recharts';

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
    { label: 'Total Projects', value: stats.total_projects, sub: 'Active Workspaces', subColor: 'text-blue-400', icon: FolderKanban, iconBg: 'bg-blue-500/10', iconColor: 'text-blue-400', gradient: 'card-gradient-blue' },
    { label: 'Total Files', value: stats.total_files, sub: 'Stored Assets', subColor: 'text-emerald-400', icon: FileSpreadsheet, iconBg: 'bg-emerald-500/10', iconColor: 'text-emerald-400', gradient: 'card-gradient-emerald' },
    { label: 'Comparisons Run', value: stats.total_comparisons, sub: 'Validation Cycles', subColor: 'text-purple-400', icon: GitCompare, iconBg: 'bg-purple-500/10', iconColor: 'text-purple-400', gradient: 'card-gradient-purple' },
    { label: 'Anomalies Detected', value: stats.total_anomalies, sub: `${stats.critical_anomalies} Critical Issues`, subColor: 'text-amber-400', icon: AlertTriangle, iconBg: 'bg-amber-500/10', iconColor: 'text-amber-400', gradient: 'card-gradient-amber' },
  ];

  const quickActions = [
    { label: 'Upload Files', icon: Upload, path: '/files', desc: 'Add new CSV/Excel data' },
    { label: 'New Comparison', icon: GitCompare, path: '/comparisons', desc: 'Start validation flow' },
    { label: 'View Anomalies', icon: AlertTriangle, path: '/anomalies', desc: 'Check data health' },
    { label: 'Create Project', icon: Plus, path: '/projects', desc: 'New analytics workspace' },
  ];

  const statusBadge = (status) => {
    const cls = { completed: 'badge-completed', running: 'badge-running', failed: 'badge-failed', pending: 'badge-pending' };
    return <span className={cls[status] || 'badge-pending'}>{status}</span>;
  };

  // Calculate a mock health score based on anomalies vs total data
  const healthScore = stats.total_files > 0 ? Math.max(0, 100 - (stats.total_anomalies / (stats.total_files * 10))) : 100;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="pb-10"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)] tracking-tight">Executive Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1 flex items-center gap-2">
            <TrendingUp size={14} className="text-emerald-400" />
            System health is optimal. {stats.total_comparisons} validations completed.
          </p>
        </div>
        <motion.button 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/comparisons')} 
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus size={18} /> New Comparison
        </motion.button>
      </div>

      {loading ? <Loader /> : (
      <>
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <AnimatePresence>
          {statCards.map((card, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`glass-card p-6 relative overflow-hidden group ${card.gradient}`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-gray-400 uppercase tracking-wider">{card.label}</span>
                <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center transition-transform group-hover:scale-110 duration-500`}>
                  <card.icon size={22} className={card.iconColor} />
                </div>
              </div>
              <div className="text-4xl font-black text-[var(--text-primary)] mb-1">{card.value}</div>
              <span className={`text-xs font-medium ${card.subColor}`}>{card.sub}</span>
              
              {/* Decorative Background Element */}
              <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity duration-500">
                <card.icon size={100} />
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        {/* Activity Overview */}
        <div className="lg:col-span-8 glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">Activity Intelligence</h3>
            <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Comparisons</div>
              <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Anomalies</div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activity}>
                <defs>
                  <linearGradient id="colorComp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAnom" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ background: 'rgb(var(--bg-800))', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="comparisons" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorComp)" />
                <Area type="monotone" dataKey="anomalies" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorAnom)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Health & Actions */}
        <div className="lg:col-span-4 space-y-8">
          {/* Data Health Gauge */}
          <div className="glass-card p-6 flex flex-col items-center">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Data Integrity Score</h3>
            <StatsGauge value={healthScore} label="Overall Health" size={160} strokeWidth={14} color="#10b981" />
            <p className="text-[10px] text-gray-500 text-center mt-4 italic">Score based on cross-version anomaly density and rule violations.</p>
          </div>

          {/* Quick Actions */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Command Center</h3>
            <div className="grid grid-cols-1 gap-3">
              {quickActions.map((action, i) => (
                <motion.button
                  key={i}
                  whileHover={{ x: 5, backgroundColor: 'rgba(255,255,255,0.05)' }}
                  onClick={() => navigate(action.path)}
                  className="w-full flex items-center justify-between p-3 border border-white/5 rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="w-8 h-8 rounded-lg bg-dark-600 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                      <action.icon size={16} className="text-accent" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-[var(--text-primary)]">{action.label}</div>
                      <div className="text-[10px] text-gray-500">{action.desc}</div>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-gray-600 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Recent Comparisons Table */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass-card overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
          <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
            <GitCompare size={20} className="text-purple-400" />
            Recent Executions
          </h3>
          <button onClick={() => navigate('/comparisons')} className="text-xs font-bold text-accent hover:text-accent-light transition-colors px-3 py-1 bg-accent/10 rounded-full">View Audit Log</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-white/2">
                <th className="text-left text-[10px] font-black text-gray-500 uppercase tracking-widest px-6 py-4">Process Name</th>
                <th className="text-left text-[10px] font-black text-gray-500 uppercase tracking-widest px-6 py-4">Project</th>
                <th className="text-left text-[10px] font-black text-gray-500 uppercase tracking-widest px-6 py-4">Status</th>
                <th className="text-left text-[10px] font-black text-gray-500 uppercase tracking-widest px-6 py-4">Timestamp</th>
                <th className="text-right text-[10px] font-black text-gray-500 uppercase tracking-widest px-6 py-4">Integrity</th>
                <th className="text-right text-[10px] font-black text-gray-500 uppercase tracking-widest px-6 py-4">Changes</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr><td colSpan={6} className="text-center py-12 text-gray-500 text-sm italic">Initializing execution history...</td></tr>
              )}
              {recent.map((c, i) => (
                <motion.tr 
                  key={c.id} 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + (i * 0.05) }}
                  className="border-b border-white/5 hover:bg-white/[0.03] cursor-pointer group transition-colors" 
                  onClick={() => navigate(`/comparisons/${c.id}`)}
                >
                  <td className="px-6 py-4 text-sm font-bold text-[var(--text-primary)] group-hover:text-accent transition-colors">{c.name}</td>
                  <td className="px-6 py-4 text-xs font-medium text-gray-500">{c.project_name}</td>
                  <td className="px-6 py-4">{statusBadge(c.status)}</td>
                  <td className="px-6 py-4 text-[11px] text-gray-500 font-mono">{c.date}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <div className="w-16 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: '94%' }}></div>
                       </div>
                       <span className="text-[11px] font-bold text-emerald-400">94%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-black text-amber-400 text-right">+{c.modified}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
      </>
      )}
    </motion.div>
  );
}
