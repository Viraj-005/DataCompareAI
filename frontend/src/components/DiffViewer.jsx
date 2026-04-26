import { motion } from 'framer-motion';

export default function DiffViewer({ changes }) {
  if (!changes) return null;

  return (
    <div className="space-y-3">
      {Object.entries(changes).map(([col, change], index) => (
        <motion.div 
          key={col}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[rgb(var(--bg-800))] border border-[var(--border-color)] rounded-2xl shadow-sm"
        >
          {/* Column Header */}
          <div className="md:col-span-2 flex items-center gap-2 mb-1">
            <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">{col}</span>
          </div>

          {/* Source Value */}
          <div className="relative p-3 bg-red-500/5 border border-red-500/10 rounded-xl group">
            <span className="absolute -top-2 left-3 px-2 py-0.5 bg-red-500 text-[9px] text-white font-black rounded-md uppercase tracking-tighter">Source</span>
            <div className="text-sm text-red-600 font-mono break-words pt-1 font-bold">{String(change.source)}</div>
          </div>

          {/* Target Value */}
          <div className="relative p-3 bg-green-500/5 border border-green-500/10 rounded-xl">
            <span className="absolute -top-2 left-3 px-2 py-0.5 bg-green-500 text-[9px] text-white font-black rounded-md uppercase tracking-tighter">Target</span>
            <div className="text-sm text-emerald-600 font-mono break-words pt-1 font-bold">{String(change.target)}</div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
