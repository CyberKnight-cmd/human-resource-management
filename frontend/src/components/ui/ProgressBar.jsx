import React from 'react';

export default function ProgressBar({ value, max = 100, color = 'primary', height = 'h-1.5', trackClass = 'bg-white/5', glow = true }) {
  const percent = Math.min(Math.max((value / max) * 100, 0), 100);

  const colorClasses = {
    primary: 'bg-primary',
    secondary: 'bg-secondary',
    tertiary: 'bg-tertiary',
    error: 'bg-error',
  }[color] || 'bg-primary';

  const glowClasses = {
    primary: 'shadow-[0_0_8px_rgba(104,218,185,0.5)]',
    secondary: 'shadow-[0_0_8px_rgba(192,193,255,0.5)]',
    tertiary: 'shadow-[0_0_8px_rgba(255,175,211,0.5)]',
    error: 'shadow-[0_0_8px_rgba(255,180,171,0.5)]',
  }[color] || 'shadow-[0_0_8px_rgba(104,218,185,0.5)]';

  return (
    <div className={`w-full ${trackClass} ${height} rounded-full overflow-hidden`}>
      <div
        className={`h-full rounded-full transition-all duration-500 ease-out ${colorClasses} ${glow ? glowClasses : ''}`}
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}
