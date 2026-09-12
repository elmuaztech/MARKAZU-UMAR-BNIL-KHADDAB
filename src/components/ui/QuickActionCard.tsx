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
            <div className="flex flex-col items-center">
              <span>{item.label}</span>
              {item.labelArabic && (
                <span className="font-arabic text-[10px] opacity-90 font-semibold mt-0.5">{item.labelArabic}</span>
              )}
            </div>
          </motion.div>
        );

        if (item.href) {
          return (
            <Link key={item.href + index} href={item.href} className="block">
              {content}
            </Link>
          );
        }

        return (
          <button key={item.label + index} onClick={item.onClick} className="block w-full text-left">
            {content}
          </button>
        );
      })}
    </div>
  );
}
