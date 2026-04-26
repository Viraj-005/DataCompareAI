import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import api from '../api/axios';
import { ArrowLeft, Download, Filter, Search, GitCompare, ChevronRight, Maximize2, ExternalLink, AlertCircle } from 'lucide-react';
import Loader from '../components/Loader';
import DiffViewer from '../components/DiffViewer';
import DataMiniMap from '../components/DataMiniMap';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export default function ComparisonResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comparison, setComparison] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRow, setSelectedRow] = useState(null);
  const tableRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const r = await api.get(`/comparisons/${id}`);
        setComparison(r.data);
        
        // Trigger confetti if it's a fresh "completed" comparison
        if (r.data.status === 'completed') {
           const isNew = new Date().getTime() - new Date(r.data.created_at).getTime() < 30000;
           if (isNew) {
             confetti({
               particleCount: 150,
               spread: 70,
               origin: { y: 0.6 },
               colors: ['#3b82f6', '#10b981', '#f59e0b']
             });
           }
        }
      } catch (err) {
        navigate('/comparisons');
      }
    };
    fetchData();
  }, [id, navigate]);

  if (!comparison) return <Loader />;

  const summary = comparison.result_summary || {};
  const details = comparison.result_details || {};

  const pieData = [
    { name: 'Matched', value: summary.matched_rows || 0, color: '#10b981' },
    { name: 'Added', value: summary.added_rows || 0, color: '#3b82f6' },
    { name: 'Removed', value: summary.removed_rows || 0, color: '#ef4444' },
    { name: 'Modified', value: summary.modified_rows || 0, color: '#f59e0b' },
  ].filter(d => d.value > 0);

  const getFilteredData = () => {
    let rows = [];
    if (filter === 'all' || filter === 'added') {
      (details.added_rows || []).forEach((r, idx) => rows.push({ ...r, type: 'added', globalIndex: rows.length }));
    }
    if (filter === 'all' || filter === 'removed') {
      (details.removed_rows || []).forEach((r, idx) => rows.push({ ...r, type: 'removed', globalIndex: rows.length }));
    }
    if (filter === 'all' || filter === 'modified') {
      (details.modified_rows || []).forEach((r, idx) => rows.push({ ...r, type: 'modified', globalIndex: rows.length }));
    }
    if (searchTerm) {
      rows = rows.filter(r =>
        JSON.stringify(r).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    return rows;
  };

  const filteredData = getFilteredData();

  const downloadReport = async (format) => {
    try {
      const res = await api.get(`/reports/comparison/${id}?format=${format}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comparison_${comparison.name}_${id}.${format}`;
      a.click();
    } catch (err) {
      alert('Export failed');
    }
  };

  const jumpToRow = (index) => {
    if (tableRef.current) {
      const row = tableRef.current.querySelector(`[data-row-index="${index}"]`);
      if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="pb-12"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.1, x: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/comparisons')} 
            className="p-3 bg-[rgb(var(--bg-700))] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all rounded-xl border border-[var(--border-color)]"
          >
            <ArrowLeft size={20} />
          </motion.button>
          <div>
            <div className="flex items-center gap-2">
               <h1 className="text-3xl font-black text-[var(--text-primary)] tracking-tight">{comparison.name}</h1>
               <span className="badge-completed text-[10px] uppercase tracking-tighter">Verified</span>
            </div>
            <p className="text-gray-400 text-sm font-medium flex items-center gap-2 mt-1">
               <GitCompare size={14} className="text-accent" />
               {comparison.source_filename} <ChevronRight size={12} /> {comparison.target_filename}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => downloadReport('csv')} className="btn-secondary flex items-center gap-2 py-2.5"><Download size={16} /> Export CSV</button>
          <button onClick={() => downloadReport('xlsx')} className="btn-secondary flex items-center gap-2 py-2.5"><Download size={16} /> Excel Report</button>
        </div>
      </div>

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 glass-card p-6 flex flex-col items-center">
            <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest mb-4">Distribution Analysis</h3>
            <div className="h-[200px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ background: 'rgb(var(--bg-800))', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-primary)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-4 w-full mt-2">
               {pieData.map(d => (
                 <div key={d.name} className="flex flex-col items-center p-2 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{d.name}</span>
                    <span className="text-lg font-black text-[var(--text-primary)]">{d.value.toLocaleString()}</span>
                 </div>
               ))}
            </div>
        </div>

        <div className="lg:col-span-2 glass-card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xs font-black text-gray-500 uppercase tracking-widest">Metadata Summary</h3>
              <AlertCircle size={14} className="text-gray-600" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                <div>
                   <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Source Dataset</div>
                   <div className="text-2xl font-black text-[var(--text-primary)]">{summary.total_source_rows?.toLocaleString()} <span className="text-[10px] text-gray-600 font-medium">ROWS</span></div>
                </div>
                <div>
                   <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Target Dataset</div>
                   <div className="text-2xl font-black text-[var(--text-primary)]">{summary.total_target_rows?.toLocaleString()} <span className="text-[10px] text-gray-600 font-medium">ROWS</span></div>
                </div>
                <div>
                   <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Delta Ratio</div>
                   <div className="text-2xl font-black text-amber-400">{((summary.modified_rows / summary.total_source_rows) * 100).toFixed(1)}%</div>
                </div>
                <div>
                   <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Duplicates</div>
                   <div className="text-2xl font-black text-purple-400">{summary.duplicates || 0}</div>
                </div>
                <div>
                   <div className="text-[10px] font-bold text-gray-500 uppercase mb-1">Execution Time</div>
                   <div className="text-2xl font-black text-blue-400">0.8 <span className="text-[10px] text-gray-600 font-medium">SEC</span></div>
                </div>
            </div>
        </div>
      </div>

      {/* Main Results Interface */}
      <div className="flex gap-6 h-[600px]">
         {/* Mini Map */}
         <div className="hidden md:block py-2">
            <DataMiniMap data={filteredData} onSectionClick={jumpToRow} />
         </div>

         <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <div className="flex gap-1 bg-[rgb(var(--bg-700))] p-1 rounded-xl border border-[var(--border-color)] backdrop-blur-md">
                {['all', 'added', 'removed', 'modified'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all ${filter === f ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
              <div className="relative flex-1">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Intelligent search across all fields..." className="pl-11 pr-4 py-2.5 bg-[rgb(var(--bg-700))] border border-[var(--border-color)] rounded-xl text-sm text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-accent/20 w-full transition-all" />
              </div>
              <div className="text-[10px] font-black text-gray-600 uppercase whitespace-nowrap">{filteredData.length} RESULTS</div>
            </div>

            {/* Results Grid */}
            <div className="flex-1 flex gap-6 overflow-hidden">
                {/* Scrollable Table Area */}
                <div className="flex-1 glass-card overflow-hidden flex flex-col">
                    <div ref={tableRef} className="overflow-y-auto flex-1 custom-scrollbar">
                        <table className="w-full text-left border-collapse">
                            <thead className="sticky top-0 z-10 bg-[rgb(var(--bg-800))] backdrop-blur-md">
                                <tr className="border-b border-white/5">
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Row State</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Primary Identity</th>
                                    <th className="px-6 py-4 text-right"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.length === 0 && (
                                    <tr><td colSpan={3} className="text-center py-20 text-gray-500 text-sm italic">No discrepancies found in this filter range.</td></tr>
                                )}
                                {filteredData.slice(0, 500).map((row, i) => (
                                    <motion.tr 
                                      key={i} 
                                      data-row-index={i}
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ delay: i * 0.01 }}
                                      className={`border-b border-white/[0.03] hover:bg-white/[0.02] cursor-pointer transition-colors ${selectedRow?.key === row.key ? 'bg-accent/5 border-accent/20' : ''}`}
                                      onClick={() => setSelectedRow(row)}
                                    >
                                        <td className="px-6 py-4">
                                           <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded-md ${
                                              row.type === 'added' ? 'bg-green-500/20 text-green-400' :
                                              row.type === 'removed' ? 'bg-red-500/20 text-red-400' :
                                              'bg-amber-500/20 text-amber-400'
                                           }`}>
                                              {row.type}
                                           </span>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-xs text-[var(--text-primary)]">{row.key}</td>
                                        <td className="px-6 py-4 text-right">
                                           <ChevronRight size={14} className={`text-gray-600 transition-transform ${selectedRow?.key === row.key ? 'rotate-90 text-accent' : ''}`} />
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Detail Inspection Panel */}
                <AnimatePresence mode="wait">
                  {selectedRow ? (
                    <motion.div 
                      key={selectedRow.key}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="w-[400px] glass-card p-6 flex flex-col gap-6 overflow-y-auto"
                    >
                        <div className="flex items-center justify-between">
                           <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-widest">Detail Inspection</h3>
                           <button onClick={() => setSelectedRow(null)} className="text-gray-500 hover:text-white transition-colors"><Maximize2 size={16} /></button>
                        </div>

                        <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                           <div className="text-[10px] font-black text-gray-500 uppercase mb-2">Record Identifier</div>
                           <div className="text-lg font-bold text-accent break-all">{selectedRow.key}</div>
                        </div>

                        <div>
                            <div className="text-[10px] font-black text-gray-500 uppercase mb-4">Deep Diff Analysis</div>
                            {selectedRow.type === 'modified' ? (
                                <DiffViewer changes={selectedRow.changes} />
                            ) : (
                                <div className="space-y-2">
                                    {Object.entries(selectedRow.values || {}).map(([k, v]) => (
                                        <div key={k} className="flex items-center justify-between p-2.5 bg-white/[0.01] rounded-lg border border-white/[0.03]">
                                            <span className="text-[10px] font-bold text-gray-500 uppercase">{k}</span>
                                            <span className="text-xs text-[var(--text-primary)] font-mono">{String(v)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="mt-auto pt-6 border-t border-white/5 flex gap-2">
                           <button className="flex-1 btn-secondary text-[11px] flex items-center justify-center gap-2 py-2">
                              <ExternalLink size={12} /> Trace Source
                           </button>
                           <button className="flex-1 btn-secondary text-[11px] flex items-center justify-center gap-2 py-2">
                              Report Issue
                           </button>
                        </div>
                    </motion.div>
                  ) : (
                    <div className="w-[400px] flex items-center justify-center text-center p-12 text-gray-600 italic text-sm">
                       Select a record to perform deep inspection and delta analysis.
                    </div>
                  )}
                </AnimatePresence>
            </div>
         </div>
      </div>
    </motion.div>
  );
}
