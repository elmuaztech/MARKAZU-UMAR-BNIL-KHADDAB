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
  CheckCircle,
  Bell,
  Baby,
  FileSpreadsheet,
  MessageSquare,
  ShieldCheck,
  CreditCard,
  ArrowRight,
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

  const [financeWards, setFinanceWards] = useState<any[]>([]);

  React.useEffect(() => {
    fetch('/api/parent/finance')
      .then((res) => res.json())
      .then((json) => {
        if (json.status === 'success' && json.data?.wards) {
          setFinanceWards(json.data.wards);
        }
      })
      .catch(() => {});
  }, []);

  const childGrades = activeChild ? grades.filter((g) => g.studentId === activeChild.id) : [];
  const childTahfiz = activeChild ? tahfizRecords.filter((r) => r.studentId === activeChild.id) : [];

  const parentActions: QuickActionItem[] = [
    {
      label: 'School Fees & Tuition',
      labelArabic: 'الرسوم المدرسية',
      href: '/dashboard/finance',
      icon: CreditCard,
      color: 'from-emerald-600 to-emerald-700',
    },
    {
      label: 'Attendance History',
      labelArabic: 'سجل الحضور',
      href: '/dashboard/attendance',
      icon: CalendarCheck,
      color: 'from-teal-600 to-teal-700',
    },
    {
      label: 'Report Cards',
      labelArabic: 'بطاقات التقرير',
      href: '/dashboard/results',
      icon: Award,
      color: 'from-amber-600 to-amber-700',
    },
    {
      label: 'Academic Subjects',
      labelArabic: 'المواد الدراسية',
      href: '/dashboard/subjects',
      icon: BookOpen,
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

  const gradeColumns: Column<GradeRecord>[] = [
    {
      header: 'Subject',
      cell: (g: GradeRecord) => <span className="font-semibold text-slate-900 dark:text-white">{g.subjectName || g.subjectId}</span>,
    },
    {
      header: 'CA 1 (20)',
      align: 'center',
      cell: (g: GradeRecord) => <span className="font-mono">{g.ca1Score}</span>,
    },
    {
      header: 'CA 2 (20)',
      align: 'center',
      cell: (g: GradeRecord) => <span className="font-mono">{g.ca2Score}</span>,
    },
    {
      header: 'Exam (60)',
      align: 'center',
      cell: (g: GradeRecord) => <span className="font-mono">{g.examScore}</span>,
    },
    {
      header: 'Total Score (100)',
      align: 'center',
      cell: (g: GradeRecord) => (
        <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">
          {g.totalScore}
        </span>
      ),
    },
    {
      header: 'Grade',
      align: 'center',
      cell: (g: GradeRecord) => (
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-bold ${
            g.grade === 'A'
              ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300'
              : g.grade === 'B'
              ? 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300'
              : g.grade === 'C'
              ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300'
              : 'bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-300'
          }`}
        >
          {g.grade}
        </span>
      ),
    },
    {
      header: 'Remarks',
      cell: (g: GradeRecord) => <span className="text-xs text-slate-500 dark:text-emerald-200/70">{g.remarks || 'Satisfactory'}</span>,
    },
  ];

  return (
    <PortalTheme>
      <PortalHeroBanner
        title={`Assalamu Alaykum, ${currentParent.fullName}`}
        titleArabic="أهلاً وسهلاً بكم في بوابة ولي الأمر"
        description="Monitor your child's academic performance, term report cards, daily attendance, and school announcements in real time."
        badgeText="Guardian Portal"
        badgeIcon={HeartHandshake}
      />

      {/* Official Notice Board */}
      <NoticeBoardWidget />

      {/* Child Switcher Selector */}
      {childrenList.length > 0 ? (
        <>
          <div className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/20 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-emerald-400">
                Enrolled Children ({childrenList.length})
              </span>
              <span className="text-xs text-slate-400 dark:text-emerald-500">
                Click a child to inspect details
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {childrenList.map((child) => (
                <button
                  key={child.id}
                  onClick={() => setSelectedChildId(child.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
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
                title="Class & Level"
                value={activeChild.className || 'Assigned'}
                subtitle={`Admission No: ${activeChild.admissionNo || 'N/A'}`}
                icon={<BookOpen className="w-5 h-5" />}
                variant="emerald"
              />

              <StatCard
                title="Academic Status"
                value={activeChild.status === 'ACTIVE' ? 'Active' : activeChild.status || 'Enrolled'}
                subtitle="Current Term Enrollment"
                icon={<Award className="w-5 h-5" />}
                variant="sky"
              />

              <StatCard
                title="Akhlaq Rating"
                value={activeChild.akhlaqRating || 'Good'}
                subtitle="Evaluated by Class Teacher"
                icon={<ShieldCheck className="w-5 h-5" />}
                variant="amber"
              />
            </div>

            {/* Ward Tuition Status Card */}
            {(() => {
              const activeWardFinance = financeWards.find((w) => w.studentId === activeChild.id);
              if (!activeWardFinance) return null;

              const isPaid = activeWardFinance.isPaidProgramme;
              const balance = activeWardFinance.outstandingBalance || 0;

              return (
                <div className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/20 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-emerald-400 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4 text-emerald-500" />
                      Tuition & Fee Status: {activeChild.fullName}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isPaid
                          ? balance > 0
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                          : 'bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-300'
                      }`}
                    >
                      {isPaid ? (balance > 0 ? 'School Fee Due' : 'Paid in Full') : 'Waqf Sponsored (Free)'}
                    </span>
                  </div>

                  {isPaid ? (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-900/40 text-center">
                        <span className="text-[10px] text-slate-400 dark:text-emerald-400 block font-semibold">School Fee</span>
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          ₦{activeWardFinance.schoolFee?.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-900/40 text-center">
                        <span className="text-[10px] text-slate-400 dark:text-emerald-400 block font-semibold">Amount Paid</span>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          ₦{activeWardFinance.amountPaid?.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-900/40 text-center">
                        <span className="text-[10px] text-slate-400 dark:text-emerald-400 block font-semibold">Balance Due</span>
                        <span className={`text-xs font-black ${balance > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          ₦{balance.toLocaleString()}
                        </span>
                      </div>
                      <div>
                        <Link
                          href="/dashboard/finance"
                          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all"
                        >
                          <span>{balance > 0 ? 'Pay Online' : 'View Receipts'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 text-[11px] text-sky-800 dark:text-sky-200 flex items-center justify-between">
                      <p>
                        This student is enrolled in a community-sponsored Waqf programme. <strong>No school fee is payable.</strong>
                      </p>
                      <Link
                        href="/dashboard/finance"
                        className="text-xs font-bold text-sky-700 dark:text-sky-300 hover:underline flex items-center gap-1 shrink-0 ml-2"
                      >
                        <span>Ledger</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })()}
          )}
        </>
      ) : (
        <div className="p-8 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/20 text-center space-y-2">
          <Baby className="w-10 h-10 text-amber-500/50 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Enrolled Children Found</h3>
          <p className="text-xs text-slate-500 dark:text-emerald-300/70 max-w-md mx-auto">
            Once your child is enrolled by the administration and linked to your guardian account, their academic progress and attendance records will appear here.
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
