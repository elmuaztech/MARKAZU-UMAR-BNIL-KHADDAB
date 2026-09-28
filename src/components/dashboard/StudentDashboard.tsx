'use client';

import React from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { PortalTheme } from '@/components/ui/PortalTheme';
import { PortalHeroBanner } from '@/components/ui/PortalHeroBanner';
import { QuickActionGrid, QuickActionItem } from '@/components/ui/QuickActionCard';
import { EnterpriseTable, Column } from '@/components/ui/EnterpriseTable';
import { NoticeBoardWidget } from './NoticeBoardWidget';
import { TimetableWidget } from '@/components/timetable/TimetableWidget';
import { StatCard } from '@/components/ui/Card';
import { GradeRecord } from '@/types';
import {
  BookOpen,
  Award,
  CalendarCheck,
  GraduationCap,
  CheckCircle,
  Clock,
  Download,
  Check,
  Bell,
  FileText,
  User,
} from 'lucide-react';

export function StudentDashboard() {
  const { currentUser, students, grades, tahfizRecords } = useApp();

  const student = students.find(
    (s) =>
      s.userId === currentUser.id ||
      s.id === currentUser.id ||
      (s.email && currentUser.email && s.email.toLowerCase() === currentUser.email.toLowerCase()) ||
      (s.admissionNo && currentUser.username && s.admissionNo.toLowerCase() === currentUser.username.toLowerCase())
  );
  const studentGrades = student ? grades.filter((g) => g.studentId === student.id) : [];

  const studentActions: QuickActionItem[] = [
    {
      label: 'Report Sheet Center',
      labelArabic: 'مركز كشوف الدرجات',
      href: '/dashboard/results',
      icon: Award,
      color: 'from-amber-600 to-amber-700',
    },
    {
      label: 'Attendance History',
      labelArabic: 'سجل الحضور',
      href: '/dashboard/attendance',
      icon: CalendarCheck,
      color: 'from-sky-600 to-sky-700',
    },
    {
      label: 'Announcements',
      labelArabic: 'الإعلانات والرسائل',
      href: '/dashboard/communication/notifications',
      icon: Bell,
      color: 'from-purple-600 to-purple-700',
    },
  ];

  const columns: Column<GradeRecord>[] = [
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
      header: 'Total Score & Grade',
      align: 'right',
      cell: (g) => (
        <span className="font-black px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20">
          Grade {g.grade} ({g.totalScore}%)
        </span>
      ),
    },
  ];

  if (!student) {
    return (
      <PortalTheme>
        <PortalHeroBanner
          badgeText="Student Portal"
          badgeIcon={GraduationCap}
          title={currentUser.name || "Student"}
          description="Assalamu Alaikum. No student academic record is currently assigned to this account yet."
        />
        <NoticeBoardWidget />
        <div className="p-8 rounded-3xl bg-white dark:bg-[#042419] border border-dashed border-slate-200 dark:border-emerald-500/20 text-center space-y-2">
          <GraduationCap className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="font-black text-slate-900 dark:text-white text-base">No Student Profile Linked</h3>
          <p className="text-xs text-slate-500 dark:text-emerald-300/70 max-w-md mx-auto">
            Your account is active, but you have not yet been enrolled in an active class or programme. Please contact the school administration.
          </p>
        </div>
      </PortalTheme>
    );
  }

  return (
    <PortalTheme>
      <PortalHeroBanner
        badgeText={`Student Profile • ${student.admissionNo}`}
        badgeIcon={GraduationCap}
        title={student.fullName}
        titleArabic={student.fullNameArabic}
        description={`${student.className} • Admission: ${student.admissionNo}. Comprehensive Islamic and Arabic academic studies.`}
        actions={
          <Link
            href="/dashboard/results"
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
          >
            <Award className="w-4 h-4" />
            <span>View Approved Report Sheet</span>
          </Link>
        }
      />

      {/* Official Notice Board */}
      <NoticeBoardWidget />

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Class Enrollment"
          value={student.className}
          subtitle={`Admission: ${student.admissionNo}`}
          icon={<GraduationCap className="w-5 h-5" />}
          variant="emerald"
        />

        <StatCard
          title="Punctuality Score"
          value="98%"
          subtitle="Fajr & Morning Register"
          icon={<CalendarCheck className="w-5 h-5" />}
          variant="sky"
        />

        <StatCard
          title="Akhlaq Rating"
          value={student.akhlaqRating}
          subtitle="Islamic Conduct & Discipline"
          icon={<Award className="w-5 h-5" />}
          variant="amber"
        />
      </div>

      {/* Timetable Schedule Widget */}
      <TimetableWidget />

      {/* Colorful Quick Action Shortcuts */}
      <QuickActionGrid items={studentActions} />

      {/* Academic Grade Table */}
      <EnterpriseTable
        title="Term 2 Academic Performance"
        subtitle="Detailed breakdown of Continuous Assessment and Exam scores"
        columns={columns}
        data={studentGrades}
        searchPlaceholder="Search subject..."
      />
    </PortalTheme>
  );
}
