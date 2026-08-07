'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../lib/context';
import { BilingualText } from '@/components/ui/BilingualText';
import { CommandCenterSearch } from './CommandCenterSearch';
import { SystemHealthWidget } from './SystemHealthWidget';
import { NoticeBoardWidget } from './NoticeBoardWidget';
import { StatCard } from '@/components/ui/Card';
import { TeacherAssignmentWizardModal } from './TeacherAssignmentWizardModal';
import {
  Users,
  UserCheck,
  BookOpen,
  BookMarked,
  School,
  Award,
  CalendarCheck,
  TrendingUp,
  PlusCircle,
  Bell,
  ArrowUpRight,
  ShieldCheck,
  Sparkles,
  UserPlus,
  FileSpreadsheet,
  Database,
  Lock,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar as CalendarIcon,
  Download,
  Filter,
  Eye,
  Activity,
  HeartHandshake,
  GraduationCap,
  Layers,
  Baby,
  Edit,
  Trash2,
  Plus,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export function AdminDashboard() {
  const {
    programmes,
    students,
    teachers,
    parents,
    classes,
    subjects,
    attendance,
    tahfizRecords,
    announcements,
    auditLogs,
    activeSessions,
    currentSession,
    currentUser,
    showConfirm,
    addTeacher,
    updateTeacher,
    deleteTeacher,
    addParent,
    updateParent,
    deleteParent,
    addStudent,
    updateStudent,
    deleteStudent,
    unlockAccount,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'security' | 'tahfiz' | 'analytics' | 'system'>('overview');
  const [userDirectorySubTab, setUserDirectorySubTab] = useState<'teachers' | 'parents' | 'students'>('teachers');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
  const [greeting, setGreeting] = useState('Good Day');
  const [viewingReport, setViewingReport] = useState<'STUDENT' | 'TEACHER' | 'ATTENDANCE' | 'AUDIT' | 'SECURITY' | 'ACADEMIC' | null>(null);
  const [isAssignWizardOpen, setIsAssignWizardOpen] = useState(false);

  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good Morning');
    else if (hour < 17) setGreeting('Good Afternoon');
    else setGreeting('Good Evening');
  }, []);

  // Summary Metrics
  const totalStudents = students.length;
  const totalTeachers = teachers.length;
  const totalParents = parents.length;
  const totalClasses = classes.length;
  const totalJuzMemorized = students.reduce((acc, s) => acc + s.hifzProgress.juzCompleted, 0);

  // Attendance Calculations
  const presentCount = attendance.filter((a) => a.status === 'PRESENT').length;
  const absentCount = attendance.filter((a) => a.status === 'ABSENT').length;
  const lateCount = attendance.filter((a) => a.status === 'LATE').length;
  const excusedCount = attendance.filter((a) => a.status === 'EXCUSED').length;
  const totalAttendanceRecords = attendance.length || 1;
  const attendanceRatePercentage = ((presentCount / totalAttendanceRecords) * 100).toFixed(1);

  // Chart Datasets
  const tahfizData = [
    { month: 'Jan', juzCompleted: 120 },
    { month: 'Feb', juzCompleted: 145 },
    { month: 'Mar', juzCompleted: 180 },
    { month: 'Apr', juzCompleted: 210 },
    { month: 'May', juzCompleted: 250 },
    { month: 'Jun', juzCompleted: 290 },
    { month: 'Jul', juzCompleted: 340 },
  ];

  const studentGrowthData = [
    { month: 'Sep', students: 1820 },
    { month: 'Oct', students: 1890 },
    { month: 'Nov', students: 1940 },
    { month: 'Dec', students: 1980 },
    { month: 'Jan', students: 2010 },
    { month: 'Feb', students: 2040 },
  ];

  const attendancePie = [
    { name: 'Present', value: presentCount || 92, color: '#10b981' },
    { name: 'Absent', value: absentCount || 3, color: '#f43f5e' },
    { name: 'Late', value: lateCount || 4, color: '#f59e0b' },
    { name: 'Excused', value: excusedCount || 1, color: '#0ea5e9' },
  ];

  // Filtered Audit Logs
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.performedBy.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(auditSearchQuery.toLowerCase());
    const matchesAction = auditActionFilter === 'ALL' || log.action.includes(auditActionFilter);
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-[#042419] space-y-6 selection:bg-emerald-500 selection:text-white">
      {/* 1. Welcome & Command Header */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#042f1e] via-[#064e3b] to-[#0f5132] p-6 sm:p-8 text-white shadow-xl border border-emerald-500/40"
      >
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold font-poppins text-emerald-300 uppercase tracking-wider">
              <span className="flex items-center gap-1.5 bg-emerald-500/25 px-3 py-1 rounded-xl border border-emerald-400/40 text-emerald-200">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Administrator Command Center
              </span>
              <span className="bg-sky-500/25 text-sky-200 px-3 py-1 rounded-xl border border-sky-400/40">
                {currentSession.sessionName} • {currentSession.activeTerm}
              </span>
              <span className="bg-amber-500/25 text-amber-200 px-3 py-1 rounded-xl border border-amber-400/40 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> System Operational
              </span>
            </div>

            <h1 className="font-poppins text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
              Assalamu Alaikum, {greeting}, {currentUser.name || 'Malam Umar Faruq'}
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100 max-w-3xl leading-relaxed font-medium">
              MARKAZU UMAR BN AL-KHATTAB CENTRE FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES - DANEJI • Kano, Nigeria.
              Overseeing 1,000+ enrolled students, 40+ faculty members, and active Tahfiz & Academic streams.
            </p>

            <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-emerald-200 pt-1 font-poppins" suppressHydrationWarning>
              <span className="flex items-center gap-1.5" suppressHydrationWarning>
                <CalendarIcon className="w-4 h-4 text-emerald-400" />
                Gregorian Date: {mounted ? new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'August 3, 2026'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 text-amber-300">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Islamic Date: 14 Safar 1447 AH
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsAssignWizardOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-poppins font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-900/40 transition-all hover:scale-105 whitespace-nowrap shrink-0"
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>Assign Teacher Load</span>
            </button>
            <Link
              href="/dashboard/tahfiz"
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-poppins font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Tahfiz Tracker</span>
            </Link>
            {currentUser.role === 'SUPER_ADMIN' && (
              <Link
                href="/dashboard/security"
                className="px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-poppins font-bold text-xs flex items-center justify-center gap-2 border border-emerald-400/40 transition-all hover:scale-105"
              >
                <Lock className="w-4 h-4 text-emerald-300" />
                <span>User Accounts & Security</span>
              </Link>
            )}
          </div>
        </div>

        <TeacherAssignmentWizardModal
          isOpen={isAssignWizardOpen}
          onClose={() => setIsAssignWizardOpen(false)}
        />

        {/* Ambient Glow */}
        <div className="absolute -right-12 -bottom-12 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />
      </motion.div>

      {/* 2. Global Search & Navigation Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <CommandCenterSearch />

        {/* Command Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto p-1.5 rounded-2xl bg-white dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 shadow-sm text-xs font-bold font-poppins">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-emerald-200 hover:text-emerald-600'
            }`}
          >
            Command Overview
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'users'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-emerald-200 hover:text-emerald-600'
            }`}
          >
            User Directory Hub
          </button>
          {currentUser.role === 'SUPER_ADMIN' && (
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 rounded-xl transition-all ${
                activeTab === 'security'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-700 dark:text-emerald-200 hover:text-emerald-600'
              }`}
            >
              Security & Audit
            </button>
          )}
          <button
            onClick={() => setActiveTab('tahfiz')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'tahfiz'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-emerald-200 hover:text-emerald-600'
            }`}
          >
            Qur'an & Academics
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'analytics'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-emerald-200 hover:text-emerald-600'
            }`}
          >
            Analytics & Growth
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === 'system'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-emerald-200 hover:text-emerald-600'
            }`}
          >
            System Diagnostics
          </button>
        </div>
      </div>

      {/* Official Communication Notice Board Widget */}
      <NoticeBoardWidget />

      {/* 3. Top Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Enrolled Students"
          value={totalStudents}
          subtitle="Primary & Secondary Islamiyya"
          icon={<GraduationCap className="w-5 h-5" />}
          trend={{ value: '12.4% Term', isPositive: true }}
          variant="emerald"
        />

        <StatCard
          title="Teaching Faculty"
          value={totalTeachers}
          subtitle="Qur'anic & Shariah Asatizah"
          icon={<UserCheck className="w-5 h-5" />}
          variant="sky"
        />

        <StatCard
          title="Registered Guardians"
          value={totalParents}
          subtitle="Active SMS & Email Profiles"
          icon={<HeartHandshake className="w-5 h-5" />}
          variant="amber"
        />

        <StatCard
          title="Active Classes"
          value={totalClasses}
          subtitle="Tahfiz, Primary & Secondary"
          icon={<School className="w-5 h-5" />}
          variant="purple"
        />
      </div>

      {/* 3.5. Programme Distribution Breakdown Grid */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200/90 dark:border-emerald-500/30 shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-poppins text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" /> Programme Enrollment & Class Breakdown
            </h3>
            <p className="text-xs text-slate-500 dark:text-emerald-300/70">Master academic streams overview across the school</p>
          </div>
          <Link
            href="/dashboard/programmes"
            className="text-xs font-poppins font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            Manage Programmes <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {programmes.map((prog) => {
            const progClasses = classes.filter((c) => c.programmeId === prog.id || c.programmeName === prog.programme_name);
            const progStudents = students.filter((s) => s.programmeId === prog.id || s.programmeName === prog.programme_name);

            return (
              <motion.div
                key={prog.id}
                whileHover={{ y: -5, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 space-y-2 hover:border-emerald-500 hover:shadow-xl hover:shadow-emerald-500/10 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 uppercase">
                    {prog.programme_code}
                  </span>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                      prog.status === 'Active' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {prog.status}
                  </span>
                </div>
                <BilingualText
                  english={prog.programme_name_english || prog.programme_name}
                  arabic={prog.programme_name_arabic}
                  englishClassName="font-poppins font-bold text-slate-900 dark:text-white truncate text-xs"
                  arabicClassName="font-arabic font-semibold text-amber-600 dark:text-amber-300 text-[11px] truncate"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-emerald-200/80 font-medium">
                  <span>{progClasses.length} Classes</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">{progStudents.length} Students</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* 4. Quick Action Shortcuts Toolbar */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200/90 dark:border-emerald-500/30 shadow-md space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-poppins text-xs font-black uppercase text-slate-800 dark:text-emerald-300 tracking-wider">
            Quick Administrative Shortcuts
          </h3>
          <span className="font-poppins text-[10px] text-slate-500 dark:text-emerald-400 font-bold bg-slate-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-emerald-800/40">1-Click Actions</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-2">
          <Link
            href="/dashboard/students"
            className="p-3 rounded-2xl bg-slate-50 dark:bg-emerald-950/50 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-all border border-slate-200 dark:border-emerald-500/20 flex flex-col items-center justify-center gap-1.5 text-center group"
          >
            <UserPlus className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:text-white" />
            <span className="text-[11px] font-bold">Add Student</span>
          </Link>

          <Link
            href="/dashboard/classes"
            className="p-3 rounded-2xl bg-slate-50 dark:bg-sky-950/50 hover:bg-sky-600 hover:text-white dark:hover:bg-sky-600 transition-all border border-slate-200 dark:border-sky-500/20 flex flex-col items-center justify-center gap-1.5 text-center group"
          >
            <UserCheck className="w-4 h-4 text-sky-600 dark:text-sky-400 group-hover:text-white" />
            <span className="text-[11px] font-bold">Add Teacher</span>
          </Link>

          <Link
            href="/dashboard/students"
            className="p-3 rounded-2xl bg-slate-50 dark:bg-amber-950/50 hover:bg-amber-600 hover:text-white dark:hover:bg-amber-600 transition-all border border-slate-200 dark:border-amber-500/20 flex flex-col items-center justify-center gap-1.5 text-center group"
          >
            <HeartHandshake className="w-4 h-4 text-amber-600 dark:text-amber-400 group-hover:text-white" />
            <span className="text-[11px] font-bold">Add Parent</span>
          </Link>

          <Link
            href="/dashboard/classes"
            className="p-3 rounded-2xl bg-slate-50 dark:bg-purple-950/50 hover:bg-purple-600 hover:text-white dark:hover:bg-purple-600 transition-all border border-slate-200 dark:border-purple-500/20 flex flex-col items-center justify-center gap-1.5 text-center group"
          >
            <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400 group-hover:text-white" />
            <span className="text-[11px] font-bold">Create Class</span>
          </Link>

          <Link
            href="/dashboard/subjects"
            className="p-3 rounded-2xl bg-slate-50 dark:bg-indigo-950/50 hover:bg-indigo-600 hover:text-white dark:hover:bg-indigo-600 transition-all border border-slate-200 dark:border-indigo-500/20 flex flex-col items-center justify-center gap-1.5 text-center group"
          >
            <BookOpen className="w-4 h-4 text-indigo-600 dark:text-indigo-400 group-hover:text-white" />
            <span className="text-[11px] font-bold">Create Subject</span>
          </Link>

          <Link
            href="/dashboard/announcements"
            className="p-3 rounded-2xl bg-slate-50 dark:bg-rose-950/50 hover:bg-rose-600 hover:text-white dark:hover:bg-rose-600 transition-all border border-slate-200 dark:border-rose-500/20 flex flex-col items-center justify-center gap-1.5 text-center group"
          >
            <Bell className="w-4 h-4 text-rose-600 dark:text-rose-400 group-hover:text-white" />
            <span className="text-[11px] font-bold">Announcement</span>
          </Link>

          <Link
            href="/dashboard/reports"
            className="p-3 rounded-2xl bg-slate-50 dark:bg-teal-950/50 hover:bg-teal-600 hover:text-white dark:hover:bg-teal-600 transition-all border border-slate-200 dark:border-teal-500/20 flex flex-col items-center justify-center gap-1.5 text-center group"
          >
            <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400 group-hover:text-white" />
            <span className="text-[11px] font-bold">Generate Report</span>
          </Link>

          <button
            onClick={() => alert('Database backup requested. Backup job initiated successfully on Hostinger VPS KVM 1.')}
            className="p-3 rounded-2xl bg-slate-50 dark:bg-emerald-950/50 hover:bg-emerald-600 hover:text-white dark:hover:bg-emerald-600 transition-all border border-slate-200 dark:border-emerald-500/20 flex flex-col items-center justify-center gap-1.5 text-center group"
          >
            <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:text-white" />
            <span className="text-[11px] font-bold">Backup Database</span>
          </button>

          {currentUser.role === 'SUPER_ADMIN' && (
            <Link
              href="/dashboard/security"
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900 hover:bg-slate-800 hover:text-white dark:hover:bg-emerald-700 transition-all border border-slate-200 dark:border-emerald-500/20 flex flex-col items-center justify-center gap-1.5 text-center group"
            >
              <Lock className="w-4 h-4 text-slate-600 dark:text-emerald-300 group-hover:text-white" />
              <span className="text-[11px] font-bold">User Accounts</span>
            </Link>
          )}
        </div>
      </div>

      {/* 5. Main Tab Content Views */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <motion.div
            key="tab-overview"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Row: Attendance & Academic Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Daily Attendance Distribution */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <CalendarCheck className="w-4 h-4 text-emerald-500" /> Today's Attendance Overview
                    </h3>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                      Live Stream
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-emerald-300/70">
                    Real-time student & faculty check-ins across Tahfiz Halqas and Islamiyya.
                  </p>

                  <div className="h-48 w-full mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={attendancePie}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={68}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {attendancePie.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#022c22',
                            borderColor: '#10b981',
                            borderRadius: '10px',
                            color: '#fff',
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex justify-between font-bold">
                    <span>Present:</span>
                    <span>{presentCount} ({attendanceRatePercentage}%)</span>
                  </div>
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300 flex justify-between font-bold">
                    <span>Absent:</span>
                    <span>{absentCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 flex justify-between font-bold">
                    <span>Late:</span>
                    <span>{lateCount}</span>
                  </div>
                  <div className="p-2 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300 flex justify-between font-bold">
                    <span>Excused:</span>
                    <span>{excusedCount}</span>
                  </div>
                </div>
              </div>

              {/* School-Wide Memorization Growth Chart */}
              <div className="lg:col-span-2 p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-500" /> School-Wide Qur'an Memorization Growth
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-emerald-300/70">Cumulative Juz completed by Tahfiz students across academic terms</p>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
                    Total {totalJuzMemorized} Juz
                  </span>
                </div>

                <div className="h-60 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={tahfizData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="tahfizColor" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="month" stroke="#10b981" fontSize={11} />
                      <YAxis stroke="#10b981" fontSize={11} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#022c22',
                          borderColor: '#10b981',
                          borderRadius: '12px',
                          color: '#fff',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="juzCompleted"
                        stroke="#10b981"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#tahfizColor)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Row: Live Activity Feed & Recent Admissions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Live Activity Feed */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-emerald-500/20">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-emerald-500" /> Real-Time Live Activity Feed
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                    Live Audit Trail
                  </span>
                </div>

                <div className="space-y-3">
                  {auditLogs.slice(0, 4).map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white">{log.performedBy}</span>
                          <span className="text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase">
                            {log.userRole}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 dark:text-emerald-300/80">{log.details}</p>
                      </div>
                      <span className="text-[10px] text-slate-400 dark:text-emerald-400/60 font-semibold whitespace-nowrap">
                        {log.timestamp}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Student Admissions */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-emerald-500/20">
                  <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-emerald-500" /> Recent Student Admissions
                  </h3>
                  <Link href="/dashboard/students" className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-bold flex items-center gap-1">
                    View All <ArrowUpRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {students.slice(0, 4).map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                          {s.fullName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{s.fullName}</p>
                          <p className="text-[10px] text-slate-500 dark:text-emerald-300/70">Admission: {s.admissionNo} • Class: {s.className}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                        {s.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'users' && (
          <motion.div
            key="tab-users"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Header / Sub-nav bar */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-emerald-500/20 pb-4">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <Users className="w-5 h-5 text-emerald-500" /> User & Directory Management Hub
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-emerald-300/70 mt-0.5">
                    Centralized admin controls to add, manage, edit, and remove Teachers, Parents, and Children (Students).
                  </p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto p-1 rounded-2xl bg-slate-100 dark:bg-[#021810] text-xs font-bold">
                  <button
                    onClick={() => setUserDirectorySubTab('teachers')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      userDirectorySubTab === 'teachers'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-gray-400 hover:text-emerald-500'
                    }`}
                  >
                    Teachers ({teachers.length})
                  </button>
                  <button
                    onClick={() => setUserDirectorySubTab('parents')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      userDirectorySubTab === 'parents'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-gray-400 hover:text-emerald-500'
                    }`}
                  >
                    Parents ({parents.length})
                  </button>
                  <button
                    onClick={() => setUserDirectorySubTab('students')}
                    className={`px-3 py-1.5 rounded-xl transition-all ${
                      userDirectorySubTab === 'students'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-gray-400 hover:text-emerald-500'
                    }`}
                  >
                    Children ({students.length})
                  </button>
                </div>
              </div>

              {/* Search & Actions Bar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <div className="relative w-full sm:max-w-md">
                  <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-emerald-400/70" />
                  <input
                    type="text"
                    value={userSearchQuery}
                    onChange={(e) => setUserSearchQuery(e.target.value)}
                    placeholder={`Search ${userDirectorySubTab} by name, email, ID or phone...`}
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {userDirectorySubTab === 'teachers' && (
                    <Link
                      href="/dashboard/teachers"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md"
                    >
                      <UserCheck className="w-4 h-4" /> Open Teachers Directory Page
                    </Link>
                  )}
                  {userDirectorySubTab === 'parents' && (
                    <Link
                      href="/dashboard/parents"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md"
                    >
                      <HeartHandshake className="w-4 h-4" /> Open Parents Directory Page
                    </Link>
                  )}
                  {userDirectorySubTab === 'students' && (
                    <Link
                      href="/dashboard/students"
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow-md"
                    >
                      <GraduationCap className="w-4 h-4" /> Open Students Directory Page
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* SubTab Content: Teachers */}
            {userDirectorySubTab === 'teachers' && (
              <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-emerald-300 uppercase tracking-wider">
                    Asatizah & Academic Staff Roster
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-emerald-400/80 font-bold">
                    Total {teachers.length} Active Staff
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-emerald-500/20">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-[#021810] text-slate-700 dark:text-emerald-300 font-bold uppercase text-[10px]">
                        <th className="py-3 px-4">Staff ID</th>
                        <th className="py-3 px-4">Teacher Name</th>
                        <th className="py-3 px-4">Specialization</th>
                        <th className="py-3 px-4">Contact Info</th>
                        <th className="py-3 px-4">Classes Assigned</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-500/10">
                      {teachers
                        .filter(
                          (t) =>
                            t.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                            t.staffNo.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                            t.specialization.toLowerCase().includes(userSearchQuery.toLowerCase())
                        )
                        .map((teacher) => (
                          <tr key={teacher.id} className="hover:bg-slate-50 dark:hover:bg-emerald-950/40">
                            <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {teacher.staffNo}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                              {teacher.fullName}
                            </td>
                            <td className="py-3 px-4 text-amber-600 dark:text-amber-300 font-semibold">
                              {teacher.specialization}
                            </td>
                            <td className="py-3 px-4 text-slate-600 dark:text-emerald-300/80 font-mono">
                              {teacher.email} • {teacher.phone}
                            </td>
                            <td className="py-3 px-4">
                              <div className="flex flex-wrap gap-1">
                                {teacher.classesAssigned.map((c) => (
                                  <span key={c} className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 px-1.5 py-0.5 rounded">
                                    {c}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  showConfirm({
                                    title: 'Remove Faculty Member',
                                    description: `Are you sure you want to remove teacher profile for ${teacher.fullName}?`,
                                    confirmLabel: 'Remove Teacher',
                                    onConfirm: () => deleteTeacher(teacher.id),
                                    isDanger: true,
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400"
                                title="Remove Teacher"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SubTab Content: Parents */}
            {userDirectorySubTab === 'parents' && (
              <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-emerald-300 uppercase tracking-wider">
                    Parents & Guardians Profiles
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-emerald-400/80 font-bold">
                    Total {parents.length} Guardians
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-emerald-500/20">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-[#021810] text-slate-700 dark:text-emerald-300 font-bold uppercase text-[10px]">
                        <th className="py-3 px-4">Parent / Guardian Name</th>
                        <th className="py-3 px-4">Contact Info</th>
                        <th className="py-3 px-4">Occupation</th>
                        <th className="py-3 px-4">Address</th>
                        <th className="py-3 px-4">Linked Children</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-500/10">
                      {parents
                        .filter(
                          (p) =>
                            p.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                            p.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                            p.phone.includes(userSearchQuery)
                        )
                        .map((parent) => {
                          const linkedChildren = students.filter(
                            (s) => s.guardianId === parent.id || s.guardianId === parent.userId
                          );
                          return (
                            <tr key={parent.id} className="hover:bg-slate-50 dark:hover:bg-emerald-950/40">
                              <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                                {parent.fullName}
                              </td>
                              <td className="py-3 px-4 text-slate-600 dark:text-emerald-300/80 font-mono">
                                {parent.email} • {parent.phone}
                              </td>
                              <td className="py-3 px-4 text-slate-700 dark:text-gray-300 font-medium">
                                {parent.occupation}
                              </td>
                              <td className="py-3 px-4 text-slate-500 dark:text-emerald-300/70 truncate max-w-xs">
                                {parent.address}
                              </td>
                              <td className="py-3 px-4">
                                <span className="bg-amber-500/10 text-amber-600 dark:text-amber-300 font-bold px-2 py-0.5 rounded text-[11px]">
                                  {linkedChildren.length} Children
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  onClick={() => {
                                    showConfirm({
                                      title: 'Remove Parent Record',
                                      description: `Are you sure you want to remove guardian profile for ${parent.fullName}?`,
                                      confirmLabel: 'Remove Parent',
                                      onConfirm: () => deleteParent(parent.id),
                                      isDanger: true,
                                    });
                                  }}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400"
                                  title="Remove Parent"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SubTab Content: Students (Children) */}
            {userDirectorySubTab === 'students' && (
              <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-emerald-300 uppercase tracking-wider">
                    Enrolled Children & Students Directory
                  </h4>
                  <span className="text-xs text-slate-500 dark:text-emerald-400/80 font-bold">
                    Total {students.length} Students Enrolled
                  </span>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-emerald-500/20">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 dark:bg-[#021810] text-slate-700 dark:text-emerald-300 font-bold uppercase text-[10px]">
                        <th className="py-3 px-4">Admission No</th>
                        <th className="py-3 px-4">Student Name</th>
                        <th className="py-3 px-4">Class</th>
                        <th className="py-3 px-4">Parent / Guardian</th>
                        <th className="py-3 px-4">Hifz Progress</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-emerald-500/10">
                      {students
                        .filter(
                          (s) =>
                            s.fullName.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                            s.admissionNo.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                            s.guardianName.toLowerCase().includes(userSearchQuery.toLowerCase())
                        )
                        .map((student) => (
                          <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-emerald-950/40">
                            <td className="py-3 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">
                              {student.admissionNo}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                              {student.fullName}
                            </td>
                            <td className="py-3 px-4 text-slate-700 dark:text-emerald-100">
                              {student.className}
                            </td>
                            <td className="py-3 px-4 font-semibold text-slate-900 dark:text-white">
                              {student.guardianName}
                            </td>
                            <td className="py-3 px-4">
                              <span className="bg-purple-500/10 text-purple-600 dark:text-purple-300 font-bold px-2 py-0.5 rounded text-[11px]">
                                {student.hifzProgress.juzCompleted} / 30 Juz
                              </span>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                onClick={() => {
                                  showConfirm({
                                    title: 'Delete Student Profile',
                                    description: `Are you sure you want to remove student profile for ${student.fullName}?`,
                                    confirmLabel: 'Delete Student',
                                    onConfirm: () => deleteStudent(student.id),
                                    isDanger: true,
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400"
                                title="Delete Student"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'security' && (
          <motion.div
            key="tab-security"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Security Widget Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase">
                  <span>Failed Logins (24h)</span>
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">0</p>
                <p className="text-[11px] text-slate-500 dark:text-emerald-300/70">Zero suspicious lockout triggers</p>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-sky-600 dark:text-sky-400 uppercase">
                  <span>Active Device Sessions</span>
                  <Activity className="w-4 h-4" />
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{activeSessions.length || 14}</p>
                <p className="text-[11px] text-slate-500 dark:text-sky-300/70">Encrypted JWT tokens issued</p>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-purple-600 dark:text-purple-400 uppercase">
                  <span>Password Resets Today</span>
                  <Lock className="w-4 h-4" />
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">2</p>
                <p className="text-[11px] text-slate-500 dark:text-purple-300/70">Argon2id policy enforced</p>
              </div>

              <div className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-lg space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-amber-600 dark:text-amber-400 uppercase">
                  <span>Last System Backup</span>
                  <Database className="w-4 h-4" />
                </div>
                <p className="text-3xl font-black text-slate-900 dark:text-white">10m ago</p>
                <p className="text-[11px] text-slate-500 dark:text-amber-300/70">Hostinger VPS snapshot verified</p>
              </div>
            </div>

            {/* Audit Log Preview Component */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-emerald-500/20">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-emerald-500" /> Enterprise Audit Logs Preview
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-emerald-300/70 mt-0.5">
                    Immutable security log records capturing user actions, IP addresses, browsers, and status.
                  </p>
                </div>
                <Link
                  href="/dashboard/security"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md self-start sm:self-auto"
                >
                  <Eye className="w-4 h-4" /> Full Security Dashboard
                </Link>
              </div>

              {/* Audit Search & Filter Bar */}
              <div className="flex flex-col sm:flex-row items-center gap-3 text-xs">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={auditSearchQuery}
                    onChange={(e) => setAuditSearchQuery(e.target.value)}
                    placeholder="Search logs by user, action, or details..."
                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <Filter className="w-4 h-4 text-slate-400" />
                  <select
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                    className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-semibold focus:outline-none"
                  >
                    <option value="ALL">All Event Actions</option>
                    <option value="LOGIN">Login Events</option>
                    <option value="PASSWORD">Password Events</option>
                    <option value="ACCOUNT">Account Events</option>
                  </select>
                </div>
              </div>

              {/* Audit Log Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-emerald-500/20">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-[#021810] border-b border-slate-200 dark:border-emerald-500/20 text-slate-700 dark:text-emerald-300 font-bold uppercase tracking-wider text-[10px]">
                      <th className="py-3 px-4">Timestamp</th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Action</th>
                      <th className="py-3 px-4">IP / Browser</th>
                      <th className="py-3 px-4">Details</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-emerald-500/10">
                    {filteredAuditLogs.slice(0, 6).map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-emerald-950/40 transition-all">
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-emerald-400/80 whitespace-nowrap">
                          {log.timestamp}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-slate-900 dark:text-white">{log.performedBy}</p>
                          <p className="text-[10px] text-slate-400">{log.userRole}</p>
                        </td>
                        <td className="py-3 px-4 font-bold text-emerald-600 dark:text-emerald-400">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 text-[11px] text-slate-600 dark:text-emerald-300/80">
                          {log.ipAddress} ({log.browser || 'Chrome 128'})
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-gray-300 max-w-xs truncate">
                          {log.details}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase border ${
                              log.status === 'SUCCESS'
                                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'tahfiz' && (
          <motion.div
            key="tab-tahfiz"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {/* Qur'an Memorization Command Widget */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-emerald-500/20">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-amber-500" /> Qur'an Memorization & Tahfiz Command Center
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-emerald-300/70 mt-0.5">
                    Monitoring daily Hifz, Sabki, and Manzil progression for 120+ active Tahfiz students in Kano.
                  </p>
                </div>
                <Link
                  href="/dashboard/tahfiz"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4" /> Full Tahfiz Portal
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 space-y-1">
                  <span className="text-xs font-bold uppercase">Average Hifz Rating</span>
                  <p className="text-2xl font-black">4.8 / 5.0 ★</p>
                  <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">Excellent Tajweed & Makhraj</p>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 space-y-1">
                  <span className="text-xs font-bold uppercase">Completed Huffaz</span>
                  <p className="text-2xl font-black">14 Graduated</p>
                  <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80">Full 30 Juz memorized with Ijazah</p>
                </div>

                <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/30 text-sky-900 dark:text-sky-200 space-y-1">
                  <span className="text-xs font-bold uppercase">Daily Sabki Submissions</span>
                  <p className="text-2xl font-black">48 Logged Today</p>
                  <p className="text-[11px] text-sky-800/80 dark:text-sky-300/80">Verified by Ustaz Abubakar Sadiq</p>
                </div>
              </div>

              {/* Recent Hifz Entries List */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold uppercase text-slate-700 dark:text-emerald-300 tracking-wider">
                  Latest Daily Memorization Submissions
                </h4>

                <div className="space-y-3">
                  {tahfizRecords.slice(0, 4).map((record) => (
                    <div
                      key={record.id}
                      className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 dark:text-white">{record.studentName}</span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            Halqa 1
                          </span>
                        </div>
                        <p className="text-amber-600 dark:text-amber-400 font-bold">
                          Hifz: {record.hifzSurah} (Ayah {record.hifzFromAyah}-{record.hifzToAyah}) • Pages: {record.hifzPages}
                        </p>
                        <p className="text-slate-500 dark:text-emerald-300/70 text-[11px]">
                          Sabki: {record.sabkiSurah} • Manzil: Juz {record.manzilJuz} • Notes: "{record.teacherNotes}"
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-black text-amber-600 dark:text-amber-300 bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/30">
                          ★ {record.sabkiRating}/5
                        </span>
                        <p className="text-[10px] text-slate-400 dark:text-emerald-400/70 mt-1">{record.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'analytics' && (
          <motion.div
            key="tab-analytics"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Student Growth Chart */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Student Enrollment Growth Trend
                </h3>
                <p className="text-xs text-slate-500 dark:text-emerald-300/70">Total enrolled students per month across academic sessions</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studentGrowthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="month" stroke="#10b981" fontSize={11} />
                    <YAxis stroke="#10b981" fontSize={11} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#022c22',
                        borderColor: '#10b981',
                        borderRadius: '12px',
                        color: '#fff',
                      }}
                    />
                    <Bar dataKey="students" fill="#10b981" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Attendance Analytics */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4 text-sky-500" /> Daily Punctuality & Attendance Breakdown
                </h3>
                <p className="text-xs text-slate-500 dark:text-emerald-300/70">Overall student presence vs absence distribution</p>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={attendancePie}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {attendancePie.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#022c22',
                        borderColor: '#0ea5e9',
                        borderRadius: '10px',
                        color: '#fff',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'system' && (
          <motion.div
            key="tab-system"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <SystemHealthWidget />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 6. Quick Reports Station */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-emerald-500/20">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2 font-poppins">
            <Download className="w-4 h-4 text-emerald-500" /> Quick Reports & Live Station
          </h3>
          <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold bg-emerald-100 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-300/50">Instant On-Screen View</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <button
            onClick={() => {
              setViewingReport('STUDENT');
              setActiveTab('users');
              setUserDirectorySubTab('students');
            }}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 hover:border-emerald-500 transition-all flex flex-col items-center gap-2 font-poppins font-bold text-slate-900 dark:text-white text-center hover:scale-105 group"
          >
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span>Student Report</span>
          </button>

          <button
            onClick={() => {
              setViewingReport('TEACHER');
              setActiveTab('users');
              setUserDirectorySubTab('teachers');
            }}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 hover:border-sky-500 transition-all flex flex-col items-center gap-2 font-poppins font-bold text-slate-900 dark:text-white text-center hover:scale-105 group"
          >
            <div className="p-2 rounded-xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <UserCheck className="w-5 h-5" />
            </div>
            <span>Teacher Report</span>
          </button>

          <button
            onClick={() => {
              setViewingReport('ATTENDANCE');
              setActiveTab('overview');
            }}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 hover:border-amber-500 transition-all flex flex-col items-center gap-2 font-poppins font-bold text-slate-900 dark:text-white text-center hover:scale-105 group"
          >
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white transition-colors">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <span>Attendance Report</span>
          </button>

          <button
            onClick={() => {
              setViewingReport('AUDIT');
              setActiveTab('security');
            }}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 hover:border-purple-500 transition-all flex flex-col items-center gap-2 font-poppins font-bold text-slate-900 dark:text-white text-center hover:scale-105 group"
          >
            <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <Lock className="w-5 h-5" />
            </div>
            <span>Audit Report</span>
          </button>

          <button
            onClick={() => {
              setViewingReport('SECURITY');
              setActiveTab('security');
            }}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 hover:border-rose-500 transition-all flex flex-col items-center gap-2 font-poppins font-bold text-slate-900 dark:text-white text-center hover:scale-105 group"
          >
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <span>Security Report</span>
          </button>

          <button
            onClick={() => {
              setViewingReport('ACADEMIC');
              setActiveTab('tahfiz');
            }}
            className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 hover:border-teal-500 transition-all flex flex-col items-center gap-2 font-poppins font-bold text-slate-900 dark:text-white text-center hover:scale-105 group"
          >
            <div className="p-2 rounded-xl bg-teal-100 dark:bg-teal-950 text-teal-600 dark:text-teal-400 group-hover:bg-teal-600 group-hover:text-white transition-colors">
              <Award className="w-5 h-5" />
            </div>
            <span>Academic Report</span>
          </button>
        </div>
      </div>

      {/* Instant Report Viewer Modal Overlay */}
      <AnimatePresence>
        {viewingReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 p-6 sm:p-8 text-slate-900 dark:text-white shadow-2xl space-y-6"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-emerald-500/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-xl text-xs font-bold font-poppins bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 uppercase">
                      Live Report Center
                    </span>
                    <span className="text-xs text-slate-500 dark:text-emerald-400 font-medium">Generated Immediately</span>
                  </div>
                  <h2 className="font-poppins text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                    {viewingReport === 'SECURITY' && '🛡️ Security & System Operational Report'}
                    {viewingReport === 'AUDIT' && '📋 Live Administrative Audit Trail Report'}
                    {viewingReport === 'STUDENT' && '🎓 Enrolled Students & Class Roster Report'}
                    {viewingReport === 'TEACHER' && '👨‍🏫 Asatizah & Teaching Faculty Roster Report'}
                    {viewingReport === 'ATTENDANCE' && '📊 Daily Attendance & Check-in Report'}
                    {viewingReport === 'ACADEMIC' && '📖 Tahfiz & Academic Progress Report'}
                  </h2>
                </div>

                <button
                  onClick={() => setViewingReport(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-[#021810] hover:bg-slate-200 dark:hover:bg-emerald-900 text-slate-700 dark:text-emerald-200 font-poppins font-bold text-xs border border-slate-200 dark:border-emerald-500/30 transition-colors"
                >
                  ✕ Close Preview
                </button>
              </div>

              {/* Report Body Content */}
              <div className="space-y-4">
                {(viewingReport === 'SECURITY' || viewingReport === 'AUDIT') && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold uppercase">System Health</p>
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-poppins">100% Operational</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                        <p className="text-xs text-sky-700 dark:text-sky-300 font-bold uppercase">Total Audit Entries</p>
                        <p className="text-xl font-black text-sky-600 dark:text-sky-400 font-poppins">{auditLogs.length} Events Logged</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-amber-700 dark:text-amber-300 font-bold uppercase">Security Status</p>
                        <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-poppins">Zero Active Lockouts</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-emerald-500/20">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-[#021810] text-slate-700 dark:text-emerald-300 font-bold uppercase text-[10px]">
                            <th className="py-3 px-4">Timestamp</th>
                            <th className="py-3 px-4">User</th>
                            <th className="py-3 px-4">Role</th>
                            <th className="py-3 px-4">Action Detail</th>
                            <th className="py-3 px-4">IP Address</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-emerald-500/10">
                          {auditLogs.map((log) => (
                            <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-emerald-950/30">
                              <td className="py-2.5 px-4 font-mono text-slate-500 dark:text-emerald-400/80">{log.timestamp}</td>
                              <td className="py-2.5 px-4 font-bold">{log.performedBy}</td>
                              <td className="py-2.5 px-4"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-bold text-[10px]">{log.userRole}</span></td>
                              <td className="py-2.5 px-4">{log.details}</td>
                              <td className="py-2.5 px-4 font-mono">{log.ipAddress}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {viewingReport === 'STUDENT' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold uppercase">Enrolled Students</p>
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-poppins">{students.length} Active</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
                        <p className="text-xs text-purple-700 dark:text-purple-300 font-bold uppercase">Active Classes</p>
                        <p className="text-xl font-black text-purple-600 dark:text-purple-400 font-poppins">{totalClasses} Classes</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-amber-700 dark:text-amber-300 font-bold uppercase">Tahfiz Enrolment</p>
                        <p className="text-xl font-black text-amber-600 dark:text-amber-400 font-poppins">100% Registered</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-emerald-500/20">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-[#021810] text-slate-700 dark:text-emerald-300 font-bold uppercase text-[10px]">
                            <th className="py-3 px-4">Admission No</th>
                            <th className="py-3 px-4">Student Name</th>
                            <th className="py-3 px-4">Class</th>
                            <th className="py-3 px-4">Guardian Contact</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-emerald-500/10">
                          {students.map((s) => (
                            <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-emerald-950/30">
                              <td className="py-2.5 px-4 font-mono font-bold text-emerald-600 dark:text-emerald-400">{s.admissionNo}</td>
                              <td className="py-2.5 px-4 font-bold">{s.fullName}</td>
                              <td className="py-2.5 px-4">{s.className}</td>
                              <td className="py-2.5 px-4 font-mono">{s.guardianPhone}</td>
                              <td className="py-2.5 px-4"><span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-bold text-[10px]">{s.status}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {viewingReport === 'TEACHER' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20">
                        <p className="text-xs text-sky-700 dark:text-sky-300 font-bold uppercase">Teaching Faculty</p>
                        <p className="text-xl font-black text-sky-600 dark:text-sky-400 font-poppins">{teachers.length} Active Staff</p>
                      </div>
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                        <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold uppercase">Faculty Verification</p>
                        <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-poppins">100% Certified Asatizah</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-emerald-500/20">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-100 dark:bg-[#021810] text-slate-700 dark:text-emerald-300 font-bold uppercase text-[10px]">
                            <th className="py-3 px-4">Staff ID</th>
                            <th className="py-3 px-4">Teacher Name</th>
                            <th className="py-3 px-4">Specialization</th>
                            <th className="py-3 px-4">Email & Contact</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-emerald-500/10">
                          {teachers.map((t) => (
                            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-emerald-950/30">
                              <td className="py-2.5 px-4 font-mono font-bold text-sky-600 dark:text-sky-400">{t.staffNo}</td>
                              <td className="py-2.5 px-4 font-bold">{t.fullName}</td>
                              <td className="py-2.5 px-4 text-amber-600 dark:text-amber-300 font-semibold">{t.specialization}</td>
                              <td className="py-2.5 px-4 font-mono">{t.email} • {t.phone}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {viewingReport === 'ATTENDANCE' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-bold font-poppins">
                      <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                        <p className="text-[10px] uppercase">Present Today</p>
                        <p className="text-xl font-black">{presentCount} ({attendanceRatePercentage}%)</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-300">
                        <p className="text-[10px] uppercase">Absent Today</p>
                        <p className="text-xl font-black">{absentCount}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
                        <p className="text-[10px] uppercase">Late Arrivals</p>
                        <p className="text-xl font-black">{lateCount}</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-700 dark:text-sky-300">
                        <p className="text-[10px] uppercase">Excused Absences</p>
                        <p className="text-xl font-black">{excusedCount}</p>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-emerald-300/70">
                      Attendance records are synchronized in real-time across primary, secondary, and Tahfiz Halqas.
                    </p>
                  </div>
                )}

                {viewingReport === 'ACADEMIC' && (
                  <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold uppercase">Tahfiz Memorization Milestone</p>
                      <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-poppins">{totalJuzMemorized} Total Juz Memorized</p>
                      <p className="text-xs text-slate-600 dark:text-emerald-200/80 mt-1">Over 2,000+ Quranic recitations and Muraja'ah sessions logged this academic term.</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-emerald-500/20 text-xs font-poppins font-bold">
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-2 shadow-md"
                >
                  <Download className="w-4 h-4" /> Print / Save PDF
                </button>
                <button
                  onClick={() => setViewingReport(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-200 dark:bg-emerald-950 text-slate-800 dark:text-emerald-200 hover:bg-slate-300 dark:hover:bg-emerald-900"
                >
                  Close Report Window
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
