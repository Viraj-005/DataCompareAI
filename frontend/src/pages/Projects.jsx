import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import Modal from '../components/Modal';
import Loader from '../components/Loader';
import { Plus, FolderKanban, MoreVertical, Trash2, Edit3 } from 'lucide-react';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [editing, setEditing] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const load = () => {
      setLoading(true);
      api.get('/projects')
        .then(r => setProjects(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/projects/${editing}`, form);
      } else {
        await api.post('/projects', form);
      }
      setShowModal(false);
      setForm({ name: '', description: '' });
      setEditing(null);
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error');
    }
  };

  const deleteProject = async (id) => {
    if (!confirm('Delete this project and all its data?')) return;
    await api.delete(`/projects/${id}`);
    load();
  };

  const editProject = (p) => {
    setForm({ name: p.name, description: p.description || '' });
    setEditing(p.id);
    setShowModal(true);
    setMenuOpen(null);
  };

  const statusBadge = (status) => {
    const cls = { active: 'badge-active', archived: 'badge-archived', completed: 'badge-completed' };
    return <span className={cls[status] || 'badge-active'}>{status}</span>;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Projects</h1>
          <p className="text-gray-400 text-sm mt-1">Organize your data comparisons</p>
        </div>
        <button onClick={() => { setForm({ name: '', description: '' }); setEditing(null); setShowModal(true); }} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Project
        </button>
      </div>

      {/* Project Cards */}
      {/* Project Cards */}
      {loading ? (
        <Loader />
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.length === 0 && (
          <div className="col-span-full text-center py-16">
            <FolderKanban size={48} className="text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No projects yet. Create your first one!</p>
          </div>
        )}
        {projects.map((p) => (
          <div key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="glass-card p-5 hover:bg-[rgb(var(--bg-700))] transition-smooth group cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[rgb(var(--bg-700))] rounded-lg flex items-center justify-center">
                  <FolderKanban size={18} className="text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)]">{p.name}</h3>
                  <p className="text-xs text-gray-500">{p.owner_name}</p>
                </div>
              </div>
              <div className="relative">
                <button onClick={() => setMenuOpen(menuOpen === p.id ? null : p.id)} className="p-1 text-gray-500 hover:text-gray-300 rounded">
                  <MoreVertical size={16} />
                </button>
                {menuOpen === p.id && (
                  <div className="absolute right-0 top-8 bg-[rgb(var(--bg-800))] border border-[var(--border-color)] rounded-lg shadow-xl py-1 min-w-[120px] z-10">
                    <button onClick={() => editProject(p)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[rgb(var(--bg-700))] transition-smooth">
                      <Edit3 size={14} /> Edit
                    </button>
                    <button onClick={() => { deleteProject(p.id); setMenuOpen(null); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-[rgb(var(--bg-700))] transition-smooth">
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
            {p.description && <p className="text-xs text-gray-500 mb-3 line-clamp-2">{p.description}</p>}
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-auto pt-2 border-t border-[var(--border-color)]">
              <span>{p.file_count || 0} files</span>
              {p.last_run && <span>Last run: {new Date(p.last_run).toLocaleDateString()}</span>}
              {statusBadge(p.status)}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Project' : 'New Project'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-dark" placeholder="Project name" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="input-dark" rows={3} placeholder="Optional description" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{editing ? 'Update' : 'Create'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
