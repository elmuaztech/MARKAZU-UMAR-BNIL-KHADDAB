'use client';

import React from 'react';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'amber' | 'sky' | 'rose' | 'purple' | 'indigo' | 'slate';
  isSolid?: boolean;
}

export function Badge({ children, variant = 'emerald', isSolid = false, className = '', ...props }: BadgeProps) {
  const subtleStyles = {
    emerald: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border-amber-500/30',
    sky: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
    rose: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
    purple: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30',
    slate: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
  };

  const solidStyles = {
    emerald: 'bg-emerald-600 text-white border-emerald-500',
    amber: 'bg-amber-500 text-slate-950 font-black border-amber-400',
    sky: 'bg-sky-600 text-white border-sky-500',
    rose: 'bg-rose-600 text-white border-rose-500',
    purple: 'bg-purple-600 text-white border-purple-500',
    indigo: 'bg-indigo-600 text-white border-indigo-500',
    slate: 'bg-slate-700 text-white border-slate-600',
  };

  const styleClass = isSolid ? solidStyles[variant] : subtleStyles[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border transition-colors ${styleClass} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
