'use client';

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export function FloatingWhatsApp() {
  const [showTooltip, setShowTooltip] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowTooltip(false), 9000);
    return () => clearTimeout(timer);
  }, []);

  const whatsappNumber = '2348167109421';
  const fullSchoolName = "Markazu Umar bn Al-Khattab Centre for Qur'an Memorization and Islamic Studies - Daneji";
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(
    `Assalamu Alaikum, I am contacting ${fullSchoolName}.`
  )}`;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3">
      {showTooltip && (
        <div className="relative bg-[#022417] text-emerald-100 border border-emerald-500/40 px-3.5 py-2 rounded-2xl shadow-2xl text-[11px] font-semibold flex items-center gap-2 animate-bounce">
          <span>💬 Parents contact immediately via <strong>08167109421</strong></span>
          <button
            onClick={() => setShowTooltip(false)}
            className="p-0.5 text-emerald-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
          <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-2.5 h-2.5 bg-[#022417] border-r border-t border-emerald-500/40 rotate-45" />
        </div>
      )}

      <a
        href={whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact Markazu Umar bn Al-Khattab via WhatsApp"
        className="group relative flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white shadow-2xl shadow-[#25D366]/50 hover:scale-110 transition-all duration-300 border-2 border-white/80 shrink-0"
      >
        {/* Official WhatsApp SVG Icon */}
        <svg
          className="w-8 h-8 fill-white group-hover:scale-110 transition-transform"
          viewBox="0 0 24 24"
        >
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.099 4.019 4.142-1.086zm11.026-6.186c-.301-.15-1.783-.881-2.058-.98-.276-.1-.476-.15-.676.15-.2.299-.776.98-.951 1.18-.175.199-.35.225-.651.075-.3-.15-1.268-.467-2.416-1.491-.893-.797-1.496-1.782-1.671-2.081-.175-.301-.019-.463.131-.612.135-.134.301-.35.45-.525.15-.175.2-.299.3-.5.1-.2.05-.375-.025-.525-.075-.15-.676-1.63-0.926-2.23-.243-.585-.49-.505-.675-.514-.175-.009-.376-.009-.576-.009s-.525.075-.8.375c-.275.3-.1.05-1.05 1.05s-1.05 2.748.075 3.698c1.125.95 2.126 1.95 4.801 3.125.638.28 1.137.447 1.527.571.64.203 1.222.174 1.681.106.512-.076 1.571-.642 1.794-1.263.223-.62.223-1.151.156-1.262-.067-.113-.267-.188-.567-.338z" />
        </svg>

        {/* Outer Glow Pulse Effect */}
        <span className="absolute -inset-1 rounded-full bg-[#25D366] opacity-40 animate-ping pointer-events-none" />
      </a>
    </div>
  );
}
