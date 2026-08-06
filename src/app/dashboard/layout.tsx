'use client';

import React, { useState } from 'react';
import { Sidebar } from '../../components/navigation/Sidebar';
import { Header } from '../../components/navigation/Header';
import { RBACGuard } from '../../components/auth/RBACGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f8f5] dark:bg-[#031c13] text-slate-900 dark:text-slate-100 flex transition-colors duration-200 portal-theme">
      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-8">
          <RBACGuard>{children}</RBACGuard>
        </main>
      </div>
    </div>
  );
}
