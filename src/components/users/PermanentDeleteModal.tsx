'use client';

import React, { useState } from 'react';
import { User } from '@/types';
import { useApp } from '@/lib/context';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';

interface PermanentDeleteModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function PermanentDeleteModal({ user, isOpen, onClose, onSuccess }: PermanentDeleteModalProps) {
  const { permanentlyDeleteUserAccount } = useApp();
  const [confirmInput, setConfirmInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const isConfirmed = confirmInput.trim() === 'DELETE';

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfirmed || isDeleting) return;

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      await permanentlyDeleteUserAccount(user.id);
      onClose();
      onSuccess?.();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to permanently delete user account.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-poppins">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#042419] border border-rose-500/40 shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-rose-900/90 to-rose-950 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
              <div>
                <h3 className="text-base font-black">Permanent Account Deletion</h3>
                <p className="text-[11px] text-rose-200 font-medium">Irreversible account removal (Super Admin Only)</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-rose-200 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <form onSubmit={handleDelete} className="p-5 sm:p-6 space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Target User: {user.name} ({user.role})</span>
              </div>
              <p className="text-[11px] font-medium leading-relaxed">
                You are about to permanently remove <strong className="underline">{user.email || user.name}</strong> from the system. This action CANNOT be undone and will erase:
              </p>
              <ul className="list-disc list-inside space-y-1 text-[11px] font-semibold text-rose-800 dark:text-rose-200">
                <li>User login credentials and password histories</li>
                <li>Associated active sessions and authentication tokens</li>
                <li>Profile details, staff records, or student academic data</li>
                <li>Historical audit logs will be detached and preserved</li>
              </ul>
            </div>

            <div className="space-y-1.5">
              <label className="block font-bold text-slate-700 dark:text-emerald-300">
                To confirm permanent deletion, type <span className="font-mono text-rose-500 font-black">DELETE</span> below:
              </label>
              <input
                type="text"
                value={confirmInput}
                onChange={(e) => setConfirmInput(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-rose-500/40 text-slate-900 dark:text-white font-mono font-bold text-center uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            {/* Footer Buttons */}
            <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-emerald-500/20">
              <Button variant="ghost" onClick={onClose} type="button">
                Cancel
              </Button>
              <button
                type="submit"
                disabled={!isConfirmed || isDeleting}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs shadow-lg shadow-rose-950/40 flex items-center gap-2 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Deleting...' : 'Permanently Delete User'}</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
