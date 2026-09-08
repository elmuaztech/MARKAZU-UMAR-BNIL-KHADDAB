'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  HeartPulse,
  Briefcase,
  Calendar,
  Save,
  Send,
  Eye,
  Search,
  Filter,
  Users,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  FileCheck,
  Layers,
  BookOpen,
  CalendarCheck,
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { AttendanceRecord, AttendanceStatusType, SchoolClass, Student } from '@/types';
import { canTeacherAccessAttendance, filterStudentsForUser, filterAttendanceForUser } from '@/lib/rbac';
import { PortalTheme } from '@/components/ui/PortalTheme';

interface AttendanceRegisterProps {
  onSuccess?: () => void;
}

export function AttendanceRegister({ onSuccess }: AttendanceRegisterProps) {
  const {
    currentUser,
    currentSession,
    programmes,
    classes,
    students,
    teacherAssignments,
    attendance,
    saveAttendanceBatch,
  } = useApp();

  // Cascading Selection State
  const [selectedSession, setSelectedSession] = useState<string>(currentSession.sessionName);
  const [selectedTerm, setSelectedTerm] = useState<string>(currentSession.activeTerm);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [attendanceDate, setAttendanceDate] = useState<string>(new Date().toISOString().split('T')[0]);

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Local Roster Status State: studentId -> { status, remarks }
  const [rosterState, setRosterState] = useState<Record<string, { status: AttendanceStatusType; remarks: string }>>({});
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);

  // Initialize selected programme dynamically
  useEffect(() => {
    if (programmes.length > 0 && !selectedProgrammeId) {
      if (currentUser.role === 'HEADMASTER' && currentUser.assignedProgrammeId) {
        setSelectedProgrammeId(currentUser.assignedProgrammeId);
      } else {
        setSelectedProgrammeId(programmes[0].id);
      }
    }
  }, [programmes, currentUser, selectedProgrammeId]);

  // RBAC Access Check
  const hasAccess = useMemo(() => {
    return canTeacherAccessAttendance(currentUser, teacherAssignments, selectedProgrammeId, selectedClassId);
  }, [currentUser, teacherAssignments, selectedProgrammeId, selectedClassId]);

  // Available Classes based on role and selected programme
  const availableClasses = useMemo(() => {
    if (currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN') {
      return classes.filter((c) => !selectedProgrammeId || c.programmeId === selectedProgrammeId);
    }
    if (currentUser.role === 'HEADMASTER') {
      const progId = currentUser.assignedProgrammeId || selectedProgrammeId;
      return classes.filter((c) => !progId || c.programmeId === progId);
    }
    const assignedClassIds = new Set(
      teacherAssignments
        .filter(
          (ta) =>
            ta.teacherId === currentUser.id ||
            (currentUser.email && ta.teacherId.toLowerCase() === currentUser.email.toLowerCase()) ||
            (currentUser.username && ta.teacherId.toLowerCase() === currentUser.username.toLowerCase()) ||
            currentUser.id.includes('teacher')
        )
        .filter((ta) => !selectedProgrammeId || ta.programmeId === selectedProgrammeId)
        .map((ta) => ta.classId)
    );
    classes.forEach((c) => {
      if (c.classTeacherId === currentUser.id) {
        if (!selectedProgrammeId || c.programmeId === selectedProgrammeId) {
          assignedClassIds.add(c.id);
        }
      }
    });

    // If teacher has no explicit assignments or classes, fallback to show classes under programme
    if (assignedClassIds.size === 0) {
      return classes.filter((c) => !selectedProgrammeId || c.programmeId === selectedProgrammeId);
    }

    return classes.filter((c) => assignedClassIds.has(c.id));
  }, [currentUser, teacherAssignments, classes, selectedProgrammeId]);

  // Sync selectedClassId whenever availableClasses changes
  useEffect(() => {
    if (availableClasses.length > 0) {
      if (!selectedClassId || !availableClasses.some((c) => c.id === selectedClassId)) {
        setSelectedClassId(availableClasses[0].id);
      }
    } else {
      setSelectedClassId('');
    }
  }, [availableClasses, selectedClassId]);

  // Class Students Roster
  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Initialize roster state from existing attendance or default to PRESENT
  React.useEffect(() => {
    if (!classStudents.length) return;
    const initial: Record<string, { status: AttendanceStatusType; remarks: string }> = {};

    classStudents.forEach((student) => {
      const existing = attendance.find(
        (a) => a.studentId === student.id && a.date === attendanceDate && a.classId === selectedClassId
      );
      if (existing) {
        initial[student.id] = { status: existing.status, remarks: existing.remarks || '' };
      } else {
        initial[student.id] = { status: 'PRESENT', remarks: '' };
      }
    });

    setRosterState(initial);
  }, [classStudents, attendanceDate, selectedClassId, attendance]);

  // Filtered Students
  const filteredStudents = useMemo(() => {
    return classStudents.filter((s) => {
      const matchesSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase());
      const currentStatus = rosterState[s.id]?.status || 'PRESENT';
      const matchesStatus = statusFilter === 'ALL' || currentStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [classStudents, searchTerm, statusFilter, rosterState]);

  // Quick Bulk Actions
  const handleBulkSetStatus = (status: AttendanceStatusType) => {
    setRosterState((prev) => {
      const next = { ...prev };
      filteredStudents.forEach((student) => {
        next[student.id] = { ...next[student.id], status };
      });
      return next;
    });
  };

  const handleStudentStatusChange = (studentId: string, status: AttendanceStatusType) => {
    setRosterState((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status },
    }));
  };

  const handleStudentRemarksChange = (studentId: string, remarks: string) => {
    setRosterState((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks },
    }));
  };

  // Build Payload
  const attendancePayload = useMemo((): AttendanceRecord[] => {
    const selectedClass = classes.find((c) => c.id === selectedClassId);
    return classStudents.map((s) => {
      const entry = rosterState[s.id] || { status: 'PRESENT', remarks: '' };
      return {
        id: `att-${selectedClassId}-${s.id}-${attendanceDate}`,
        date: attendanceDate,
        studentId: s.id,
        studentName: s.fullName,
        programmeId: selectedProgrammeId,
        classId: selectedClassId,
        className: selectedClass?.name || 'Class Roster',
        teacherId: currentUser.id,
        status: entry.status,
        remarks: entry.remarks,
      };
    });
  }, [classStudents, rosterState, selectedClassId, selectedProgrammeId, attendanceDate, classes, currentUser]);

  const stats = useMemo(() => {
    const total = attendancePayload.length;
    const present = attendancePayload.filter((r) => r.status === 'PRESENT').length;
    const absent = attendancePayload.filter((r) => r.status === 'ABSENT').length;
    const late = attendancePayload.filter((r) => r.status === 'LATE').length;
    const excused = attendancePayload.filter((r) => r.status === 'EXCUSED' || r.status === 'MEDICAL_LEAVE' || r.status === 'OFFICIAL_ASSIGNMENT').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, excused, percentage };
  }, [attendancePayload]);

  const handleSaveDraft = () => {
    saveAttendanceBatch(attendancePayload, true);
    alert('Attendance register draft saved successfully!');
  };

  const handleSubmitFinal = () => {
    saveAttendanceBatch(attendancePayload, false);
    setIsPreviewOpen(false);
    setIsSuccessModalOpen(true);
    if (onSuccess) onSuccess();
  };

  const getStatusBadge = (status: AttendanceStatusType) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
      case 'ABSENT':
        return 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30';
      case 'LATE':
        return 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30';
      case 'EXCUSED':
      case 'MEDICAL_LEAVE':
      case 'OFFICIAL_ASSIGNMENT':
        return 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30';
      case 'HOLIDAY':
        return 'bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (currentUser.role === 'STUDENT' || currentUser.role === 'PARENT') {
    const userStudents = filterStudentsForUser(currentUser, students, [], teacherAssignments);
    const userAttendance = filterAttendanceForUser(currentUser, attendance, userStudents);

    return (
      <div className="space-y-6 font-poppins">
        <div className="p-6 bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl shadow-md space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CalendarCheck className="w-4 h-4" />
              <span>Read-Only Attendance Log & Record History</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase">
              {currentUser.role} View
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Punctuality & Daily Attendance Summary
          </h2>
          <p className="text-xs text-slate-500 dark:text-emerald-300/80">
            Official recorded daily attendance statuses, punctuality logs, and teacher remarks.
          </p>

          <div className="overflow-x-auto pt-2">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 dark:bg-[#021810] text-slate-700 dark:text-emerald-300 uppercase font-bold border-b border-emerald-500/20">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Class</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Remarks / Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-emerald-500/10">
                {userAttendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      No attendance records logged yet for this period.
                    </td>
                  </tr>
                ) : (
                  userAttendance.map((rec) => (
                    <tr key={rec.id} className="hover:bg-emerald-500/5 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-800 dark:text-emerald-200">{rec.date}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-white">{rec.studentName}</td>
                      <td className="p-3 text-slate-600 dark:text-emerald-300/90">{rec.className}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${getStatusBadge(rec.status)}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500 dark:text-gray-300">{rec.remarks || 'None'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-poppins">
      {/* Scope Selector Header Bar */}
      <div className="p-6 bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Scope-Restricted Teacher Attendance Portal</span>
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              Daily Class Attendance Register
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveDraft}
              className="px-4 py-2.5 rounded-2xl bg-slate-100 dark:bg-emerald-950 text-slate-800 dark:text-emerald-100 hover:bg-slate-200 font-extrabold text-xs flex items-center gap-2 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>

            <button
              onClick={() => setIsPreviewOpen(true)}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all hover:scale-105"
            >
              <Eye className="w-4 h-4" />
              <span>Preview & Submit ({stats.total})</span>
            </button>
          </div>
        </div>

        {/* 5-Step Cascading Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 dark:text-emerald-300/80 mb-1">
              Academic Session
            </label>
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value={currentSession.sessionName}>{currentSession.sessionName}</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 dark:text-emerald-300/80 mb-1">
              Academic Term
            </label>
            <select
              value={selectedTerm}
              onChange={(e) => setSelectedTerm(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="Term 1">Term 1</option>
              <option value="Term 2">Term 2</option>
              <option value="Term 3">Term 3</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 dark:text-emerald-300/80 mb-1">
              Programme {currentUser.role === 'HEADMASTER' && <span className="text-emerald-500 font-bold">(Locked)</span>}
            </label>
            <select
              disabled={currentUser.role === 'HEADMASTER'}
              value={selectedProgrammeId}
              onChange={(e) => {
                if (currentUser.role !== 'HEADMASTER') {
                  const newPId = e.target.value;
                  setSelectedProgrammeId(newPId);
                  const matched = classes.filter((c) => !newPId || c.programmeId === newPId);
                  if (matched.length > 0) {
                    setSelectedClassId(matched[0].id);
                  } else {
                    setSelectedClassId('');
                  }
                }
              }}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {programmes.length === 0 ? (
                <option value="">-- No Programmes Found --</option>
              ) : (
                programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.programme_name_english || p.programme_name} ({p.programme_code})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 dark:text-emerald-300/80 mb-1">
              Class Roster
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              {availableClasses.length === 0 ? (
                <option value="">-- No Classes in Programme --</option>
              ) : (
                availableClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.section ? `(${c.section})` : ''}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-extrabold text-slate-500 dark:text-emerald-300/80 mb-1">
              Attendance Date
            </label>
            <input
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* RBAC Violation Notice */}
      {!hasAccess ? (
        <div className="p-8 bg-rose-500/10 border border-rose-500/30 rounded-3xl text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-black text-rose-700 dark:text-rose-300">
            Access Restricted: Class Not Assigned
          </h3>
          <p className="text-xs text-rose-600/80 dark:text-rose-400/80 max-w-xl mx-auto font-medium">
            You are not assigned to manage attendance for this class or programme. Teachers may only record attendance for their designated class rosters.
          </p>
        </div>
      ) : (
        <>
          {/* Quick Roster Metrics Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/20 text-center">
              <div className="text-[10px] font-bold text-slate-500 dark:text-emerald-300/70">Total Roster</div>
              <div className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{stats.total}</div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
              <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">Present</div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">{stats.present}</div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-center">
              <div className="text-[10px] font-bold text-rose-700 dark:text-rose-300">Absent</div>
              <div className="text-xl font-black text-rose-600 dark:text-rose-400 mt-0.5">{stats.absent}</div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center">
              <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300">Late</div>
              <div className="text-xl font-black text-amber-600 dark:text-amber-400 mt-0.5">{stats.late}</div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-center">
              <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300">Excused / Medical</div>
              <div className="text-xl font-black text-blue-600 dark:text-blue-400 mt-0.5">{stats.excused}</div>
            </div>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 text-white text-center">
              <div className="text-[10px] font-bold text-emerald-200">Attendance Rate</div>
              <div className="text-xl font-black mt-0.5">{stats.percentage}%</div>
            </div>
          </div>

          {/* Bulk Action Tools & Filter Bar */}
          <div className="p-4 bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-700 dark:text-emerald-200">Bulk Actions:</span>
              <button
                onClick={() => handleBulkSetStatus('PRESENT')}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-extrabold text-[11px] hover:bg-emerald-500 flex items-center gap-1 transition-all"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> All Present
              </button>
              <button
                onClick={() => handleBulkSetStatus('ABSENT')}
                className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-extrabold text-[11px] hover:bg-rose-500 flex items-center gap-1 transition-all"
              >
                <XCircle className="w-3.5 h-3.5" /> All Absent
              </button>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search student name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="ALL">All Statuses</option>
                <option value="PRESENT">Present Only</option>
                <option value="ABSENT">Absent Only</option>
                <option value="LATE">Late Only</option>
                <option value="EXCUSED">Excused / Leave</option>
              </select>
            </div>
          </div>

          {/* Interactive Roster Table */}
          <div className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-[#021810] border-b border-slate-200 dark:border-emerald-500/20 text-[11px] font-black text-slate-600 dark:text-emerald-300 uppercase tracking-wider">
                    <th className="p-4">#</th>
                    <th className="p-4">Student Admission & Name</th>
                    <th className="p-4">Quick Status Toggle</th>
                    <th className="p-4">Status Remarks & Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-emerald-500/10 text-xs font-medium">
                  {filteredStudents.length > 0 ? (
                    filteredStudents.map((student, idx) => {
                      const entry = rosterState[student.id] || { status: 'PRESENT', remarks: '' };

                      return (
                        <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-emerald-950/20 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900 dark:text-white">{student.fullName}</div>
                            <div className="text-[10px] text-slate-500 dark:text-emerald-400 font-mono">
                              Adm: {student.admissionNo}
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleStudentStatusChange(student.id, 'PRESENT')}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                                  entry.status === 'PRESENT'
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                                    : 'bg-slate-100 dark:bg-emerald-950 text-slate-600 dark:text-emerald-300 hover:bg-emerald-500/20'
                                }`}
                              >
                                Present
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStudentStatusChange(student.id, 'ABSENT')}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                                  entry.status === 'ABSENT'
                                    ? 'bg-rose-600 text-white shadow-md shadow-rose-900/30'
                                    : 'bg-slate-100 dark:bg-emerald-950 text-slate-600 dark:text-emerald-300 hover:bg-rose-500/20'
                                }`}
                              >
                                Absent
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStudentStatusChange(student.id, 'LATE')}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                                  entry.status === 'LATE'
                                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-900/30'
                                    : 'bg-slate-100 dark:bg-emerald-950 text-slate-600 dark:text-emerald-300 hover:bg-amber-500/20'
                                }`}
                              >
                                Late
                              </button>

                              <button
                                type="button"
                                onClick={() => handleStudentStatusChange(student.id, 'EXCUSED')}
                                className={`px-3 py-1.5 rounded-xl text-[11px] font-black transition-all ${
                                  entry.status === 'EXCUSED'
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                                    : 'bg-slate-100 dark:bg-emerald-950 text-slate-600 dark:text-emerald-300 hover:bg-blue-500/20'
                                }`}
                              >
                                Excused
                              </button>
                            </div>
                          </td>
                          <td className="p-4">
                            <input
                              type="text"
                              placeholder="Add remark (e.g. Traffic, Sick, Approved leave)..."
                              value={entry.remarks}
                              onChange={(e) => handleStudentRemarksChange(student.id, e.target.value)}
                              className="w-full px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                            />
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-slate-400 font-bold">
                        No student records match the search filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Preview Summary Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-500/20 p-5 shrink-0">
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-500" />
                Confirm Attendance Submission
              </h3>
              <button onClick={() => setIsPreviewOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-emerald-950">
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-xs font-poppins">
              <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-[#021810] p-4 rounded-2xl border border-slate-200 dark:border-emerald-500/20">
                <div>Date: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{attendanceDate}</span></div>
                <div>Class: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{classes.find((c) => c.id === selectedClassId)?.name}</span></div>
                <div>Present: <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{stats.present} / {stats.total}</span></div>
                <div>Absent: <span className="text-rose-600 dark:text-rose-400 font-extrabold">{stats.absent}</span></div>
              </div>

              <div className="space-y-2">
                <div className="font-extrabold text-slate-700 dark:text-emerald-300">Roster Summary Breakdown:</div>
                {attendancePayload.map((r) => (
                  <div key={r.studentId} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-slate-50/50 dark:bg-emerald-950/20">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white">{r.studentName}</span>
                      {r.remarks && <span className="text-[11px] text-slate-500 dark:text-emerald-400/80 block italic">Remarks: {r.remarks}</span>}
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getStatusBadge(r.status)}`}>
                      {r.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 dark:border-emerald-500/20 shrink-0 bg-slate-50/50 dark:bg-[#021810]">
              <button
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 font-bold text-xs"
              >
                Back to Edit
              </button>
              <button
                onClick={handleSubmitFinal}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-900/30 flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Submit Final Attendance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#042419] border border-emerald-500/30 rounded-3xl w-full max-w-md shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Attendance Register Submitted!
            </h3>
            <p className="text-xs text-slate-600 dark:text-emerald-200">
              The daily attendance records have been saved securely and parent in-app alerts have been generated for absent/late students.
            </p>
            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-lg shadow-emerald-900/30"
            >
              Done / Return to Register
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
