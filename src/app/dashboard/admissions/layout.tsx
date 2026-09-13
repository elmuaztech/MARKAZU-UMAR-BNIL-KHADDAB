import React from 'react';
import { getServerSessionUser } from '@/lib/serverAuth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AdmissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser) {
    redirect('/login?redirect=/dashboard/admissions');
  }

  // Admissions management restricted to SUPER_ADMIN and ADMIN
  if (sessionUser.role !== 'SUPER_ADMIN' && sessionUser.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
