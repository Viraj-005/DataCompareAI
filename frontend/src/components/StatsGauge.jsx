import { motion } from 'framer-motion';

export default function StatsGauge({ value, label, size = 120, strokeWidth = 10, color = '#3b82f6' }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center" style={{ width: size, height: size + 30 }}>
      <div className="relative" style={{ width: size, height: size }}>
        {/* Background Circle */}
        <svg className="transform -rotate-90" width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={strokeWidth}
            fill="transparent"
            className="text-[var(--text-secondary)] opacity-10"
          />
          {/* Progress Circle */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        {/* Value Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl font-black text-[var(--text-primary)]"
          >
            {Math.round(value)}%
          </motion.span>
        </div>
      </div>
      {label && <span className="text-[10px] font-black uppercase tracking-widest text-[var(--text-secondary)] mt-2">{label}</span>}
    </div>
  );
}
