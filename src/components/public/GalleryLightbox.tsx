'use client';

import React, { useEffect, useState } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2, Minimize2, ShieldAlert } from 'lucide-react';

interface GalleryItem {
  title: string;
  category: string;
  image: string;
}

interface GalleryLightboxProps {
  isOpen: boolean;
  currentIndex: number;
  items: GalleryItem[];
  onClose: () => void;
  onNavigate: (newIndex: number) => void;
}

export function GalleryLightbox({
  isOpen,
  currentIndex,
  items,
  onClose,
  onNavigate,
}: GalleryLightboxProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const currentItem = items[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') {
        onNavigate((currentIndex - 1 + items.length) % items.length);
      }
      if (e.key === 'ArrowRight') {
        onNavigate((currentIndex + 1) % items.length);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, items.length, onClose, onNavigate]);

  if (!isOpen || !currentItem) return null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-xl flex flex-col justify-between p-4 sm:p-6 select-none transition-all duration-300"
      onContextMenu={(e) => e.preventDefault()} // Disable right-click image download
    >
      {/* Lightbox Top Toolbar */}
      <div className="flex items-center justify-between gap-4 z-10">
        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-amber-300 text-xs font-bold border border-emerald-500/40">
            {currentItem.category}
          </span>
          <h3 className="text-white font-bold text-sm sm:text-base mt-1 truncate max-w-md">
            {currentItem.title}
          </h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-full bg-slate-800/80 hover:bg-emerald-600 text-slate-200 hover:text-white transition-all shadow-lg"
            title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Close Modal Button */}
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-slate-800/80 hover:bg-rose-600 text-slate-200 hover:text-white transition-all shadow-lg"
            title="Close Lightbox"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div className="relative flex-1 flex items-center justify-center py-4 my-auto overflow-hidden">
        {/* Previous Image Button */}
        <button
          onClick={() => onNavigate((currentIndex - 1 + items.length) % items.length)}
          className="absolute left-2 sm:left-4 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-emerald-600 text-white transition-all shadow-2xl hover:scale-110"
          title="Previous Image (Left Arrow)"
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>

        {/* Displayed Image with Download Prevention */}
        <div className="relative max-h-full max-w-full flex items-center justify-center p-2">
          <img
            src={currentItem.image}
            alt={currentItem.title}
            className="max-h-[75vh] max-w-[90vw] object-contain rounded-2xl shadow-2xl border border-emerald-500/20 pointer-events-none"
            onContextMenu={(e) => e.preventDefault()}
            draggable={false}
          />
        </div>

        {/* Next Image Button */}
        <button
          onClick={() => onNavigate((currentIndex + 1) % items.length)}
          className="absolute right-2 sm:right-4 z-20 p-3 rounded-full bg-slate-900/80 hover:bg-emerald-600 text-white transition-all shadow-2xl hover:scale-110"
          title="Next Image (Right Arrow)"
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </div>

      {/* Bottom Info Bar */}
      <div className="flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80 pt-3 z-10">
        <span className="font-mono">
          Image {currentIndex + 1} of {items.length}
        </span>
        <div className="flex items-center gap-1.5 text-[11px] text-amber-400/90 font-medium">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Protected Content • Download Disabled</span>
        </div>
      </div>
    </div>
  );
}
