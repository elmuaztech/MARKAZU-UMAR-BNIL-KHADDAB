'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, CheckCircle2, X } from 'lucide-react';
import { Button } from './Button';

export interface ConfirmOptions {
  title: string;
  description?: string;
  message?: string;
  confirmLabel?: string;
  confirmText?: string;
  cancelLabel?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  isDanger?: boolean;
  variant?: 'danger' | 'warning' | 'info';
}

interface EnterpriseConfirmModalProps {
  options: ConfirmOptions | null;
  onClose: () => void;
}

export function EnterpriseConfirmModal({ options, onClose }: EnterpriseConfirmModalProps) {
  if (!options) return null;

  const handleConfirm = async () => {
    try {
      await options.onConfirm();
    } finally {
      onClose();
    }
  };

  const isDanger = options.isDanger !== undefined ? options.isDanger : (options.variant ? options.variant === 'danger' : true);
  const modalText = options.description || options.message || 'Are you sure you want to proceed?';
  const cancelBtnText = options.cancelLabel || options.cancelText || 'Cancel';
  const confirmBtnText = options.confirmLabel || options.confirmText || (isDanger ? 'Confirm Delete' : 'Confirm Action');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="max-w-md w-full bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-7 space-y-5 shadow-2xl relative text-slate-900 dark:text-white font-poppins"
        >
          <button
            onClick={onClose}
            className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl border ${
                isDanger
                  ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border-rose-500/30'
                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30'
              }`}
            >
              {isDanger ? <Trash2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight leading-tight">{options.title}</h3>
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-emerald-400/80">
                Action Confirmation Required
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-emerald-100/80 font-medium leading-relaxed">
            {modalText}
          </p>

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-emerald-500/20">
            <Button variant="secondary" size="md" onClick={onClose}>
              {cancelBtnText}
            </Button>
            <Button
              variant={isDanger ? 'danger' : 'primary'}
              size="md"
              onClick={handleConfirm}
            >
              {confirmBtnText}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
