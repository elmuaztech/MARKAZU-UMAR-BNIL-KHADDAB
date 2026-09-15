'use client';

import React, { useState, useEffect, useRef } from 'react';
import { syncEngine, SyncEngineState } from '@/lib/db/syncEngine';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  CheckCircle2,
  AlertTriangle,
  Server,
  CloudUpload,
} from 'lucide-react';

export function SyncStatusBadge() {
  const [syncState, setSyncState] = useState<SyncEngineState>(syncEngine.getState());
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleManualSync = async () => {
    if (!syncState.isOnline || syncState.isSyncing) return;
    await syncEngine.processSyncQueue();
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Not synced yet';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all shadow-xs border ${
          !syncState.isOnline
            ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            : syncState.isSyncing
            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 animate-pulse'
            : syncState.pendingCount > 0
            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30 hover:bg-blue-500/20'
            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/15'
        }`}
        title="Sync & Offline Status"
      >
        {syncState.isSyncing ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-500" />
            <span className="hidden md:inline">Syncing...</span>
          </>
        ) : !syncState.isOnline ? (
          <>
            <WifiOff className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Offline</span>
            {syncState.pendingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px] font-bold">
                {syncState.pendingCount}
              </span>
            )}
          </>
        ) : syncState.pendingCount > 0 ? (
          <>
            <CloudUpload className="w-3.5 h-3.5 text-blue-500" />
            <span className="hidden md:inline">{syncState.pendingCount} Pending</span>
          </>
        ) : (
          <>
            <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden md:inline">Online</span>
          </>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-white dark:bg-[#042419] border border-emerald-200 dark:border-emerald-800/60 shadow-2xl z-50 p-4 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex items-center justify-between pb-3 border-b border-emerald-100 dark:border-emerald-800/40">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Offline & Sync Engine
              </span>
            </div>
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                syncState.isOnline
                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
              }`}
            >
              {syncState.isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className="py-3 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-slate-600 dark:text-emerald-200/80">
              <span>Local Storage:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                IndexedDB (Dexie.js)
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-emerald-200/80">
              <span>Cloud Server:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <Server className="w-3 h-3 text-emerald-500" />
                PostgreSQL (Hostinger)
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-emerald-200/80">
              <span>Pending Sync Queue:</span>
              <span
                className={`font-bold ${
                  syncState.pendingCount > 0
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {syncState.pendingCount} record{syncState.pendingCount === 1 ? '' : 's'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-emerald-200/80">
              <span>Last Server Sync:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {formatLastSync(syncState.lastSyncTime)}
              </span>
            </div>

            {syncState.lastError && (
              <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-start gap-1.5 text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span className="line-clamp-2">{syncState.lastError}</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-emerald-100 dark:border-emerald-800/40">
            <button
              onClick={handleManualSync}
              disabled={!syncState.isOnline || syncState.isSyncing}
              className={`w-full py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                !syncState.isOnline
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : syncState.isSyncing
                  ? 'bg-emerald-500/20 text-emerald-600 cursor-wait'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs hover:shadow-md'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncState.isSyncing ? 'animate-spin' : ''}`} />
              {syncState.isSyncing
                ? 'Syncing with Server...'
                : !syncState.isOnline
                ? 'Auto-Syncs When Online'
                : 'Sync Now with Server'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
