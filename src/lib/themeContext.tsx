'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';
export type BrandColorPreset = 'emerald' | 'blue' | 'purple' | 'teal' | 'ruby' | 'amber';

export interface BrandColorConfig {
  id: BrandColorPreset;
  name: string;
  primary: string;
  primaryHover: string;
  gradientFrom: string;
  gradientTo: string;
  accent: string;
  glow: string;
  previewClass: string;
}

export const BRAND_COLOR_PRESETS: Record<BrandColorPreset, BrandColorConfig> = {
  emerald: {
    id: 'emerald',
    name: 'Islamic Emerald',
    primary: '#0f5132',
    primaryHover: '#16a34a',
    gradientFrom: '#064e3b',
    gradientTo: '#0284c7',
    accent: '#10b981',
    glow: 'rgba(16, 185, 129, 0.35)',
    previewClass: 'from-emerald-700 via-emerald-600 to-sky-500',
  },
  blue: {
    id: 'blue',
    name: 'Sapphire & Sky',
    primary: '#1d4ed8',
    primaryHover: '#2563eb',
    gradientFrom: '#1e3a8a',
    gradientTo: '#0284c7',
    accent: '#38bdf8',
    glow: 'rgba(56, 189, 248, 0.35)',
    previewClass: 'from-blue-800 via-blue-600 to-sky-400',
  },
  purple: {
    id: 'purple',
    name: 'Imperial Violet',
    primary: '#6d28d9',
    primaryHover: '#7c3aed',
    gradientFrom: '#4c1d95',
    gradientTo: '#0284c7',
    accent: '#c084fc',
    glow: 'rgba(192, 132, 252, 0.35)',
    previewClass: 'from-purple-800 via-purple-600 to-pink-500',
  },
  teal: {
    id: 'teal',
    name: 'Midnight Teal',
    primary: '#0f766e',
    primaryHover: '#0d9488',
    gradientFrom: '#134e4a',
    gradientTo: '#0284c7',
    accent: '#2dd4bf',
    glow: 'rgba(45, 212, 191, 0.35)',
    previewClass: 'from-teal-800 via-teal-600 to-cyan-500',
  },
  ruby: {
    id: 'ruby',
    name: 'Crimson Ruby',
    primary: '#be123c',
    primaryHover: '#e11d48',
    gradientFrom: '#881337',
    gradientTo: '#d97706',
    accent: '#fb7185',
    glow: 'rgba(251, 113, 133, 0.35)',
    previewClass: 'from-rose-800 via-rose-600 to-amber-500',
  },
  amber: {
    id: 'amber',
    name: 'Royal Gold',
    primary: '#b45309',
    primaryHover: '#d97706',
    gradientFrom: '#78350f',
    gradientTo: '#10b981',
    accent: '#fbbf24',
    glow: 'rgba(251, 191, 36, 0.35)',
    previewClass: 'from-amber-700 via-amber-500 to-emerald-500',
  },
};

interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: 'light' | 'dark';
  brandColor: BrandColorPreset;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
  setBrandColor: (color: BrandColorPreset) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_THEME_KEY = 'markazu_theme_mode';
const STORAGE_COLOR_KEY = 'markazu_brand_color';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>('light');
  const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>('light');
  const [brandColor, setBrandColorState] = useState<BrandColorPreset>('emerald');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const savedTheme = localStorage.getItem(STORAGE_THEME_KEY) as ThemeMode | null;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }

    const savedColor = localStorage.getItem(STORAGE_COLOR_KEY) as BrandColorPreset | null;
    if (savedColor && BRAND_COLOR_PRESETS[savedColor]) {
      setBrandColorState(savedColor);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (currentTheme: ThemeMode) => {
      let activeTheme: 'light' | 'dark' = 'light';

      if (currentTheme === 'system') {
        activeTheme = mediaQuery.matches ? 'dark' : 'light';
      } else {
        activeTheme = currentTheme;
      }

      setResolvedTheme(activeTheme);

      if (activeTheme === 'dark') {
        root.classList.add('dark');
        root.classList.remove('light');
        root.style.colorScheme = 'dark';
      } else {
        root.classList.add('light');
        root.classList.remove('dark');
        root.style.colorScheme = 'light';
      }
    };

    applyTheme(theme);
    localStorage.setItem(STORAGE_THEME_KEY, theme);

    const handleSystemChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, [theme, mounted]);

  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;
    const config = BRAND_COLOR_PRESETS[brandColor] || BRAND_COLOR_PRESETS.emerald;

    root.style.setProperty('--brand-primary', config.primary);
    root.style.setProperty('--brand-primary-hover', config.primaryHover);
    root.style.setProperty('--brand-gradient-from', config.gradientFrom);
    root.style.setProperty('--brand-gradient-to', config.gradientTo);
    root.style.setProperty('--brand-accent', config.accent);
    root.style.setProperty('--brand-glow', config.glow);
    root.setAttribute('data-brand-color', brandColor);

    localStorage.setItem(STORAGE_COLOR_KEY, brandColor);
  }, [brandColor, mounted]);

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === 'dark') return 'light';
      if (prev === 'light') return 'system';
      return 'dark';
    });
  };

  const setBrandColor = (newColor: BrandColorPreset) => {
    setBrandColorState(newColor);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        resolvedTheme,
        brandColor,
        setTheme,
        toggleTheme,
        setBrandColor,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
