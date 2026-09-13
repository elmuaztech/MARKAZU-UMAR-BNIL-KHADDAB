import React from 'react';
import { getServerSessionUser } from '@/lib/serverAuth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function HeadmasterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const sessionUser = await getServerSessionUser();
  if (!sessionUser) {
    redirect('/login?redirect=/headmaster');
  }

  if (sessionUser.role !== 'SUPER_ADMIN' && sessionUser.role !== 'HEADMASTER') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
