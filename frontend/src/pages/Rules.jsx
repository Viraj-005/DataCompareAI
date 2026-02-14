import { useState, useEffect } from 'react';
import api from '../api/axios';
import Modal from '../components/Modal';
import { Plus, Shield, Trash2, Play } from 'lucide-react';
import Pagination from '../components/Pagination';

export default function Rules() {
  const [rules, setRules] = useState([]);
  const [violations, setViolations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [files, setFiles] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [tab, setTab] = useState('rules');
  const [form, setForm] = useState({ name: '', column_name: '', rule_type: 'not_null', project_id: '', parameters: {} });
  const [rangeParams, setRangeParams] = useState({ min: '', max: '' });
  const [regexParam, setRegexParam] = useState({ pattern: '' }); // Fixed to object for consistency
  const [validateForm, setValidateForm] = useState({ file_id: '', project_id: '' });
  const [showValidate, setShowValidate] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const load = () => {
    api.get('/rules').then(r => setRules(r.data)).catch(() => {});
    api.get('/rules/violations').then(r => setViolations(r.data)).catch(() => {});
  };

  useEffect(() => {
    load();
    api.get('/projects').then(r => setProjects(r.data)).catch(() => {});
    api.get('/files').then(r => setFiles(r.data)).catch(() => {});
  }, []);
  
  // Reset pagination on tab change
  useEffect(() => {
      setCurrentPage(1);
  }, [tab]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let params = {};
    if (form.rule_type === 'range') params = { min: parseFloat(rangeParams.min) || null, max: parseFloat(rangeParams.max) || null };
    if (form.rule_type === 'regex') params = { pattern: regexParam.pattern }; // Access pattern from object
    try {
      await api.post('/rules', { ...form, project_id: parseInt(form.project_id), parameters: params });
      setShowModal(false);
      setForm({ name: '', column_name: '', rule_type: 'not_null', project_id: '', parameters: {} });
      load();
    } catch (err) {
      alert(err.response?.data?.detail || 'Error');
    }
  };

  const deleteRule = async (id) => {
    if (!confirm('Delete this rule?')) return;
    await api.delete(`/rules/${id}`);
    load();
  };

  const runValidation = async () => {
    try {
      await api.post(`/rules/validate/${validateForm.file_id}?project_id=${validateForm.project_id}`);
      setShowValidate(false);
      load();
      alert('Validation complete');
    } catch (err) {
      alert(err.response?.data?.detail || 'Validation failed');
    }
  };

  const ruleTypes = ['not_null', 'unique', 'positive', 'range', 'regex'];

  // Pagination Logic
  const activeList = tab === 'rules' ? rules : violations;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = activeList.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(activeList.length / itemsPerPage);
  
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Rules</h1>
          <p className="text-gray-400 text-sm mt-1">Define and enforce data validation rules</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowValidate(true)} className="btn-secondary flex items-center gap-2 text-sm"><Play size={14} /> Validate</button>
          <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2 text-sm"><Plus size={14} /> New Rule</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-dark-700 rounded-lg p-1 mb-6 w-fit">
        <button onClick={() => setTab('rules')} className={`px-4 py-2 text-sm font-medium rounded-md transition-smooth ${tab === 'rules' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'}`}>Rules ({rules.length})</button>
        <button onClick={() => setTab('violations')} className={`px-4 py-2 text-sm font-medium rounded-md transition-smooth ${tab === 'violations' ? 'bg-accent text-white' : 'text-gray-400 hover:text-white'}`}>Violations ({violations.length})</button>
      </div>

      {tab === 'rules' && (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-500/30">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Name</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Column</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Type</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Parameters</th>
                <th className="text-right text-xs font-medium text-gray-500 uppercase px-5 py-3">Violations</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rules.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-500 text-sm">No rules defined yet</td></tr>}
              {currentItems.map((r) => (
                <tr key={r.id} className="border-b border-dark-500/10 hover:bg-dark-600/30 transition-smooth">
                  <td className="px-5 py-3 text-sm text-gray-200 flex items-center gap-2"><Shield size={14} className="text-accent" />{r.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-300 font-mono">{r.column_name}</td>
                  <td className="px-5 py-3"><span className="px-2 py-0.5 text-xs font-medium rounded-full bg-accent/10 text-accent">{r.rule_type}</span></td>
                  <td className="px-5 py-3 text-xs text-gray-400">{r.parameters ? JSON.stringify(r.parameters) : '-'}</td>
                  <td className="px-5 py-3 text-sm text-right">{r.violation_count > 0 ? <span className="text-red-400 font-medium">{r.violation_count}</span> : <span className="text-gray-500">0</span>}</td>
                  <td className="px-3 py-3"><button onClick={() => deleteRule(r.id)} className="p-1.5 text-gray-500 hover:text-red-400"><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={paginate}
                totalItems={activeList.length}
                itemsPerPage={itemsPerPage}
                indexOfFirstItem={indexOfFirstItem}
                indexOfLastItem={indexOfLastItem}
           />
        </div>
      )}

      {tab === 'violations' && (
        <div className="glass-card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-500/30">
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Rule</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">File</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Row</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Column</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Value</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase px-5 py-3">Message</th>
              </tr>
            </thead>
            <tbody>
              {violations.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-gray-500 text-sm">No violations found</td></tr>}
              {currentItems.map((v) => (
                <tr key={v.id} className="border-b border-dark-500/10 hover:bg-dark-600/30 transition-smooth">
                  <td className="px-5 py-3 text-sm text-gray-300">{v.rule_name}</td>
                  <td className="px-5 py-3 text-sm text-gray-400">{v.filename}</td>
                  <td className="px-5 py-3 text-sm text-gray-400 font-mono">{v.row_index}</td>
                  <td className="px-5 py-3 text-sm text-gray-300">{v.column_name}</td>
                  <td className="px-5 py-3 text-sm text-red-400 font-mono">{v.value || 'null'}</td>
                  <td className="px-5 py-3 text-xs text-gray-400 max-w-xs truncate">{v.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={paginate}
                totalItems={activeList.length}
                itemsPerPage={itemsPerPage}
                indexOfFirstItem={indexOfFirstItem}
                indexOfLastItem={indexOfLastItem}
           />
        </div>
      )}

      {/* New Rule Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New Rule">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Rule Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-dark" placeholder="e.g., Positive Revenue" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Project</label>
            <select value={form.project_id} onChange={e => setForm({ ...form, project_id: e.target.value })} className="input-dark" required>
              <option value="">Select project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Column Name</label>
            <input value={form.column_name} onChange={e => setForm({ ...form, column_name: e.target.value })} className="input-dark" placeholder="e.g., revenue" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Rule Type</label>
            <select value={form.rule_type} onChange={e => setForm({ ...form, rule_type: e.target.value })} className="input-dark">
              {ruleTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {form.rule_type === 'range' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Min</label>
                <input type="number" value={rangeParams.min} onChange={e => setRangeParams({ ...rangeParams, min: e.target.value })} className="input-dark text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Max</label>
                <input type="number" value={rangeParams.max} onChange={e => setRangeParams({ ...rangeParams, max: e.target.value })} className="input-dark text-sm" />
              </div>
            </div>
          )}
          {form.rule_type === 'regex' && (
            <div>
              <label className="block text-xs text-gray-400 mb-1">Pattern</label>
              <input value={regexParam} onChange={e => setRegexParam(e.target.value)} className="input-dark text-sm" placeholder="e.g., ^[A-Z]{2}\\d+" />
            </div>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Rule</button>
          </div>
        </form>
      </Modal>

      {/* Validate Modal */}
      <Modal isOpen={showValidate} onClose={() => setShowValidate(false)} title="Run Validation">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Project</label>
            <select value={validateForm.project_id} onChange={e => setValidateForm({ ...validateForm, project_id: e.target.value })} className="input-dark">
              <option value="">Select project...</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">File</label>
            <select value={validateForm.file_id} onChange={e => setValidateForm({ ...validateForm, file_id: e.target.value })} className="input-dark">
              <option value="">Select file...</option>
              {files.filter(f => !validateForm.project_id || String(f.project_id) === String(validateForm.project_id)).map(f => <option key={f.id} value={f.id}>{f.original_filename}</option>)}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setShowValidate(false)} className="btn-secondary">Cancel</button>
            <button onClick={runValidation} disabled={!validateForm.file_id || !validateForm.project_id} className="btn-primary">Run</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
