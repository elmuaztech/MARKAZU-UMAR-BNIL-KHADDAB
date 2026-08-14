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
  Sparkles,
  CheckCircle,
  Star,
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
      label: 'My Hifz Progress',
      labelArabic: 'تقدم الحفظ',
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
      label: 'My Subjects',
      labelArabic: 'المواد الدراسية',
      href: '/dashboard/subjects',
      icon: BookOpen,
      color: 'from-emerald-600 to-emerald-700',
    },
    {
      label: 'Attendance History',
      labelArabic: 'سجل الحضور',
      href: '/dashboard/attendance',
      icon: CalendarCheck,
      color: 'from-sky-600 to-sky-700',
    },
    {
      label: 'My Messages & Notices',
      labelArabic: 'الإعلانات والرسائل',
      href: '/dashboard/messages',
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
          description="Assalamu Alaikum. No student academic record is currently assigned to this account in the database."
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
        description={`${student.className} • Memorization Target: ${student.hifzProgress.currentSurah}. Consistent progress in Tahfiz and Islamiyya streams.`}
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
          title="Juz Memorized"
          value={`${student.hifzProgress.juzCompleted} / 30`}
          subtitle={`${((student.hifzProgress.juzCompleted / 30) * 100).toFixed(0)}% Roadmap Completed`}
          icon={<BookOpen className="w-5 h-5" />}
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
          icon={<Sparkles className="w-5 h-5" />}
          variant="amber"
        />
      </div>

      {/* 30-Juz Progress Roadmap */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200/90 dark:border-emerald-500/30 shadow-md space-y-4 font-poppins">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-emerald-500" /> 30-Juz Qur'an Memorization Roadmap
          </h3>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
            Target: {student.hifzProgress.currentSurah}
          </span>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
          {Array.from({ length: 30 }, (_, i) => i + 1).map((juzNum) => {
            const isCompleted = juzNum <= student.hifzProgress.juzCompleted;
            const isCurrent = juzNum === student.hifzProgress.currentJuz;
            return (
              <div
                key={juzNum}
                className={`p-2 rounded-2xl text-center border transition-all ${
                  isCompleted
                    ? 'bg-gradient-to-br from-emerald-600 to-emerald-800 border-emerald-400 text-white shadow-sm'
                    : isCurrent
                    ? 'bg-gradient-to-br from-amber-500 to-amber-700 border-amber-300 text-white animate-pulse shadow-sm'
                    : 'bg-slate-50 dark:bg-emerald-950/40 border-slate-200 dark:border-emerald-800/40 text-slate-400 dark:text-emerald-500/60'
                }`}
              >
                <span className="text-[10px] font-bold block uppercase">Juz</span>
                <span className="text-sm font-black">{juzNum}</span>
                {isCompleted ? (
                  <Check className="w-3 h-3 mx-auto mt-0.5 text-emerald-100" />
                ) : isCurrent ? (
                  <Star className="w-3 h-3 mx-auto mt-0.5 text-amber-100 fill-amber-100" />
                ) : null}
              </div>
            );
          })}
        </div>
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
