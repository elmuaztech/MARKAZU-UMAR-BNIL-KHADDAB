'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { PortalTheme } from '@/components/ui/PortalTheme';
import { PortalHeroBanner } from '@/components/ui/PortalHeroBanner';
import { QuickActionGrid, QuickActionItem } from '@/components/ui/QuickActionCard';
import { EnterpriseTable, Column } from '@/components/ui/EnterpriseTable';
import { NoticeBoardWidget } from './NoticeBoardWidget';
import { TimetableWidget } from '@/components/timetable/TimetableWidget';
import { StatCard } from '@/components/ui/Card';
import { BilingualText } from '@/components/ui/BilingualText';
import { Student } from '@/types';
import {
  BookOpen,
  CalendarCheck,
  Award,
  Users,
  CheckCircle2,
  Clock,
  UserCheck,
  FilePlus,
  ArrowUpRight,
  School,
  Layers,
  MessageSquare,
  Bell,
  User,
} from 'lucide-react';

export function TeacherDashboard() {
  const { currentUser, teachers, programmes, classes, subjects, teacherAssignments, students } = useApp();

  const currentTeacher =
    teachers.find(
      (t) =>
        t.id === currentUser.id ||
        (t.userId && t.userId === currentUser.id) ||
        (t.email && currentUser.email && t.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (t.staffNo && currentUser.username && t.staffNo.toLowerCase() === currentUser.username.toLowerCase()) ||
        (t.fullName && currentUser.name && t.fullName.toLowerCase() === currentUser.name.toLowerCase()) ||
        (t.full_name_english && currentUser.name && t.full_name_english.toLowerCase() === currentUser.name.toLowerCase())
    ) || {
      id: currentUser.id,
      userId: currentUser.id,
      staffNo: currentUser.username || '',
      fullName: currentUser.name,
      full_name_english: currentUser.name,
      full_name_arabic: '',
      email: currentUser.email,
      phone: '',
      programmeIds: currentUser.assignedProgrammeId ? [currentUser.assignedProgrammeId] : [],
      classesAssigned: [],
      subjectsAssigned: [],
      dateJoined: new Date().toISOString().split('T')[0],
      status: 'ACTIVE' as const,
    };

  // Scoped assignments for the logged in Teacher
  const myAssignments = teacherAssignments.filter(
    (ta) =>
      ta.teacherId === currentTeacher.id ||
      ta.teacherId === currentUser.id ||
      (currentUser.email && ta.teacherId.toLowerCase() === currentUser.email.toLowerCase()) ||
      (currentUser.username && ta.teacherId.toLowerCase() === currentUser.username.toLowerCase())
  );

  const directProgrammeIds = currentTeacher.programmeIds || [];
  const directClassIds = currentTeacher.classesAssigned || [];

  const rawAssignedClassIds = Array.from(
    new Set([...myAssignments.map((ta) => ta.classId), ...directClassIds])
  );

  // Match classes by ID, Name, or classTeacherId
  const myClasses = classes.filter(
    (c) =>
      rawAssignedClassIds.includes(c.id) ||
      rawAssignedClassIds.includes(c.name) ||
      c.classTeacherId === currentTeacher.id ||
      c.classTeacherId === currentUser.id
  );

  const assignedProgrammeIds = Array.from(
    new Set([
      ...myClasses.map((c) => c.programmeId).filter(Boolean),
      ...myAssignments.map((ta) => ta.programmeId),
      ...directProgrammeIds,
    ])
  );

  const myProgrammes = programmes.filter(
    (p) => assignedProgrammeIds.includes(p.id)
  );

  const [selectedProgId, setSelectedProgId] = useState<string>(myProgrammes[0]?.id || 'ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>(myClasses[0]?.id || 'ALL');

  // Scoped classes & subjects under selected Programme
  const filteredMyClasses = myClasses.filter((c) => selectedProgId === 'ALL' || c.programmeId === selectedProgId);

  const myClassIdsAndNames = new Set([
    ...myClasses.map((c) => c.id),
    ...myClasses.map((c) => c.name),
  ]);

  const teacherStudents = students.filter(
    (s) =>
      myClassIdsAndNames.has(s.classId) ||
      (s.className && myClassIdsAndNames.has(s.className)) ||
      (s.class_name && myClassIdsAndNames.has(s.class_name))
  );

  const quickActions: QuickActionItem[] = [
    {
      label: 'Log Daily Hifz',
      labelArabic: 'تسجيل الحفظ اليومي',
      href: '/dashboard/tahfiz',
      icon: BookOpen,
      color: 'from-emerald-600 to-emerald-700',
    },
    {
      label: 'Mark Attendance',
      labelArabic: 'تسجيل الحضور',
      href: '/dashboard/attendance',
      icon: CalendarCheck,
      color: 'from-amber-600 to-amber-700',
    },
    {
      label: 'Enter Grades',
      labelArabic: 'رصد الدرجات',
      href: '/dashboard/assessment',
      icon: Award,
      color: 'from-sky-600 to-sky-700',
    },
    {
      label: 'Student Messaging',
      labelArabic: 'رسائل الطلاب',
      href: '/dashboard/messages',
      icon: MessageSquare,
      color: 'from-purple-600 to-purple-700',
    },
    {
      label: 'Downloads Center',
      labelArabic: 'مركز التحميلات',
      href: '/dashboard/downloads',
      icon: Bell,
      color: 'from-indigo-600 to-indigo-700',
    },
  ];

  const columns: Column<Student>[] = [
    {
      header: 'Student Name',
      cell: (s) => (
        <div>
          <p className="font-bold text-slate-900 dark:text-white">{s.fullName}</p>
          <p className="text-[10px] text-slate-500 dark:text-emerald-300/70">Admission: {s.admissionNo}</p>
        </div>
      ),
    },
    {
      header: 'Assigned Class',
      cell: (s) => <span className="font-bold text-slate-700 dark:text-emerald-200">{s.className}</span>,
    },
    {
      header: 'Current Hifz Target',
      cell: (s) => <span className="font-semibold text-amber-600 dark:text-amber-300">{s.hifzProgress.currentSurah}</span>,
    },
    {
      header: 'Juz Completed',
      cell: (s) => (
        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold">
          {s.hifzProgress.juzCompleted} / 30 Juz
        </span>
      ),
    },
    {
      header: 'Action',
      align: 'right',
      cell: (s) => (
        <Link
          href="/dashboard/tahfiz"
          className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all"
        >
          Update Log
        </Link>
      ),
    },
  ];

  return (
    <PortalTheme>
      <PortalHeroBanner
        badgeText="Teacher & Educator Portal"
        badgeIcon={UserCheck}
        title={`Assalamu Alaikum, ${currentTeacher.full_name_english || currentUser.name || 'Teacher'}`}
        titleArabic={currentTeacher.full_name_arabic}
        description="Teacher Command Portal: Scoped exclusively to your assigned Programmes, Classes, and Subjects. Manage daily Hifz, Muraja'ah, class attendance, and grade entries."
        actions={
          <Link
            href="/dashboard/tahfiz"
            className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
          >
            <BookOpen className="w-4 h-4" />
            <span>Log Daily Hifz & Sabki</span>
          </Link>
        }
      />

      {/* Official Notice Board */}
      <NoticeBoardWidget />

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Assigned Programmes"
          value={myProgrammes.length}
          subtitle="Master Academic Streams"
          icon={<Layers className="w-5 h-5" />}
          variant="emerald"
        />

        <StatCard
          title="Assigned Classes"
          value={myClasses.length}
          subtitle="Active Teaching Groups"
          icon={<School className="w-5 h-5" />}
          variant="sky"
        />

        <StatCard
          title="Allocated Students"
          value={teacherStudents.length}
          subtitle="Students under your care"
          icon={<Users className="w-5 h-5" />}
          variant="amber"
        />
      </div>

      {/* Section E: Teacher Portal Scoped Programme & Class Selector */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-4 font-poppins">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-500" /> My Assigned Academic Load
          </h3>
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            Class Scoped
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {myProgrammes.map((p) => {
            const isSelected = selectedProgId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setSelectedProgId(p.id);
                  const firstCls = myClasses.find((c) => c.programmeId === p.id);
                  if (firstCls) setSelectedClassId(firstCls.id);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-slate-100 dark:bg-[#021810] text-slate-700 dark:text-emerald-200 border border-slate-200 dark:border-emerald-500/20'
                }`}
              >
                <BilingualText
                  english={`${p.programme_name_english || p.programme_name} (${p.programme_code})`}
                  arabic={p.programme_name_arabic}
                  inline
                  englishClassName="font-bold text-xs"
                  arabicClassName="font-arabic text-[11px] ml-1"
                />
              </button>
            );
          })}
        </div>

        {/* Classes List under selected Programme */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {filteredMyClasses.map((c) => {
            const classStudentCount = teacherStudents.filter((s) => s.classId === c.id).length;
            return (
              <div
                key={c.id}
                onClick={() => setSelectedClassId(c.id)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedClassId === c.id
                    ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 dark:bg-[#021810] border-slate-200 dark:border-emerald-500/20 hover:border-emerald-500'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-slate-900 dark:text-white text-xs">{c.name}</span>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                    {classStudentCount} Students
                  </span>
                </div>
                <p className="font-arabic text-amber-600 dark:text-amber-300 text-[11px] font-semibold">{c.class_name_arabic}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Timetable Widget */}
      <TimetableWidget />

      {/* Colorful Quick Actions Grid */}
      <QuickActionGrid items={quickActions} />

      {/* Allocated Student Table */}
      <EnterpriseTable
        title="Assigned Halqa & Class Roster"
        subtitle="Students in your active assigned classes"
        columns={columns}
        data={teacherStudents}
        searchPlaceholder="Search student name or admission number..."
      />
    </PortalTheme>
  );
}
