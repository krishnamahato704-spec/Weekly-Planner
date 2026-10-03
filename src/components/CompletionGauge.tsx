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

  const colorClass = percentage === 100 ? 'text-emerald-600 dark:text-emerald-300' : 'text-indigo-600 dark:text-indigo-300';

  return (
    <div className="relative inline-flex items-center justify-center shrink-0" style={{ width: size, height: size }} role="img" aria-label={`${percentage}% complete`}>
      <svg aria-hidden="true" className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-700/60"
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
        <span className="text-[clamp(18px,2.3vw,30px)] font-semibold tracking-tight tabular-nums">
          {percentage}%
        </span>
        <span className="text-[10px] font-medium text-muted mt-1">
          complete
        </span>
      </div>
    </div>
  );
};
