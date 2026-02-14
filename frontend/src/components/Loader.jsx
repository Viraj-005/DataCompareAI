import { Loader2 } from 'lucide-react';

export default function Loader({ size = 24, className = "" }) {
  return (
    <div className={`flex justify-center items-center py-10 w-full ${className}`}>
      <Loader2 size={size} className="animate-spin text-accent" />
    </div>
  );
}
