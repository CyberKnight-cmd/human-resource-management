import React from 'react';

export default function StatusBadge({ status }) {
  const normalizedStatus = (status || '').toLowerCase().trim();

  let styles = 'bg-primary/10 text-primary border border-primary/20';

  if (normalizedStatus === 'active' || normalizedStatus === 'present' || normalizedStatus === 'verified') {
    styles = 'bg-primary/10 text-primary border border-primary/20';
  } else if (normalizedStatus === 'on leave' || normalizedStatus === 'leave') {
    styles = 'bg-secondary-container/20 text-secondary border border-secondary/20';
  } else if (normalizedStatus === 'late') {
    styles = 'bg-tertiary-container/20 text-tertiary border border-tertiary/20';
  } else if (normalizedStatus === 'reviewing' || normalizedStatus === 'pending') {
    styles = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
  } else if (normalizedStatus === 'rejected') {
    styles = 'bg-error-container/20 text-error border border-error-container/40';
  } else if (normalizedStatus === 'absent') {
    styles = 'bg-error/20 text-error border border-error/30';
  }

  return (
    <span className={`px-3 py-1 rounded-full font-label-sm text-[10px] font-bold uppercase tracking-wider ${styles}`}>
      {status}
    </span>
  );
}
