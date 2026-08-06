'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { Bell, Check, Pin, Trash2, ArrowUpRight, Sparkles, ShieldAlert, FileText, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function HeaderNotificationBadge() {
  const { currentUser, inAppNotifications, markNotificationAsRead, markAllNotificationsAsRead } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  // Filter notifications relevant to currentUser
  const userNotifs = inAppNotifications.filter((n) => !n.isArchived);
  const unreadCount = userNotifs.filter((n) => !n.read).length;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-slate-700 dark:text-emerald-300 hover:text-emerald-600 dark:hover:text-white shadow-sm transition-all group"
        title="Personal Notifications Inbox"
      >
        <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-mono text-[10px] font-black animate-pulse shadow-md">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

            {/* Notification Dropdown Panel */}
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 shadow-2xl z-50 p-4 space-y-3 font-poppins text-xs"
            >
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-emerald-500/20">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-black text-slate-900 dark:text-white text-sm">Notifications Inbox</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 font-extrabold text-[10px]">
                      {unreadCount} Unread
                    </span>
                  )}
                </div>

                {unreadCount > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Mark All Read
                  </button>
                )}
              </div>

              {/* Notification Items List */}
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {userNotifs.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 dark:text-emerald-300/60 font-medium">
                    No new notifications in your inbox.
                  </div>
                ) : (
                  userNotifs.slice(0, 5).map((notif) => (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationAsRead(notif.id)}
                      className={`p-3 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${
                        !notif.read
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-900 dark:text-white'
                          : 'bg-slate-50 dark:bg-[#021810] border-slate-200 dark:border-emerald-500/10 text-slate-600 dark:text-emerald-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            notif.priority === 'URGENT'
                              ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              : notif.priority === 'IMPORTANT'
                              ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                              : 'bg-sky-500/20 text-sky-600 dark:text-sky-400'
                          }`}
                        >
                          {notif.priority}
                        </span>

                        <span className="text-[10px] text-slate-400 font-mono" suppressHydrationWarning>
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="font-bold text-slate-900 dark:text-white text-xs leading-snug">{notif.title}</p>
                      <p className="text-[11px] text-slate-600 dark:text-emerald-200/75 line-clamp-2">{notif.body}</p>

                      {notif.attachments && notif.attachments.length > 0 && (
                        <div className="pt-1 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                          <FileText className="w-3 h-3" />
                          <span>{notif.attachments.length} Document Attachment(s)</span>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-emerald-500/20 text-center">
                <Link
                  href="/dashboard/communication/notifications"
                  onClick={() => setIsOpen(false)}
                  className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                >
                  <span>Open Notification Center</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
