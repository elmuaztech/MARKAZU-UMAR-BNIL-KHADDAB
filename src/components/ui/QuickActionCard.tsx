'use client';

import React from 'react';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export interface QuickActionItem {
  label: string;
  labelArabic?: string;
  href?: string;
  onClick?: () => void;
  icon: LucideIcon;
  color: string; // Tailored gradient: e.g. "from-emerald-600 to-emerald-700"
}

interface QuickActionGridProps {
  items: QuickActionItem[];
  columns?: string;
}

export function QuickActionGrid({ items, columns = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5' }: QuickActionGridProps) {
  return (
    <div className={`grid ${columns} gap-3 sm:gap-4`}>
      {items.map((item, index) => {
        const Icon = item.icon;

        const content = (
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.color} text-white font-bold text-xs flex flex-col items-center justify-center gap-2 shadow-md hover:shadow-xl transition-all text-center cursor-pointer h-full border border-white/10`}
          >
            <Icon className="w-5 h-5" />
            <div className="flex flex-col items-center w-full px-1">
              <span className="leading-snug break-words text-center">{item.label}</span>
              {item.labelArabic && (
                <span dir="rtl" lang="ar" className="font-arabic text-[11px] leading-normal opacity-90 font-medium mt-0.5 break-words text-center">{item.labelArabic}</span>
              )}
            </div>
          </motion.div>
        );

        if (item.href) {
          return (
            <Link key={item.href + index} href={item.href} className="block h-full">
              {content}
            </Link>
          );
        }

        return (
          <button key={item.label + index} onClick={item.onClick} className="block w-full h-full text-center">
            {content}
          </button>
        );
      })}
    </div>
  );
}
