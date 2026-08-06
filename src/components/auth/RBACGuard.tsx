'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { hasPageAccess } from '@/lib/rbac';
import { ShieldAlert, ArrowLeft, Lock, LayoutDashboard } from 'lucide-react';
import { PortalTheme } from '@/components/ui/PortalTheme';

export function RBACGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { currentUser } = useApp();

  const isAllowed = hasPageAccess(currentUser.role, pathname);

  if (!isAllowed) {
    return (
      <PortalTheme>
        <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 font-poppins">
          <div className="max-w-lg w-full bg-white dark:bg-[#042419] border border-rose-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
            {/* Background Glow */}
            <div className="absolute -top-12 -right-12 w-40 h-40 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="w-16 h-16 rounded-3xl bg-rose-500/10 text-rose-500 border border-rose-500/20 flex items-center justify-center mx-auto shadow-md">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wide">
                <Lock className="w-3.5 h-3.5" />
                <span>Restricted Module Security Policy</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Access Denied / غير مصرح بالدخول
              </h2>
              <p className="text-xs text-slate-600 dark:text-emerald-200/80 leading-relaxed max-w-sm mx-auto">
                Your logged-in role (<span className="font-bold text-slate-900 dark:text-white uppercase">{currentUser.role}</span>) does not have authorization to access the requested route:
              </p>
              <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 text-xs font-mono font-bold text-rose-600 dark:text-rose-300">
                {pathname}
              </div>
            </div>

            <div className="pt-2 flex items-center justify-center gap-3">
              <Link
                href="/dashboard"
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/30 flex items-center gap-2 transition-all"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Return to Main Dashboard</span>
              </Link>
            </div>
          </div>
        </div>
      </PortalTheme>
    );
  }

  return <>{children}</>;
}
