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
  Tag,
  Crown,
  Filter,
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
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('ALL');

  // Verify Role - Redirect if not Headmaster or Admin
  useEffect(() => {
    if (currentUser && currentUser.role !== 'HEADMASTER' && currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  const assignedProgId = currentUser.assignedProgrammeId || (programmes[0]?.id ?? '');
  const currentProgramme = programmes.find((p) => p.id === assignedProgId) || programmes[0];
  const assignedProgName = currentUser.assignedProgrammeName || currentProgramme?.programme_name_english || currentProgramme?.programme_name || 'Programme';

  // Raw Data Scoped to Headmaster's Parent Programme
  const rawClasses = assignedProgId ? classes.filter((c) => c.programmeId === assignedProgId) : classes;
  const rawStudents = assignedProgId ? students.filter((s) => s.programmeId === assignedProgId) : students;
  const rawTeachers = teachers.filter(
    (t) =>
      (assignedProgId && t.programmeIds && t.programmeIds.includes(assignedProgId)) ||
      rawClasses.some((c) => c.classTeacherId === t.id || (c.assignedTeacherIds && c.assignedTeacherIds.includes(t.id)))
  );
  const rawAttendance = attendance.filter((a) => rawStudents.some((s) => s.id === a.studentId));

  // Available Subcategories for current Programme
  const availableSubcategories = currentProgramme?.subcategories || [];

  // Isolated Filtered Data based on selectedSubcategory
  const sectionClasses = rawClasses.filter((c) => {
    if (selectedSubcategory === 'ALL') return true;
    const cat = (c.subcategory || c.section || '').toLowerCase();
    const target = selectedSubcategory.toLowerCase();
    return cat.includes(target) || c.name.toLowerCase().includes(target);
  });

  const sectionStudents = rawStudents.filter((s) => {
    if (selectedSubcategory === 'ALL') return true;
    const target = selectedSubcategory.toLowerCase();
    const studentClass = classes.find((cls) => cls.id === s.classId);
    const sub = (s.subcategory || studentClass?.subcategory || studentClass?.section || '').toLowerCase();
    return sub.includes(target) || (studentClass?.name || '').toLowerCase().includes(target);
  });

  const sectionTeachers = rawTeachers.filter((t) => {
    if (selectedSubcategory === 'ALL') return true;
    return sectionClasses.some((c) => c.classTeacherId === t.id || (c.assignedTeacherIds && c.assignedTeacherIds.includes(t.id)));
  });

  const sectionAttendance = rawAttendance.filter((a) => sectionStudents.some((s) => s.id === a.studentId));

  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f4f8f5] dark:bg-[#031c13] text-slate-900 dark:text-gray-100 flex font-sans selection:bg-emerald-500 selection:text-white">
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

        <main className="flex-1 p-4 sm:p-6 md:p-8 space-y-6">
          {/* Main Programme Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#042f1e] via-[#064E3B] to-[#0f5132] text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-500/40">
            <div className="space-y-1.5 z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-amber-400 text-emerald-950 font-black px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider flex items-center gap-1">
                  <Crown className="w-3 h-3 text-emerald-950" /> Headmaster Portal
                </Badge>
                <span className="text-xs text-emerald-200 font-semibold">{currentProgramme?.programme_name_arabic || ''}</span>
                {currentProgramme?.hasSubcategories && (
                  <span className="bg-emerald-500/30 text-emerald-200 font-bold px-2 py-0.5 rounded-full text-[10px] border border-emerald-400/40">
                    {availableSubcategories.length} Subcategories Stream
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight uppercase">
                {assignedProgName} Programme
              </h1>
              <p className="text-xs text-emerald-100/90 max-w-xl">
                Managing Officer: <span className="font-bold text-white">{currentUser.name}</span> ({currentUser.email})
              </p>
            </div>

            <div className="flex items-center gap-2 z-10 flex-wrap">
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

          {/* Subcategory Filter / Selector Bar */}
          {currentProgramme?.hasSubcategories && availableSubcategories.length > 0 && (
            <div className="p-4 rounded-3xl bg-white dark:bg-[#042419] border border-emerald-200 dark:border-emerald-800/40 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-emerald-300">
                    Programme Subcategory Filter:
                  </span>
                </div>
                {selectedSubcategory !== 'ALL' && (
                  <button
                    onClick={() => setSelectedSubcategory('ALL')}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Clear Filter (Show All)
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedSubcategory('ALL')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-2 ${
                    selectedSubcategory === 'ALL'
                      ? 'bg-slate-900 text-white dark:bg-emerald-600 shadow-md scale-105'
                      : 'bg-slate-100 dark:bg-[#021810] text-slate-700 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 border border-slate-200 dark:border-emerald-800/30'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>ALL SUBCATEGORIES</span>
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
                    {rawClasses.length} Classes
                  </span>
                </button>

                {availableSubcategories.map((sub) => {
                  const isSelected = selectedSubcategory.toLowerCase() === sub.toLowerCase();
                  const subClasses = rawClasses.filter((c) => {
                    const cat = (c.subcategory || c.section || '').toLowerCase();
                    return cat.includes(sub.toLowerCase()) || c.name.toLowerCase().includes(sub.toLowerCase());
                  });

                  return (
                    <button
                      key={sub}
                      onClick={() => setSelectedSubcategory(sub)}
                      className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all shrink-0 flex items-center gap-2 ${
                        isSelected
                          ? sub.toLowerCase() === 'asubah'
                            ? 'bg-emerald-600 text-white shadow-lg scale-105 ring-2 ring-emerald-400'
                            : sub.toLowerCase() === 'maghrib'
                            ? 'bg-amber-500 text-slate-950 shadow-lg scale-105 ring-2 ring-amber-400'
                            : 'bg-purple-600 text-white shadow-lg scale-105 ring-2 ring-purple-400'
                          : 'bg-slate-100 dark:bg-[#021810] text-slate-700 dark:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 border border-slate-200 dark:border-emerald-800/30'
                      }`}
                    >
                      <Tag className="w-4 h-4" />
                      <span>{sub.toUpperCase()}</span>
                      <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-black/10 dark:bg-white/20">
                        {subClasses.length} Classes
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section Metrics KPI Grid (Isolated for Selected Subcategory) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={selectedSubcategory === 'ALL' ? 'Total Classes' : `${selectedSubcategory} Classes`}
              value={sectionClasses.length}
              subtitle={selectedSubcategory === 'ALL' ? 'All 3 subcategories' : `Filtered under ${selectedSubcategory}`}
              icon={<School className="w-5 h-5 text-emerald-500" />}
              variant="emerald"
            />
            <StatCard
              title={selectedSubcategory === 'ALL' ? 'Enrolled Students' : `${selectedSubcategory} Students`}
              value={sectionStudents.length}
              subtitle="Active verified pupils"
              icon={<Users className="w-5 h-5 text-sky-500" />}
              variant="sky"
            />
            <StatCard
              title={selectedSubcategory === 'ALL' ? 'Section Teachers' : `${selectedSubcategory} Staff`}
              value={sectionTeachers.length}
              subtitle="Assigned academic staff"
              icon={<UserCheck className="w-5 h-5 text-amber-500" />}
              variant="amber"
            />
            <StatCard
              title="Average Attendance"
              value="95.4%"
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
                    Programme Profile & Subcategories Structure
                  </h3>
                  <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    Single Headmaster Governance
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
                    {currentProgramme?.description || 'Morning & Evening Quranic Memorization & Islamic Studies Program'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#062c1e] border border-emerald-500/10">
                    <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold uppercase">Programme Code</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{currentProgramme?.programme_code || 'PRG'}</p>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#062c1e] border border-emerald-500/10">
                    <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold uppercase">Subcategories</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {availableSubcategories.map((sub) => (
                        <span key={sub} className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#062c1e] border border-emerald-500/10">
                    <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-semibold uppercase">Programme Headmaster</p>
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
                        <p className="text-xs font-bold text-slate-900 dark:text-white">View Programme Classes</p>
                        <p className="text-[10px] text-slate-500 dark:text-emerald-300/80">{sectionClasses.length} classes under {selectedSubcategory}</p>
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
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Student Roster</p>
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
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Performance Reports</p>
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
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-emerald-300">
                  Classes List ({selectedSubcategory === 'ALL' ? 'All Subcategories' : selectedSubcategory})
                </h2>
                <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                  {sectionClasses.length} Classes Shown
                </Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sectionClasses.map((cls) => (
                  <div key={cls.id} className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-emerald-200 dark:border-emerald-800/40 space-y-3 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">{cls.name}</h3>
                      <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                        {cls.subcategory || cls.section || 'General'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-gray-400">Teacher: <span className="font-semibold text-slate-900 dark:text-white">{cls.classTeacherName || 'Assigned Staff'}</span></p>
                    <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-emerald-800/30">
                      <span className="text-slate-500 dark:text-emerald-400">Capacity: {cls.capacity || 30}</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STUDENTS TAB */}
          {activeTab === 'students' && (
            <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-emerald-200 dark:border-emerald-800/40 space-y-4 shadow-sm overflow-x-auto">
              <div className="flex items-center justify-between">
                <h3 className="font-bold uppercase tracking-wider text-xs text-emerald-600 dark:text-emerald-400">
                  Enrolled Students ({selectedSubcategory === 'ALL' ? assignedProgName : `${assignedProgName} — ${selectedSubcategory}`})
                </h3>
                <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                  {sectionStudents.length} Students
                </Badge>
              </div>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-emerald-200 dark:border-emerald-800/40 text-slate-500 dark:text-emerald-400 uppercase font-bold text-[10px]">
                    <th className="pb-2">Admission No</th>
                    <th className="pb-2">Student Name</th>
                    <th className="pb-2">Class</th>
                    <th className="pb-2">Subcategory</th>
                    <th className="pb-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-emerald-800/30">
                  {sectionStudents.map((s) => {
                    const studentClass = classes.find((c) => c.id === s.classId);
                    return (
                      <tr key={s.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30">
                        <td className="py-2.5 font-mono font-bold text-emerald-600 dark:text-emerald-400">{s.admissionNo}</td>
                        <td className="py-2.5 font-bold text-slate-900 dark:text-white">{s.fullName}</td>
                        <td className="py-2.5 text-slate-600 dark:text-gray-300">{s.className}</td>
                        <td className="py-2.5">
                          <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                            {s.subcategory || studentClass?.subcategory || studentClass?.section || 'General'}
                          </span>
                        </td>
                        <td className="py-2.5">
                          <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px]">
                            {s.status}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* TEACHERS TAB */}
          {activeTab === 'teachers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-emerald-300">
                  Academic Staff ({selectedSubcategory === 'ALL' ? 'All Subcategories' : selectedSubcategory})
                </h2>
                <Badge className="bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                  {sectionTeachers.length} Teachers Assigned
                </Badge>
              </div>

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
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
