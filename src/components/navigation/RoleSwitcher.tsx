'use client';

import React from 'react';
import { useApp } from '../../lib/context';
import { ShieldCheck, UserCheck, GraduationCap, HeartHandshake, Lock } from 'lucide-react';

export function RoleSwitcher() {
  const { currentUser } = useApp();

  const roleConfigs: Record<string, { label: string; icon: any; colorClass: string }> = {
    SUPER_ADMIN: {
      label: 'Super Admin',
      icon: ShieldCheck,
      colorClass: 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    },
    ADMIN: {
      label: 'School Admin',
      icon: ShieldCheck,
      colorClass: 'bg-teal-500/20 text-teal-700 dark:text-teal-300 border-teal-500/30',
    },
    TEACHER: {
      label: 'Teacher Portal',
      icon: UserCheck,
      colorClass: 'bg-sky-500/20 text-sky-700 dark:text-sky-300 border-sky-500/30',
    },
    STUDENT: {
      label: 'Student Portal',
      icon: GraduationCap,
      colorClass: 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30',
    },
    PARENT: {
      label: 'Parent Portal',
      icon: HeartHandshake,
      colorClass: 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30',
    },
  };

  const currentRole = (currentUser.role as string) === 'SUPER_ADMIN' ? 'SUPER_ADMIN' : currentUser.role;
  const config = roleConfigs[currentRole] || roleConfigs.ADMIN;
  const Icon = config.icon;

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold shrink-0 whitespace-nowrap shadow-xs ${config.colorClass}`}>
      <Icon className="w-4 h-4 flex-shrink-0" />
      <span>{config.label}</span>
    </div>
  );
}
