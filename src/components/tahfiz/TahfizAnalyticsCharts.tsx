'use client';

import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Award,
  BookOpen,
  PieChart,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/lib/context';

export function TahfizAnalyticsCharts() {
  const [timeframe, setTimeframe] = useState<'WEEKLY' | 'MONTHLY' | 'TERM' | 'ACADEMIC_YEAR'>('WEEKLY');

  // Simulated visual chart data
  const chartData = {
    WEEKLY: [
      { label: 'Mon', pages: 1.5, target: 2.0, rating: 5 },
      { label: 'Tue', pages: 2.0, target: 2.0, rating: 4 },
      { label: 'Wed', pages: 1.0, target: 2.0, rating: 5 },
      { label: 'Thu', pages: 2.5, target: 2.0, rating: 5 },
      { label: 'Fri', pages: 2.0, target: 2.0, rating: 4 },
      { label: 'Sat', pages: 1.5, target: 2.0, rating: 5 },
    ],
    MONTHLY: [
      { label: 'Week 1', pages: 8.5, target: 10.0, rating: 4.8 },
      { label: 'Week 2', pages: 10.0, target: 10.0, rating: 5.0 },
      { label: 'Week 3', pages: 9.0, target: 10.0, rating: 4.5 },
      { label: 'Week 4', pages: 11.5, target: 10.0, rating: 4.9 },
    ],
    TERM: [
      { label: 'Month 1', pages: 38.0, target: 40.0, rating: 4.7 },
      { label: 'Month 2', pages: 42.0, target: 40.0, rating: 4.9 },
      { label: 'Month 3', pages: 45.0, target: 40.0, rating: 5.0 },
    ],
    ACADEMIC_YEAR: [
      { label: 'Term 1', pages: 125.0, target: 120.0, rating: 4.8 },
      { label: 'Term 2', pages: 138.0, target: 120.0, rating: 4.9 },
      { label: 'Term 3', pages: 140.0, target: 120.0, rating: 5.0 },
    ],
  }[timeframe];

  return (
    <div className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 space-y-6 shadow-xl font-poppins">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-emerald-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <BarChart3 className="w-4 h-4" />
            <span>Tahfiz Memorization Analytics & Historical Progress</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Visual Hifz Rate & Quality Performance
          </h3>
        </div>

        {/* Timeframe Toggle Buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#021810] rounded-2xl border border-slate-200 dark:border-emerald-500/20">
          {(['WEEKLY', 'MONTHLY', 'TERM', 'ACADEMIC_YEAR'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-[10px] uppercase transition-all ${
                timeframe === t
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-600 dark:text-emerald-300 hover:bg-slate-200 dark:hover:bg-emerald-950'
              }`}
            >
              {t.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Bar Chart Visualization */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-emerald-300/80">
          <span>Pages Memorized vs Target ({timeframe})</span>
          <span>Target line: 100%</span>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-3 items-end h-48 pt-6 border-b border-slate-200 dark:border-emerald-500/20 pb-2">
          {chartData.map((item, idx) => {
            const heightPercent = Math.min(100, Math.round((item.pages / (item.target * 1.3)) * 100));

            return (
              <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                <div className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.pages} pgs
                </div>
                <div className="w-full bg-slate-100 dark:bg-emerald-950/40 rounded-t-xl h-full flex items-end overflow-hidden p-1">
                  <div
                    className="w-full bg-gradient-to-t from-emerald-700 via-emerald-600 to-emerald-400 rounded-t-lg transition-all duration-500 group-hover:brightness-110"
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <div className="text-[10px] font-extrabold text-slate-700 dark:text-emerald-200">
                  {item.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quality Ratings Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-bold">
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-300 uppercase">Average Tajweed Rating</div>
            <div className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">4.9 / 5.0 ⭐</div>
          </div>
          <Award className="w-6 h-6 text-emerald-500" />
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-amber-700 dark:text-amber-300 uppercase">Sabki Retention Rate</div>
            <div className="text-base font-black text-amber-600 dark:text-amber-400 mt-0.5">96.5% Strong</div>
          </div>
          <TrendingUp className="w-6 h-6 text-amber-500" />
        </div>

        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-purple-700 dark:text-purple-300 uppercase">Manzil Cycle Pace</div>
            <div className="text-base font-black text-purple-700 dark:text-purple-300 mt-0.5">1 Juz / Day</div>
          </div>
          <BookOpen className="w-6 h-6 text-purple-500" />
        </div>
      </div>
    </div>
  );
}
