import { useState, useEffect, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import api from '../api/axios';
import { Upload, FileSpreadsheet, MoreVertical, Trash2, Eye, X } from 'lucide-react';
import Modal from '../components/Modal';
import Loader from '../components/Loader';

export default function Files() {
  const [files, setFiles] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Menu State
  const [openMenuId, setOpenMenuId] = useState(null);
  // Column Viewer State
  const [viewingFile, setViewingFile] = useState(null);
  const menuRef = useRef(null);

  const load = () => {
      setLoading(true);
      api.get('/files')
        .then(r => setFiles(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    api.get('/projects').then(r => setProjects(r.data)).catch(() => {});
    
    // Close menu when clicking outside
    function handleClickOutside(event) {
        if (menuRef.current && !menuRef.current.contains(event.target)) {
            setOpenMenuId(null);
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!selectedProject) return alert('Please select a project first');
    setUploading(true);
    setUploadProgress(0);
    for (const file of acceptedFiles) {
      const formData = new FormData();
      formData.append('file', file);
      try {
        await api.post(`/files/upload?project_id=${selectedProject}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        });
      } catch (err) {
        alert(`Failed to upload ${file.name}: ${err.response?.data?.detail || err.message}`);
      }
    }
    setUploading(false);
    setUploadProgress(0);
    load();
  }, [selectedProject]);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    noClick: true
  });

  const deleteFile = async (id) => {
    if (!confirm('Delete this file?')) return;
    await api.delete(`/files/${id}`);
    load();
    setOpenMenuId(null);
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const toggleMenu = (e, id) => {
      e.stopPropagation();
      setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <div onClick={() => setOpenMenuId(null)}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Files</h1>
        <p className="text-gray-400 text-sm mt-1">Upload and manage your data files</p>
      </div>

      {/* Project selector for upload */}
      <div className="mb-4">
        <select
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
          className="input-dark max-w-xs"
        >
          <option value="">Select project to upload to...</option>
          {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`glass-card p-8 mb-6 text-center cursor-pointer transition-smooth border-2 border-dashed ${isDragActive ? 'border-accent bg-accent/5' : 'border-dark-500/30 hover:border-accent/40'}`}
        onClick={open}
      >
        <input {...getInputProps()} />
        <Upload size={36} className="mx-auto mb-3 text-gray-500" />
        {uploading ? (
            <div className="w-full max-w-xs mx-auto">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                </div>
                <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-accent transition-all duration-300 ease-out"
                        style={{ width: `${uploadProgress}%` }}
                    />
                </div>
            </div>
        ) : (
            <p className="text-gray-300 font-medium">Drag & drop files here</p>
        )}
        <p className="text-gray-500 text-xs mt-1">CSV, XLSX, XLS files supported</p>
        <button 
          className="mt-3 btn-secondary text-sm pointer-events-none" 
          type="button"
        >
          Browse Files
        </button>
      </div>

      {/* File Table */}
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-500/30">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Name</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Size</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Rows</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Columns</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Project</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Uploaded</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7}><Loader /></td></tr>
              ) : files.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-gray-500 text-sm">No files uploaded yet</td></tr>
              ) : (
                files.map((f) => (
                <tr key={f.id} className="border-b border-dark-500/10 hover:bg-dark-600/30 transition-smooth">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet size={16} className="text-accent flex-shrink-0" />
                      <span className="text-sm text-gray-200">{f.original_filename}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">{formatSize(f.size_bytes)}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">{f.row_count?.toLocaleString()}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">{f.column_count}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">{f.project_name || '-'}</td>
                  <td className="px-5 py-3.5 text-sm text-gray-400">{new Date(f.uploaded_at).toLocaleDateString()}</td>
                  <td className="px-3 py-3.5 relative">
                    <button 
                        onClick={(e) => toggleMenu(e, f.id)} 
                        className={`p-1.5 rounded transition-smooth ${openMenuId === f.id ? 'bg-dark-600 text-white' : 'text-gray-500 hover:text-white'}`}
                    >
                      <MoreVertical size={14} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {openMenuId === f.id && (
                        <div ref={menuRef} className="absolute right-8 top-0 mt-2 w-40 bg-dark-800 border border-dark-500 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                             <button 
                                onClick={(e) => { e.stopPropagation(); setViewingFile(f); setOpenMenuId(null); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-dark-700 hover:text-white flex items-center gap-2"
                             >
                                <Eye size={14} className="text-blue-400" /> View Columns
                             </button>
                             <button
                                onClick={(e) => { e.stopPropagation(); deleteFile(f.id); }}
                                className="w-full text-left px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                             >
                                <Trash2 size={14} /> Delete
                             </button>
                        </div>
                    )}
                  </td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Column Viewer Modal */}
      <Modal isOpen={!!viewingFile} onClose={() => setViewingFile(null)} title="File Columns">
        <div className="space-y-4">
             {viewingFile && (
                 <div>
                     <p className="text-sm text-gray-400 mb-3">Columns for <span className="text-white font-medium">{viewingFile.original_filename}</span>:</p>
                     <div className="max-h-64 overflow-y-auto rounded-lg border border-dark-500/30 bg-dark-900/50 p-2">
                        {(!viewingFile.column_metadata || Object.keys(viewingFile.column_metadata).length === 0) ? (
                            <p className="text-center text-gray-500 text-sm py-4">No column metadata available</p>
                        ) : (
                            <ul className="space-y-1">
                                {viewingFile.column_metadata.map((colInfo, index) => (
                                    <li key={index} className="text-sm text-gray-300 flex justify-between px-2 py-1.5 hover:bg-dark-700/30 rounded">
                                        <span>{colInfo.name}</span>
                                        <span className="text-xs text-gray-500 bg-dark-700 px-1.5 py-0.5 rounded">{colInfo.dtype}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                     </div>
                     <div className="mt-4 flex justify-end">
                         <button onClick={() => setViewingFile(null)} className="btn-secondary">Close</button>
                     </div>
                 </div>
             )}
        </div>
      </Modal>
    </div>
  );
}
