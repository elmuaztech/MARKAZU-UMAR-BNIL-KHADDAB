'use client';

import React from 'react';
import { motion } from 'framer-motion';

export interface CardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onDrag' | 'onDragStart' | 'onDragEnd' | 'onAnimationStart'> {
  hoverEffect?: boolean;
}

export function Card({ children, className = '', hoverEffect = false, ...props }: CardProps) {
  const baseClasses =
    'rounded-2xl sm:rounded-3xl bg-white dark:bg-[#042419] border border-slate-200/90 dark:border-emerald-500/30 p-4 sm:p-6 shadow-xl transition-all duration-200';

  if (hoverEffect) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        whileHover={{ y: -3, scale: 1.005 }}
        className={`${baseClasses} hover:shadow-2xl hover:border-emerald-500/50 ${className}`}
        onClick={props.onClick}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      className={`${baseClasses} ${className}`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-emerald-500/20 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <h3 className={`text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight ${className}`}>{children}</h3>;
}

export function CardDescription({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-xs text-slate-500 dark:text-emerald-300/70 font-medium ${className}`}>{children}</p>;
}

export function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`pt-4 ${className}`}>{children}</div>;
}

export function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`pt-4 border-t border-slate-100 dark:border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4 ${className}`}>{children}</div>;
}

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  variant?: 'emerald' | 'amber' | 'sky' | 'purple' | 'rose';
}

export function StatCard({ title, value, subtitle, icon, trend, variant = 'emerald' }: StatCardProps) {
  const variantStyles = {
    emerald: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    sky: 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30',
    purple: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
    rose: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
  };

  return (
    <Card hoverEffect className="flex flex-col justify-between h-full space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500 dark:text-emerald-300/80">
          {title}
        </span>
        <div className={`p-3 rounded-2xl border ${variantStyles[variant]}`}>{icon}</div>
      </div>

      <div>
        <p suppressHydrationWarning className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">{value}</p>
        {subtitle && <p suppressHydrationWarning className="text-xs font-semibold text-slate-500 dark:text-emerald-300/70 mt-1">{subtitle}</p>}
      </div>

      {trend && (
        <div className="flex items-center gap-1.5 text-xs font-extrabold">
          <span className={trend.isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
          <span className="text-slate-400 font-normal">vs last term</span>
        </div>
      )}
    </Card>
  );
}
