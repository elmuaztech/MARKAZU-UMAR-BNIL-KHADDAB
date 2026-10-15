'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldAlert, ArrowLeft, UserCheck, AlertTriangle } from 'lucide-react';

interface ImpersonationState {
  isImpersonated: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    assignedProgrammeName?: string | null;
  };
  impersonatedBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

export function ImpersonationBanner() {
  const [state, setState] = useState<ImpersonationState | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const pathname = usePathname();

  const checkImpersonation = async () => {
    try {
      const res = await fetch('/api/auth/impersonate', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.isImpersonated) {
          setState(data);
        } else {
          setState(null);
        }
      } else {
        setState(null);
      }
    } catch {
      setState(null);
    }
  };

  useEffect(() => {
    checkImpersonation();
  }, [pathname]);

  const handleExit = async () => {
    try {
      setIsExiting(true);
      const res = await fetch('/api/auth/impersonate/exit', {
        method: 'POST',
      });
      if (res.ok) {
        // Clear local storage overrides if any
        try {
          localStorage.removeItem('markazu_impersonated_user');
        } catch {}

        // Hard refresh and redirect back to Super Admin dashboard
        window.location.href = '/dashboard';
      }
    } catch (err) {
      console.error('Failed to exit impersonation:', err);
    } finally {
      setIsExiting(false);
    }
  };

  if (!state || !state.isImpersonated) {
    return null;
  }

  return (
    <div
      role="alert"
      aria-label="Super Admin Impersonation Notice"
      className="sticky top-0 z-[9999] w-full bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 text-amber-100 border-b-2 border-amber-500 shadow-2xl px-3 sm:px-6 py-2.5 transition-all text-xs selection:bg-amber-500 selection:text-black"
    >
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/40">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="font-black text-amber-300 uppercase tracking-wider text-[10px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                Impersonation Mode Active
              </span>
              <span className="font-bold text-white text-xs truncate">
                Viewing as: {state.user?.name}
              </span>
              <span className="text-[11px] text-amber-200/80 font-mono">
                ({state.user?.role})
              </span>
            </div>

            <div className="text-[10px] text-amber-200/70 truncate mt-0.5 flex flex-wrap items-center gap-x-2">
              <span>Account: {state.user?.email}</span>
              {state.user?.assignedProgrammeName && (
                <>
                  <span>•</span>
                  <span>Programme: {state.user.assignedProgrammeName}</span>
                </>
              )}
              {state.impersonatedBy?.name && (
                <>
                  <span>•</span>
                  <span>Authorized Operator: Super Admin {state.impersonatedBy.name}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={handleExit}
          disabled={isExiting}
          className="self-stretch sm:self-auto shrink-0 flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-slate-950 font-black shadow-md transition-all hover:scale-[1.02] text-xs whitespace-nowrap cursor-pointer disabled:opacity-60"
        >
          <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{isExiting ? 'Restoring Context...' : 'Return to Super Admin'}</span>
        </button>
      </div>
    </div>
  );
}
