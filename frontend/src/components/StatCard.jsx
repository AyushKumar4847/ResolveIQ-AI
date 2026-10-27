import React from 'react';

export const StatCard = ({ title, value, icon: Icon, change, trend = 'up', description }) => {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700/80 transition-all duration-200">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">{title}</span>
        {Icon && (
          <div className="w-9 h-9 rounded-xl bg-zinc-800/80 border border-zinc-700/50 flex items-center justify-center text-zinc-300">
            <Icon className="w-4 h-4 text-brand-400" />
          </div>
        )}
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight text-zinc-100">{value}</span>
        {change && (
          <span
            className={`text-xs font-medium ${
              trend === 'up' ? 'text-emerald-400' : 'text-zinc-400'
            }`}
          >
            {change}
          </span>
        )}
      </div>
      {description && <p className="mt-1 text-xs text-zinc-500">{description}</p>}
    </div>
  );
};

