'use client';

import React from 'react';
import { useApp } from '../../lib/context';
import { AdminDashboard } from '../../components/dashboard/AdminDashboard';
import { HeadmasterDashboard } from '../../components/dashboard/HeadmasterDashboard';
import { TeacherDashboard } from '../../components/dashboard/TeacherDashboard';
import { StudentDashboard } from '../../components/dashboard/StudentDashboard';
import { ParentDashboard } from '../../components/dashboard/ParentDashboard';

export default function DashboardPage() {
  const { currentUser } = useApp();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  switch (currentUser.role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return <AdminDashboard />;
    case 'HEADMASTER':
      return <HeadmasterDashboard />;
    case 'TEACHER':
      return <TeacherDashboard />;
    case 'STUDENT':
      return <StudentDashboard />;
    case 'PARENT':
      return <ParentDashboard />;
    default:
      return <StudentDashboard />;
  }
}
