'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { AlertTriangle, RotateCcw, ArrowLeft, ShieldAlert } from 'lucide-react';

export default function FailedDeliveriesPage() {
  const { deliveryQueue, retryFailedDelivery, retryAllFailedDeliveries } = useApp();

  const failedItems = deliveryQueue.filter((q) => q.status === 'FAILED');

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
            <h1 className="text-2xl font-black text-slate-900 dark:text-white">Failed Deliveries Exception Handler</h1>
            <p className="text-xs text-slate-500 dark:text-emerald-300/70">Inspect delivery failures, review API error traces, and trigger single or bulk retries</p>
          </div>
        </div>

        {failedItems.length > 0 && (
          <button
            onClick={() => retryAllFailedDeliveries()}
            className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-lg flex items-center gap-2 transition-all hover:scale-105"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Retry All {failedItems.length} Failed Tasks</span>
          </button>
        )}
      </div>

      <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-6 shadow-xl space-y-4">
        {failedItems.length === 0 ? (
          <div className="py-12 text-center text-slate-400 dark:text-emerald-300/60 font-medium">
            🎉 No failed deliveries recorded! All communication dispatches are operating smoothly.
          </div>
        ) : (
          <div className="space-y-4">
            {failedItems.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white font-black text-[9px] uppercase">
                      {item.channel}
                    </span>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">{item.messageTitle}</span>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-emerald-200">
                    Recipient: <strong>{item.recipientName}</strong> ({item.recipientContact})
                  </p>
                  <p className="text-xs text-rose-600 dark:text-rose-400 font-mono">
                    Error Trace: {item.errorTrace || 'Unknown API Exception'}
                  </p>
                </div>

                <button
                  onClick={() => retryFailedDelivery(item.id)}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 transition-all self-start sm:self-auto"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Delivery</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
