'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import {
  filterStudentsForUser,
  filterClassesForUser,
  filterTeachersForUser,
  filterAttendanceForUser,
  filterTahfizForUser,
} from '@/lib/rbac';
import {
  Crown,
  School,
  Users,
  GraduationCap,
  CalendarCheck,
  BookOpen,
  Award,
  MessageSquare,
  Sparkles,
  ArrowRight,
  UserCheck,
  Tag,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BilingualText } from '@/components/ui/BilingualText';
import { NoticeBoardWidget } from '@/components/dashboard/NoticeBoardWidget';

export function HeadmasterDashboard() {
  const {
    currentUser,
    programmes,
    classes,
    students,
    teachers,
    parents,
    attendance,
    tahfizRecords,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'teachers'>('overview');

  // Find Headmaster's Assigned Programme
  const assignedProg = programmes.find(
    (p) =>
      p.id === currentUser.assignedProgrammeId ||
      (p.programme_name_english &&
        currentUser.assignedProgrammeName &&
        p.programme_name_english.toLowerCase() === currentUser.assignedProgrammeName.toLowerCase()) ||
      (p.programme_name &&
        currentUser.assignedProgrammeName &&
        p.programme_name.toLowerCase() === currentUser.assignedProgrammeName.toLowerCase())
  );

  // Scoped Data
  const scopedStudents = filterStudentsForUser(currentUser, students, parents);
  const scopedClasses = filterClassesForUser(currentUser, classes);
  const scopedTeachers = filterTeachersForUser(currentUser, teachers);
  const scopedAttendance = filterAttendanceForUser(currentUser, attendance, scopedStudents);
  const scopedTahfiz = filterTahfizForUser(currentUser, tahfizRecords, scopedStudents);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayAttendance = scopedAttendance.filter((a) => a.date.startsWith(todayStr));
  const presentCount = todayAttendance.filter((a) => a.status === 'PRESENT').length;
  const attendanceRate =
    todayAttendance.length > 0 ? Math.round((presentCount / todayAttendance.length) * 100) : 100;

  return (
    <div className="space-y-6 font-sans">
      {/* Headmaster Programme Master Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#032015] via-[#064e3b] to-[#042f1e] p-6 sm:p-8 text-white border border-amber-500/40 shadow-2xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-xl bg-amber-500/25 text-amber-300 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 border border-amber-400/40 font-poppins">
                <Crown className="w-4 h-4 text-amber-400" />
                Headmaster Portal
              </span>
              {assignedProg && (
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-200 text-xs font-mono font-bold border border-emerald-400/30">
                  {assignedProg.programme_code}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black font-poppins text-white flex items-center gap-2">
              Welcome, {currentUser.name}
            </h1>

            {assignedProg ? (
              <div className="pt-1">
                <p className="text-xs text-emerald-200/80 font-medium">Assigned Academic Section:</p>
                <div className="text-xl sm:text-2xl font-black text-amber-400 font-poppins flex items-center gap-2">
                  <BilingualText
                    english={assignedProg.programme_name_english || assignedProg.programme_name}
                    arabic={assignedProg.programme_name_arabic}
                    inline
                    englishClassName="text-xl sm:text-2xl font-black text-white"
                    arabicClassName="text-lg text-amber-300 font-arabic font-bold ml-2"
                  />
                </div>
                <p className="text-xs text-emerald-100/80 mt-1 max-w-xl font-medium">
                  {assignedProg.description || 'Academic section governance, class streams, student tracking, and results management.'}
                </p>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-200 text-xs font-bold">
                ⚠️ No Programme Assignment Found. Please contact the Super Administrator to assign your account to a school programme.
              </div>
            )}
          </div>

          {/* Quick Section Badge Box */}
          {assignedProg && (
            <div className="bg-black/30 backdrop-blur-md rounded-2xl p-4 border border-emerald-500/30 space-y-2 text-right">
              <span className="text-[10px] uppercase font-bold text-emerald-300 tracking-wider">
                Section Governance
              </span>
              <div className="text-2xl font-black text-amber-400 font-poppins">
                {scopedStudents.length} Students
              </div>
              <p className="text-[11px] text-emerald-200/80 font-medium">
                across {scopedClasses.length} class streams
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Subcategories Badges if present */}
      {assignedProg?.hasSubcategories && assignedProg.subcategories && assignedProg.subcategories.length > 0 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-extrabold text-slate-800 dark:text-emerald-200">
              Active Subcategories in your Section:
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {assignedProg.subcategories.map((sub, idx) => {
              const count = scopedClasses.filter(
                (c) => c.subcategory?.toLowerCase() === sub.toLowerCase() || c.section?.toLowerCase() === sub.toLowerCase()
              ).length;
              return (
                <span
                  key={idx}
                  className="px-3 py-1 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-extrabold border border-emerald-500/20 flex items-center gap-1.5"
                >
                  <span>{sub}</span>
                  <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded-full font-mono">
                    {count} classes
                  </span>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Scoped Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-poppins">
        <motion.div
          whileHover={{ y: -4 }}
          className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-emerald-300/80 uppercase">
              Section Students
            </span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{scopedStudents.length}</p>
          <p className="text-[11px] text-slate-500 dark:text-emerald-300/70 font-medium">
            Enrolled in {assignedProg?.programme_name || 'Section'}
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-purple-300/80 uppercase">
              Class Streams
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <School className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{scopedClasses.length}</p>
          <p className="text-[11px] text-slate-500 dark:text-purple-300/70 font-medium">
            Active Classes in Section
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-sky-300/80 uppercase">
              Assigned Teachers
            </span>
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{scopedTeachers.length}</p>
          <p className="text-[11px] text-slate-500 dark:text-sky-300/70 font-medium">
            Teaching in this Section
          </p>
        </motion.div>

        <motion.div
          whileHover={{ y: -4 }}
          className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-2"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-amber-300/80 uppercase">
              Attendance Today
            </span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{attendanceRate}%</p>
          <p className="text-[11px] text-slate-500 dark:text-amber-300/70 font-medium">
            {todayAttendance.length > 0 ? `${presentCount} Present` : 'Ready for marking'}
          </p>
        </motion.div>
      </div>

      {/* Quick Action Hub */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
        <h2 className="text-base font-black font-poppins text-slate-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-amber-500" /> Quick Section Actions
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs font-poppins font-bold">
          <Link
            href="/dashboard/attendance"
            className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-200 flex flex-col items-center justify-center text-center gap-2 transition-all shadow-sm group"
          >
            <CalendarCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
            <span>Mark Attendance</span>
          </Link>

          <Link
            href="/dashboard/classes"
            className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-500/30 text-purple-800 dark:text-purple-200 flex flex-col items-center justify-center text-center gap-2 transition-all shadow-sm group"
          >
            <School className="w-6 h-6 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform" />
            <span>Manage Classes</span>
          </Link>

          <Link
            href="/dashboard/students"
            className="p-4 rounded-2xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/50 border border-sky-200 dark:border-sky-500/30 text-sky-800 dark:text-sky-200 flex flex-col items-center justify-center text-center gap-2 transition-all shadow-sm group"
          >
            <Users className="w-6 h-6 text-sky-600 dark:text-sky-400 group-hover:scale-110 transition-transform" />
            <span>Section Students</span>
          </Link>

          <Link
            href="/dashboard/tahfiz"
            className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200 flex flex-col items-center justify-center text-center gap-2 transition-all shadow-sm group"
          >
            <BookOpen className="w-6 h-6 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Tahfiz Progress</span>
          </Link>

          <Link
            href="/dashboard/results"
            className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/50 border border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200 flex flex-col items-center justify-center text-center gap-2 transition-all shadow-sm group"
          >
            <Award className="w-6 h-6 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform" />
            <span>Results & Reports</span>
          </Link>

          <Link
            href="/dashboard/subjects"
            className="p-4 rounded-2xl bg-teal-50 dark:bg-teal-950/40 hover:bg-teal-100 dark:hover:bg-teal-900/50 border border-teal-200 dark:border-teal-500/30 text-teal-800 dark:text-teal-200 flex flex-col items-center justify-center text-center gap-2 transition-all shadow-sm group"
          >
            <BookOpen className="w-6 h-6 text-teal-600 dark:text-teal-400 group-hover:scale-110 transition-transform" />
            <span>Section Subjects</span>
          </Link>
        </div>
      </div>

      {/* Class Stream Overview for this Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-poppins">
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <School className="w-5 h-5 text-emerald-500" />
                Classes under {assignedProg?.programme_name || 'Your Section'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-emerald-300/70">
                Live capacity, enrollment, and teacher assignments.
              </p>
            </div>
            <Link
              href="/dashboard/classes"
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {scopedClasses.map((c) => (
              <div
                key={c.id}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 space-y-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                    {c.subcategory || c.section}
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-white">
                    {c.studentCount} / {c.capacity} Students
                  </span>
                </div>

                <BilingualText
                  english={c.class_name_english || c.name}
                  arabic={c.class_name_arabic}
                  englishClassName="font-bold text-sm text-slate-900 dark:text-white"
                  arabicClassName="font-arabic font-semibold text-xs text-amber-600 dark:text-amber-300"
                />

                <div className="pt-1 text-[11px] text-slate-500 dark:text-emerald-300/80 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-sky-500" />
                  <span>Teacher: </span>
                  <strong className="text-slate-800 dark:text-emerald-200">
                    {c.assignedTeacherNames && c.assignedTeacherNames.length > 0
                      ? c.assignedTeacherNames.join(', ')
                      : c.classTeacherName || 'Unassigned'}
                  </strong>
                </div>
              </div>
            ))}

            {scopedClasses.length === 0 && (
              <div className="col-span-2 p-8 text-center text-xs text-slate-500 dark:text-emerald-300/70 italic">
                No classes currently registered under this section.
              </div>
            )}
          </div>
        </div>

        {/* Notice Board Widget */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl">
          <NoticeBoardWidget />
        </div>
      </div>
    </div>
  );
}
