'use client';

import React from 'react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-[#042419] border border-dashed border-slate-200 dark:border-emerald-500/30 space-y-4 font-sans">
      <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
        {icon}
      </div>

      <div className="space-y-1 max-w-sm mx-auto">
        <h3 className="text-base font-black text-slate-900 dark:text-white">{title}</h3>
        <p className="text-xs text-slate-500 dark:text-emerald-300/70">{description}</p>
      </div>

      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
