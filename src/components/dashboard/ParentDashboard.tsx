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
      (p) =>
        (p.email && currentUser.email && p.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (p.fullName && currentUser.name && p.fullName.toLowerCase() === currentUser.name.toLowerCase()) ||
        p.id === currentUser.id
    ) || {
      id: currentUser.id || '',
      fullName: currentUser.name || 'Parent',
      email: currentUser.email || '',
      phone: '',
      address: '',
      wardsCount: 0,
      wardIds: [] as string[],
      dateRegistered: new Date().toISOString().split('T')[0],
      status: 'ACTIVE' as const,
    };

  // Linked Wards
  const childrenList = students.filter(
    (s) => (currentParent.id && s.guardianId === currentParent.id) || currentParent.wardIds?.includes(s.id)
  );

  const [selectedChildId, setSelectedChildId] = useState<string>(childrenList[0]?.id || '');
  const activeChild = childrenList.find((w) => w.id === selectedChildId) || childrenList[0] || null;

  const childGrades = activeChild ? grades.filter((g) => g.studentId === activeChild.id) : [];
  const childTahfiz = activeChild ? tahfizRecords.filter((r) => r.studentId === activeChild.id) : [];

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
        title={`Assalamu Alaikum, ${currentParent.fullName || 'Parent'}`}
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
      {childrenList.length > 0 ? (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 border-b border-slate-200 dark:border-emerald-800/40 pb-3 font-poppins">
            <span className="text-xs font-bold text-slate-800 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-1.5 shrink-0">
              <Baby className="w-4 h-4 text-amber-500" /> Select Child:
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {childrenList.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`px-3 sm:px-4 py-2 rounded-xl sm:rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
                    activeChild?.id === child.id
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
          {activeChild && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                title="Juz Memorized"
                value={`${activeChild.hifzProgress?.juzCompleted || 0} / 30`}
                subtitle={`Current Target: ${activeChild.hifzProgress?.currentSurah || 'N/A'}`}
                icon={<BookOpen className="w-5 h-5" />}
                variant="emerald"
              />

              <StatCard
                title="Sabki Revision Score"
                value={`★ ${activeChild.hifzProgress?.sabkiRating || 0} / 5`}
                subtitle="Daily Hifz Retention Rating"
                icon={<Star className="w-5 h-5" />}
                variant="sky"
              />

              <StatCard
                title="Akhlaq Rating"
                value={activeChild.akhlaqRating || 'N/A'}
                subtitle="Evaluated by Class Teacher"
                icon={<Sparkles className="w-5 h-5" />}
                variant="amber"
              />
            </div>
          )}
        </>
      ) : (
        <div className="p-8 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/20 text-center space-y-2">
          <Baby className="w-10 h-10 text-amber-500/50 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Linked Ward Profiles Yet</h3>
          <p className="text-xs text-slate-500 dark:text-emerald-300/70 max-w-md mx-auto">
            Once your child is enrolled by the administration and linked to your guardian account, their Tahfiz and academic progress will appear here.
          </p>
        </div>
      )}

      {/* Colorful Quick Action Shortcuts */}
      <QuickActionGrid items={parentActions} />

      {/* Child Subject Grades Table */}
      {activeChild && (
        <EnterpriseTable
          title={`Academic Performance: ${activeChild.fullName}`}
          subtitle={`Class: ${activeChild.className} • Admission: ${activeChild.admissionNo}`}
          columns={gradeColumns}
          data={childGrades}
          searchPlaceholder="Search subject grade..."
        />
      )}
    </PortalTheme>
  );
}
