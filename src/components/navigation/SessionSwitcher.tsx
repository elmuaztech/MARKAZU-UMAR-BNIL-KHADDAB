'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { Calendar, ChevronDown, Check, Plus, Sparkles, X, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function SessionSwitcher() {
  const {
    currentSession,
    currentUser,
    sessions,
    selectedSessionId,
    setSelectedSessionId,
    fetchSessions,
    createSession,
    activateSession,
    notify,
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [newActiveTerm, setNewActiveTerm] = useState('Term 1');
  const [setAsCurrent, setSetAsCurrent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#session-switcher-dropdown')) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('click', handleClickOutside);
    }
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isOpen]);

  const activeSessionList = sessions && sessions.length > 0 ? sessions : [currentSession];
  const activeSelected = activeSessionList.find((s) => s.id === selectedSessionId) || currentSession;

  const handleSelectSession = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setIsOpen(false);
    notify({
      type: 'info',
      title: 'Academic Session Switched',
      message: `Viewing records for ${activeSessionList.find((s) => s.id === sessionId)?.sessionName || 'selected session'}.`,
    });
  };

  const handleCreateSessionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName.trim()) {
      notify({ type: 'error', title: 'Input Required', message: 'Please enter a session name (e.g. 2027/2028).' });
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await createSession(newSessionName.trim(), newActiveTerm, setAsCurrent);
      if (created) {
        notify({
          type: 'success',
          title: 'Session Created',
          message: `Academic Session "${created.sessionName}" successfully added.`,
        });
        setShowCreateModal(false);
        setNewSessionName('');
        setNewActiveTerm('Term 1');
        setSetAsCurrent(false);
      }
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Session Creation Failed',
        message: err.message || 'Could not create academic session.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canManageSessions = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN';

  return (
    <div id="session-switcher-dropdown" className="relative shrink-0">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/90 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-300/60 dark:border-emerald-700/50 text-xs font-bold text-slate-900 dark:text-white transition-all shadow-xs shrink-0 max-w-[110px] sm:max-w-[180px] xl:max-w-[280px]"
        title="Switch Academic Session"
      >
        <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="truncate font-poppins">{activeSelected?.sessionName || 'Session'}</span>
        <span className="hidden md:inline-block bg-emerald-600 text-white dark:bg-emerald-500/30 dark:text-emerald-300 px-1.5 py-0.2 rounded-md text-[10px] font-extrabold uppercase shrink-0">
          {activeSelected?.activeTerm || 'Term 1'}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="fixed sm:absolute inset-x-2 sm:inset-x-auto left-2 sm:left-0 top-16 sm:top-full mt-1 sm:mt-2 w-auto sm:w-80 max-w-[calc(100vw-1rem)] rounded-2xl bg-white dark:bg-[#032015] border border-emerald-500/30 shadow-2xl z-50 overflow-hidden font-poppins"
          >
            <div className="p-3 bg-gradient-to-r from-emerald-900 to-[#021810] text-white border-b border-emerald-500/20 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-emerald-300">Academic Session</p>
                <p className="text-xs font-bold">Select Active Record Scope</p>
              </div>
              {canManageSessions && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setShowCreateModal(true);
                  }}
                  className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold flex items-center gap-1 transition-all"
                  title="Create New Academic Session"
                >
                  <Plus className="w-3 h-3" />
                  <span>New Session</span>
                </button>
              )}
            </div>

            {/* List of Sessions */}
            <div className="p-2 max-h-64 overflow-y-auto divide-y divide-emerald-500/10 text-xs">
              {activeSessionList.map((session) => {
                const isSelected = (selectedSessionId || currentSession.id) === session.id;
                return (
                  <div
                    key={session.id}
                    onClick={() => handleSelectSession(session.id)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-emerald-500/15 border border-emerald-500/40 text-emerald-900 dark:text-white font-bold'
                        : 'hover:bg-emerald-500/5 text-slate-700 dark:text-gray-200'
                    }`}
                  >
                    <div className="space-y-0.5 truncate pr-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs">{session.sessionName}</span>
                        {session.isCurrent && (
                          <span className="px-1.5 py-0.2 rounded-full bg-emerald-600 text-white text-[9px] font-extrabold uppercase">
                            Current
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-emerald-400/80">Active: {session.activeTerm}</p>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
                  </div>
                );
              })}
            </div>

            {/* Footer Notice */}
            <div className="p-2.5 bg-slate-50 dark:bg-[#021810] border-t border-emerald-500/20 text-[10px] text-slate-500 dark:text-emerald-300/70 text-center">
              Historical records are separated by academic session.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal: Create Academic Session */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm font-poppins">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#042419] border border-emerald-500/30 shadow-2xl overflow-hidden"
            >
              <div className="p-5 bg-gradient-to-r from-emerald-950 via-[#042f1e] to-emerald-900 text-white border-b border-emerald-500/30 flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" /> Create Academic Session
                  </h3>
                  <p className="text-xs text-emerald-200/80">Add a new academic session to the database</p>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-emerald-300 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateSessionSubmit} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                    Academic Session Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    placeholder="e.g. 2027/2028 or 1448/1449 AH (2027/2028 AD)"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 font-semibold"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-emerald-400/70 mt-1">
                    Enter the official school academic session identifier.
                  </p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                    Active Term
                  </label>
                  <select
                    value={newActiveTerm}
                    onChange={(e) => setNewActiveTerm(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-hidden focus:border-emerald-500 font-semibold"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="setAsCurrent"
                    checked={setAsCurrent}
                    onChange={(e) => setSetAsCurrent(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 dark:bg-[#021810] border-slate-300 dark:border-emerald-500/30"
                  />
                  <label htmlFor="setAsCurrent" className="font-semibold text-slate-700 dark:text-emerald-200 cursor-pointer">
                    Set as Current Active Session
                  </label>
                </div>

                <div className="pt-3 border-t border-emerald-500/20 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 dark:border-emerald-500/30 text-slate-700 dark:text-gray-300 font-bold hover:bg-slate-100 dark:hover:bg-emerald-950/40 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-900/30 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Creating...' : 'Create Session'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
