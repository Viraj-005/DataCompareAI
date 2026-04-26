import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Loader from '../components/Loader';
import { ArrowLeft, FileSpreadsheet, GitCompare, FolderKanban, MoreVertical, Trash2, Eye } from 'lucide-react';

export default function ProjectDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [files, setFiles] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [projRes, filesRes, compRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get('/files'),
                api.get('/comparisons')
            ]);
            setProject(projRes.data);
            setFiles(filesRes.data.filter(f => String(f.project_id) === String(id)));
            setComparisons(compRes.data.filter(c => String(c.project_id) === String(id)));
        } catch (e) {
            console.error(e);
            navigate('/projects');
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [id, navigate]);

  if (loading) return <Loader />;
  if (!project) return null;

  const statusBadge = (status) => {
    const cls = { completed: 'badge-completed', running: 'badge-running', failed: 'badge-failed', pending: 'badge-pending' };
    return <span className={cls[status] || 'badge-pending'}>{status}</span>;
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/projects')} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-smooth rounded-lg hover:bg-[rgb(var(--bg-700))]">
            <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] flex items-center gap-2">
            <FolderKanban className="text-accent" size={24} />
            {project.name}
          </h1>
          <p className="text-gray-400 text-sm mt-1">{project.description || 'No description provided'}</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-4">
            <div className="text-sm text-gray-400 mb-1">Total Files</div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{files.length}</div>
        </div>
        <div className="glass-card p-4">
            <div className="text-sm text-gray-400 mb-1">Comparisons Run</div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">{comparisons.length}</div>
        </div>
        <div className="glass-card p-4">
            <div className="text-sm text-gray-400 mb-1">Last Updated</div>
            <div className="text-xl font-semibold text-[var(--text-primary)]">{new Date(project.updated_at).toLocaleDateString()}</div>
        </div>
      </div>

      {/* Files Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <FileSpreadsheet size={18} className="text-blue-400" /> Files
        </h2>
        <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[var(--border-color)]">
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Name</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Size</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Rows</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Uploaded</th>
                        </tr>
                    </thead>
                    <tbody>
                        {files.length === 0 && (
                            <tr><td colSpan={4} className="text-center py-6 text-gray-500 text-sm">No files in this project</td></tr>
                        )}
                        {files.map(f => (
                            <tr key={f.id} className="border-b border-[var(--border-color)] hover:bg-[rgb(var(--bg-700))] transition-smooth">
                                <td className="px-5 py-3.5 text-sm text-[var(--text-primary)] font-bold">{f.original_filename}</td>
                                <td className="px-5 py-3.5 text-sm text-gray-400">{formatSize(f.size_bytes)}</td>
                                <td className="px-5 py-3.5 text-sm text-gray-400">{f.row_count?.toLocaleString()}</td>
                                <td className="px-5 py-3.5 text-sm text-gray-400">{new Date(f.uploaded_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* Comparisons Section */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
            <GitCompare size={18} className="text-purple-400" /> Comparisons
        </h2>
        <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-[var(--border-color)]">
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Name</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Source</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Target</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Status</th>
                            <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {comparisons.length === 0 && (
                            <tr><td colSpan={5} className="text-center py-6 text-gray-500 text-sm">No comparisons yet</td></tr>
                        )}
                        {comparisons.map(c => (
                            <tr key={c.id} className="border-b border-[var(--border-color)] hover:bg-[rgb(var(--bg-700))] transition-smooth cursor-pointer" onClick={() => navigate(`/comparisons/${c.id}`)}>
                                <td className="px-5 py-3.5 text-sm text-[var(--text-primary)] font-bold">{c.name}</td>
                                <td className="px-5 py-3.5 text-sm text-gray-400 max-w-[150px] truncate">{c.source_filename}</td>
                                <td className="px-5 py-3.5 text-sm text-gray-400 max-w-[150px] truncate">{c.target_filename}</td>
                                <td className="px-5 py-3.5">{statusBadge(c.status)}</td>
                                <td className="px-5 py-3.5 text-sm text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
}
