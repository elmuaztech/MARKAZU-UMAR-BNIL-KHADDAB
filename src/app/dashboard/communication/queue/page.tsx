'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import {
  Layers,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Search,
  Filter,
  Play,
  RotateCcw,
} from 'lucide-react';

export default function DeliveryQueuePage() {
  const { deliveryQueue, retryFailedDelivery, retryAllFailedDeliveries } = useApp();
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  const filteredQueue = deliveryQueue.filter((q) => filterStatus === 'ALL' || q.status === filterStatus);

  const queuedCount = deliveryQueue.filter((q) => q.status === 'QUEUED').length;
  const processingCount = deliveryQueue.filter((q) => q.status === 'PROCESSING').length;
  const completedCount = deliveryQueue.filter((q) => q.status === 'COMPLETED').length;
  const failedCount = deliveryQueue.filter((q) => q.status === 'FAILED').length;

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
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Delivery Queue Monitor</h1>
            <p className="text-xs text-slate-500 dark:text-emerald-300/70">Real-time status monitor of background communication dispatches</p>
          </div>
        </div>

        {failedCount > 0 && (
          <button
            onClick={() => retryAllFailedDeliveries()}
            className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg flex items-center gap-2 transition-all hover:scale-105"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry All {failedCount} Failed Deliveries</span>
          </button>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div onClick={() => setFilterStatus('QUEUED')} className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md cursor-pointer space-y-1">
          <span className="text-slate-400 font-extrabold uppercase">Queued</span>
          <p className="text-2xl font-black text-amber-500">{queuedCount}</p>
        </div>

        <div onClick={() => setFilterStatus('PROCESSING')} className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md cursor-pointer space-y-1">
          <span className="text-slate-400 font-extrabold uppercase">Processing</span>
          <p className="text-2xl font-black text-sky-500">{processingCount}</p>
        </div>

        <div onClick={() => setFilterStatus('COMPLETED')} className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md cursor-pointer space-y-1">
          <span className="text-slate-400 font-extrabold uppercase">Completed</span>
          <p className="text-2xl font-black text-emerald-500">{completedCount}</p>
        </div>

        <div onClick={() => setFilterStatus('FAILED')} className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md cursor-pointer space-y-1">
          <span className="text-slate-400 font-extrabold uppercase">Failed</span>
          <p className="text-2xl font-black text-rose-500">{failedCount}</p>
        </div>
      </div>

      {/* Queue Table */}
      <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-black text-slate-900 dark:text-white">Active Queue Monitor</h2>
          <div className="flex items-center gap-2">
            {['ALL', 'QUEUED', 'PROCESSING', 'COMPLETED', 'FAILED'].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase transition-all ${
                  filterStatus === st
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 dark:bg-emerald-950 text-slate-600 dark:text-emerald-300'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-emerald-500/20 text-slate-400 font-extrabold uppercase text-[10px]">
                <th className="py-3 px-4">Message Title</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Recipient Name & Contact</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Attempts</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-emerald-500/10">
              {filteredQueue.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-emerald-300/60 font-medium">
                    No items found in queue matching status filter.
                  </td>
                </tr>
              ) : (
                filteredQueue.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-emerald-900/20">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{item.messageTitle}</td>
                    <td className="py-3.5 px-4 font-black text-emerald-600 dark:text-emerald-400">{item.channel}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-slate-900 dark:text-white">{item.recipientName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{item.recipientContact}</div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-600 dark:text-emerald-300">{item.recipientRole}</td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full font-black text-[10px] ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                            : item.status === 'FAILED'
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-emerald-300">
                      {item.attempts}/{item.maxAttempts}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {item.status === 'FAILED' && (
                        <button
                          onClick={() => retryFailedDelivery(item.id)}
                          className="px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-600 font-bold hover:bg-rose-600 hover:text-white transition-all text-[10px]"
                        >
                          Retry Task
                        </button>
                      )}
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
