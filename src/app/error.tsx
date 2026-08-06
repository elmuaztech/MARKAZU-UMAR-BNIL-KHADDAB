'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application Runtime Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#031c13] text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-[#032417] border border-emerald-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
          <AlertTriangle className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">
            Something went wrong
          </h2>
          <p className="text-xs text-emerald-300">
            An unexpected error occurred while rendering this page.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Try Again</span>
          </button>

          <Link
            href="/"
            className="flex-1 py-3 rounded-xl bg-emerald-950 border border-emerald-800 text-emerald-200 font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-900"
          >
            <Home className="w-4 h-4" />
            <span>Go to Home</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
