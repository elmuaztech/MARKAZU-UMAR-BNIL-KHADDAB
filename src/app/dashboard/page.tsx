'use client';

import React from 'react';
import { useApp } from '../../lib/context';
import { AdminDashboard } from '../../components/dashboard/AdminDashboard';
import { TeacherDashboard } from '../../components/dashboard/TeacherDashboard';
import { StudentDashboard } from '../../components/dashboard/StudentDashboard';
import { ParentDashboard } from '../../components/dashboard/ParentDashboard';

export default function DashboardPage() {
  const { currentUser } = useApp();

  switch (currentUser.role) {
    case 'ADMIN':
      return <AdminDashboard />;
    case 'TEACHER':
      return <TeacherDashboard />;
    case 'STUDENT':
      return <StudentDashboard />;
    case 'PARENT':
      return <ParentDashboard />;
    default:
      return <AdminDashboard />;
  }
}
