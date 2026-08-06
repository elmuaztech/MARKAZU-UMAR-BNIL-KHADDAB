'use client';

import React from 'react';
import { useTheme, BRAND_COLOR_PRESETS, BrandColorPreset } from '../../lib/themeContext';
import { Check, Palette, Sparkles } from 'lucide-react';

interface BrandColorPickerProps {
  className?: string;
  showTitle?: boolean;
}

export function BrandColorPicker({ className = '', showTitle = true }: BrandColorPickerProps) {
  const { brandColor, setBrandColor, resolvedTheme } = useTheme();

  return (
    <div className={`space-y-3 ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
              System Brand Color Theme
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30 capitalize">
            {BRAND_COLOR_PRESETS[brandColor]?.name || brandColor} Active
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
        {(Object.keys(BRAND_COLOR_PRESETS) as BrandColorPreset[]).map((key) => {
          const preset = BRAND_COLOR_PRESETS[key];
          const isSelected = brandColor === key;

          return (
            <button
              key={key}
              onClick={() => setBrandColor(key)}
              className={`p-2.5 rounded-2xl border transition-all duration-200 flex flex-col items-center justify-center gap-2 text-center group relative overflow-hidden ${
                isSelected
                  ? resolvedTheme === 'dark'
                    ? 'bg-emerald-900/40 border-emerald-400 ring-2 ring-emerald-400/50 shadow-lg'
                    : 'bg-white border-emerald-500 ring-2 ring-emerald-500/40 shadow-md'
                  : resolvedTheme === 'dark'
                  ? 'bg-emerald-950/40 border-emerald-800/40 hover:bg-emerald-900/30 hover:border-emerald-700/50'
                  : 'bg-emerald-50/60 border-emerald-200 hover:bg-white hover:border-emerald-300'
              }`}
            >
              {/* Color Gradient Swatch */}
              <div
                className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${preset.previewClass} flex items-center justify-center text-white shadow-md transition-transform duration-200 group-hover:scale-110`}
              >
                {isSelected ? (
                  <Check className="w-5 h-5 drop-shadow-md" />
                ) : (
                  <div className="w-2 h-2 rounded-full bg-white/60" />
                )}
              </div>

              <span
                className={`text-[11px] font-bold leading-tight ${
                  isSelected
                    ? 'text-emerald-700 dark:text-emerald-200 font-extrabold'
                    : 'text-slate-700 dark:text-emerald-300/80 group-hover:text-slate-900 dark:group-hover:text-white'
                }`}
              >
                {preset.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
