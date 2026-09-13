'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  CalendarDays,
  CalendarRange,
  Clock,
  Search,
  Filter,
  Layers,
  Sparkles,
  RotateCcw,
  Download,
  Printer,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  ShieldAlert,
  Edit,
  ChevronDown,
  X,
  FileSpreadsheet,
  GraduationCap,
  Building2,
  CalendarCheck,
  Info,
  Users,
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { AttendanceRecord, AttendanceStatusType } from '@/types';
import {
  filterProgrammesForUser,
  getHeadmasterAssignedProgramme,
} from '@/lib/rbac';

type TimeFilterMode =
  | 'ALL'
  | 'DATE'
  | 'DAY_OF_WEEK'
  | 'WEEK'
  | 'MONTH'
  | 'YEAR'
  | 'TERM'
  | 'SESSION'
  | 'DATE_RANGE';

const DAYS_OF_WEEK = [
  { label: 'Monday', value: 'MONDAY', dayIndex: 1 },
  { label: 'Tuesday', value: 'TUESDAY', dayIndex: 2 },
  { label: 'Wednesday', value: 'WEDNESDAY', dayIndex: 3 },
  { label: 'Thursday', value: 'THURSDAY', dayIndex: 4 },
  { label: 'Friday', value: 'FRIDAY', dayIndex: 5 },
  { label: 'Saturday', value: 'SATURDAY', dayIndex: 6 },
  { label: 'Sunday', value: 'SUNDAY', dayIndex: 0 },
];

const MONTHS = [
  { label: 'January', value: 1 },
  { label: 'February', value: 2 },
  { label: 'March', value: 3 },
  { label: 'April', value: 4 },
  { label: 'May', value: 5 },
  { label: 'June', value: 6 },
  { label: 'July', value: 7 },
  { label: 'August', value: 8 },
  { label: 'September', value: 9 },
  { label: 'October', value: 10 },
  { label: 'November', value: 11 },
  { label: 'December', value: 12 },
];

