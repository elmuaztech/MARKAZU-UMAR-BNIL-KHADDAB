'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { Clock, ArrowLeft, Send, Calendar, Trash2 } from 'lucide-react';

export default function ScheduledMessagesPage() {
  const { communications } = useApp();

  const scheduledList = communications.filter((c) => c.status === 'SCHEDULED');

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 font-poppins">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/communication"
          className="p-2.5 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-slate-700 dark:text-emerald-300 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Scheduled Messages Manager</h1>
          <p className="text-xs text-slate-500 dark:text-emerald-300/70">Overview of pending scheduled communications queued for automated future dispatch</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-6 shadow-xl space-y-4">
        {scheduledList.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-emerald-300/60 font-medium">
            No scheduled messages at the moment.
          </div>
        ) : (
          <div className="space-y-4">
            {scheduledList.map((comm) => (
              <div
                key={comm.id}
                className="p-5 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-600 dark:text-sky-400 font-extrabold text-[10px]">
                    Scheduled for: {comm.scheduledFor ? new Date(comm.scheduledFor).toLocaleString() : 'Pending'}
                  </span>
                  <h3 className="font-black text-slate-900 dark:text-white text-sm">{comm.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-emerald-200">Subject: {comm.subject}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
