'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../lib/context';
import { useRouter } from 'next/navigation';
import {
  School,
  Users,
  UserCheck,
  BookOpen,
  CalendarCheck,
  Award,
  BarChart3,
  ShieldCheck,
  Building2,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Header } from '../../components/navigation/Header';
import { Sidebar } from '../../components/navigation/Sidebar';
import { StatCard } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';

export default function HeadmasterPortalPage() {
  const router = useRouter();
  const { currentUser, programmes, classes, students, teachers, attendance, grades } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'classes' | 'students' | 'teachers' | 'attendance'>('overview');

  // Verify Role - Redirect if not Headmaster or Admin
  useEffect(() => {
    if (currentUser && currentUser.role !== 'HEADMASTER' && currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  const assignedProgId = currentUser.assignedProgrammeId || 'prog-01';
  const assignedProgName = currentUser.assignedProgrammeName || 'Assigned Programme';
  const currentProgramme = programmes.find((p) => p.id === assignedProgId) || programmes[0];

  // Scoped Data Filtering for Headmaster's Assigned Section
  const sectionClasses = classes.filter((c) => c.programmeId === assignedProgId);
  const sectionStudents = students.filter((s) => s.programmeId === assignedProgId);
  const sectionTeachers = teachers.filter(
    (t) =>
      (t.programmeIds && t.programmeIds.includes(assignedProgId)) ||
      sectionClasses.some((c) => c.classTeacherId === t.id || (c.assignedTeacherIds && c.assignedTeacherIds.includes(t.id)))
  );
  const sectionAttendance = attendance.filter((a) => sectionStudents.some((s) => s.id === a.studentId));

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f8f5] dark:bg-[#031c13] text-slate-900 dark:text-gray-100 flex font-sans selection:bg-emerald-500 selection:text-white">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6">
          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-500/30">
            <div className="space-y-1.5 z-10">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-400 text-emerald-950 font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider">
                  Headmaster Portal
                </Badge>
                <span className="text-xs text-emerald-200 font-semibold">{currentProgramme?.programme_name_arabic || ''}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
                {assignedProgName} Section
              </h1>
              <p className="text-xs text-emerald-100/90 max-w-xl">
                Managing Officer: <span className="font-bold text-white">{currentUser.name}</span> ({currentUser.email})
              </p>
            </div>

            <div className="flex items-center gap-2 z-10">
              <Link
                href="/dashboard/attendance"
                className="px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all flex items-center gap-2"
              >
                <CalendarCheck className="w-4 h-4" />
                <span>Mark Attendance</span>
              </Link>
              <Link
                href="/dashboard/assessment"
                className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-emerald-950 font-bold text-xs shadow-md transition-all flex items-center gap-2"
              >
                <Award className="w-4 h-4" />
                <span>Section Grades</span>
              </Link>
            </div>
          </div>

          {/* Section Metrics KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Section Classes"
              value={sectionClasses.length}
              subtitle="Active learning streams"
              icon={<School className="w-5 h-5 text-emerald-500" />}
              variant="emerald"
            />
            <StatCard
              title="Enrolled Students"
              value={sectionStudents.length}
              subtitle="Verified active pupils"
              icon={<Users className="w-5 h-5 text-sky-500" />}
              variant="sky"
            />
            <StatCard
              title="Section Teachers"
              value={sectionTeachers.length}
              subtitle="Assigned academic staff"
              icon={<UserCheck className="w-5 h-5 text-amber-500" />}
              variant="amber"
            />
            <StatCard
              title="Average Attendance"
              value="94.8%"
              subtitle="Current term average"
              icon={<CalendarCheck className="w-5 h-5 text-purple-500" />}
              variant="purple"
            />
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-emerald-200 dark:border-emerald-800/40 pb-2 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                activeTab === 'overview'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('classes')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                activeTab === 'classes'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
              }`}
            >
              Classes ({sectionClasses.length})
            </button>
            <button
              onClick={() => setActiveTab('students')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                activeTab === 'students'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
              }`}
            >
              Students ({sectionStudents.length})
            </button>
            <button
              onClick={() => setActiveTab('teachers')}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                activeTab === 'teachers'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
              }`}
            >
              Teachers ({sectionTeachers.length})
            </button>
          </div>

          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Programme Details Card */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#042419] border border-emerald-200 dark:border-emerald-800/40 space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold uppercase tracking-wider text-xs text-emerald-600 dark:text-emerald-400">
                    Programme Profile & Scoping
                  </h3>
                  <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    Active Section
                  </Badge>
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{assignedProgName}</span>
                    <span className="text-base text-emerald-600 dark:text-emerald-400 font-normal">
                      {currentProgramme?.programme_name_arabic}
                    </span>
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-gray-300">
                    {currentProgramme?.description || 'Official Quranic Memorization and Islamic Studies Stream'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#062c1e] border border-emerald-500/10">
                    <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold uppercase">Programme Code</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{currentProgramme?.programme_code || 'PRG'}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#062c1e] border border-emerald-500/10">
                    <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold uppercase">Subcategories</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {currentProgramme?.subcategories?.join(', ') || 'Standard Stream'}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#062c1e] border border-emerald-500/10">
                    <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold uppercase">Headmaster</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{currentUser.name}</p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Panel */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-emerald-200 dark:border-emerald-800/40 space-y-4 shadow-sm">
                <h3 className="font-bold uppercase tracking-wider text-xs text-emerald-600 dark:text-emerald-400">
                  Headmaster Quick Actions
                </h3>

                <div className="space-y-2.5">
                  <Link
                    href="/dashboard/classes"
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#062c1e] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-emerald-500/10 flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <School className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">View Section Classes</p>
                        <p className="text-[10px] text-slate-500 dark:text-emerald-300/80">{sectionClasses.length} assigned classes</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/dashboard/students"
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#062c1e] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-emerald-500/10 flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <Users className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Section Student Roster</p>
                        <p className="text-[10px] text-slate-500 dark:text-emerald-300/80">{sectionStudents.length} enrolled pupils</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </Link>

                  <Link
                    href="/dashboard/reports"
                    className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#062c1e] hover:bg-emerald-50 dark:hover:bg-emerald-950/50 border border-emerald-500/10 flex items-center justify-between transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Section Performance Reports</p>
                        <p className="text-[10px] text-slate-500 dark:text-emerald-300/80">Terminal progress analytics</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* CLASSES TAB */}
          {activeTab === 'classes' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectionClasses.map((cls) => (
                <div key={cls.id} className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-emerald-200 dark:border-emerald-800/40 space-y-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{cls.name}</h3>
                    <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                      {cls.category || 'General'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-gray-400">Teacher: <span className="font-semibold text-slate-900 dark:text-white">{cls.classTeacherName || 'Assigned Staff'}</span></p>
                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-emerald-800/30">
                    <span className="text-slate-500 dark:text-emerald-400">Capacity: {cls.capacity || 40}</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Active</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* STUDENTS TAB */}
          {activeTab === 'students' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-emerald-200 dark:border-emerald-800/40 space-y-4 shadow-sm overflow-x-auto">
              <h3 className="font-bold uppercase tracking-wider text-xs text-emerald-600 dark:text-emerald-400">
                Enrolled Students ({assignedProgName})
              </h3>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-emerald-200 dark:border-emerald-800/40 text-slate-500 dark:text-emerald-400 uppercase font-bold text-[10px]">
                    <th className="pb-2">Admission No</th>
                    <th className="pb-2">Student Name</th>
                    <th className="pb-2">Class</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-emerald-800/30">
                  {sectionStudents.map((s) => (
                    <tr key={s.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30">
                      <td className="py-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">{s.admissionNo}</td>
                      <td className="py-2.5 font-bold text-slate-900 dark:text-white">{s.fullName}</td>
                      <td className="py-2.5 text-slate-600 dark:text-gray-300">{s.className}</td>
                      <td className="py-2.5">
                        <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px]">
                          {s.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TEACHERS TAB */}
          {activeTab === 'teachers' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {sectionTeachers.map((t) => (
                <div key={t.id} className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-emerald-200 dark:border-emerald-800/40 space-y-3 shadow-sm flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-base shrink-0">
                    {(t.fullName || t.full_name_english || 'Teacher').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">{t.fullName || t.full_name_english}</h3>
                    <p className="text-xs text-slate-500 dark:text-gray-400">{t.email}</p>
                    <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] mt-1 font-semibold">
                      {t.specialization || 'Teacher'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
