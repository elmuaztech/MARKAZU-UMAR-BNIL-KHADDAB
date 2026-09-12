'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { Bell, CheckCircle2, Pin, Archive, Trash2, ArrowLeft, Search, Filter, Sparkles, FileText } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotificationCenterPage() {
  const {
    inAppNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    pinNotification,
    archiveNotification,
    deleteNotification,
  } = useApp();

  const [filterTab, setFilterTab] = useState<'ALL' | 'UNREAD' | 'PINNED' | 'ARCHIVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredNotifs = inAppNotifications.filter((n) => {
    if (filterTab === 'UNREAD' && n.read) return false;
    if (filterTab === 'PINNED' && !n.pinned) return false;
    if (filterTab === 'ARCHIVED' && !n.isArchived) return false;
    if (filterTab !== 'ARCHIVED' && n.isArchived) return false;

    const matchesSearch =
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.body.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const unreadCount = inAppNotifications.filter((n) => !n.read && !n.isArchived).length;

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-8 font-poppins">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/communication"
            className="p-2.5 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-slate-700 dark:text-emerald-300 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Personal Notification Center</h1>
            <p className="text-xs text-slate-500 dark:text-emerald-300/70">Your central inbox for all official school communications & announcements</p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={markAllNotificationsAsRead}
            className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg flex items-center gap-2 transition-all hover:scale-105"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Mark All Read ({unreadCount})</span>
          </button>
        )}
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 shrink-0">
          {(['ALL', 'UNREAD', 'PINNED', 'ARCHIVED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilterTab(tab)}
              className={`px-3.5 sm:px-4 py-2 rounded-2xl text-xs font-black transition-all whitespace-nowrap shrink-0 ${
                filterTab === tab
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white dark:bg-[#042419] text-slate-600 dark:text-emerald-300 border border-slate-200 dark:border-emerald-500/30'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search inbox..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>
      </div>

      {/* Inbox List */}
      <div className="space-y-3">
        {filteredNotifs.length === 0 ? (
          <div className="py-12 text-center bg-white dark:bg-[#042419] rounded-3xl border border-slate-200 dark:border-emerald-500/30 text-slate-400 dark:text-emerald-300/60 font-medium text-xs">
            No notifications found matching filter.
          </div>
        ) : (
          filteredNotifs.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all space-y-3 ${
                !notif.read
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-slate-900 dark:text-white shadow-md'
                  : 'bg-white dark:bg-[#042419] border-slate-200 dark:border-emerald-500/20 text-slate-700 dark:text-emerald-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                      notif.priority === 'URGENT'
                        ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                        : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {notif.priority}
                  </span>
                  <span className="text-xs font-bold text-slate-500">From: {notif.senderName}</span>
                </div>

                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                  <span className="text-[10px] text-slate-400 font-mono">
                    {new Date(notif.createdAt).toLocaleDateString()}
                  </span>
                  <button onClick={() => pinNotification(notif.id)} className={`p-1.5 rounded-xl ${notif.pinned ? 'text-amber-500' : 'text-slate-400'}`}>
                    <Pin className="w-4 h-4" />
                  </button>
                  <button onClick={() => archiveNotification(notif.id)} className="p-1.5 rounded-xl text-slate-400 hover:text-emerald-500">
                    <Archive className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteNotification(notif.id)} className="p-1.5 rounded-xl text-slate-400 hover:text-rose-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-extrabold text-base text-slate-900 dark:text-white">{notif.title}</h3>
              <p className="text-xs text-slate-600 dark:text-emerald-100/90 leading-relaxed">{notif.body}</p>

              {notif.attachments && notif.attachments.length > 0 && (
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 flex items-center gap-3">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <div className="text-xs font-bold text-slate-800 dark:text-emerald-200">
                    {notif.attachments.map((a) => a.name).join(', ')}
                  </div>
                </div>
              )}

              {!notif.read && (
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => markNotificationAsRead(notif.id)}
                    className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Mark as Read
                  </button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
