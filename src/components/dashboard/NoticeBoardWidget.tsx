'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { Bell, Pin, Megaphone, Calendar, FileText, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

export function NoticeBoardWidget() {
  const { currentUser, communications, announcements } = useApp();

  // Filter sent communications that target currentUser's role or ENTIRE_SCHOOL
  const relevantComms = communications.filter((c) => {
    if (c.status !== 'SENT') return false;
    if (c.recipientType === 'ENTIRE_SCHOOL') return true;
    if (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') return true;

    if (currentUser.role === 'TEACHER' && (c.recipientType === 'TEACHERS' || c.recipientType === 'PROGRAMME' || c.recipientType === 'CLASS')) return true;
    if (currentUser.role === 'PARENT' && (c.recipientType === 'PARENTS' || c.recipientType === 'PROGRAMME' || c.recipientType === 'CLASS')) return true;
    if (currentUser.role === 'STUDENT' && (c.recipientType === 'STUDENTS' || c.recipientType === 'PROGRAMME' || c.recipientType === 'CLASS')) return true;

    return false;
  });

  return (
    <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-5 shadow-lg space-y-4 font-poppins">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Megaphone className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white tracking-tight">Official Notice Board</h2>
            <p className="text-xs text-slate-500 dark:text-emerald-300/70">Verified announcements & official dispatches</p>
          </div>
        </div>

        <Link
          href="/dashboard/communication"
          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
        >
          <span>Communication Center</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="space-y-3">
        {relevantComms.length === 0 ? (
          <div className="py-8 text-center bg-slate-50 dark:bg-[#021810] rounded-2xl border border-dashed border-slate-200 dark:border-emerald-500/20 text-slate-400 dark:text-emerald-300/60 font-medium text-xs">
            No active notice board announcements at the moment.
          </div>
        ) : (
          relevantComms.slice(0, 3).map((comm) => (
            <motion.div
              key={comm.id}
              whileHover={{ scale: 1.01 }}
              className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/5 via-slate-50 to-white dark:from-emerald-950/40 dark:to-[#021810] border border-slate-200 dark:border-emerald-500/20 shadow-xs space-y-2"
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    comm.priority === 'URGENT'
                      ? 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30'
                      : comm.priority === 'IMPORTANT'
                      ? 'bg-amber-500/15 text-amber-800 dark:text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {comm.type.replace('_', ' ')}
                </span>

                <span className="text-[10px] text-slate-400 font-mono" suppressHydrationWarning>
                  {new Date(comm.createdAt).toLocaleDateString()}
                </span>
              </div>

              <h3 className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug">{comm.title}</h3>
              <p className="text-xs text-slate-600 dark:text-emerald-100/80 line-clamp-2">{comm.subject || comm.content}</p>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-emerald-500/10 text-[10px] text-slate-500 dark:text-emerald-400">
                <span className="font-medium">By: {comm.senderName}</span>
                <span className="font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-300">
                  Target: {comm.recipientType.replace('_', ' ')}
                </span>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
