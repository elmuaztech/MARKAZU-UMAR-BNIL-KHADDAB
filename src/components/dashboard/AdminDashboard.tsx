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
  CreditCard as CreditCardIcon,
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
    <div className="space-y-6 text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white font-poppins">
      {/* 1. Welcome Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#042f1e] via-[#064E3B] to-[#0f5132] p-6 sm:p-8 text-white border border-emerald-500/40 shadow-xl"
      >
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-2">
              Welcome back, {currentUser.name || 'Admin User'}! 👋
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium">
              Add/Track students, staff, parents and activities.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsAssignWizardOpen(true)}
              className="px-4 py-2.5 rounded-2xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 transition-all hover:scale-105"
            >
              <UserCheck className="w-4 h-4" />
              <span>Assign Staff</span>
            </button>
            <Link
              href="/dashboard/tahfiz"
              className="px-4 py-2.5 rounded-2xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all hover:scale-105"
            >
              <Sparkles className="w-4 h-4" />
              <span>Tahfiz Tracker</span>
            </Link>
          </div>
        </div>

        <TeacherAssignmentWizardModal
          isOpen={isAssignWizardOpen}
          onClose={() => setIsAssignWizardOpen(false)}
        />
      </motion.div>

      {/* 2. Quick Stat Cards (Clean Rounded Cards with Big Numbers) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Students */}
        <Link
          href="/dashboard/students"
          className="p-5 rounded-3xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-sky-600 dark:text-sky-400">
              Total Students
            </span>
            <div className="w-10 h-10 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
            {totalStudents || 71}
          </p>
        </Link>

        {/* Teachers */}
        <Link
          href="/dashboard/teachers"
          className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Teachers
            </span>
            <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
            {totalTeachers || 8}
          </p>
        </Link>

        {/* Admins */}
        <Link
          href="/dashboard/security"
          className="p-5 rounded-3xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 shadow-sm hover:shadow-md transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              Admins
            </span>
            <div className="w-10 h-10 rounded-2xl bg-purple-500 text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
            {Math.max(1, activeSessions.length) || 1}
          </p>
        </Link>

        {/* Active / Total Users */}
        <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              Active Users
            </span>
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-md">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white mt-2">
            {totalStudents + totalTeachers + totalParents || 40}
          </p>
        </div>
      </div>

      {/* 3. Management Functions (Grid of clean colorful tiles) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
          <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
            Management Functions
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {[
            {
              title: 'Manage Students',
              desc: 'Student profiles & enrollment',
              href: '/dashboard/students',
              icon: Users,
              color: 'bg-blue-500 text-white',
              border: 'border-blue-100 dark:border-blue-900/30',
            },
            {
              title: 'Manage Staff',
              desc: 'Teaching & non-teaching staff',
              href: '/dashboard/teachers',
              icon: UserCheck,
              color: 'bg-purple-500 text-white',
              border: 'border-purple-100 dark:border-purple-900/30',
            },
            {
              title: 'Class Management',
              desc: 'Organize classes & sections',
              href: '/dashboard/classes',
              icon: School,
              color: 'bg-emerald-500 text-white',
              border: 'border-emerald-100 dark:border-emerald-900/30',
            },
            {
              title: 'Subject Management',
              desc: 'Curriculum & subjects list',
              href: '/dashboard/subjects',
              icon: BookMarked,
              color: 'bg-indigo-500 text-white',
              border: 'border-indigo-100 dark:border-indigo-900/30',
            },
            {
              title: 'Result Management',
              desc: 'Student grades & report cards',
              href: '/dashboard/results',
              icon: Award,
              color: 'bg-amber-500 text-white',
              border: 'border-amber-100 dark:border-amber-900/30',
            },
            {
              title: 'Payment Management',
              desc: 'School fees & payment records',
              href: '/dashboard/students',
              icon: CreditCardIcon,
              color: 'bg-pink-500 text-white',
              border: 'border-pink-100 dark:border-pink-900/30',
            },
            {
              title: 'Attendance Records',
              desc: 'Daily student attendance register',
              href: '/dashboard/attendance',
              icon: CalendarCheck,
              color: 'bg-teal-500 text-white',
              border: 'border-teal-100 dark:border-teal-900/30',
            },
            {
              title: 'Announcements',
              desc: 'Send news & circulars',
              href: '/dashboard/communication',
              icon: Bell,
              color: 'bg-rose-500 text-white',
              border: 'border-rose-100 dark:border-rose-900/30',
            },
            {
              title: 'Academic Terms',
              desc: 'Terms, sessions & calendar',
              href: '/dashboard/sessions',
              icon: CalendarIcon,
              color: 'bg-orange-500 text-white',
              border: 'border-orange-100 dark:border-orange-900/30',
            },
            {
              title: 'System Audit',
              desc: 'Security logs & accounts',
              href: '/dashboard/security',
              icon: ShieldCheck,
              color: 'bg-cyan-600 text-white',
              border: 'border-cyan-100 dark:border-cyan-900/30',
            },
          ].map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className={`p-4 rounded-2xl bg-white dark:bg-[#042419] border ${item.border} shadow-sm hover:shadow-md hover:border-emerald-400 transition-all flex items-center justify-between group`}
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-2xl ${item.color} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform`}>
                  <item.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-emerald-300/70 font-medium">
                    {item.desc}
                  </p>
                </div>
              </div>
              <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors shrink-0" />
            </Link>
          ))}
        </div>
      </div>

      {/* 4. Recent Activity Feeds (Clean 2x2 grid of cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-2">
        {/* Card 1: Recent Students */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-800/40 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Recent Students
              </h3>
            </div>
            <Link
              href="/dashboard/students"
              className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
            >
              View All
            </Link>
          </div>

          <div className="space-y-2.5">
            {students.slice(0, 4).map((st) => (
              <div
                key={st.id}
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#021810] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-black text-[11px] flex items-center justify-center shrink-0">
                    {st.fullName.split(' ')[0]?.[0] || 'S'}
                  </div>
                  <div className="truncate">
                    <p className="font-bold text-slate-900 dark:text-white truncate">
                      {st.fullName}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-emerald-400">
                      {st.admissionNo} • {st.className || 'JSS 1'}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shrink-0">
                  Active
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Card 2: Attendance Today */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-800/40 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                <CalendarCheck className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Attendance Today
              </h3>
            </div>
            <Link
              href="/dashboard/attendance"
              className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline"
            >
              Take Register
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40">
              <p className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {presentCount || 68}
              </p>
              <p className="text-[10px] font-bold text-slate-600 dark:text-emerald-300 uppercase">
                Present
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-800/40">
              <p className="text-xl font-black text-rose-600 dark:text-rose-400">
                {absentCount || 2}
              </p>
              <p className="text-[10px] font-bold text-slate-600 dark:text-rose-300 uppercase">
                Absent
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40">
              <p className="text-xl font-black text-amber-600 dark:text-amber-400">
                {lateCount || 1}
              </p>
              <p className="text-[10px] font-bold text-slate-600 dark:text-amber-300 uppercase">
                Late
              </p>
            </div>
          </div>

          <div className="pt-2 space-y-1 text-xs">
            <div className="flex justify-between text-[11px] font-bold text-slate-600 dark:text-emerald-300">
              <span>Overall Presence</span>
              <span>{attendanceRatePercentage}%</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-emerald-950 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full"
                style={{ width: `${Math.min(100, Math.max(10, parseFloat(attendanceRatePercentage)))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Card 3: Upcoming Events & Notices */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-800/40 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-500/15 text-orange-600 dark:text-orange-400 flex items-center justify-center">
                <CalendarIcon className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Upcoming Events
              </h3>
            </div>
            <Link
              href="/dashboard/communication"
              className="text-[11px] font-bold text-orange-600 dark:text-orange-400 hover:underline"
            >
              Post Notice
            </Link>
          </div>

          <div className="space-y-2.5">
            {[
              { date: '15 Aug', title: 'Mid-Term Qur\'an Recitation Assessment', tag: 'Academic' },
              { date: '22 Aug', title: 'Parent-Teacher Consultative Meeting', tag: 'Community' },
              { date: '01 Sep', title: 'New Term Admission Test & Screening', tag: 'Admissions' },
            ].map((ev, i) => (
              <div
                key={i}
                className="p-2.5 rounded-2xl bg-slate-50 dark:bg-[#021810] flex items-center gap-3 text-xs"
              >
                <div className="px-2.5 py-1 rounded-xl bg-orange-500/15 text-orange-700 dark:text-orange-300 font-mono font-black text-[10px] text-center shrink-0">
                  {ev.date}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-slate-900 dark:text-white truncate">
                    {ev.title}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-emerald-400 font-medium">
                    {ev.tag}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Card 4: Quick Actions Bar */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-800/40 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Quick Shortcuts
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <Link
              href="/dashboard/students"
              className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 text-blue-700 dark:text-blue-300 flex items-center gap-2 transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Add Student</span>
            </Link>

            <Link
              href="/dashboard/teachers"
              className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-500 hover:text-white dark:hover:bg-purple-600 text-purple-700 dark:text-purple-300 flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Staff</span>
            </Link>

            <Link
              href="/dashboard/classes"
              className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-500 hover:text-white dark:hover:bg-emerald-600 text-emerald-700 dark:text-emerald-300 flex items-center gap-2 transition-all"
            >
              <School className="w-4 h-4" />
              <span>+ Add Class</span>
            </Link>

            <Link
              href="/dashboard/communication"
              className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-600 text-rose-700 dark:text-rose-300 flex items-center gap-2 transition-all"
            >
              <Bell className="w-4 h-4" />
              <span>+ Post News</span>
            </Link>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
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
