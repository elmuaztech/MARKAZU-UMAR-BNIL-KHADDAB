'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

export function AppSplashLoader() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Only show launch splash on initial page open
    const splashAlreadyShown = sessionStorage.getItem('markazu_launch_splash_seen');
    if (splashAlreadyShown) {
      setVisible(false);
      return;
    }

    sessionStorage.setItem('markazu_launch_splash_seen', 'true');

    // Smooth fade-out after brief initial readiness
    const timer = setTimeout(() => {
      setFading(true);
      const removeTimer = setTimeout(() => {
        setVisible(false);
      }, 400);
      return () => clearTimeout(removeTimer);
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-b from-[#031c13] via-[#04281c] to-[#02130d] text-white transition-opacity duration-400 ease-out pointer-events-none select-none ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Ambient Radial Glow */}
      <div className="absolute w-72 h-72 rounded-full bg-emerald-500/15 blur-3xl -top-10 pointer-events-none animate-pulse" />
      <div className="absolute w-64 h-64 rounded-full bg-amber-500/10 blur-3xl bottom-10 pointer-events-none" />

      {/* Main Branding Card */}
      <div className="relative flex flex-col items-center text-center px-6 max-w-sm">
        {/* Crest Logo Container with Professional Curved Edges */}
        <div className="relative mb-5">
          <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-tr from-amber-400 to-emerald-400 opacity-60 blur-md animate-pulse" />
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-2 bg-white border-2 border-amber-400/90 shadow-2xl overflow-hidden flex items-center justify-center">
            <img
              src="/logo.png"
              alt="Markazu Umar Logo"
              className="w-full h-full object-contain rounded-xl"
            />
          </div>
        </div>

        {/* School Name & Arabic Motto */}
        <p className="text-amber-400 font-arabic text-lg tracking-wide mb-1 drop-shadow">
          مَرْكَزُ عُمَرَ بْنِ الْخَطَّابِ
        </p>
        <h1 className="text-xl font-bold tracking-tight text-white mb-1">
          Markazu Umar bn Al-Khattab
        </h1>
        <p className="text-xs text-emerald-200/80 uppercase tracking-widest font-semibold mb-6">
          School Management System
        </p>

        {/* Minimalist Progress Loader */}
        <div className="w-40 h-1 bg-emerald-950/80 rounded-full overflow-hidden border border-emerald-800/40 shadow-inner">
          <div className="h-full bg-gradient-to-r from-amber-400 via-emerald-400 to-amber-300 w-full animate-marquee-smooth" />
        </div>

        <span className="text-[10px] text-emerald-400/60 mt-3 font-medium">
          Loading portal...
        </span>
      </div>
    </div>
  );
}
