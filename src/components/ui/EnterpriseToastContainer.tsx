'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export interface ToastItem {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
}

interface EnterpriseToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const toastConfigs = {
  success: {
    icon: CheckCircle2,
    badgeBg: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    iconColor: 'text-emerald-500',
    barColor: 'bg-emerald-500',
    borderClass: 'border-emerald-500/40 dark:border-emerald-500/30',
  },
  info: {
    icon: Info,
    badgeBg: 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30',
    iconColor: 'text-sky-500',
    barColor: 'bg-sky-500',
    borderClass: 'border-sky-500/40 dark:border-sky-500/30',
  },
  warning: {
    icon: AlertTriangle,
    badgeBg: 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border-amber-500/30',
    iconColor: 'text-amber-500',
    barColor: 'bg-amber-500',
    borderClass: 'border-amber-500/40 dark:border-amber-500/30',
  },
  error: {
    icon: AlertCircle,
    badgeBg: 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30',
    iconColor: 'text-rose-500',
    barColor: 'bg-rose-500',
    borderClass: 'border-rose-500/40 dark:border-rose-500/30',
  },
};

export function EnterpriseToastContainer({ toasts, onDismiss }: EnterpriseToastContainerProps) {
  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      <AnimatePresence mode="sync">
        {toasts.map((toast) => {
          const config = toastConfigs[toast.type] || toastConfigs.info;
          const Icon = config.icon;

          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className={`pointer-events-auto relative overflow-hidden rounded-2xl bg-white dark:bg-[#042419] border ${config.borderClass} p-4 shadow-xl shadow-emerald-950/20 font-poppins flex items-start gap-3 text-slate-900 dark:text-white`}
            >
              <div className={`p-2 rounded-xl border ${config.badgeBg} shrink-0 mt-0.5`}>
                <Icon className={`w-5 h-5 ${config.iconColor}`} />
              </div>

              <div className="flex-1 min-w-0 pr-4">
                <h4 className="text-xs font-black tracking-tight leading-snug uppercase">{toast.title}</h4>
                <p className="text-xs text-slate-600 dark:text-emerald-100/80 font-medium leading-relaxed mt-0.5">
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => onDismiss(toast.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors p-1 rounded-lg shrink-0"
                title="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Progress bar countdown */}
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: (toast.duration || 4500) / 1000, ease: 'linear' }}
                className={`absolute bottom-0 left-0 h-1 ${config.barColor}`}
              />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
