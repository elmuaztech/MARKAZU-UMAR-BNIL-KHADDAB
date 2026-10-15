'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { ShieldAlert, ArrowLeft, UserCheck, AlertTriangle } from 'lucide-react';

import { useApp } from '@/lib/context';
import { User } from '@/types';

interface ImpersonationState {
  isImpersonated: boolean;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    avatar?: string | null;
    assignedProgrammeId?: string | null;
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
  const { currentUser, setCurrentUser, users } = useApp();
  const [state, setState] = useState<ImpersonationState | null>(null);
  const [isExiting, setIsExiting] = useState(false);
  const pathname = usePathname();

  const checkImpersonation = async () => {
    try {
      const res = await fetch('/api/auth/impersonate', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (data.isImpersonated && data.user) {
          setState(data);

          // Synchronize client-side currentUser if currently still on Super Admin or out of sync
          if (currentUser.id !== data.user.id || currentUser.role !== data.user.role) {
            try {
              const currentSaved = localStorage.getItem('markazu_current_user');
              const existingBackup = localStorage.getItem('markazu_superadmin_backup');
              if (!existingBackup && currentSaved) {
                const parsed = JSON.parse(currentSaved);
                if (parsed.role === 'SUPER_ADMIN' || !parsed.isImpersonated) {
                  localStorage.setItem('markazu_superadmin_backup', currentSaved);
                }
              } else if (!existingBackup && currentUser && currentUser.role === 'SUPER_ADMIN') {
                localStorage.setItem('markazu_superadmin_backup', JSON.stringify(currentUser));
              }
            } catch {}

            const matched = users.find(
              (u) =>
                u.id === data.user.id ||
                (data.user.email && u.email?.toLowerCase() === data.user.email.toLowerCase())
            );

            const impUser: User = {
              ...(matched || {}),
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: data.user.role as any,
              status: (matched?.status || 'ACTIVE') as any,
              avatar: data.user.avatar || (matched as any)?.avatar || undefined,
              assignedProgrammeId: data.user.assignedProgrammeId || (matched as any)?.assignedProgrammeId || undefined,
              assignedProgrammeName: data.user.assignedProgrammeName || (matched as any)?.assignedProgrammeName || undefined,
              isImpersonated: true,
            };

            try {
              localStorage.setItem('markazu_current_user', JSON.stringify(impUser));
              localStorage.setItem('markazu_impersonated_user', JSON.stringify(impUser));
            } catch {}

            setCurrentUser(impUser);
          }
        } else {
          setState(null);
          // If server reports impersonation is not active, restore Super Admin if backup exists
          try {
            const backup = localStorage.getItem('markazu_superadmin_backup');
            if (backup) {
              const restored = JSON.parse(backup);
              localStorage.removeItem('markazu_superadmin_backup');
              localStorage.removeItem('markazu_impersonated_user');
              localStorage.setItem('markazu_current_user', JSON.stringify(restored));
              setCurrentUser(restored);
            }
          } catch {}
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
        // Clear local storage overrides and restore Super Admin backup
        try {
          localStorage.removeItem('markazu_impersonated_user');
          const backup = localStorage.getItem('markazu_superadmin_backup');
          if (backup) {
            const restored = JSON.parse(backup);
            localStorage.setItem('markazu_current_user', JSON.stringify(restored));
            localStorage.removeItem('markazu_superadmin_backup');
            setCurrentUser(restored);
          }
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
