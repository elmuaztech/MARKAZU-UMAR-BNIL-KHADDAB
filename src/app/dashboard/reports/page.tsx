'use client';

import React from 'react';
import { useApp } from '../../../lib/context';
import { BarChart3, TrendingUp, Download, Sparkles, Award, Users } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';

export default function ReportsPage() {
  const { students, programmes, classes } = useApp();

  const classPerformanceData = [
    { class: 'Tahfiz Halqa 1', avgScore: 89, hifzRate: 94 },
    { class: 'Tahfiz Halqa 2', avgScore: 84, hifzRate: 88 },
    { class: 'Primary 4', avgScore: 82, hifzRate: 79 },
    { class: 'Secondary 2', avgScore: 86, hifzRate: 85 },
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#042f1e] via-[#064E3B] to-[#0f5132] text-white border border-emerald-500/40 shadow-xl font-poppins">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-widest">
            <BarChart3 className="w-4 h-4 text-amber-400" /> School Analytics & Master Reporting
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">Executive Reports & Programme Metrics</h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 font-medium">
            Comparative performance, Tahfiz completion rates, and enrollment grouped by Programme.
          </p>
        </div>
      </div>

      {/* Programme Performance Overview Cards */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-4 font-poppins">
        <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" /> Programme Performance Summary
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {programmes.map((p) => {
            const pClasses = classes.filter((c) => c.programmeId === p.id || c.programmeName === p.programme_name);
            const pStudents = students.filter((s) => s.programmeId === p.id || s.programmeName === p.programme_name);

            return (
              <div key={p.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded bg-amber-500/10 uppercase">
                    {p.programme_code}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">{p.status}</span>
                </div>
                <h4 className="font-bold text-slate-900 dark:text-white">{p.programme_name}</h4>
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-emerald-200/80">
                  <span>{pClasses.length} Classes</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-300">{pStudents.length} Students</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Analytics Chart */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-4 font-poppins">
        <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-500" />
          Academic & Tahfiz Mastery by Class
        </h3>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={classPerformanceData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="class" stroke="#059669" fontSize={11} />
              <YAxis stroke="#059669" fontSize={11} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#042419',
                  borderColor: '#10b981',
                  borderRadius: '16px',
                  color: '#fff',
                }}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#059669' }} />
              <Bar dataKey="avgScore" name="Academic Score (%)" fill="#0EA5E9" radius={[8, 8, 0, 0]} />
              <Bar dataKey="hifzRate" name="Tahfiz Retention (%)" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
