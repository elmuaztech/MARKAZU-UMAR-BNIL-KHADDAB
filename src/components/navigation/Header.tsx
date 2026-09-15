'use client';

import React from 'react';
import { useApp } from '../../lib/context';
import { RoleSwitcher } from './RoleSwitcher';
import { ThemeToggle } from './ThemeToggle';
import { HeaderNotificationBadge } from './HeaderNotificationBadge';
import { SessionSwitcher } from './SessionSwitcher';
import { Menu, Bell } from 'lucide-react';

export function Header({
  mobileOpen,
  setMobileOpen,
}: {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}) {
  const { currentSession, currentUser, announcements } = useApp();

  return (
    <header className="sticky top-0 z-30 h-16 bg-white dark:bg-[#032015] border-b border-emerald-200/80 dark:border-emerald-800/50 px-2 sm:px-6 flex items-center justify-between transition-colors duration-200 shadow-sm w-full max-w-full overflow-visible shrink-0">
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 min-w-0">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 sm:p-2 text-slate-800 dark:text-emerald-200 hover:text-emerald-950 dark:hover:text-white hover:bg-emerald-100 dark:hover:bg-emerald-800/40 rounded-xl lg:hidden transition-colors shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Academic Session Switcher */}
        <SessionSwitcher />
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 whitespace-nowrap">
        {/* Theme Switcher for Dark/Light Mode */}
        <ThemeToggle variant="dropdown" />

        {/* Role Switcher for easy demoing (Desktop & Tablet only to avoid mobile header collision) */}
        <div className="hidden sm:flex">
          <RoleSwitcher />
        </div>

        {/* Live Notification Center Badge */}
        <HeaderNotificationBadge />

        {/* User Account Badge */}
        <div className="flex items-center gap-1.5 sm:gap-2 pl-1.5 sm:pl-2 border-l border-emerald-200 dark:border-emerald-800/50">
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
          <span className="hidden xl:inline-block text-xs font-bold text-slate-800 dark:text-emerald-100 max-w-[120px] truncate">
            {currentUser.name}
          </span>
        </div>
      </div>
    </header>
  );
}

