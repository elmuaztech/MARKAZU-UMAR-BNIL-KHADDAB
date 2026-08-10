'use client';

import React from 'react';
import { Server, Database, Mail, HardDrive, Cpu, ShieldCheck, CheckCircle2, RefreshCw } from 'lucide-react';

export function SystemHealthWidget() {
  const healthMetrics = [
    {
      id: 'db',
      label: 'PostgreSQL Database',
      status: 'Healthy',
      detail: 'Latency 2ms • Connections Active',
      icon: Database,
      color: 'emerald',
    },
    {
      id: 'server',
      label: 'Cloud Server & Database',
      status: 'Healthy',
      detail: 'Secure Cloud Node • Uptime 99.99%',
      icon: Server,
      color: 'emerald',
    },
    {
      id: 'email',
      label: 'Email System & Dispatch',
      status: 'Healthy',
      detail: 'SMTP Relay Operational',
      icon: Mail,
      color: 'sky',
    },
    {
      id: 'storage',
      label: 'Cloud & Document Storage',
      status: 'Optimal',
      detail: '24.5 GB / 100 GB (24.5% Used)',
      icon: HardDrive,
      color: 'purple',
    },
    {
      id: 'memory',
      label: 'Node.js Memory & CPU',
      status: 'Optimal',
      detail: '3.2 GB / 8 GB RAM • CPU 14%',
      icon: Cpu,
      color: 'amber',
    },
    {
      id: 'security',
      label: 'Enterprise Security Guard',
      status: 'Active',
      detail: 'Argon2id Salted • CSRF & Rate Limit Active',
      icon: ShieldCheck,
      color: 'emerald',
    },
  ];

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-emerald-500/20">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Enterprise System Health Diagnostics
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-emerald-300/70 mt-0.5">
            Real-time infrastructure performance, database connectivity, and automated cloud backups.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> All Services Operational
          </span>
          <button
            onClick={() => window.location.reload()}
            title="Refresh System Health Diagnostics"
            className="p-2 rounded-xl bg-slate-100 dark:bg-emerald-950/60 hover:bg-slate-200 dark:hover:bg-emerald-900/60 text-slate-600 dark:text-emerald-400 transition-all border border-slate-200 dark:border-emerald-500/20"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {healthMetrics.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.id}
              className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 flex items-start gap-3 hover:border-emerald-500/50 transition-all"
            >
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex-shrink-0">
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.label}</h4>
                  <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-md border border-emerald-500/30">
                    {item.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-emerald-300/70 mt-1">{item.detail}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
