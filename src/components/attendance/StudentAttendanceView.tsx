'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { Student, AttendanceRecord, AttendanceStatusType } from '@/types';
import {
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  HeartPulse,
  User,
  GraduationCap,
  BookOpen,
  Calendar,
  Filter,
  Users,
  ShieldCheck,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface StudentAttendanceViewProps {
  // If student is provided directly (e.g. for parent viewing specific child), use it;
  // otherwise, default to the logged-in student.
  studentOverride?: Student;
  isParentView?: boolean;
}

export function StudentAttendanceView({ studentOverride, isParentView = false }: StudentAttendanceViewProps) {
  const {
    currentUser,
    students,
    attendance,
    classes,
    teachers,
    currentSession,
  } = useApp();

  // 1. Resolve Active Student
  const resolvedStudent = useMemo(() => {
    if (studentOverride) return studentOverride;

    // Find student corresponding to current user
    return students.find(
      (s) =>
        s.userId === currentUser.id ||
        s.id === currentUser.id ||
        (s.email && currentUser.email && s.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (s.admissionNo && currentUser.username && s.admissionNo.toLowerCase() === currentUser.username.toLowerCase())
    );
  }, [studentOverride, students, currentUser]);

  // 2. Resolve Linked Wards for Parent View
  const parentWards = useMemo(() => {
    if (!isParentView) return [];
    return students.filter(
      (s) => s.guardianId === currentUser.id || s.parentEmail === currentUser.email
    );
  }, [isParentView, students, currentUser]);

  const [selectedWardId, setSelectedWardId] = useState<string>(
    studentOverride?.id || (parentWards[0]?.id ?? '')
  );

  const activeStudent = isParentView
    ? parentWards.find((w) => w.id === selectedWardId) || resolvedStudent
    : resolvedStudent;

  // 3. Resolve Class & Teacher Information (without inventing data)
  const studentClass = useMemo(() => {
    if (!activeStudent) return null;
    return classes.find(
      (c) => c.id === activeStudent.classId || c.name === activeStudent.className
    );
  }, [activeStudent, classes]);

  const classTeacher = useMemo(() => {
    if (!studentClass?.classTeacherId) return null;
    return teachers.find((t) => t.id === studentClass.classTeacherId);
  }, [studentClass, teachers]);

  // 4. Resolve Student Attendance Records
  const studentRecords = useMemo(() => {
    if (!activeStudent) return [];
    return attendance
      .filter((rec) => rec.studentId === activeStudent.id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [activeStudent, attendance]);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredRecords = useMemo(() => {
    return studentRecords.filter((rec) => {
      if (statusFilter !== 'ALL' && rec.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const dateStr = new Date(rec.date).toLocaleDateString().toLowerCase();
        const remarksStr = (rec.remarks || '').toLowerCase();
        return dateStr.includes(query) || remarksStr.includes(query);
      }
      return true;
    });
  }, [studentRecords, statusFilter, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = studentRecords.length;
    const present = studentRecords.filter((r) => r.status === 'PRESENT').length;
    const absent = studentRecords.filter((r) => r.status === 'ABSENT').length;
    const late = studentRecords.filter((r) => r.status === 'LATE').length;
    const excused = studentRecords.filter(
      (r) => r.status === 'EXCUSED' || (r.status as string) === 'MEDICAL_LEAVE'
    ).length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 100;

    return { total, present, absent, late, excused, rate };
  }, [studentRecords]);

  // Helper for status badge styling
  const getStatusBadge = (status: AttendanceStatusType | string) => {
    switch (status) {
      case 'PRESENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-300/40 shrink-0">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            <span>Present</span>
          </span>
        );
      case 'ABSENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-300/40 shrink-0">
            <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            <span>Absent</span>
          </span>
        );
      case 'LATE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300/40 shrink-0">
            <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            <span>Late</span>
          </span>
        );
      case 'EXCUSED':
      case 'MEDICAL_LEAVE':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-sky-100 dark:bg-sky-950/70 text-sky-800 dark:text-sky-300 border border-sky-300/40 shrink-0">
            <HeartPulse className="w-3 h-3 text-sky-600 dark:text-sky-400" />
            <span>Excused</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-emerald-950/40 text-slate-700 dark:text-emerald-300 shrink-0">
            <HelpCircle className="w-3 h-3" />
            <span>{status}</span>
          </span>
        );
    }
  };

  // If no student record could be linked
  if (!activeStudent) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-3xl bg-white dark:bg-[#042419] border border-dashed border-emerald-300/50 dark:border-emerald-500/20 space-y-3 font-poppins max-w-xl mx-auto shadow-sm">
        <GraduationCap className="w-12 h-12 text-emerald-500/50 mx-auto" />
        <h3 className="font-extrabold text-base text-slate-900 dark:text-white">
          {isParentView ? 'No Enrolled Ward Selected' : 'No Student Record Linked'}
        </h3>
        <p className="text-xs text-slate-500 dark:text-emerald-300/70 leading-relaxed">
          {isParentView
            ? 'There are no active enrolled children linked to this guardian account yet. Please contact the administrative office.'
            : 'Your account is active, but your profile has not been assigned to a student record yet. Please contact the school administration.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-poppins">
      {/* Ward Selector for Parents with multiple children */}
      {isParentView && parentWards.length > 1 && (
        <div className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/20 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-emerald-400">
              Select Child ({parentWards.length})
            </span>
            <span className="text-[11px] text-slate-400 dark:text-emerald-500">
              Viewing attendance for: <strong className="text-emerald-600 dark:text-emerald-300">{activeStudent.fullName}</strong>
            </span>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            {parentWards.map((ward) => (
              <button
                key={ward.id}
                onClick={() => setSelectedWardId(ward.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  activeStudent.id === ward.id
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-slate-50 dark:bg-emerald-950/50 text-slate-700 dark:text-emerald-200 border-slate-200 dark:border-emerald-800/40 hover:bg-emerald-100/50'
                }`}
              >
                <User className="w-3 h-3" />
                <span>{ward.fullName}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Neat, Professional Green-Themed Student Information Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-[#042f1e] to-emerald-950 text-white border border-emerald-500/30 p-5 sm:p-7 shadow-xl">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          {/* Student Identity */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 border-2 border-emerald-400/40 flex items-center justify-center text-white text-lg sm:text-xl font-black shrink-0 shadow-inner">
              {activeStudent.fullName.charAt(0)}
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-2xl font-black tracking-tight text-white break-words font-poppins">
                  {activeStudent.fullName}
                </h2>
                {activeStudent.fullNameArabic && (
                  <span dir="rtl" lang="ar" className="font-arabic text-amber-300 text-sm font-semibold">
                    {activeStudent.fullNameArabic}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-emerald-200/90 font-medium">
                <span className="inline-flex items-center gap-1">
                  <GraduationCap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                  <span>Admission: <strong className="text-white font-mono">{activeStudent.admissionNo}</strong></span>
                </span>
                <span className="text-emerald-500 hidden sm:inline">•</span>
                <span className="inline-flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Class: <strong className="text-white">{activeStudent.className || 'Assigned Class'}</strong></span>
                </span>
              </div>
            </div>
          </div>

          {/* Academic Scope & Teacher Details (Displayed Only When Available) */}
          <div className="flex flex-wrap md:flex-col items-start md:items-end justify-between gap-2 pt-3 md:pt-0 border-t md:border-t-0 border-emerald-800/60 text-xs">
            <div className="flex items-center gap-1.5 text-emerald-200/90">
              <Calendar className="w-3.5 h-3.5 text-amber-300 shrink-0" />
              <span>{currentSession?.sessionName} ({currentSession?.activeTerm || 'Term 1'})</span>
            </div>

            {classTeacher?.fullName && (
              <div className="flex items-center gap-1.5 text-emerald-300/90">
                <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>Class Teacher: <strong className="text-white">{classTeacher.fullName}</strong></span>
              </div>
            )}

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 font-bold text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-300" />
              <span>Verified Attendance Record</span>
            </div>
          </div>
        </div>
      </div>

      {/* Attendance Statistics Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/20 text-center shadow-xs">
          <div className="text-[10px] sm:text-xs font-bold uppercase text-slate-500 dark:text-emerald-400">Total School Days</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</div>
          <div className="text-[10px] text-slate-400 dark:text-emerald-500 mt-0.5">Recorded Days</div>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 text-center shadow-xs">
          <div className="text-[10px] sm:text-xs font-bold uppercase text-emerald-700 dark:text-emerald-300">Days Present</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.present}</div>
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.rate}% Attendance</div>
        </div>

        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 text-center shadow-xs">
          <div className="text-[10px] sm:text-xs font-bold uppercase text-rose-700 dark:text-rose-300">Days Absent</div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.absent}</div>
          <div className="text-[10px] text-rose-500 dark:text-rose-400 mt-0.5">Unexcused Absences</div>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 text-center shadow-xs">
          <div className="text-[10px] sm:text-xs font-bold uppercase text-amber-700 dark:text-amber-300">Late / Excused</div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.late + stats.excused}</div>
          <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Late: {stats.late} | Excused: {stats.excused}</div>
        </div>
      </div>

      {/* Attendance History Section with Filter Controls */}
      <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-4 sm:p-6 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              {isParentView ? `${activeStudent.fullName}'s Daily Attendance Log` : 'My Daily Attendance Log'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-emerald-300/70">
              Official records submitted by authorized school teachers
            </p>
          </div>

          {/* Quick Filter Bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 rounded-xl text-xs">
              {(['ALL', 'PRESENT', 'ABSENT', 'LATE', 'EXCUSED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-[10px] transition-all ${
                    statusFilter === st
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-emerald-300 hover:text-emerald-700'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st.charAt(0) + st.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Attendance Records List / Table */}
        {filteredRecords.length === 0 ? (
          <div className="p-8 sm:p-12 text-center rounded-2xl bg-slate-50 dark:bg-[#021810] border border-dashed border-slate-200 dark:border-emerald-500/20 space-y-2">
            <CalendarCheck className="w-10 h-10 text-slate-400 dark:text-emerald-500/50 mx-auto" />
            <h4 className="font-bold text-sm text-slate-800 dark:text-white">No Attendance Records Found</h4>
            <p className="text-xs text-slate-500 dark:text-emerald-300/70 max-w-sm mx-auto">
              {studentRecords.length === 0
                ? 'No attendance records have been posted yet for this academic session.'
                : 'No attendance records match the selected status filter.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto rounded-2xl border border-slate-200 dark:border-emerald-500/20">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 dark:bg-[#021810] border-b border-slate-200 dark:border-emerald-500/20 text-slate-500 dark:text-emerald-300 font-extrabold uppercase tracking-wider text-[10px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Day</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Remarks & Notes</th>
                    <th className="py-3 px-4 text-right">Verification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-emerald-500/10">
                  {filteredRecords.map((rec) => {
                    const recordDate = new Date(rec.date);
                    const dayName = recordDate.toLocaleDateString('en-US', { weekday: 'long' });
                    const formattedDate = recordDate.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    });

                    return (
                      <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-emerald-950/30 transition-colors">
                        <td className="py-3 px-4 font-bold font-mono text-slate-900 dark:text-white">
                          {formattedDate}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-emerald-300 font-medium">
                          {dayName}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(rec.status)}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-emerald-200/80 max-w-xs break-words whitespace-normal">
                          {rec.remarks || <span className="text-slate-400 italic">None recorded</span>}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Recorded by Staff
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card / Row View (Clean, responsive down to 320px) */}
            <div className="sm:hidden space-y-2.5">
              {filteredRecords.map((rec) => {
                const recordDate = new Date(rec.date);
                const dayName = recordDate.toLocaleDateString('en-US', { weekday: 'short' });
                const formattedDate = recordDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="font-bold text-slate-900 dark:text-white truncate">
                          {dayName}, {formattedDate}
                        </span>
                      </div>
                      {getStatusBadge(rec.status)}
                    </div>

                    {rec.remarks && (
                      <div className="text-[11px] text-slate-600 dark:text-emerald-200/80 bg-white dark:bg-emerald-950/40 p-2 rounded-xl border border-slate-200/80 dark:border-emerald-800/30 break-words whitespace-normal">
                        <span className="font-bold text-slate-500 dark:text-emerald-400">Note: </span>
                        {rec.remarks}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
