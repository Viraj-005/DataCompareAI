import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage, indexOfFirstItem, indexOfLastItem }) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-dark-500/30 px-5 py-4">
      <div className="text-sm text-gray-500">
        Showing <span className="font-medium text-gray-300">{indexOfFirstItem + 1}</span> to <span className="font-medium text-gray-300">{Math.min(indexOfLastItem, totalItems)}</span> of <span className="font-medium text-gray-300">{totalItems}</span> results
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1 px-3 py-1.5 rounded-lg border border-dark-500/50 text-gray-400 hover:bg-dark-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-smooth text-sm flex items-center gap-1"
        >
          <ChevronLeft size={14} /> Previous
        </button>
        <span className="text-sm text-gray-400">
            Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1 px-3 py-1.5 rounded-lg border border-dark-500/50 text-gray-400 hover:bg-dark-600 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-smooth text-sm flex items-center gap-1"
        >
          Next <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
