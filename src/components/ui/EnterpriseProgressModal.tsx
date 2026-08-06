'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, CheckCircle2, Sparkles, X } from 'lucide-react';

export interface ProgressOptions {
  title: string;
  totalItems: number;
  itemLabel?: string;
  onComplete?: () => void;
}

interface EnterpriseProgressModalProps {
  options: ProgressOptions | null;
  onClose: () => void;
}

export function EnterpriseProgressModal({ options, onClose }: EnterpriseProgressModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!options) {
      setCurrentIndex(0);
      setIsCompleted(false);
      return;
    }

    const total = options.totalItems;
    const intervalTime = Math.max(100, Math.floor(3000 / total));

    const timer = setInterval(() => {
      setCurrentIndex((prev) => {
        if (prev + 1 >= total) {
          clearInterval(timer);
          setIsCompleted(true);
          setTimeout(() => {
            if (options.onComplete) options.onComplete();
            onClose();
          }, 800);
          return total;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [options]);

  if (!options) return null;

  const percentage = Math.min(100, Math.round((currentIndex / options.totalItems) * 100));

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 10 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="max-w-md w-full bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative text-slate-900 dark:text-white font-poppins"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30">
              {isCompleted ? <CheckCircle2 className="w-6 h-6 text-emerald-500" /> : <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />}
            </div>
            <div>
              <h3 className="text-base font-black tracking-tight leading-tight">{options.title}</h3>
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-600 dark:text-emerald-400">
                {isCompleted ? 'Operation Complete' : 'Processing Task...'}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-emerald-200">
                {options.itemLabel || 'Item'} {currentIndex} of {options.totalItems}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black">{percentage}%</span>
            </div>

            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-emerald-950 border border-slate-200 dark:border-emerald-800/50 overflow-hidden p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 shadow-sm"
              />
            </div>
          </div>

          <p className="text-xs text-slate-500 dark:text-emerald-300/80 font-medium">
            {isCompleted ? 'All records processed successfully.' : `Processing item ${currentIndex} of ${options.totalItems}. Please hold on...`}
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
