import React from 'react';

export default function GlassCard({ children, className = '', onClick, style = {} }) {
  return (
    <div
      onClick={onClick}
      style={style}
      className={`glass-panel rounded-3xl p-6 transition-all duration-300 ${className} ${onClick ? 'cursor-pointer' : ''}`}
    >
      {children}
    </div>
  );
}
