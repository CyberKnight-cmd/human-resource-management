import React from 'react';
import useCounterAnimation from '../../hooks/useCounterAnimation';

export default function StatCard({ 
  icon, 
  title, 
  value, 
  badgeText, 
  badgeType = 'primary', // 'primary' | 'secondary' | 'tertiary' | 'error'
  iconBgColor = 'bg-primary/10',
  iconColor = 'text-primary',
  animate = true,
  className = '',
  delay = '0.1s'
}) {
  const animatedValue = animate && typeof value === 'number' ? useCounterAnimation(value) : value;

  const badgeColorClass = {
    primary: 'bg-primary/20 text-primary',
    secondary: 'bg-secondary/20 text-secondary',
    tertiary: 'bg-tertiary-container/20 text-tertiary',
    error: 'bg-error-container/20 text-error'
  }[badgeType] || 'bg-primary/20 text-primary';

  return (
    <div 
      className={`glass-card p-6 rounded-3xl stagger-in ${className}`}
      style={{ animationDelay: delay }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 rounded-xl ${iconBgColor} ${iconColor} flex items-center justify-center`}>
          <span className="material-symbols-outlined fill" style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        </div>
        {badgeText && (
          <span className={`font-label-sm text-[10px] px-2 py-1 rounded-full ${badgeColorClass}`}>
            {badgeText}
          </span>
        )}
      </div>
      <p className="font-label-sm text-on-surface-variant mb-1 uppercase tracking-widest">{title}</p>
      <h3 className="font-display-xl text-[48px] font-bold text-on-surface">
        {typeof animatedValue === 'number' ? animatedValue.toLocaleString() : animatedValue}
      </h3>
    </div>
  );
}
