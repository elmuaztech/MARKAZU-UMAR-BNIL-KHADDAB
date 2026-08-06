'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'outline' | 'ghost' | 'icon';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  // Base classes
  const baseClasses =
    'inline-flex items-center justify-center font-bold font-sans rounded-2xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

  // Size variants
  const sizeClasses = {
    sm: 'text-xs px-3 py-1.5 h-8 gap-1.5',
    md: 'text-xs sm:text-sm px-4 py-2.5 h-10 gap-2',
    lg: 'text-sm sm:text-base px-6 py-3.5 h-12 gap-2.5',
  };

  // Color & Style variants
  const variantClasses = {
    primary:
      'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-md shadow-emerald-900/30 border border-emerald-500/40',
    secondary:
      'bg-slate-100 dark:bg-[#021810] hover:bg-slate-200 dark:hover:bg-emerald-950 text-slate-800 dark:text-emerald-200 border border-slate-200 dark:border-emerald-500/30 shadow-xs',
    success:
      'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white shadow-md shadow-emerald-900/30',
    danger:
      'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-md shadow-rose-900/30',
    warning:
      'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black shadow-md shadow-amber-900/30',
    outline:
      'bg-transparent hover:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40 dark:border-emerald-500/30',
    ghost:
      'bg-transparent hover:bg-slate-100 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-emerald-300',
    icon:
      'p-2.5 h-10 w-10 bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-slate-700 dark:text-emerald-300 hover:text-emerald-600 dark:hover:text-white shadow-sm',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      disabled={disabled || isLoading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
      {...(props as any)}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          {children && <span>{children}</span>}
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
}
