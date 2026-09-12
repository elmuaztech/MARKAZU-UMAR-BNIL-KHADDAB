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

    const handlePopState = () => {
      onClose();
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
      try {
        window.history.pushState({ modalOpen: true }, '');
      } catch {}
      window.addEventListener('popstate', handlePopState);
    }
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-poppins">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/75 backdrop-blur-md z-40"
          />

          {/* Modal Content Box */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`relative z-50 w-full ${maxWidthClasses[maxWidth]} max-h-[90vh] flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 shadow-2xl font-sans`}
          >
            {/* Header (Fixed / Non-scrolling) */}
            <div className="shrink-0 bg-white/95 dark:bg-[#042419]/95 backdrop-blur-md p-4 sm:p-6 border-b border-slate-100 dark:border-emerald-500/20 flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">{title}</h3>
                {titleArabic && <p className="font-arabic text-xs font-bold text-amber-500 mt-0.5">{titleArabic}</p>}
              </div>

              <button
                onClick={onClose}
                className="p-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-emerald-950 dark:hover:bg-emerald-900 text-slate-500 dark:text-emerald-300 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body (Scrolls Independently) */}
            <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 scrollbar-thin scrollbar-thumb-emerald-600">{children}</div>

            {/* Footer (Fixed / Pinned Action Area) */}
            {footer && (
              <div className="shrink-0 p-3.5 sm:p-6 border-t border-slate-100 dark:border-emerald-500/20 bg-slate-50/50 dark:bg-[#021810] flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3 [&>*]:w-full sm:[&>*]:w-auto">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
