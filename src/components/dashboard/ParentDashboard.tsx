'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { PortalTheme } from '@/components/ui/PortalTheme';
import { PortalHeroBanner } from '@/components/ui/PortalHeroBanner';
import { QuickActionGrid, QuickActionItem } from '@/components/ui/QuickActionCard';
import { EnterpriseTable, Column } from '@/components/ui/EnterpriseTable';
import { NoticeBoardWidget } from './NoticeBoardWidget';
import { StatCard } from '@/components/ui/Card';
import { GradeRecord, Student } from '@/types';
import {
  HeartHandshake,
  BookOpen,
  Award,
  CalendarCheck,
  Download,
  Users,
  Star,
  CheckCircle,
  Bell,
  Baby,
  FileSpreadsheet,
  MessageSquare,
  Sparkles,
} from 'lucide-react';

export function ParentDashboard() {
  const { students, grades, tahfizRecords, currentUser, parents } = useApp();

  const currentParent =
    parents.find(
      (p) => p.email.toLowerCase() === currentUser.email.toLowerCase() || p.fullName.toLowerCase() === currentUser.name.toLowerCase()
    ) || parents[0];

  // Linked Wards
  const childrenList = students.filter(
    (s) => s.guardianId === currentParent.id || currentParent.wardIds?.includes(s.id)
  );

  const [selectedChildId, setSelectedChildId] = useState<string>(childrenList[0]?.id || '');
  const activeChild = childrenList.find((w) => w.id === selectedChildId) || childrenList[0] || students[0];

  const childGrades = grades.filter((g) => g.studentId === activeChild.id);
  const childTahfiz = tahfizRecords.filter((r) => r.studentId === activeChild.id);

  const parentActions: QuickActionItem[] = [
    {
      label: 'Child Hifz Tracker',
      labelArabic: 'متابعة حفظ الطفل',
      href: '/dashboard/tahfiz',
      icon: BookOpen,
      color: 'from-emerald-600 to-emerald-700',
    },
    {
      label: 'Report Sheet Center',
      labelArabic: 'مركز كشوف الدرجات',
      href: '/dashboard/results',
      icon: Award,
      color: 'from-amber-600 to-amber-700',
    },
    {
      label: 'Attendance Record',
      labelArabic: 'سجل الحضور',
      href: '/dashboard/attendance',
      icon: CalendarCheck,
      color: 'from-sky-600 to-sky-700',
    },
    {
      label: 'Teacher Messages',
      labelArabic: 'رسائل المعلمين',
      href: '/dashboard/messages',
      icon: MessageSquare,
      color: 'from-purple-600 to-purple-700',
    },
    {
      label: 'Parent Inbox & Notices',
      labelArabic: 'الإشعارات والرسائل',
      href: '/dashboard/messages',
      icon: Bell,
      color: 'from-indigo-600 to-indigo-700',
    },
  ];

  const gradeColumns: Column<GradeRecord>[] = [
    {
      header: 'Subject',
      cell: (g) => <span className="font-bold text-slate-900 dark:text-white">{g.subjectName}</span>,
    },
    {
      header: 'Continuous Assessment',
      cell: (g) => (
        <span className="text-slate-600 dark:text-emerald-300">
          CA1: {g.ca1Score} / 20 | CA2: {g.ca2Score} / 20
        </span>
      ),
    },
    {
      header: 'Exam Score',
      cell: (g) => <span className="font-semibold text-slate-700 dark:text-emerald-200">{g.examScore} / 60</span>,
    },
    {
      header: 'Overall Grade',
      align: 'right',
      cell: (g) => (
        <span className="font-black px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20">
          Grade {g.grade} ({g.totalScore}%)
        </span>
      ),
    },
  ];

  return (
    <PortalTheme>
      <PortalHeroBanner
        badgeText="Parent & Guardian Portal"
        badgeIcon={HeartHandshake}
        title={`Assalamu Alaikum, ${currentParent.fullName}`}
        description={`Tracking academic performance, Tahfiz progress, and attendance for ${childrenList.length} enrolled children at Markazu Umar School.`}
        actions={
          <Link
            href="/dashboard/results"
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
          >
            <Award className="w-4 h-4" />
            <span>View Approved Report Sheets</span>
          </Link>
        }
      />

      {/* Official Notice Board */}
      <NoticeBoardWidget />

      {/* Child Switcher Bar */}
      <div className="flex items-center gap-3 border-b border-slate-200 dark:border-emerald-800/40 pb-3 font-poppins">
        <span className="text-xs font-bold text-slate-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
          <Baby className="w-4 h-4 text-amber-500" /> Select Child:
        </span>
        <div className="flex items-center gap-2">
          {childrenList.map((child) => (
            <button
              key={child.id}
              onClick={() => setSelectedChildId(child.id)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
                activeChild.id === child.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105'
                  : 'bg-white dark:bg-emerald-950/60 text-slate-700 dark:text-emerald-200 border-slate-200 dark:border-emerald-800/40 hover:bg-emerald-100/60'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>
                {child.fullName} ({child.className})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Child KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Juz Memorized"
          value={`${activeChild.hifzProgress.juzCompleted} / 30`}
          subtitle={`Current Target: ${activeChild.hifzProgress.currentSurah}`}
          icon={<BookOpen className="w-5 h-5" />}
          variant="emerald"
        />

        <StatCard
          title="Sabki Revision Score"
          value={`★ ${activeChild.hifzProgress.sabkiRating} / 5`}
          subtitle="Daily Hifz Retention Rating"
          icon={<Star className="w-5 h-5" />}
          variant="sky"
        />

        <StatCard
          title="Akhlaq Rating"
          value={activeChild.akhlaqRating}
          subtitle="Evaluated by Class Teacher"
          icon={<Sparkles className="w-5 h-5" />}
          variant="amber"
        />
      </div>

      {/* Colorful Quick Action Shortcuts */}
      <QuickActionGrid items={parentActions} />

      {/* Child Subject Grades Table */}
      <EnterpriseTable
        title={`Academic Performance: ${activeChild.fullName}`}
        subtitle={`Class: ${activeChild.className} • Admission: ${activeChild.admissionNo}`}
        columns={gradeColumns}
        data={childGrades}
        searchPlaceholder="Search subject grade..."
      />
    </PortalTheme>
  );
}
