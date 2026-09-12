'use client';

import React from 'react';

export interface FormFieldProps {
  label?: string;
  labelArabic?: string;
  error?: string;
  helperText?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({ label, labelArabic, error, helperText, children, className = '' }: FormFieldProps) {
  return (
    <div className={`space-y-1.5 font-sans ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-slate-700 dark:text-emerald-300">
          <span>{label}</span>
          {labelArabic && <span className="font-arabic text-xs font-bold text-amber-500">{labelArabic}</span>}
        </div>
      )}
      {children}
      {error && <p className="text-[11px] font-bold text-rose-600 dark:text-rose-400 break-words">{error}</p>}
      {helperText && !error && <p className="text-[11px] font-medium text-slate-400 dark:text-emerald-300/60 break-words">{helperText}</p>}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className = '', error, ...props }, ref) => {
  return (
    <input
      ref={ref}
      className={`w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#021810] border ${
        error ? 'border-rose-500' : 'border-slate-200 dark:border-emerald-500/30'
      } text-[16px] sm:text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors ${className}`}
      {...props}
    />
  );
});
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({ className = '', error, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={`w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#021810] border ${
        error ? 'border-rose-500' : 'border-slate-200 dark:border-emerald-500/30'
      } text-[16px] sm:text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 transition-colors ${className}`}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className = '', error, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={`w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#021810] border ${
        error ? 'border-rose-500' : 'border-slate-200 dark:border-emerald-500/30'
      } text-[16px] sm:text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 transition-colors ${className}`}
      {...props}
    />
  );
});
Textarea.displayName = 'Textarea';
