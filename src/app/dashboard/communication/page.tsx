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
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedTypeFilter === 'ALL' || c.type === selectedTypeFilter;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-4 sm:p-8 space-y-8 font-poppins max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950 via-[#042f1e] to-emerald-900 border border-emerald-500/30 p-6 sm:p-8 text-white shadow-2xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5" /> Enterprise Communication Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Communication Center</h1>
            <p className="text-sm text-emerald-200/80 max-w-2xl">
              Centralized messaging engine for announcements, report sheet delivery, circulars, automated queues, smart parent grouping, and multi-channel notifications.
            </p>
          </div>

          {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
            <div className="flex flex-wrap gap-3">
              <Link
                href="/dashboard/communication/new"
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-900/40 flex items-center gap-2 transition-all hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span>New Communication</span>
              </Link>

              <Link
                href="/dashboard/communication/report-sheet-delivery"
                className="px-5 py-3 rounded-2xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-2 transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Report Sheet Delivery</span>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Analytics KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 dark:text-emerald-300 uppercase tracking-wider">Total Dispatched</span>
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Send className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{totalDispatched}</p>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">100% Multi-channel reach</p>
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 dark:text-emerald-300 uppercase tracking-wider">Scheduled Messages</span>
            <div className="p-2.5 rounded-2xl bg-sky-500/15 text-sky-600 dark:text-sky-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{totalScheduled}</p>
          <p className="text-xs text-sky-600 dark:text-sky-400 font-bold">Pending auto-dispatch</p>
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 dark:text-emerald-300 uppercase tracking-wider">Delivery Queue</span>
            <div className="p-2.5 rounded-2xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{activeQueueCount}</p>
          <p className="text-xs text-purple-600 dark:text-purple-400 font-bold">Active task queue</p>
        </div>

        <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-500 dark:text-emerald-300 uppercase tracking-wider">Failed Queue Tasks</span>
            <div className="p-2.5 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{totalFailedQueue}</p>
          <Link href="/dashboard/communication/failed" className="text-xs text-rose-600 dark:text-rose-400 font-bold hover:underline">
            View & retry failed items
          </Link>
        </div>
      </div>

      {/* Sub-Navigation Shortcut Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
        {[
          { label: 'New Comm', href: '/dashboard/communication/new', icon: Send, color: 'from-emerald-600 to-emerald-700' },
          { label: 'Report Sheets', href: '/dashboard/communication/report-sheet-delivery', icon: FileText, color: 'from-amber-600 to-amber-700' },
          { label: 'Templates', href: '/dashboard/communication/templates', icon: Layout, color: 'from-sky-600 to-sky-700' },
          { label: 'Delivery Queue', href: '/dashboard/communication/queue', icon: Layers, color: 'from-purple-600 to-purple-700' },
          { label: 'Delivery History', href: '/dashboard/communication/history', icon: BarChart3, color: 'from-indigo-600 to-indigo-700' },
          { label: 'Failed Deliveries', href: '/dashboard/communication/failed', icon: AlertTriangle, color: 'from-rose-600 to-rose-700' },
          { label: 'Scheduled', href: '/dashboard/communication/scheduled', icon: Clock, color: 'from-teal-600 to-teal-700' },
          { label: 'Inbox Center', href: '/dashboard/communication/notifications', icon: Bell, color: 'from-blue-600 to-blue-700' },
          { label: 'Settings', href: '/dashboard/communication/settings', icon: Sparkles, color: 'from-slate-600 to-slate-700' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`p-4 rounded-2xl bg-gradient-to-br ${item.color} text-white font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-md hover:scale-105 transition-all text-center`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
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
