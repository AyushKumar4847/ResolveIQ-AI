import React from 'react';

const statusStyles = {
  open: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  closed: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
  completed: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pending: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  failed: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  agent: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  admin: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  user: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
};

export const Badge = ({ status = 'open', children, className = '' }) => {
  const normalized = status.toLowerCase();
  const style = statusStyles[normalized] || 'bg-zinc-800 text-zinc-300 border-zinc-700';

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border uppercase tracking-wider ${style} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80" />
      {children || status}
    </span>
  );
};

