'use client';

import React from 'react';
import { Sparkles, LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

interface PortalHeroBannerProps {
  badgeText: string;
  badgeIcon?: LucideIcon;
  title: string;
  titleArabic?: string;
  description: string;
  actions?: React.ReactNode;
  variant?: 'emerald' | 'amber' | 'sky' | 'purple';
}

export function PortalHeroBanner({
  badgeText,
  badgeIcon: BadgeIcon = Sparkles,
  title,
  titleArabic,
  description,
  actions,
  variant = 'emerald',
}: PortalHeroBannerProps) {
  const gradientStyles = {
    emerald: 'from-emerald-950 via-[#042f1e] to-emerald-900 border-emerald-500/30',
    amber: 'from-amber-950 via-[#2d1b02] to-amber-900 border-amber-500/30',
    sky: 'from-sky-950 via-[#032433] to-sky-900 border-sky-500/30',
    purple: 'from-purple-950 via-[#240333] to-purple-900 border-purple-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r ${gradientStyles[variant]} border p-4 sm:p-8 text-white shadow-2xl`}
    >
      <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black uppercase tracking-widest">
            <BadgeIcon className="w-3.5 h-3.5" /> {badgeText}
          </div>
          <div className="flex flex-wrap items-baseline gap-3">
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white font-poppins">{title}</h1>
            {titleArabic && (
              <span className="font-arabic text-lg sm:text-xl text-amber-300 font-semibold dir-rtl">
                {titleArabic}
              </span>
            )}
          </div>
          <p className="text-sm text-emerald-200/80 max-w-2xl font-medium leading-relaxed">{description}</p>
        </div>

        {actions && <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">{actions}</div>}
      </div>
    </motion.div>
  );
}
