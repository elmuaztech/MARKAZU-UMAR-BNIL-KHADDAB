'use client';

import React, { useState } from 'react';
import {
  MessageSquare,
  X,
  ExternalLink,
  CheckCircle2,
  Send,
  Users,
  Search,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  CheckSquare,
  Square,
  Zap,
} from 'lucide-react';
import { WhatsAppPayload } from '@/lib/whatsappUtils';

interface WhatsAppBatchModalProps {
  title: string;
  subtitle: string;
  payloads: WhatsAppPayload[];
  onClose: () => void;
  onDispatchComplete?: () => void;
}

export function WhatsAppBatchModal({
  title,
  subtitle,
  payloads,
  onClose,
  onDispatchComplete,
}: WhatsAppBatchModalProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sentStatusMap, setSentStatusMap] = useState<Record<string, boolean>>({});
  const [selectedParentIds, setSelectedParentIds] = useState<Set<string>>(() => {
    return new Set(payloads.map((p) => p.parentId));
  });
  const [currentIndex, setCurrentIndex] = useState<number>(0);

  const filteredPayloads = payloads.filter(
    (p) =>
      p.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.parentPhone.includes(searchTerm) ||
      p.wardNames.some((w) => w.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Selected payloads within current filter
  const selectedPayloads = filteredPayloads.filter((p) => selectedParentIds.has(p.parentId));
  const isAllSelected = filteredPayloads.length > 0 && selectedPayloads.length === filteredPayloads.length;

  const totalSent = Object.values(sentStatusMap).filter(Boolean).length;
  const progressPercent = payloads.length > 0 ? Math.round((totalSent / payloads.length) * 100) : 0;

  const toggleSelectAll = () => {
    if (isAllSelected) {
      const next = new Set(selectedParentIds);
      filteredPayloads.forEach((p) => next.delete(p.parentId));
      setSelectedParentIds(next);
    } else {
      const next = new Set(selectedParentIds);
      filteredPayloads.forEach((p) => next.add(p.parentId));
      setSelectedParentIds(next);
    }
  };

  const toggleSelectParent = (parentId: string) => {
    const next = new Set(selectedParentIds);
    if (next.has(parentId)) {
      next.delete(parentId);
    } else {
      next.add(parentId);
    }
    setSelectedParentIds(next);
  };

  const handleSendSingle = (payload: WhatsAppPayload) => {
    setSentStatusMap((prev) => ({ ...prev, [payload.parentId]: true }));
    window.open(payload.whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  const handleLaunchNextSelected = () => {
    if (selectedPayloads.length === 0) return;
    const current = selectedPayloads[currentIndex] || selectedPayloads[0];
    handleSendSingle(current);

    if (currentIndex < selectedPayloads.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  React.useEffect(() => {
    const handlePopState = () => {
      onClose();
    };

    try {
      window.history.pushState({ modalOpen: true }, '');
    } catch {}

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto font-poppins">
      <div className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-2xl sm:rounded-3xl w-full max-w-4xl shadow-2xl overflow-y-auto flex flex-col max-h-[85vh] sm:max-h-[88vh] scrollbar-thin scrollbar-thumb-emerald-600">
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black">{title}</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[10px]">
                  WhatsApp Gateway
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">{subtitle}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress & Quick Batch Actions Bar */}
        <div className="p-5 bg-slate-50 dark:bg-[#021810] border-b border-slate-200 dark:border-emerald-500/20 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-emerald-100">
                <Users className="w-4 h-4 text-emerald-500" />
                <span>
                  {totalSent} of {payloads.length} Parent WhatsApp Messages Sent ({progressPercent}%)
                </span>
              </div>
              <div className="w-full sm:w-64 h-2 bg-slate-200 dark:bg-emerald-950 rounded-full overflow-hidden mt-1.5">
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleLaunchNextSelected}
                disabled={selectedPayloads.length === 0}
                className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
              >
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>
                  Send Next Selected ({currentIndex + 1}/{selectedPayloads.length})
                </span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Box & Multi-Select Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-200 dark:border-emerald-500/20">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search parent name, phone, or ward name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Select All Toggle Checkbox */}
            <div
              onClick={toggleSelectAll}
              className="px-4 py-2.5 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 cursor-pointer flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-emerald-100 hover:border-emerald-500 shrink-0"
            >
              {isAllSelected ? (
                <CheckSquare className="w-4 h-4 text-emerald-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All Parents ({selectedPayloads.length}/{filteredPayloads.length})</span>
            </div>
          </div>
        </div>

        {/* Security & Strict Isolation Notice */}
        <div className="px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
          <span>
            Multi-Parent Selector Active: Check multiple parents below to batch dispatch WhatsApp messages only to selected parent accounts.
          </span>
        </div>

        {/* Payload Recipient Cards List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {filteredPayloads.length > 0 ? (
            filteredPayloads.map((payload, index) => {
              const isSent = !!sentStatusMap[payload.parentId];
              const isChecked = selectedParentIds.has(payload.parentId);
              const isSelectedNext = selectedPayloads[currentIndex]?.parentId === payload.parentId;

              return (
                <div
                  key={payload.parentId}
                  className={`p-5 rounded-2xl border transition-all flex items-start gap-4 ${
                    isSelectedNext
                      ? 'bg-emerald-500/10 border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/30'
                      : isChecked
                      ? 'bg-white dark:bg-[#042419] border-emerald-500/40 shadow-sm'
                      : 'bg-slate-50 dark:bg-emerald-950/20 border-slate-200 dark:border-emerald-900/40 opacity-60'
                  }`}
                >
                  {/* Parent Checkbox Selector */}
                  <button
                    onClick={() => toggleSelectParent(payload.parentId)}
                    className="mt-1 p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-emerald-900/40 transition-colors"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  <div className="flex-1 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {payload.parentName}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-emerald-950 font-mono text-[10px] text-slate-600 dark:text-emerald-300">
                          📱 {payload.parentPhone}
                        </span>
                        {isSent && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Dispatched
                          </span>
                        )}
                      </div>

                      <div className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                        Assigned Ward(s): {payload.wardNames.join(', ')}
                      </div>

                      <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/30 text-[11px] text-slate-700 dark:text-emerald-200 font-sans whitespace-pre-line leading-relaxed max-h-36 overflow-y-auto">
                        {payload.messageText}
                      </div>
                    </div>

                    <button
                      onClick={() => handleSendSingle(payload)}
                      className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 shrink-0 transition-all ${
                        isSent
                          ? 'bg-slate-200 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 hover:bg-slate-300'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/20 hover:scale-105'
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{isSent ? 'Resend WhatsApp' : 'Send via WhatsApp'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-12 text-center text-slate-400 font-bold text-xs space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-emerald-800" />
              <div>No parent recipients match your filter search.</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50 dark:bg-[#021810] border-t border-slate-200 dark:border-emerald-500/20 flex items-center justify-between text-xs font-bold">
          <div className="text-slate-500 dark:text-emerald-300/70">
            Selected: {selectedPayloads.length} parent accounts ready for WhatsApp dispatch.
          </div>

          <button
            onClick={() => {
              if (onDispatchComplete) onDispatchComplete();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 dark:bg-emerald-900 dark:hover:bg-emerald-800 text-white font-extrabold transition-all"
          >
            Done / Close Gateway
          </button>
        </div>
      </div>
    </div>
  );
}
