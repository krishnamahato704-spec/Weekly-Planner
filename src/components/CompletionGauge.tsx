import React from 'react';

interface CompletionGaugeProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export const CompletionGauge: React.FC<CompletionGaugeProps> = ({
  percentage,
  size = 110,
  strokeWidth = 9,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  let colorClass = 'text-indigo-500';
  if (percentage === 100) {
    colorClass = 'text-emerald-500';
  } else if (percentage >= 50) {
    colorClass = 'text-indigo-600 dark:text-indigo-400';
  } else if (percentage > 0) {
    colorClass = 'text-sky-500 dark:text-sky-400';
  } else {
    colorClass = 'text-slate-300 dark:text-slate-700';
  }

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800/80"
          fill="transparent"
        />
        {/* Progress fill */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={`${colorClass} transition-all duration-700 ease-out`}
          fill="transparent"
        />
      </svg>
      {/* Centered percentage text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span className="text-xl font-extrabold tracking-tight text-slate-950 dark:text-white tabular-nums font-mono">
          {percentage}%
        </span>
        <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
          Done
        </span>
      </div>
    </div>
  );
};
