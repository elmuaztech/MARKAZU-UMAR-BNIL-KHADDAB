'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  titleArabic?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  titleArabic,
  children,
  footer,
  maxWidth = 'md',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-40"
          />

          {/* Modal Content Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`relative z-50 w-full ${maxWidthClasses[maxWidth]} rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 shadow-2xl overflow-hidden font-sans space-y-4`}
          >
            {/* Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-emerald-500/20 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
                {titleArabic && <p className="font-arabic text-xs font-bold text-amber-500 mt-0.5">{titleArabic}</p>}
              </div>

              <button
                onClick={onClose}
                className="p-2 rounded-2xl bg-slate-100 dark:bg-emerald-950 text-slate-500 dark:text-emerald-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 max-h-[70vh] overflow-y-auto">{children}</div>

            {/* Footer */}
            {footer && (
              <div className="p-4 sm:p-6 border-t border-slate-100 dark:border-emerald-500/20 bg-slate-50/50 dark:bg-[#021810] flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
