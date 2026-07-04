import React from 'react';

export default function ProgressBar({ value, max = 100, color = 'primary' }) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);

  const colorClasses = {
    primary: 'bg-primary shadow-[0_0_8px_rgba(104,218,185,0.5)]',
    secondary: 'bg-secondary shadow-[0_0_8px_rgba(192,193,255,0.5)]',
    tertiary: 'bg-tertiary shadow-[0_0_8px_rgba(255,175,211,0.5)]',
    error: 'bg-error shadow-[0_0_8px_rgba(255,180,171,0.5)]'
  }[color] || 'bg-primary shadow-[0_0_8px_rgba(104,218,185,0.5)]';

  return (
    <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
      <div 
        className={`h-full rounded-full transition-all duration-500 ease-out ${colorClasses}`} 
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
