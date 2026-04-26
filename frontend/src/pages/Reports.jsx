import { useState, useEffect } from 'react';
import api from '../api/axios';
import { Download, FileBarChart } from 'lucide-react';
import Pagination from '../components/Pagination';
import Loader from '../components/Loader';

export default function Reports() {
  const [comparisons, setComparisons] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Pagination State
  const [compPage, setCompPage] = useState(1);
  const [filePage, setFilePage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const fetchData = async () => {
        try {
            const [compRes, filesRes] = await Promise.all([
                api.get('/comparisons'),
                api.get('/files')
            ]);
            setComparisons(compRes.data);
            setFiles(filesRes.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, []);

  const downloadReport = async (type, id, format) => {
    try {
      let url;
      if (type === 'comparison') url = `/reports/comparison/${id}?format=${format}`;
      else if (type === 'anomalies') url = `/reports/anomalies?file_id=${id}&format=${format}`;
      else url = `/reports/violations?file_id=${id}&format=${format}`;

      const res = await api.get(url, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${type}_report.${format}`;
      link.click();
    } catch {
      alert('Export failed');
    }
  };

  // Pagination Logic
  const getPaginatedData = (data, page) => {
      const idxLast = page * itemsPerPage;
      const idxFirst = idxLast - itemsPerPage;
      return {
          current: data.slice(idxFirst, idxLast),
          totalPages: Math.ceil(data.length / itemsPerPage),
          firstIndex: idxFirst,
          lastIndex: idxLast
      };
  };

  const paginatedComp = getPaginatedData(comparisons.filter(c => c.status === 'completed'), compPage);
  const paginatedFiles = getPaginatedData(files, filePage);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Reports</h1>
        <p className="text-gray-400 text-sm mt-1">Download comparison results and analysis reports</p>
      </div>

      {loading ? <Loader /> : (
      <>
      {/* Comparison Reports */}
      <div className="glass-card mb-6">
        <div className="px-5 py-4 border-none">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Comparison Reports</h3>
        </div>
        <div className="space-y-1">
          {paginatedComp.current.length === 0 && <p className="text-center py-8 text-gray-500 text-sm">No comparisons available</p>}
          {paginatedComp.current.map(c => (
            <div key={c.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[rgb(var(--bg-700))] transition-smooth">
              <div className="flex items-center gap-3">
                <FileBarChart size={16} className="text-accent" />
                <div>
                  <p className="text-sm text-[var(--text-primary)] font-bold">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.project_name} • {new Date(c.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => downloadReport('comparison', c.id, 'csv')} className="btn-secondary text-xs flex items-center gap-1.5"><Download size={12} /> CSV</button>
                <button onClick={() => downloadReport('comparison', c.id, 'xlsx')} className="btn-secondary text-xs flex items-center gap-1.5"><Download size={12} /> Excel</button>
              </div>
            </div>
          ))}
        </div>
        <Pagination 
            currentPage={compPage}
            totalPages={paginatedComp.totalPages}
            onPageChange={setCompPage}
            totalItems={comparisons.filter(c => c.status === 'completed').length}
            itemsPerPage={itemsPerPage}
            indexOfFirstItem={paginatedComp.firstIndex}
            indexOfLastItem={paginatedComp.lastIndex}
        />
      </div>

      {/* Anomaly Reports */}
      <div className="glass-card mb-6">
        <div className="px-5 py-4 border-none">
          <h3 className="text-base font-semibold text-[var(--text-primary)]">Anomaly Reports (by File)</h3>
        </div>
        <div className="space-y-1">
          {paginatedFiles.current.length === 0 && <p className="text-center py-8 text-gray-500 text-sm">No files available</p>}
          {paginatedFiles.current.map(f => (
            <div key={f.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-[rgb(var(--bg-700))] transition-smooth">
              <div>
                <p className="text-sm text-[var(--text-primary)] font-bold">{f.original_filename}</p>
                <p className="text-xs text-gray-500">{f.project_name} • {f.row_count} rows</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => downloadReport('anomalies', f.id, 'csv')} className="btn-secondary text-xs flex items-center gap-1.5"><Download size={12} /> Anomalies CSV</button>
                <button onClick={() => downloadReport('violations', f.id, 'csv')} className="btn-secondary text-xs flex items-center gap-1.5"><Download size={12} /> Violations CSV</button>
              </div>
            </div>
          ))}
        </div>
        <Pagination 
            currentPage={filePage}
            totalPages={paginatedFiles.totalPages}
            onPageChange={setFilePage}
            totalItems={files.length}
            itemsPerPage={itemsPerPage}
            indexOfFirstItem={paginatedFiles.firstIndex}
            indexOfLastItem={paginatedFiles.lastIndex}
        />
      </div>
      </>
      )}
    </div>
  );
}
