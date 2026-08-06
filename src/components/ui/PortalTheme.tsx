'use client';

import React from 'react';

interface PortalThemeProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Global PortalTheme wrapper component.
 * Ensures every authenticated page inherits the approved portal theme:
 * - Manrope typography for English
 * - Noto Naskh Arabic for Arabic
 * - 8/16/24/32/48/64px consistent spacing scale
 * - Dark emerald glassmorphism styling
 */
export function PortalTheme({ children, className = '' }: PortalThemeProps) {
  return (
    <div className={`portal-theme min-h-screen p-4 sm:p-6 lg:p-8 space-y-8 font-poppins max-w-7xl mx-auto ${className}`}>
      {children}
    </div>
  );
}