export function AttendanceFilterExplorer() {
  const {
    attendance,
    students,
    classes,
    programmes,
    currentUser,
    sessions,
    currentSession,
    teacherAssignments,
    adminOverrideAttendance,
  } = useApp();

  const isAdmin = currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN';
  const isHeadmaster = currentUser.role === 'HEADMASTER';
  const isTeacher = currentUser.role === 'TEACHER';

  // Available programmes scoped to user
  const availableProgrammes = useMemo(() => {
    return filterProgrammesForUser(currentUser, programmes);
  }, [currentUser, programmes]);

  // Available classes scoped to user
  const availableClasses = useMemo(() => {
    if (isAdmin) return classes;
    if (isHeadmaster) {
      const assigned = getHeadmasterAssignedProgramme(currentUser, programmes);
      const progId = assigned?.id || currentUser.assignedProgrammeId;
      return classes.filter((c) => !progId || c.programmeId === progId);
    }
    if (isTeacher) {
      const teacherClassIds = teacherAssignments
        .filter((ta) => ta.teacherId === currentUser.id)
        .map((ta) => ta.classId);
      return classes.filter((c) => teacherClassIds.includes(c.id));
    }
    return classes;
  }, [classes, currentUser, isAdmin, isHeadmaster, isTeacher, programmes, teacherAssignments]);

  // --- FILTER STATES ---
  const [timeMode, setTimeMode] = useState<TimeFilterMode>('ALL');

  // Specific Date filter (YYYY-MM-DD)
  const [filterDate, setFilterDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Day of week filter (MONDAY..SUNDAY)
  const [filterDayOfWeek, setFilterDayOfWeek] = useState<string>('ALL');

  // Week filter mode: 'THIS_WEEK' | 'LAST_WEEK' | 'CUSTOM_WEEK'
  const [filterWeekPreset, setFilterWeekPreset] = useState<'THIS_WEEK' | 'LAST_WEEK' | 'CUSTOM'>('THIS_WEEK');

  // Month & Year filter
  const currentMonthNum = new Date().getMonth() + 1;
  const currentYearNum = new Date().getFullYear();
  const [filterMonth, setFilterMonth] = useState<number>(currentMonthNum);
  const [filterYear, setFilterYear] = useState<number>(currentYearNum);

  // Term filter
  const [filterTerm, setFilterTerm] = useState<string>('ALL');

  // Academic Session filter
  const [filterSessionId, setFilterSessionId] = useState<string>('ALL');

  // Custom Date Range filter
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');

  // Demographics / Entity filters
  const [filterProgrammeId, setFilterProgrammeId] = useState<string>('ALL');
  const [filterClassId, setFilterClassId] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Admin Override Modal
  const [overrideTarget, setOverrideTarget] = useState<AttendanceRecord | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<AttendanceStatusType>('PRESENT');
  const [overrideReason, setOverrideReason] = useState<string>('');

  // Reset all filters to default
  const handleResetFilters = () => {
    setTimeMode('ALL');
    setFilterDate(new Date().toISOString().split('T')[0]);
    setFilterDayOfWeek('ALL');
    setFilterWeekPreset('THIS_WEEK');
    setFilterMonth(currentMonthNum);
    setFilterYear(currentYearNum);
    setFilterTerm('ALL');
    setFilterSessionId('ALL');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterProgrammeId('ALL');
    setFilterClassId('ALL');
    setFilterStatus('ALL');
    setSearchTerm('');
  };

  // Helper date calculators
  const getWeekRange = (preset: 'THIS_WEEK' | 'LAST_WEEK') => {
    const d = new Date();
    if (preset === 'LAST_WEEK') {
      d.setDate(d.getDate() - 7);
    }
    const day = d.getDay(); // 0 is Sunday
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diffToMonday));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
    };
  };

  // Quick Preset Handlers
  const applyPreset = (presetName: string) => {
    const today = new Date().toISOString().split('T')[0];
    switch (presetName) {
      case 'TODAY':
        setTimeMode('DATE');
        setFilterDate(today);
        break;
      case 'YESTERDAY': {
        const y = new Date();
        y.setDate(y.getDate() - 1);
        setTimeMode('DATE');
        setFilterDate(y.toISOString().split('T')[0]);
        break;
      }
      case 'THIS_WEEK':
        setTimeMode('WEEK');
        setFilterWeekPreset('THIS_WEEK');
        break;
      case 'THIS_MONTH':
        setTimeMode('MONTH');
        setFilterMonth(currentMonthNum);
        setFilterYear(currentYearNum);
        break;
      case 'THIS_TERM':
        setTimeMode('TERM');
        setFilterTerm(currentSession?.activeTerm || 'Term 1');
        break;
      case 'THIS_SESSION':
        setTimeMode('SESSION');
        setFilterSessionId(currentSession?.id || 'ALL');
        break;
      case 'ALL':
        handleResetFilters();
        break;
      default:
        break;
    }
  };

  // Filtered Attendance List
  const filteredRecords = useMemo(() => {
    const weekRange = getWeekRange(filterWeekPreset === 'LAST_WEEK' ? 'LAST_WEEK' : 'THIS_WEEK');

    return attendance.filter((rec) => {
      // 1. Role / Scoping Security
      if (isHeadmaster) {
        const assigned = getHeadmasterAssignedProgramme(currentUser, programmes);
        const progId = assigned?.id || currentUser.assignedProgrammeId;
        if (progId && rec.programmeId && rec.programmeId !== progId) return false;
      }
      if (isTeacher) {
        const allowedClassIds = availableClasses.map((c) => c.id);
        if (!allowedClassIds.includes(rec.classId)) return false;
      }

      // Safe date normalization
      const recordDateStr = rec.date.includes('T') ? rec.date.split('T')[0] : rec.date;
      const recDateObj = new Date(recordDateStr + 'T12:00:00Z');

      // 2. Time Mode Filtering
      if (timeMode === 'DATE') {
        if (recordDateStr !== filterDate) return false;
      } else if (timeMode === 'DAY_OF_WEEK') {
        if (filterDayOfWeek !== 'ALL') {
          const dayIdx = recDateObj.getUTCDay();
          const dayName = DAYS_OF_WEEK.find((d) => d.dayIndex === dayIdx)?.value;
          if (dayName !== filterDayOfWeek) return false;
        }
      } else if (timeMode === 'WEEK') {
        if (recordDateStr < weekRange.start || recordDateStr > weekRange.end) return false;
      } else if (timeMode === 'MONTH') {
        const recMonth = recDateObj.getUTCMonth() + 1;
        const recYear = recDateObj.getUTCFullYear();
        if (recMonth !== filterMonth || recYear !== filterYear) return false;
      } else if (timeMode === 'YEAR') {
        const recYear = recDateObj.getUTCFullYear();
        if (recYear !== filterYear) return false;
      } else if (timeMode === 'TERM') {
        if (filterTerm !== 'ALL') {
          const recTerm = (rec.term || '').toUpperCase();
          const targetTerm = filterTerm.toUpperCase();
          if (!recTerm.includes(targetTerm) && !targetTerm.includes(recTerm)) {
            // Also match if sessionId maps to that term in sessions list
            const matchedSession = sessions.find((s) => s.id === rec.sessionId);
            if (!matchedSession || !matchedSession.activeTerm.toUpperCase().includes(targetTerm)) {
              return false;
            }
          }
        }
      } else if (timeMode === 'SESSION') {
        if (filterSessionId !== 'ALL' && rec.sessionId !== filterSessionId) {
          // If no sessionId on record, check if currentSession name matches
          const currentMatches = currentSession?.id === filterSessionId && currentSession.sessionName === rec.sessionId;
          if (!currentMatches) return false;
        }
      } else if (timeMode === 'DATE_RANGE') {
        if (filterStartDate && recordDateStr < filterStartDate) return false;
        if (filterEndDate && recordDateStr > filterEndDate) return false;
      }

      // 3. Demographic & Entity Filters
      if (filterProgrammeId !== 'ALL' && rec.programmeId !== filterProgrammeId) {
        return false;
      }
      if (filterClassId !== 'ALL' && rec.classId !== filterClassId) {
        return false;
      }
      if (filterStatus !== 'ALL' && rec.status !== filterStatus) {
        return false;
      }

      // 4. Search Filter
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesName = rec.studentName.toLowerCase().includes(term);
        const matchesRemarks = (rec.remarks || '').toLowerCase().includes(term);
        const matchesClass = (rec.className || '').toLowerCase().includes(term);
        if (!matchesName && !matchesRemarks && !matchesClass) {
          return false;
        }
      }

      return true;
    });
  }, [
    attendance,
    isHeadmaster,
    isTeacher,
    currentUser,
    programmes,
    availableClasses,
    timeMode,
    filterDate,
    filterDayOfWeek,
    filterWeekPreset,
    filterMonth,
    filterYear,
    filterTerm,
    filterSessionId,
    filterStartDate,
    filterEndDate,
    filterProgrammeId,
    filterClassId,
    filterStatus,
    searchTerm,
    sessions,
    currentSession,
  ]);

  // Statistics calculation
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter((r) => r.status === 'PRESENT').length;
    const absent = filteredRecords.filter((r) => r.status === 'ABSENT').length;
    const late = filteredRecords.filter((r) => r.status === 'LATE').length;
    const excused = filteredRecords.filter(
      (r) => r.status === 'EXCUSED' || r.status === 'MEDICAL_LEAVE' || r.status === 'OFFICIAL_ASSIGNMENT'
    ).length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, excused, rate };
  }, [filteredRecords]);

  // Export to CSV
  const handleExportCsv = () => {
    if (filteredRecords.length === 0) {
      alert('No records available to export.');
      return;
    }

    const headers = ['Date', 'Day', 'Student Name', 'Class', 'Programme', 'Status', 'Remarks', 'Edited By', 'Edit Reason'];
    const rows = filteredRecords.map((r) => {
      const d = new Date((r.date.includes('T') ? r.date.split('T')[0] : r.date) + 'T12:00:00Z');
      const dayName = DAYS_OF_WEEK.find((item) => item.dayIndex === d.getUTCDay())?.label || '';
      return [
        `"${r.date}"`,
        `"${dayName}"`,
        `"${r.studentName}"`,
        `"${r.className || ''}"`,
        `"${r.programmeId || ''}"`,
        `"${r.status}"`,
        `"${(r.remarks || '').replace(/"/g, '""')}"`,
        `"${r.editedBy || ''}"`,
        `"${(r.editReason || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_filtered_report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Handle Admin Override Execution
  const handleExecuteOverride = () => {
    if (!overrideTarget || !overrideReason.trim()) {
      alert('Please enter a mandatory administrative reason for this attendance override.');
      return;
    }
    adminOverrideAttendance(overrideTarget.id, overrideStatus, overrideReason);
    setOverrideTarget(null);
    alert('Attendance override successfully saved and recorded in audit logs.');
  };

  return (
    <div className="space-y-6 font-poppins">
      {/* Overview Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-4 bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/20 rounded-2xl shadow-sm">
          <div className="text-[11px] font-bold text-slate-500 dark:text-emerald-300/70 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-emerald-500" />
            <span>Total Records</span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1.5">{stats.total}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Matching active filters</div>
        </div>

        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl">
          <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Present</span>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">{stats.present}</div>
          <div className="text-[10px] text-emerald-600/70 mt-0.5">
            {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}% of total
          </div>
        </div>

        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-2xl">
          <div className="text-[11px] font-bold text-rose-700 dark:text-rose-300 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            <span>Absent</span>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1.5">{stats.absent}</div>
          <div className="text-[10px] text-rose-600/70 mt-0.5">
            {stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}% of total
          </div>
        </div>

        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl">
          <div className="text-[11px] font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Late Arrivals</span>
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1.5">{stats.late}</div>
          <div className="text-[10px] text-amber-600/70 mt-0.5">
            {stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0}% of total
          </div>
        </div>

        <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl">
          <div className="text-[11px] font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5 text-blue-500" />
            <span>Excused / Sick</span>
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1.5">{stats.excused}</div>
          <div className="text-[10px] text-blue-600/70 mt-0.5">Official leave</div>
        </div>

        <div className="p-4 bg-gradient-to-br from-emerald-600 to-emerald-900 text-white rounded-2xl text-center flex flex-col justify-center">
          <div className="text-[11px] font-bold text-emerald-200">Attendance Rate</div>
          <div className="text-2xl font-black mt-1">{stats.rate}%</div>
          <div className="text-[10px] text-emerald-200/80 mt-0.5">Present / Total</div>
        </div>
      </div>

      {/* QUICK PRESETS TOOLBAR */}
      <div className="flex flex-wrap items-center gap-2 p-2.5 bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/20 rounded-2xl shadow-sm">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-emerald-300/70 mr-1 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Quick Presets:
        </span>

        <button
          onClick={() => applyPreset('TODAY')}
          className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all"
        >
          Today
        </button>

        <button
          onClick={() => applyPreset('YESTERDAY')}
          className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all"
        >
          Yesterday
        </button>

        <button
          onClick={() => applyPreset('THIS_WEEK')}
          className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all"
        >
          This Week
        </button>

        <button
          onClick={() => applyPreset('THIS_MONTH')}
          className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all"
        >
          This Month
        </button>

        <button
          onClick={() => applyPreset('THIS_TERM')}
          className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all"
        >
          This Term
        </button>

        <button
          onClick={() => applyPreset('THIS_SESSION')}
          className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all"
        >
          This Academic Session
        </button>

        <button
          onClick={() => applyPreset('ALL')}
          className="px-3 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 hover:bg-emerald-600 hover:text-white transition-all ml-auto"
        >
          Show All
        </button>

        <button
          onClick={handleResetFilters}
          className="px-3 py-1 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1 transition-all"
        >
          <RotateCcw className="w-3 h-3" /> Reset Filters
        </button>
      </div>

      {/* COMPREHENSIVE FILTERING DASHBOARD CARD */}
      <div className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-emerald-500/20 pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
              Multi-Dimensional Attendance Filtering Engine
            </h3>
          </div>

          {/* Timeframe Mode Selector Pills */}
          <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-[#021810] p-1 rounded-2xl border border-slate-200 dark:border-emerald-500/20 text-xs">
            <button
              onClick={() => setTimeMode('ALL')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                timeMode === 'ALL'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-emerald-300 hover:text-emerald-500'
              }`}
            >
              All Dates
            </button>

            <button
              onClick={() => setTimeMode('DATE')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                timeMode === 'DATE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-emerald-300 hover:text-emerald-500'
              }`}
            >
              By Date
            </button>

            <button
              onClick={() => setTimeMode('DAY_OF_WEEK')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                timeMode === 'DAY_OF_WEEK'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-emerald-300 hover:text-emerald-500'
              }`}
            >
              By Day of Week
            </button>

            <button
              onClick={() => setTimeMode('WEEK')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                timeMode === 'WEEK'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-emerald-300 hover:text-emerald-500'
              }`}
            >
              By Week
            </button>

            <button
              onClick={() => setTimeMode('MONTH')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                timeMode === 'MONTH'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-emerald-300 hover:text-emerald-500'
              }`}
            >
              By Month
            </button>

            <button
              onClick={() => setTimeMode('YEAR')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                timeMode === 'YEAR'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-emerald-300 hover:text-emerald-500'
              }`}
            >
              By Year
            </button>

            <button
              onClick={() => setTimeMode('TERM')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                timeMode === 'TERM'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-emerald-300 hover:text-emerald-500'
              }`}
            >
              By Term
            </button>

            <button
              onClick={() => setTimeMode('SESSION')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                timeMode === 'SESSION'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-emerald-300 hover:text-emerald-500'
              }`}
            >
              By Session
            </button>

            <button
              onClick={() => setTimeMode('DATE_RANGE')}
              className={`px-2.5 py-1 rounded-xl font-bold transition-all ${
                timeMode === 'DATE_RANGE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-emerald-300 hover:text-emerald-500'
              }`}
            >
              Date Range
            </button>
          </div>
        </div>

        {/* DYNAMIC TIMEFRAME CONTROLS BASED ON ACTIVE MODE */}
        <div className="p-3 bg-emerald-500/5 dark:bg-[#021810] border border-emerald-500/20 rounded-2xl">
          {timeMode === 'ALL' && (
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-emerald-300">
              <CalendarRange className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Viewing attendance records across all available dates and sessions. Select a time mode above to filter by specific period.</span>
            </div>
          )}

          {timeMode === 'DATE' && (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-slate-700 dark:text-emerald-200">Select Date:</span>
                <input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <button
                  onClick={() => {
                    const prev = new Date(filterDate);
                    prev.setDate(prev.getDate() - 1);
                    setFilterDate(prev.toISOString().split('T')[0]);
                  }}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-slate-700 dark:text-emerald-300 text-xs font-bold hover:bg-slate-50"
                >
                  ◀ Previous Day
                </button>
                <button
                  onClick={() => setFilterDate(new Date().toISOString().split('T')[0])}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-slate-700 dark:text-emerald-300 text-xs font-bold hover:bg-slate-50"
                >
                  Today
                </button>
                <button
                  onClick={() => {
                    const next = new Date(filterDate);
                    next.setDate(next.getDate() + 1);
                    setFilterDate(next.toISOString().split('T')[0]);
                  }}
                  className="px-2 py-1 rounded-lg bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-slate-700 dark:text-emerald-300 text-xs font-bold hover:bg-slate-50"
                >
                  Next Day ▶
                </button>
              </div>
            </div>
          )}

          {timeMode === 'DAY_OF_WEEK' && (
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700 dark:text-emerald-200 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4 text-emerald-500" />
                <span>Filter by Day of the Week:</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  onClick={() => setFilterDayOfWeek('ALL')}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                    filterDayOfWeek === 'ALL'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-slate-700 dark:text-emerald-300'
                  }`}
                >
                  All Days
                </button>
                {DAYS_OF_WEEK.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => setFilterDayOfWeek(day.value)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      filterDayOfWeek === day.value
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-slate-700 dark:text-emerald-300 hover:border-emerald-500'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {timeMode === 'WEEK' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-xs font-bold text-slate-700 dark:text-emerald-200 flex items-center gap-1.5">
                <CalendarRange className="w-4 h-4 text-emerald-500" />
                <span>Select Week Range:</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFilterWeekPreset('THIS_WEEK')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterWeekPreset === 'THIS_WEEK'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-slate-700 dark:text-emerald-300'
                  }`}
                >
                  Current Week (Mon - Sun)
                </button>
                <button
                  onClick={() => setFilterWeekPreset('LAST_WEEK')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    filterWeekPreset === 'LAST_WEEK'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-slate-700 dark:text-emerald-300'
                  }`}
                >
                  Previous Week
                </button>
              </div>
              <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                Active Week: {getWeekRange(filterWeekPreset === 'LAST_WEEK' ? 'LAST_WEEK' : 'THIS_WEEK').start} to{' '}
                {getWeekRange(filterWeekPreset === 'LAST_WEEK' ? 'LAST_WEEK' : 'THIS_WEEK').end}
              </span>
            </div>
          )}

          {timeMode === 'MONTH' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                <span className="text-xs font-bold text-slate-700 dark:text-emerald-200">Month:</span>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                >
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-emerald-200">Year:</span>
                <select
                  value={filterYear}
                  onChange={(e) => setFilterYear(Number(e.target.value))}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                >
                  {[2024, 2025, 2026, 2027, 2028].map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {timeMode === 'YEAR' && (
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-xs font-bold text-slate-700 dark:text-emerald-200">Calendar Year:</span>
              <select
                value={filterYear}
                onChange={(e) => setFilterYear(Number(e.target.value))}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
              >
                {[2024, 2025, 2026, 2027, 2028].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          )}

          {timeMode === 'TERM' && (
            <div className="flex flex-wrap items-center gap-3">
              <GraduationCap className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-xs font-bold text-slate-700 dark:text-emerald-200">Academic Term:</span>
              <div className="flex items-center gap-1.5">
                {['ALL', 'Term 1', 'Term 2', 'Term 3'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setFilterTerm(term)}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${
                      filterTerm === term
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-slate-700 dark:text-emerald-300'
                    }`}
                  >
                    {term === 'ALL' ? 'All Terms' : term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {timeMode === 'SESSION' && (
            <div className="flex flex-wrap items-center gap-3">
              <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-xs font-bold text-slate-700 dark:text-emerald-200">Academic Session:</span>
              <select
                value={filterSessionId}
                onChange={(e) => setFilterSessionId(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="ALL">All Academic Sessions</option>
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.sessionName} {s.isCurrent ? '⭐ (Current Active)' : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          {timeMode === 'DATE_RANGE' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-emerald-200">From Date:</span>
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-emerald-200">To Date:</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* DEMOGRAPHIC & COOPERATIVE DROPDOWNS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          {/* Programme Scope */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-emerald-300 mb-1">
              Programme Section
            </label>
            <select
              value={filterProgrammeId}
              onChange={(e) => setFilterProgrammeId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="ALL">All Programme Sections</option>
              {availableProgrammes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.programme_name_english || p.programme_name}
                </option>
              ))}
            </select>
          </div>

          {/* Class Scope */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-emerald-300 mb-1">
              Class Roster
            </label>
            <select
              value={filterClassId}
              onChange={(e) => setFilterClassId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="ALL">All Classes</option>
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Attendance Status */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-emerald-300 mb-1">
              Attendance Status
            </label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="ALL">All Statuses</option>
              <option value="PRESENT">Present Only</option>
              <option value="ABSENT">Absent Only</option>
              <option value="LATE">Late Arrivals Only</option>
              <option value="EXCUSED">Excused Leave Only</option>
              <option value="MEDICAL_LEAVE">Medical Leave Only</option>
              <option value="OFFICIAL_ASSIGNMENT">Official Assignment</option>
            </select>
          </div>

          {/* Keyword Search */}
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-emerald-300 mb-1">
              Live Search Student / Notes
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search student or remark..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* ACTIVE FILTER CHIPS BAR */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-emerald-500/10">
          <span className="text-[10px] font-bold text-slate-400 dark:text-emerald-400/60 uppercase mr-1">Active Filter Tags:</span>
          {timeMode !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
              Mode: {timeMode}
              <X className="w-2.5 h-2.5 cursor-pointer hover:text-rose-500" onClick={() => setTimeMode('ALL')} />
            </span>
          )}

          {filterDayOfWeek !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-700">
              Day: {filterDayOfWeek}
              <X className="w-2.5 h-2.5 cursor-pointer hover:text-rose-500" onClick={() => setFilterDayOfWeek('ALL')} />
            </span>
          )}

          {filterProgrammeId !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
              Prog: {programmes.find((p) => p.id === filterProgrammeId)?.programme_name_english || filterProgrammeId}
              <X className="w-2.5 h-2.5 cursor-pointer hover:text-rose-500" onClick={() => setFilterProgrammeId('ALL')} />
            </span>
          )}

          {filterClassId !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700">
              Class: {classes.find((c) => c.id === filterClassId)?.name || filterClassId}
              <X className="w-2.5 h-2.5 cursor-pointer hover:text-rose-500" onClick={() => setFilterClassId('ALL')} />
            </span>
          )}

          {filterStatus !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
              Status: {filterStatus}
              <X className="w-2.5 h-2.5 cursor-pointer hover:text-rose-500" onClick={() => setFilterStatus('ALL')} />
            </span>
          )}

          {searchTerm.trim() && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
              Search: "{searchTerm}"
              <X className="w-2.5 h-2.5 cursor-pointer hover:text-rose-500" onClick={() => setSearchTerm('')} />
            </span>
          )}

          {timeMode === 'ALL' &&
            filterDayOfWeek === 'ALL' &&
            filterProgrammeId === 'ALL' &&
            filterClassId === 'ALL' &&
            filterStatus === 'ALL' &&
            !searchTerm.trim() && (
              <span className="text-[10px] text-slate-400 italic">None (Displaying all records)</span>
            )}
        </div>
      </div>

      {/* ATTENDANCE ROSTER TABLE CARD */}
      <div className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-200 dark:border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <div>
              <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                Filtered Attendance Records Log
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-emerald-300/70">
                Found {filteredRecords.length} records matching active query criteria
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportCsv}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl bg-slate-100 dark:bg-emerald-950 hover:bg-slate-200 text-slate-800 dark:text-emerald-200 font-black text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-emerald-500/30 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Roster</span>
            </button>
          </div>
        </div>

        {/* The Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-[#021810] border-b border-slate-200 dark:border-emerald-500/20 text-[10px] font-black text-slate-500 dark:text-emerald-300 uppercase tracking-wider">
                <th className="p-4">Date & Day</th>
                <th className="p-4">Student & ID</th>
                <th className="p-4">Class & Programme</th>
                <th className="p-4">Status</th>
                <th className="p-4">Remarks / Audit Info</th>
                {isAdmin && <th className="p-4 text-right">Admin Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-emerald-500/10 text-xs font-medium">
              {filteredRecords.length > 0 ? (
                filteredRecords.map((rec) => {
                  const d = new Date((rec.date.includes('T') ? rec.date.split('T')[0] : rec.date) + 'T12:00:00Z');
                  const dayName = DAYS_OF_WEEK.find((item) => item.dayIndex === d.getUTCDay())?.label || '';

                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 dark:hover:bg-emerald-950/20 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">{rec.date}</div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-bold">
                          {dayName}
                        </div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-900 dark:text-white">{rec.studentName}</div>
                        <div className="text-[10px] text-slate-400 font-mono">ID: {rec.studentId.substring(0, 8)}...</div>
                      </td>

                      <td className="p-4">
                        <div className="font-bold text-slate-800 dark:text-emerald-200">{rec.className || 'Assigned Class'}</div>
                        <div className="text-[10px] text-slate-500 dark:text-emerald-400/80">
                          {programmes.find((p) => p.id === rec.programmeId)?.programme_name_english || 'Islamic Studies'}
                        </div>
                      </td>

                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${
                            rec.status === 'PRESENT'
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                              : rec.status === 'ABSENT'
                              ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/30'
                              : rec.status === 'LATE'
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30'
                          }`}
                        >
                          {rec.status === 'PRESENT' && <CheckCircle2 className="w-2.5 h-2.5" />}
                          {rec.status === 'ABSENT' && <XCircle className="w-2.5 h-2.5" />}
                          {rec.status === 'LATE' && <Clock className="w-2.5 h-2.5" />}
                          {rec.status}
                        </span>
                      </td>

                      <td className="p-4">
                        <div className="text-slate-700 dark:text-emerald-200 text-xs">{rec.remarks || 'No remarks'}</div>
                        {rec.editedBy && (
                          <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                            Modified: {rec.editedBy} ({rec.editReason || 'Administrative override'})
                          </div>
                        )}
                      </td>

                      {isAdmin && (
                        <td className="p-4 text-right">
                          <button
                            onClick={() => {
                              setOverrideTarget(rec);
                              setOverrideStatus(rec.status);
                              setOverrideReason('');
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[10px] inline-flex items-center gap-1 shadow-sm transition-all"
                          >
                            <Edit className="w-3 h-3" /> Override
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 6 : 5} className="p-12 text-center">
                    <div className="max-w-sm mx-auto space-y-2">
                      <CalendarDays className="w-8 h-8 text-slate-300 dark:text-emerald-700 mx-auto" />
                      <p className="font-bold text-sm text-slate-700 dark:text-emerald-200">
                        No Attendance Records Found
                      </p>
                      <p className="text-xs text-slate-400">
                        No records matched your selected timeframe or filter criteria. Try clicking "Show All" or "Reset Filters" above.
                      </p>
                      <button
                        onClick={handleResetFilters}
                        className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500 transition-all"
                      >
                        Reset All Filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ADMIN OVERRIDE MODAL */}
      {overrideTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#042419] border border-amber-500/40 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-500/20 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                Administrative Attendance Override
              </h3>
              <button
                onClick={() => setOverrideTarget(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-slate-400">Student:</span>{' '}
                <strong className="text-slate-900 dark:text-white">{overrideTarget.studentName}</strong>
              </div>
              <div>
                <span className="text-slate-400">Date:</span>{' '}
                <strong className="text-slate-900 dark:text-white">{overrideTarget.date}</strong>
              </div>
              <div>
                <span className="text-slate-400">Class:</span>{' '}
                <strong className="text-slate-900 dark:text-white">{overrideTarget.className}</strong>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-emerald-300 mb-1">
                  New Attendance Status:
                </label>
                <select
                  value={overrideStatus}
                  onChange={(e) => setOverrideStatus(e.target.value as AttendanceStatusType)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="PRESENT">PRESENT</option>
                  <option value="ABSENT">ABSENT</option>
                  <option value="LATE">LATE</option>
                  <option value="EXCUSED">EXCUSED</option>
                  <option value="MEDICAL_LEAVE">MEDICAL LEAVE</option>
                  <option value="OFFICIAL_ASSIGNMENT">OFFICIAL ASSIGNMENT</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-emerald-300 mb-1">
                  Mandatory Administrative Reason:
                </label>
                <textarea
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="e.g., Parent submitted medical certificate, authorized official travel..."
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-emerald-500/20">
              <button
                onClick={() => setOverrideTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-emerald-300 hover:bg-slate-100 dark:hover:bg-emerald-950"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteOverride}
                className="px-4 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
              >
                Confirm & Save Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
