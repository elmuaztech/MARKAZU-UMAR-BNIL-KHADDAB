'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { PortalTheme } from '@/components/ui/PortalTheme';
import { PortalHeroBanner } from '@/components/ui/PortalHeroBanner';
import { AttendanceRegister } from '@/components/attendance/AttendanceRegister';
import { AttendanceFilterExplorer } from '@/components/attendance/AttendanceFilterExplorer';
import { CalendarCheck, Filter, Users } from 'lucide-react';

export default function AttendancePage() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'REGISTER' | 'EXPLORER'>('REGISTER');

  const isAdmin = currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN';
  const isHeadmaster = currentUser.role === 'HEADMASTER';

  return (
    <PortalTheme>
      <div className="space-y-6 font-poppins">
        {/* Global Hero Banner */}
        <PortalHeroBanner
          title="Enterprise Attendance & Punctuality Engine"
          description="Scoped daily class attendance, bulk marking tools, multi-dimensional filtering (Day, Month, Week, Year, Term, Session), and automated parent notifications."
          badgeText="Attendance Engine"
          badgeIcon={CalendarCheck}
        />

        {/* Tab Navigation - Accessible to Teachers, Headmasters & Admins */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1.5 bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-2xl w-full sm:w-fit shadow-sm">
          <button
            onClick={() => setActiveTab('REGISTER')}
            className={`px-4 py-2.5 sm:py-2 rounded-xl font-black text-xs flex items-center justify-center sm:justify-start gap-2 transition-all ${
              activeTab === 'REGISTER'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-600 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-emerald-950'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Mark Daily Register</span>
          </button>

          <button
            onClick={() => setActiveTab('EXPLORER')}
            className={`px-4 py-2.5 sm:py-2 rounded-xl font-black text-xs flex items-center justify-center sm:justify-start gap-2 transition-all text-center sm:text-left ${
              activeTab === 'EXPLORER'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-600 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-emerald-950'
            }`}
          >
            <Filter className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {isAdmin
                ? 'Attendance Filter Explorer & Admin Override'
                : isHeadmaster
                ? 'Section Attendance Records & Filters'
                : 'My Class Attendance Records & Filters'}
            </span>
          </button>
        </div>

        {/* Active Component */}
        {activeTab === 'REGISTER' ? <AttendanceRegister /> : <AttendanceFilterExplorer />}
      </div>
    </PortalTheme>
  );
}
