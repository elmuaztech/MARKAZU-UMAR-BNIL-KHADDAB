import React from 'react';
import { getServerSessionUser } from '@/lib/serverAuth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function AcademicSessionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser) {
    redirect('/login?redirect=/dashboard/sessions');
  }

  // Academic sessions are strictly managed by SUPER_ADMIN
  if (sessionUser.role !== 'SUPER_ADMIN') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
