import { X } from 'lucide-react';

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative ${sizes[size]} w-full mx-4 bg-[rgb(var(--bg-800))] rounded-2xl shadow-2xl animate-in overflow-hidden`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)] bg-[rgb(var(--bg-700))]">
          <h3 className="text-lg font-bold text-[var(--text-primary)]">{title}</h3>
          <button onClick={onClose} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-smooth rounded-xl hover:bg-[rgb(var(--bg-600))]">
            <X size={20} />
          </button>
        </div>
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
