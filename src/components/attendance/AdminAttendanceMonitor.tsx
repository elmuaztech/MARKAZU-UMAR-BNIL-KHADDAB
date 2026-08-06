'use client';

import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Edit,
  CheckCircle2,
  AlertTriangle,
  Clock,
  UserCheck,
  Search,
  Filter,
  Layers,
  Sparkles,
  FileSpreadsheet,
  RotateCcw,
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { AttendanceRecord, AttendanceStatusType } from '@/types';

export function AdminAttendanceMonitor() {
  const { attendance, students, classes, programmes, currentUser, adminOverrideAttendance } = useApp();

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Override Modal state
  const [overrideTarget, setOverrideTarget] = useState<AttendanceRecord | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<AttendanceStatusType>('PRESENT');
  const [overrideReason, setOverrideReason] = useState<string>('');

  // Filtered Attendance Records
  const filteredAttendance = useMemo(() => {
    return attendance.filter((rec) => {
      const matchesDate = !selectedDate || rec.date === selectedDate;
      const matchesProg = selectedProgrammeId === 'ALL' || rec.programmeId === selectedProgrammeId;
      const matchesClass = selectedClassId === 'ALL' || rec.classId === selectedClassId;
      const matchesSearch =
        rec.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (rec.remarks && rec.remarks.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesDate && matchesProg && matchesClass && matchesSearch;
    });
  }, [attendance, selectedDate, selectedProgrammeId, selectedClassId, searchTerm]);

  // Daily Statistics
  const stats = useMemo(() => {
    const total = filteredAttendance.length;
    const present = filteredAttendance.filter((r) => r.status === 'PRESENT').length;
    const absent = filteredAttendance.filter((r) => r.status === 'ABSENT').length;
    const late = filteredAttendance.filter((r) => r.status === 'LATE').length;
    const excused = filteredAttendance.filter(
      (r) => r.status === 'EXCUSED' || r.status === 'MEDICAL_LEAVE' || r.status === 'OFFICIAL_ASSIGNMENT'
    ).length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent, late, excused, rate };
  }, [filteredAttendance]);

  const handleOpenOverride = (rec: AttendanceRecord) => {
    setOverrideTarget(rec);
    setOverrideStatus(rec.status);
    setOverrideReason('');
  };

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
      {/* Overview Metric Widgets */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-5 bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/20 rounded-3xl">
          <div className="text-xs font-bold text-slate-500 dark:text-emerald-300/70">Total Monitored</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">{stats.total}</div>
        </div>

        <div className="p-5 bg-emerald-500/10 border border-emerald-500/30 rounded-3xl">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300">Present Count</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.present}</div>
        </div>

        <div className="p-5 bg-rose-500/10 border border-rose-500/30 rounded-3xl">
          <div className="text-xs font-bold text-rose-700 dark:text-rose-300">Absent Students</div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">{stats.absent}</div>
        </div>

        <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-3xl">
          <div className="text-xs font-bold text-amber-700 dark:text-amber-300">Late Arrivals</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{stats.late}</div>
        </div>

        <div className="p-5 bg-gradient-to-br from-emerald-700 to-emerald-950 text-white rounded-3xl text-center">
          <div className="text-xs font-bold text-emerald-200">School Attendance %</div>
          <div className="text-2xl font-black mt-1">{stats.rate}%</div>
        </div>
      </div>

      {/* Admin Filters Bar */}
      <div className="p-5 bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-auto flex-1">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-emerald-300 mb-1">Filter Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-emerald-300 mb-1">Programme Scope</label>
            <select
              value={selectedProgrammeId}
              onChange={(e) => setSelectedProgrammeId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="ALL">All Programmes</option>
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.programme_name_english || p.programme_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-emerald-300 mb-1">Class Scope</label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="ALL">All Classes</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search student or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Admin Audit & Override Table */}
      <div className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl overflow-hidden shadow-xl">
        <div className="p-5 border-b border-slate-200 dark:border-emerald-500/20 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            School Attendance Audit Roster & Override Queue
          </h3>
          <span className="text-xs font-bold text-slate-500 dark:text-emerald-300 font-mono">
            {filteredAttendance.length} Records Loaded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#021810] border-b border-slate-200 dark:border-emerald-500/20 text-[11px] font-black text-slate-600 dark:text-emerald-300 uppercase">
                <th className="p-4">Date & Student</th>
                <th className="p-4">Class</th>
                <th className="p-4">Status</th>
                <th className="p-4">Remarks / Audit Info</th>
                <th className="p-4 text-right">Admin Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-emerald-500/10 text-xs font-medium">
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-emerald-950/20 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{rec.studentName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-emerald-400 font-mono">Date: {rec.date}</div>
                    </td>
                    <td className="p-4 font-bold text-slate-700 dark:text-emerald-200">
                      {rec.className || 'Class Roster'}
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${
                          rec.status === 'PRESENT'
                            ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                            : rec.status === 'ABSENT'
                            ? 'bg-rose-500/20 text-rose-700 dark:text-rose-300 border-rose-500/30'
                            : rec.status === 'LATE'
                            ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="text-slate-700 dark:text-emerald-200">{rec.remarks || 'No remarks'}</div>
                      {rec.editedBy && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                          Edited by: {rec.editedBy} (Reason: {rec.editReason})
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleOpenOverride(rec)}
                        className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 transition-all ml-auto"
                      >
                        <Edit className="w-3.5 h-3.5" /> Admin Override
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 font-bold">
                    No attendance logs match the query filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Admin Override Action Modal */}
      {overrideTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#042419] border border-amber-500/40 rounded-3xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-500/20 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                Administrative Attendance Override
              </h3>
              <button onClick={() => setOverrideTarget(null)} className="text-slate-400 hover:text-slate-600 font-bold">
                ✕
              </button>
            </div>

            <div className="text-xs space-y-1 bg-slate-50 dark:bg-[#021810] p-3 rounded-2xl border border-slate-200 dark:border-emerald-500/20">
              <div>Student: <span className="font-bold text-slate-900 dark:text-white">{overrideTarget.studentName}</span></div>
              <div>Date: <span className="font-bold text-slate-900 dark:text-white">{overrideTarget.date}</span></div>
              <div>Current Status: <span className="font-bold text-amber-600">{overrideTarget.status}</span></div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">New Override Status</label>
              <select
                value={overrideStatus}
                onChange={(e) => setOverrideStatus(e.target.value as AttendanceStatusType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="PRESENT">PRESENT</option>
                <option value="ABSENT">ABSENT</option>
                <option value="LATE">LATE</option>
                <option value="EXCUSED">EXCUSED</option>
                <option value="MEDICAL_LEAVE">MEDICAL_LEAVE</option>
                <option value="OFFICIAL_ASSIGNMENT">OFFICIAL_ASSIGNMENT</option>
                <option value="HOLIDAY">HOLIDAY</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">Mandatory Override Audit Reason</label>
              <textarea
                rows={3}
                placeholder="Enter exact administrative reason for overriding teacher attendance..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setOverrideTarget(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteOverride}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg flex items-center gap-2"
              >
                Confirm Administrative Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
