'use client';

import React, { useState, useMemo } from 'react';
import {
  Calendar,
  Clock,
  BookOpen,
  User,
  MapPin,
  CheckCircle2,
  ChevronRight,
  Layers,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { TimetablePeriod } from '@/types';

export function TimetableWidget() {
  const { timetablePeriods, currentUser, teacherAssignments, students } = useApp();
  const [selectedDay, setSelectedDay] = useState<TimetablePeriod['dayOfWeek']>('MONDAY');

  // Filter periods based on user role scope
  const userTimetable = useMemo(() => {
    return timetablePeriods.filter((tp) => {
      if (currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN') {
        return true;
      }
      if (currentUser.role === 'TEACHER') {
        return tp.teacherId === currentUser.id || currentUser.id.includes('teacher');
      }
      if (currentUser.role === 'STUDENT') {
        const studentRecord = students.find((s) => s.userId === currentUser.id || s.id === currentUser.id);
        return studentRecord ? tp.classId === studentRecord.classId : true;
      }
      return true;
    });
  }, [timetablePeriods, currentUser, students]);

  const activeDayPeriods = useMemo(() => {
    return userTimetable.filter((tp) => tp.dayOfWeek === selectedDay);
  }, [userTimetable, selectedDay]);

  const todaySchedule = useMemo(() => {
    return userTimetable.filter((tp) => tp.dayOfWeek === 'MONDAY');
  }, [userTimetable]);

  return (
    <div className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 space-y-6 shadow-xl font-poppins">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-emerald-500/20 pb-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <Calendar className="w-4 h-4" />
            <span>Scoped Class & Halqa Timetable</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white">
            Daily & Weekly Academic Schedule
          </h3>
        </div>

        {/* Day Selector Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#021810] rounded-2xl border border-slate-200 dark:border-emerald-500/20">
          {(['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'] as const).map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`px-3 py-1.5 rounded-xl font-extrabold text-[10px] transition-all ${
                selectedDay === day
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                  : 'text-slate-600 dark:text-emerald-300 hover:bg-slate-200 dark:hover:bg-emerald-950'
              }`}
            >
              {day.slice(0, 3)}
            </button>
          ))}
        </div>
      </div>

      {/* Today's Classes & Current Class Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-white space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-emerald-200">CURRENT ACTIVE CLASS</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-950 font-black text-[9px] animate-pulse">
              LIVE NOW
            </span>
          </div>

          <div>
            <div className="text-base font-black">
              {todaySchedule[0]?.subjectName || "Hifz & Revision (Qur'an)"}
            </div>
            <div className="text-xs text-emerald-200/80 font-medium">
              {todaySchedule[0]?.className || 'Tahfiz Halqa 1'} • {todaySchedule[0]?.room || 'Halqa Room A1'}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-bold text-emerald-300 pt-1">
            <Clock className="w-3.5 h-3.5" />
            <span>07:30 AM - 09:00 AM</span>
          </div>
        </div>

        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 space-y-2">
            <div className="text-[11px] font-extrabold text-slate-500 dark:text-emerald-300">UPCOMING LESSON</div>
            <div className="text-sm font-black text-slate-900 dark:text-white">
              {todaySchedule[1]?.subjectName || 'Tajweed Rules & Recitation'}
            </div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              09:15 AM - 10:30 AM • {todaySchedule[1]?.teacherName || 'Ustaz Ahmad'}
            </div>
          </div>

          <div className="p-5 rounded-3xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 space-y-2">
            <div className="text-[11px] font-extrabold text-slate-500 dark:text-emerald-300">TODAY'S TOTAL PERIODS</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white">
              {todaySchedule.length} Sessions
            </div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
              100% On-Schedule
            </div>
          </div>
        </div>
      </div>

      {/* Selected Day Timetable List */}
      <div className="space-y-3">
        <div className="text-xs font-extrabold text-slate-700 dark:text-emerald-200">
          Timetable Schedule for {selectedDay}
        </div>

        {activeDayPeriods.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeDayPeriods.map((period) => (
              <div
                key={period.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 flex items-center justify-between hover:border-emerald-500 transition-all"
              >
                <div className="space-y-1">
                  <div className="font-extrabold text-sm text-slate-900 dark:text-white">
                    {period.subjectName}
                  </div>
                  <div className="text-xs font-bold text-slate-600 dark:text-emerald-300">
                    {period.className} • {period.teacherName}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-emerald-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-500" /> {period.startTime} - {period.endTime}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-emerald-500" /> {period.room || 'Classroom'}
                    </span>
                  </div>
                </div>

                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 flex items-center justify-center font-black">
                  <BookOpen className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-slate-400 font-bold text-xs bg-slate-50 dark:bg-[#021810] rounded-2xl border border-slate-200 dark:border-emerald-500/20">
            No active periods scheduled for {selectedDay}.
          </div>
        )}
      </div>
    </div>
  );
}
