import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage, indexOfFirstItem, indexOfLastItem }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-none px-5 py-4">
      <div className="text-sm text-[var(--text-secondary)]">
        Showing <span className="font-bold text-[var(--text-primary)]">{indexOfFirstItem + 1}</span> to <span className="font-bold text-[var(--text-primary)]">{Math.min(indexOfLastItem, totalItems)}</span> of <span className="font-bold text-[var(--text-primary)]">{totalItems}</span> results
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-2 rounded-xl bg-[rgb(var(--bg-600))] text-[var(--text-primary)] font-bold hover:bg-accent hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-smooth text-sm flex items-center gap-2 shadow-sm"
        >
          <ChevronLeft size={16} /> Previous
        </button>
        <span className="text-sm font-bold text-[var(--text-secondary)] px-2">
            {currentPage} / {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-4 py-2 rounded-xl bg-[rgb(var(--bg-600))] text-[var(--text-primary)] font-bold hover:bg-accent hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-smooth text-sm flex items-center gap-2 shadow-sm"
        >
          Next <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
