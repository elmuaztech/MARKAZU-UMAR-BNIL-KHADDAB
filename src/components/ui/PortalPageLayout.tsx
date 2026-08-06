'use client';

import React from 'react';

export interface PortalPageLayoutProps {
  categoryTag?: string;
  badgeText?: string;
  title: string;
  titleArabic?: string;
  description: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function PortalPageLayout({
  categoryTag = 'Management Module',
  badgeText,
  title,
  titleArabic,
  description,
  icon,
  actions,
  children,
  className = '',
}: PortalPageLayoutProps) {
  return (
    <div className={`space-y-6 sm:space-y-8 font-sans ${className}`}>
      {/* Standardized Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#042f1e] via-[#064e3b] to-[#0284c7] text-white border border-emerald-500/30 shadow-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              {categoryTag}
            </span>
            {badgeText && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                {badgeText}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {icon && <div className="text-emerald-400 shrink-0">{icon}</div>}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{title}</h1>
              {titleArabic && (
                <p className="font-arabic text-xs font-bold text-amber-300 mt-0.5">{titleArabic}</p>
              )}
            </div>
          </div>

          <p className="text-xs sm:text-sm text-emerald-100/90 max-w-2xl font-medium">{description}</p>
        </div>

        {actions && <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">{actions}</div>}
      </div>

      {/* Main Content Area */}
      <div>{children}</div>
    </div>
  );
}
