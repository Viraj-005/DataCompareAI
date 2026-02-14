import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { ArrowLeft, Download, Filter, Search } from 'lucide-react';
import Loader from '../components/Loader';

export default function ComparisonResult() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comparison, setComparison] = useState(null);
  const [filter, setFilter] = useState('all'); // all, added, removed, modified
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    api.get(`/comparisons/${id}`).then(r => setComparison(r.data)).catch(() => navigate('/comparisons'));
  }, [id]);

  if (!comparison) return <Loader />;

  const summary = comparison.result_summary || {};
  const details = comparison.result_details || {};

  const summaryCards = [
    { label: 'Total Source Rows', value: summary.total_source_rows || 0, color: 'text-blue-400' },
    { label: 'Total Target Rows', value: summary.total_target_rows || 0, color: 'text-blue-400' },
    { label: 'Matched', value: summary.matched_rows || 0, color: 'text-emerald-400' },
    { label: 'Added', value: summary.added_rows || 0, color: 'text-green-400' },
    { label: 'Removed', value: summary.removed_rows || 0, color: 'text-red-400' },
    { label: 'Modified', value: summary.modified_rows || 0, color: 'text-amber-400' },
    { label: 'Duplicates', value: summary.duplicates || 0, color: 'text-purple-400' },
  ];

  const getFilteredData = () => {
    let rows = [];
    if (filter === 'all' || filter === 'added') {
      (details.added_rows || []).forEach(r => rows.push({ ...r, type: 'added' }));
    }
    if (filter === 'all' || filter === 'removed') {
      (details.removed_rows || []).forEach(r => rows.push({ ...r, type: 'removed' }));
    }
    if (filter === 'all' || filter === 'modified') {
      (details.modified_rows || []).forEach(r => rows.push({ ...r, type: 'modified' }));
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
      a.download = `comparison_${id}.${format}`;
      a.click();
    } catch (err) {
      alert('Export failed');
    }
  };

  const typeBadge = (type) => {
    const styles = {
      added: 'bg-green-500/20 text-green-400',
      removed: 'bg-red-500/20 text-red-400',
      modified: 'bg-amber-500/20 text-amber-400',
    };
    return <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${styles[type]}`}>{type}</span>;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/comparisons')} className="p-2 text-gray-400 hover:text-white transition-smooth rounded-lg hover:bg-dark-600">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white">{comparison.name}</h1>
            <p className="text-gray-400 text-sm">{comparison.source_filename} → {comparison.target_filename}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => downloadReport('csv')} className="btn-secondary flex items-center gap-2 text-sm"><Download size={14} /> CSV</button>
          <button onClick={() => downloadReport('xlsx')} className="btn-secondary flex items-center gap-2 text-sm"><Download size={14} /> Excel</button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
        {summaryCards.map((card, i) => (
          <div key={i} className="glass-card p-3 text-center">
            <div className={`text-xl font-bold ${card.color}`}>{card.value?.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1 bg-dark-700 rounded-lg p-1">
          {['all', 'added', 'removed', 'modified'].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-smooth ${filter === f ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'}`}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search results..." className="pl-8 pr-3 py-2 bg-dark-700 border border-dark-500/30 rounded-lg text-sm text-gray-300 placeholder-gray-500 focus:border-accent/50 focus:outline-none w-full" />
        </div>
        <span className="text-xs text-gray-500">{filteredData.length} results</span>
      </div>

      {/* Results Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-dark-700">
              <tr className="border-b border-dark-500/30">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Type</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Key</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 && (
                <tr><td colSpan={3} className="text-center py-10 text-gray-500 text-sm">No differences found</td></tr>
              )}
              {filteredData.slice(0, 200).map((row, i) => (
                <tr key={i} className="border-b border-dark-500/10 hover:bg-dark-600/30 transition-smooth">
                  <td className="px-5 py-3">{typeBadge(row.type)}</td>
                  <td className="px-5 py-3 text-sm text-gray-300 font-mono">{row.key}</td>
                  <td className="px-5 py-3">
                    {row.type === 'modified' && row.changes ? (
                      <div className="space-y-1">
                        {Object.entries(row.changes).slice(0, 5).map(([col, change]) => (
                          <div key={col} className="text-xs">
                            <span className="text-gray-400 font-medium">{col}:</span>{' '}
                            <span className="text-red-400 line-through">{change.source}</span>{' → '}
                            <span className="text-green-400">{change.target}</span>
                          </div>
                        ))}
                      </div>
                    ) : row.values ? (
                      <div className="text-xs text-gray-400 truncate max-w-md">{Object.entries(row.values).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join(', ')}</div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
