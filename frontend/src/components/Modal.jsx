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
      <div className={`relative ${sizes[size]} w-full mx-4 bg-dark-700 border border-dark-500/30 rounded-xl shadow-2xl animate-in`}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-dark-500/30">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white transition-smooth rounded-lg hover:bg-dark-600">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">
          {children}
        </div>
      </div>
    </div>
  );
}
