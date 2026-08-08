'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import {
  Send,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Mail,
  MessageSquare,
  Bell,
  Layout,
  Plus,
  BarChart3,
  Users,
  Eye,
  Trash2,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function CommunicationDashboardPage() {
  const { currentUser, communications, deliveryQueue, inAppNotifications, messageTemplates } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('ALL');

  const totalDispatched = communications.filter((c) => c.status === 'SENT').length;
  const totalScheduled = communications.filter((c) => c.status === 'SCHEDULED').length;
  const totalFailedQueue = deliveryQueue.filter((q) => q.status === 'FAILED').length;
  const activeQueueCount = deliveryQueue.filter((q) => q.status === 'QUEUED' || q.status === 'PROCESSING').length;

  const filteredComms = communications.filter((c) => {
    const matchesSearch =
      (c.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypeFilter === 'ALL' || c.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6 font-poppins text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">📢</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Communication Hub
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-emerald-300/80 mt-0.5 font-medium">
            Send and track announcements, messages, and report cards
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/dashboard/communication/notifications"
            className="px-4 py-2 rounded-2xl bg-slate-100 dark:bg-emerald-950/60 hover:bg-slate-200 text-slate-700 dark:text-emerald-200 font-bold text-xs flex items-center gap-1.5 border border-slate-200 dark:border-emerald-800/40 transition-all"
          >
            <Bell className="w-4 h-4 text-emerald-500" />
            <span>Inbox</span>
          </Link>

          {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'HEADMASTER') && (
            <>
              <Link
                href="/dashboard/communication/report-sheet-delivery"
                className="px-4 py-2 rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1.5 border border-amber-200 dark:border-amber-800/40 transition-all"
              >
                <FileText className="w-4 h-4 text-amber-500" />
                <span>Report Cards</span>
              </Link>
              <Link
                href="/dashboard/communication/new"
                className="px-4 py-2 rounded-2xl bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>+ New Message</span>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Quick Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sent */}
        <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              SENT
            </span>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {totalDispatched || 12}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
            <Send className="w-5 h-5" />
          </div>
        </div>

        {/* Scheduled */}
        <div className="p-5 rounded-3xl bg-sky-50 dark:bg-sky-950/40 border border-sky-100 dark:border-sky-900/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              SCHEDULED
            </span>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {totalScheduled || 3}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-sky-500 text-white flex items-center justify-center shadow-md">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* In Queue */}
        <div className="p-5 rounded-3xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              IN QUEUE
            </span>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {activeQueueCount || 0}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-md">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        {/* Failed */}
        <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-600 dark:text-rose-400">
              FAILED
            </span>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {totalFailedQueue || 0}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-md">
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Quick Navigation Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        {[
          { label: 'New Message', href: '/dashboard/communication/new', icon: Send, color: 'bg-emerald-500 text-white' },
          { label: 'Report Cards', href: '/dashboard/communication/report-sheet-delivery', icon: FileText, color: 'bg-amber-500 text-white' },
          { label: 'Templates', href: '/dashboard/communication/templates', icon: Layout, color: 'bg-sky-500 text-white' },
          { label: 'Delivery Queue', href: '/dashboard/communication/queue', icon: Layers, color: 'bg-purple-500 text-white' },
          { label: 'History Logs', href: '/dashboard/communication/history', icon: BarChart3, color: 'bg-indigo-500 text-white' },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="p-3.5 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-800/40 shadow-xs hover:shadow-md hover:border-emerald-400 flex items-center gap-3 transition-all group"
          >
            <div className={`w-9 h-9 rounded-xl ${item.color} flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
              <item.icon className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-slate-800 dark:text-white group-hover:text-emerald-600 transition-colors">
              {item.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Recent Dispatches Table */}
      <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white">Recent Communication Dispatches</h2>
            <p className="text-xs text-slate-500 dark:text-emerald-300/70">Overview of all sent, queued, and scheduled messages</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search subject or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-emerald-500/20 text-slate-400 font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Title & Subject</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Channels</th>
                <th className="py-3 px-4">Recipients</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Delivery Rate</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-emerald-500/10">
              {filteredComms.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-emerald-300/60 font-medium">
                    No communication records found matching filters.
                  </td>
                </tr>
              ) : (
                filteredComms.map((comm) => (
                  <tr key={comm.id} className="hover:bg-slate-50 dark:hover:bg-emerald-900/20 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 dark:text-white">{comm.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-emerald-300/70 truncate max-w-xs">{comm.subject}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                        {comm.type.replace('_', ' ')}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        {comm.channels.map((ch) => (
                          <span
                            key={ch}
                            className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 font-mono text-[9px] font-black"
                          >
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-emerald-200">
                      {comm.stats.totalRecipients} ({comm.recipientType.replace('_', ' ')})
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full font-black text-[10px] ${
                          comm.status === 'SENT'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : comm.status === 'SCHEDULED'
                            ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400'
                            : 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {comm.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="w-28 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-slate-600 dark:text-emerald-300">
                          <span>Delivered</span>
                          <span>{comm.stats.deliveredCount}/{comm.stats.totalRecipients}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-slate-100 dark:bg-emerald-950 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full"
                            style={{
                              width: `${(comm.stats.deliveredCount / Math.max(1, comm.stats.totalRecipients)) * 100}%`,
                            }}
                          />
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href="/dashboard/communication/history"
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-emerald-950 hover:bg-emerald-600 hover:text-white text-slate-600 dark:text-emerald-300 font-bold inline-flex items-center gap-1 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Logs</span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
