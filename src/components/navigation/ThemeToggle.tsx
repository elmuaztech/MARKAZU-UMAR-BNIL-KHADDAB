'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme, ThemeMode } from '../../lib/themeContext';
import { Sun, Moon, Laptop, ChevronDown } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'icon-only' | 'dropdown' | 'pill';
  className?: string;
}

export function ThemeToggle({ variant = 'dropdown', className = '' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const options: { mode: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { mode: 'light', label: 'Light Mode', icon: Sun },
    { mode: 'dark', label: 'Dark Mode', icon: Moon },
    { mode: 'system', label: 'System', icon: Laptop },
  ];

  if (variant === 'icon-only') {
    return (
      <button
        onClick={toggleTheme}
        aria-label="Toggle theme mode"
        title={`Current mode: ${theme} (${resolvedTheme}). Click to switch.`}
        className={`p-2 rounded-xl transition-all duration-200 border flex items-center justify-center ${
          resolvedTheme === 'dark'
            ? 'bg-emerald-950/80 border-emerald-700/50 text-amber-300 hover:bg-emerald-900/80 hover:text-amber-200 shadow-md shadow-emerald-950/40'
            : 'bg-white border-emerald-200 text-emerald-800 hover:bg-emerald-50 hover:text-emerald-900 shadow-sm'
        } ${className}`}
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 transition-transform hover:rotate-12" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500 transition-transform hover:rotate-45" />
        )}
      </button>
    );
  }

  if (variant === 'pill') {
    return (
      <div className={`inline-flex items-center p-1 rounded-2xl border transition-all ${
        resolvedTheme === 'dark'
          ? 'bg-emerald-950/90 border-emerald-800/60 text-emerald-200'
          : 'bg-emerald-50/90 border-emerald-200 text-emerald-900 shadow-sm'
      } ${className}`}>
        {options.map((opt) => {
          const Icon = opt.icon;
          const isActive = theme === opt.mode;
          return (
            <button
              key={opt.mode}
              onClick={() => setTheme(opt.mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                isActive
                  ? resolvedTheme === 'dark'
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-md shadow-emerald-950/60'
                    : 'bg-white text-emerald-900 shadow-md border border-emerald-200/60'
                  : resolvedTheme === 'dark'
                  ? 'text-emerald-300/70 hover:text-white hover:bg-emerald-900/40'
                  : 'text-emerald-700/70 hover:text-emerald-900 hover:bg-emerald-100/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="capitalize">{opt.mode}</span>
            </button>
          );
        })}
      </div>
    );
  }

  // Default: Dropdown Variant
  const CurrentIcon = theme === 'light' ? Sun : theme === 'dark' ? Moon : Laptop;

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select theme mode"
        className={`px-2 sm:px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 sm:gap-2 border transition-all duration-200 shrink-0 ${
          resolvedTheme === 'dark'
            ? 'bg-emerald-950/80 border-emerald-800/60 text-emerald-200 hover:bg-emerald-900/60 hover:text-white'
            : 'bg-white border-emerald-200 text-emerald-900 hover:bg-emerald-50 shadow-sm'
        }`}
      >
        <CurrentIcon className={`w-4 h-4 shrink-0 ${theme === 'light' ? 'text-amber-500' : 'text-emerald-400'}`} />
        <span className="capitalize hidden sm:inline">{theme} Mode</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute right-0 mt-2 w-40 max-w-[calc(100vw-1rem)] rounded-2xl border shadow-xl z-50 overflow-hidden py-1 transition-all animate-in fade-in zoom-in-95 duration-150 ${
          resolvedTheme === 'dark'
            ? 'bg-[#032417] border-emerald-700/50 text-emerald-100 shadow-emerald-950/80'
            : 'bg-white border-emerald-200 text-slate-800 shadow-emerald-950/10'
        }`}>
          <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-emerald-500 border-b border-emerald-500/20 mb-1">
            Appearance Mode
          </div>
          {options.map((opt) => {
            const Icon = opt.icon;
            const isSelected = theme === opt.mode;
            return (
              <button
                key={opt.mode}
                onClick={() => {
                  setTheme(opt.mode);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                  isSelected
                    ? resolvedTheme === 'dark'
                      ? 'bg-emerald-800/40 text-emerald-200 font-bold'
                      : 'bg-emerald-100/80 text-emerald-950 font-bold'
                    : resolvedTheme === 'dark'
                    ? 'hover:bg-emerald-900/30 text-emerald-300/80 hover:text-white'
                    : 'hover:bg-emerald-50 text-slate-600 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-500' : 'opacity-60'}`} />
                <span>{opt.label}</span>
                {isSelected && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
