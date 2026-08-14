'use client';

import React from 'react';
import { useApp } from '../../lib/context';
import { RoleSwitcher } from './RoleSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { HeaderNotificationBadge } from './HeaderNotificationBadge';
import { Menu, Calendar, Bell } from 'lucide-react';

export function Header({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}) {
  const { currentSession, currentUser, announcements } = useApp();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/95 dark:bg-[#032015]/95 backdrop-blur-md border-b border-emerald-200/80 dark:border-emerald-800/50 px-4 sm:px-6 flex items-center justify-between transition-colors duration-200 shadow-sm w-full max-w-full overflow-visible shrink-0">
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-800 dark:text-emerald-200 hover:text-emerald-950 dark:hover:text-white hover:bg-emerald-100 dark:hover:bg-emerald-800/40 rounded-xl lg:hidden transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Academic Session Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/90 border border-emerald-300/60 dark:border-emerald-700/50 text-xs font-bold text-slate-900 dark:text-white transition-colors shadow-xs shrink-0 whitespace-nowrap">
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="font-poppins">{currentSession.sessionName}</span>
          <span className="bg-emerald-600 text-white dark:bg-emerald-500/30 dark:text-emerald-300 px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase font-poppins shrink-0">
            {currentSession.activeTerm}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 shrink-0 whitespace-nowrap">
        {/* Theme Switcher for Dark/Light Mode */}
        <ThemeToggle variant="dropdown" />

        {/* Role Switcher for easy demoing */}
        <RoleSwitcher />

        {/* Live Notification Center Badge */}
        <HeaderNotificationBadge />

        {/* User Account Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-emerald-200 dark:border-emerald-800/50">
          {currentUser.avatar ? (
            <img
              src={currentUser.avatar}
              alt={currentUser.name || 'User Avatar'}
              className="w-8 h-8 rounded-full border-2 border-emerald-400/50 object-cover shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black text-xs flex items-center justify-center border-2 border-emerald-400/50 uppercase shadow-xs shrink-0">
              {(currentUser.name || 'U').substring(0, 2)}
            </div>
          )}
          <span className="hidden md:inline-block text-xs font-bold text-slate-800 dark:text-emerald-100 max-w-[120px] truncate">
            {currentUser.name}
          </span>
        </div>
      </div>
    </header>
  );
}

