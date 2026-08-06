'use client';

import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'warning' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  leftIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon,
  leftIcon,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const renderIcon = leftIcon || icon;
  const variantStyles = {
    primary:
      'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-lg shadow-emerald-900/30 border border-emerald-400/30',
    secondary:
      'bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 dark:bg-emerald-950 dark:hover:bg-emerald-900 dark:border-emerald-800 dark:text-emerald-200',
    danger:
      'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-900/30 border border-rose-400/30',
    warning:
      'bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold shadow-lg shadow-amber-900/20 border border-amber-400/30',
    outline:
      'bg-transparent border border-slate-300 dark:border-emerald-500/40 text-slate-700 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-emerald-900/30',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-emerald-900/30 text-slate-700 dark:text-emerald-300',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-[11px] rounded-xl font-bold gap-1.5',
    md: 'px-4 py-2 text-xs rounded-xl font-extrabold gap-2',
    lg: 'px-5 py-3 text-sm rounded-2xl font-black gap-2.5',
  };

  return (
    <button
      className={`inline-flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {renderIcon && <span className="shrink-0">{renderIcon}</span>}
      {children && <span>{children}</span>}
    </button>
  );
}

export function IconButton({
  icon,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}: Omit<ButtonProps, 'children'> & { icon: React.ReactNode }) {
  const iconSizeStyles = {
    sm: 'p-1.5 rounded-lg text-xs',
    md: 'p-2 rounded-xl text-sm',
    lg: 'p-3 rounded-2xl text-base',
  };

  const variantStyles = {
    primary: 'bg-emerald-600 hover:bg-emerald-500 text-white',
    secondary: 'bg-slate-800 hover:bg-slate-700 text-slate-100',
    danger: 'bg-rose-600 hover:bg-rose-500 text-white',
    warning: 'bg-amber-500 hover:bg-amber-400 text-slate-950',
    outline: 'border border-slate-300 dark:border-emerald-500/40 text-slate-700 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-emerald-900/30',
    ghost: 'hover:bg-slate-100 dark:hover:bg-emerald-900/30 text-slate-700 dark:text-emerald-300',
  };

  return (
    <button
      className={`inline-flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${variantStyles[variant]} ${iconSizeStyles[size]} ${className}`}
      {...props}
    >
      {icon}
    </button>
  );
}
