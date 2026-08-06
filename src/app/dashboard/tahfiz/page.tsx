'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { PortalTheme } from '@/components/ui/PortalTheme';
import { PortalHeroBanner } from '@/components/ui/PortalHeroBanner';
import { TahfizTracker } from '@/components/tahfiz/TahfizTracker';
import { TahfizAnalyticsCharts } from '@/components/tahfiz/TahfizAnalyticsCharts';
import { BookOpen, BarChart3, Award, Sparkles } from 'lucide-react';

export default function TahfizPage() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'TRACKER' | 'ANALYTICS'>('TRACKER');

  return (
    <PortalTheme>
      <div className="space-y-6 font-poppins">
        <PortalHeroBanner
          title="Tahfiz Progress Tracking & Analytics Engine"
          description="Daily Hifz, Sabki, and Manzil logging, automated Juz progress & completion percentage calculations, and historical visual analytics."
          badgeText="30-Juz Qur'an Engine"
          badgeIcon={BookOpen}
        />

        {/* Tab Selector Bar */}
        <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-2xl w-fit shadow-sm">
          <button
            onClick={() => setActiveTab('TRACKER')}
            className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${
              activeTab === 'TRACKER'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-600 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-emerald-950'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Daily Hifz & Revision Tracker</span>
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`px-4 py-2 rounded-xl font-black text-xs flex items-center gap-2 transition-all ${
              activeTab === 'ANALYTICS'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                : 'text-slate-600 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-emerald-950'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-emerald-400" />
            <span>Visual Performance Analytics</span>
          </button>
        </div>

        {/* Active Tab View */}
        {activeTab === 'TRACKER' ? <TahfizTracker /> : <TahfizAnalyticsCharts />}
      </div>
    </PortalTheme>
  );
}
