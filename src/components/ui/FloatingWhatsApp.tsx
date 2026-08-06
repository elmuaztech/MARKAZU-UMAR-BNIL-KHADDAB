'use client';

import React, { useState, useEffect } from 'react';
import { MessageCircle, Phone, X } from 'lucide-react';

export function FloatingWhatsApp() {
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  const whatsappNumber = '2348167109421';
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=Assalamu%20Alaikum,%20I%20want%20to%20enquire%20about%20Markazu%20Umar%20bn%20Al-Khattab%20Islamiyyah.`;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      {showTooltip && (
        <div className="relative bg-emerald-950 text-emerald-100 border border-emerald-500/40 px-4 py-2.5 rounded-2xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>💬 Parents contact immediately via <strong>08167109421</strong></span>
          <button
            onClick={() => setShowTooltip(false)}
            className="p-1 text-emerald-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-3 bg-emerald-950 border-r border-t border-emerald-500/40 rotate-45" />
        </div>
      )}

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact Markazu Umar via WhatsApp"
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white shadow-2xl shadow-emerald-500/50 hover:scale-110 transition-all duration-300 border-2 border-emerald-300/80 animate-pulse"
      >
        <MessageCircle className="w-7 h-7 fill-white text-emerald-600 group-hover:scale-110 transition-transform" />

        {/* Pulse Ring effect */}
        <span className="absolute -inset-1 rounded-full bg-emerald-400 opacity-40 animate-ping pointer-events-none" />
      </a>
    </div>
  );
}
