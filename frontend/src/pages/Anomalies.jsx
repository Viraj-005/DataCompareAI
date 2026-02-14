import { useState, useEffect } from 'react';
import api from '../api/axios';
import { AlertTriangle, Filter, Search } from 'lucide-react';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';

export default function Anomalies() {
  const [data, setData] = useState({ anomalies: [], total: 0, critical_count: 0, warning_count: 0, info_count: 0 });
  const [filters, setFilters] = useState({ anomaly_type: '', min_severity: '' });
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.anomaly_type) params.set('anomaly_type', filters.anomaly_type);
    if (filters.min_severity) params.set('min_severity', filters.min_severity);
    api.get(`/anomalies?${params.toString()}`)
        .then(r => setData(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filters]);

  const severityBadge = (severity) => {
    if (severity >= 8) return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-red-500/20 text-red-400">Critical ({severity})</span>;
    if (severity >= 5) return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400">Warning ({severity})</span>;
    return <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-500/20 text-blue-400">Info ({severity})</span>;
  };

  const typeBadge = (type) => {
    const colors = { zscore: 'text-purple-400 bg-purple-500/10', iqr: 'text-blue-400 bg-blue-500/10', negative: 'text-red-400 bg-red-500/10', spike: 'text-amber-400 bg-amber-500/10', deviation: 'text-pink-400 bg-pink-500/10' };
    const cls = colors[type] || 'text-gray-400 bg-gray-500/10';
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cls}`}>{type}</span>;
  };

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentAnomalies = data.anomalies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(data.anomalies.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Anomalies</h1>
          <p className="text-gray-400 text-sm mt-1">Automatically detected data issues</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-white">{data.total}</div>
          <div className="text-xs text-gray-500 mt-1">Total Anomalies</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-red-400">{data.critical_count}</div>
          <div className="text-xs text-gray-500 mt-1">Critical</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-amber-400">{data.warning_count}</div>
          <div className="text-xs text-gray-500 mt-1">Warning</div>
        </div>
        <div className="glass-card p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{data.info_count}</div>
          <div className="text-xs text-gray-500 mt-1">Info</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4">
        <select value={filters.anomaly_type} onChange={e => setFilters({ ...filters, anomaly_type: e.target.value })} className="input-dark max-w-[180px] text-sm">
          <option value="">All types</option>
          <option value="zscore">Z-Score</option>
          <option value="iqr">IQR</option>
          <option value="negative">Negative</option>
          <option value="spike">Spike</option>
          <option value="deviation">Deviation</option>
        </select>
        <select value={filters.min_severity} onChange={e => setFilters({ ...filters, min_severity: e.target.value })} className="input-dark max-w-[180px] text-sm">
          <option value="">All severities</option>
          <option value="8">Critical (≥8)</option>
          <option value="5">Warning+ (≥5)</option>
          <option value="3">Info+ (≥3)</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-500/30">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">File</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Row</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Column</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Value</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Type</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Severity</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><Loader /></td></tr>
              ) : data.anomalies.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500 text-sm">
                  <AlertTriangle size={32} className="mx-auto mb-2 text-gray-600" />
                  No anomalies detected
                </td></tr>
              ) : (
                currentAnomalies.map((a) => (
                <tr key={a.id} className="border-b border-dark-500/10 hover:bg-dark-600/30 transition-smooth">
                  <td className="px-5 py-3 text-sm text-gray-300">{a.filename}</td>
                  <td className="px-5 py-3 text-sm text-gray-400 font-mono">{a.row_index}</td>
                  <td className="px-5 py-3 text-sm text-gray-300 font-medium">{a.column_name}</td>
                  <td className="px-5 py-3 text-sm text-gray-200 font-mono">{a.value}</td>
                  <td className="px-5 py-3">{typeBadge(a.anomaly_type)}</td>
                  <td className="px-5 py-3">{severityBadge(a.severity)}</td>
                  <td className="px-5 py-3 text-xs text-gray-400 max-w-xs truncate">{a.reason}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
        
        <Pagination 
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={paginate}
            totalItems={data.anomalies.length}
            itemsPerPage={itemsPerPage}
            indexOfFirstItem={indexOfFirstItem}
            indexOfLastItem={indexOfLastItem}
        />
      </div>
    </div>
  );
}
