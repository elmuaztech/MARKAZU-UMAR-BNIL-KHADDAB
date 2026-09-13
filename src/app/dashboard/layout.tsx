import React from 'react';
import { requireServerPageAuth } from '@/lib/serverAuth';
import DashboardClientShell from './DashboardClientShell';

export const dynamic = 'force-dynamic';

/**
 * Authoritative Server Layout for /dashboard
 * Evaluates session validity and user status server-side BEFORE any HTML or client bundle is rendered.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await requireServerPageAuth();

  return (
    <DashboardClientShell sessionUser={sessionUser}>
      {children}
    </DashboardClientShell>
  );
}
