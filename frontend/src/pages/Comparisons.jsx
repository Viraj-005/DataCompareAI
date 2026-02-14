import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import { Plus, GitCompare, Trash2 } from 'lucide-react';

export default function Comparisons() {
  const [comparisons, setComparisons] = useState([]);
  const [projects, setProjects] = useState([]);
  const [files, setFiles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false); // keep this for submission
  const [dataLoading, setDataLoading] = useState(true); // new state for page load
  const [form, setForm] = useState({ name: '', project_id: '', source_file_id: '', target_file_id: '', config: {} });
  const [configOpen, setConfigOpen] = useState(false);
  const [config, setConfig] = useState({ primary_key: '', ignore_columns: '', case_sensitive: true, tolerance: 0 });
  const navigate = useNavigate();

  const load = () => api.get('/comparisons').then(r => setComparisons(r.data)).catch(() => {});

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [compRes, projRes, filesRes] = await Promise.all([
                api.get('/comparisons'),
                api.get('/projects'),
                api.get('/files')
            ]);
            setComparisons(compRes.data);
            setProjects(projRes.data);
            setFiles(filesRes.data);
        } catch (e) {
            console.error(e); 
        } finally {
            setDataLoading(false);
        }
    };
    fetchData();
  }, []);

  const projectFiles = files.filter(f => String(f.project_id) === String(form.project_id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const configPayload = {};
      if (config.primary_key) configPayload.primary_key = config.primary_key;
      if (config.ignore_columns) configPayload.ignore_columns = config.ignore_columns.split(',').map(s => s.trim());
      configPayload.case_sensitive = config.case_sensitive;
      if (config.tolerance) configPayload.tolerance = parseFloat(config.tolerance);

      const res = await api.post('/comparisons', {
        name: form.name,
        project_id: parseInt(form.project_id),
        source_file_id: parseInt(form.source_file_id),
        target_file_id: parseInt(form.target_file_id),
        config: configPayload,
      });
      setShowModal(false);
      setForm({ name: '', project_id: '', source_file_id: '', target_file_id: '', config: {} });
      load();
      navigate(`/comparisons/${res.data.id}`);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error running comparison');
    }
    setLoading(false);
  };

  const deleteComparison = async (id) => {
    if (!confirm('Delete this comparison?')) return;
    await api.delete(`/comparisons/${id}`);
    load();
  };

  const statusBadge = (status) => {
    const cls = { completed: 'badge-completed', running: 'badge-running', failed: 'badge-failed', pending: 'badge-pending' };
    return <span className={cls[status] || 'badge-pending'}>{status}</span>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Comparisons</h1>
          <p className="text-gray-400 text-sm mt-1">Compare files and detect differences</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Comparison
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-500/30">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Name</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Project</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Source</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Target</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Status</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Date</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">Changes</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {dataLoading ? (
                 <tr><td colSpan={8}><Loader /></td></tr>
              ) : comparisons.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-gray-500 text-sm">No comparisons yet</td></tr>
              ) : (
                comparisons.map((c) => (
                <tr key={c.id} className="border-b border-dark-500/10 hover:bg-dark-600/30 transition-smooth cursor-pointer" onClick={() => navigate(`/comparisons/${c.id}`)}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <GitCompare size={14} className="text-accent" />
                      <span className="text-sm text-gray-200">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">{c.project_name}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-400 max-w-[120px] truncate">{c.source_filename}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-400 max-w-[120px] truncate">{c.target_filename}</td>
                  <td className="px-5 py-3.5">{statusBadge(c.status)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-200 text-right">{c.result_summary?.modified_rows || 0}</td>
                  <td className="px-3 py-3.5" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => deleteComparison(c.id)} className="p-1.5 text-gray-500 hover:text-red-400 rounded transition-smooth"><Trash2 size={14} /></button>
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Comparison Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Comparison" size="lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Comparison Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-dark" placeholder="e.g., Q4 Revenue vs Q3" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Project</label>
            <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value, source_file_id: '', target_file_id: '' })} className="input-dark" required>
              <option value="">Select project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Source File</label>
              <select value={form.source_file_id} onChange={e => setForm({ ...form, source_file_id: e.target.value })} className="input-dark" required>
                <option value="">Select source...</option>
                {projectFiles.map(f => <option key={f.id} value={f.id}>{f.original_filename}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Target File</label>
              <select value={form.target_file_id} onChange={e => setForm({ ...form, target_file_id: e.target.value })} className="input-dark" required>
                <option value="">Select target...</option>
                {projectFiles.map(f => <option key={f.id} value={f.id}>{f.original_filename}</option>)}
              </select>
            </div>
          </div>

          {/* Advanced Config */}
          <button type="button" onClick={() => setConfigOpen(!configOpen)} className="text-sm text-accent hover:text-accent-light">
            {configOpen ? '▾' : '▸'} Advanced Configuration
          </button>
          {configOpen && (
            <div className="space-y-3 pl-4 border-l-2 border-dark-500/30">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Primary Key Column</label>
                <input value={config.primary_key} onChange={e => setConfig({ ...config, primary_key: e.target.value })} className="input-dark text-sm" placeholder="e.g., id" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Ignore Columns (comma separated)</label>
                <input value={config.ignore_columns} onChange={e => setConfig({ ...config, ignore_columns: e.target.value })} className="input-dark text-sm" placeholder="e.g., updated_at, created_at" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input type="checkbox" checked={config.case_sensitive} onChange={e => setConfig({ ...config, case_sensitive: e.target.checked })} className="rounded bg-dark-600 border-dark-500 text-accent" />
                  Case sensitive
                </label>
                <div>
                  <label className="text-xs font-medium text-gray-400 mr-2">Numeric tolerance:</label>
                  <input type="number" step="0.001" value={config.tolerance} onChange={e => setConfig({ ...config, tolerance: e.target.value })} className="input-dark text-sm w-24 inline-block" />
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary">{loading ? 'Running...' : 'Run Comparison'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
