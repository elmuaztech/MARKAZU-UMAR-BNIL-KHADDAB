'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FinanceDashboardPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[60vh] text-slate-400">
      <div className="animate-pulse text-sm">Loading dashboard...</div>
    </div>
  );
}
