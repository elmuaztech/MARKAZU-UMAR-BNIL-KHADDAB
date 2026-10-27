'use client';

import React, { useEffect, useState } from 'react';

export function AppSplashLoader() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    // Only show launch splash on initial page open per session
    const splashAlreadyShown = sessionStorage.getItem('markazu_launch_splash_seen');
    if (splashAlreadyShown) {
      setVisible(false);
      return;
    }

    sessionStorage.setItem('markazu_launch_splash_seen', 'true');

    // Smooth transition after initial presentation
    const timer = setTimeout(() => {
      setFading(true);
      const removeTimer = setTimeout(() => {
        setVisible(false);
      }, 500);
      return () => clearTimeout(removeTimer);
    }, 1100);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-b from-[#021810] via-[#031c13] to-[#010f0a] text-white transition-opacity duration-500 ease-out pointer-events-none select-none ${
        fading ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
      }`}
      style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <style jsx>{`
        @keyframes splashLogoPop {
          0% {
            opacity: 0;
            transform: scale(0.7) translateY(12px);
          }
          60% {
            opacity: 1;
            transform: scale(1.05) translateY(-2px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes splashTextFade {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes splashBarPulse {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(20%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-logo-pop {
          animation: splashLogoPop 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-text-reveal {
          animation: splashTextFade 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards;
          opacity: 0;
        }
        .animate-bar-slide {
          animation: splashBarPulse 1.2s infinite ease-in-out;
        }
      `}</style>

      {/* Main Branding Presentation */}
      <div className="relative flex flex-col items-center text-center px-6 max-w-sm">
        {/* Soft Ambient Halo behind the crest */}
        <div className="absolute top-8 w-44 h-44 rounded-full bg-emerald-500/15 blur-2xl pointer-events-none" />

        {/* Curved Crest Logo Container */}
        <div className="relative mb-5 animate-logo-pop">
          <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-[28px] p-2.5 bg-gradient-to-br from-white via-slate-50 to-amber-50/80 border-2 border-amber-400/80 shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_24px_rgba(251,191,36,0.25)] overflow-hidden flex items-center justify-center transform transition-transform">
            <img
              src="/logo.png"
              alt="Markazu Umar Logo"
              className="w-full h-full object-contain rounded-[20px]"
            />
          </div>
        </div>

        {/* School Name & Arabic Motto */}
        <div className="animate-text-reveal space-y-1.5 flex flex-col items-center">
          <p className="text-amber-400 font-arabic text-xl sm:text-2xl font-bold tracking-wide">
            مَرْكَزُ عُمَرَ بْنِ الْخَطَّابِ
          </p>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
            Markazu Umar bn Al-Khattab
          </h1>
          <p className="text-[11px] sm:text-xs text-emerald-300/85 uppercase tracking-[0.25em] font-extrabold pb-2">
            School Management System
          </p>

          {/* Minimalist Native Loading Bar */}
          <div className="w-40 h-1 bg-emerald-950/80 rounded-full overflow-hidden border border-emerald-500/30 mt-4 relative">
            <div className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full w-2/3 animate-bar-slide" />
          </div>

          <span className="text-[10px] text-emerald-400/80 tracking-wider font-semibold mt-2">
            Opening Portal...
          </span>
        </div>
      </div>
    </div>
  );
}
