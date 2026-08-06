'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { BarChart3, Search, Download, ArrowLeft, Eye, CheckCircle2, FileText, Send } from 'lucide-react';

export default function DeliveryHistoryPage() {
  const { communications } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = communications.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 font-poppins">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/communication"
            className="p-2.5 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-slate-700 dark:text-emerald-300 hover:text-emerald-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Delivery History & Analytics</h1>
            <p className="text-xs text-slate-500 dark:text-emerald-300/70">Comprehensive log of all dispatched campaigns, open rates, and channel delivery metrics</p>
          </div>
        </div>
      </div>

      {/* Search & Export Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search campaigns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>
      </div>

      {/* History Table */}
      <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-6 shadow-xl space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-emerald-500/20 text-slate-400 font-extrabold uppercase text-[10px]">
                <th className="py-3 px-4">Title & Category</th>
                <th className="py-3 px-4">Date Sent</th>
                <th className="py-3 px-4">Sender</th>
                <th className="py-3 px-4">Recipients Target</th>
                <th className="py-3 px-4">Email Dispatched</th>
                <th className="py-3 px-4">WhatsApp Dispatched</th>
                <th className="py-3 px-4">Read Rate %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-emerald-500/10">
              {filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-emerald-900/20">
                  <td className="py-3.5 px-4">
                    <div className="font-extrabold text-slate-900 dark:text-white">{c.title}</div>
                    <div className="text-[10px] text-slate-500">{c.type}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600 dark:text-emerald-200 font-mono">
                    {c.sentAt ? new Date(c.sentAt).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-emerald-100">{c.senderName}</td>
                  <td className="py-3.5 px-4 font-bold text-emerald-700 dark:text-emerald-300">{c.recipientType}</td>
                  <td className="py-3.5 px-4 font-mono">{c.stats.emailCount}</td>
                  <td className="py-3.5 px-4 font-mono">{c.stats.whatsappCount}</td>
                  <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">
                    {Math.round((c.stats.readCount / Math.max(1, c.stats.totalRecipients)) * 100)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
