'use client';

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Award,
  Save,
  CheckCircle2,
  BarChart3,
  TrendingUp,
  User,
  Calendar,
  AlertCircle,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { TahfizRecord, Student } from '@/types';
import { filterStudentsForUser, filterTahfizForUser } from '@/lib/rbac';

export function TahfizTracker() {
  const { students, parents, classes, teachers, teacherAssignments, currentUser, tahfizRecords, saveTahfizRecord } = useApp();

  // Scope available classes for TEACHER
  const availableClasses = useMemo(() => {
    if (currentUser.role !== 'TEACHER') return classes;
    const currentTeacher = teachers.find(
      (t) =>
        t.id === currentUser.id ||
        (t.userId && t.userId === currentUser.id) ||
        (t.email && currentUser.email && t.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (t.staffNo && currentUser.username && t.staffNo.toLowerCase() === currentUser.username.toLowerCase())
    );
    const assignedIds = new Set<string>();
    if (currentTeacher?.classesAssigned) {
      currentTeacher.classesAssigned.forEach((c) => assignedIds.add(c));
    }
    teacherAssignments
      .filter((ta) => ta.teacherId === currentUser.id || (currentTeacher && ta.teacherId === currentTeacher.id))
      .forEach((ta) => assignedIds.add(ta.classId));

    const scoped = classes.filter(
      (c) =>
        assignedIds.has(c.id) ||
        assignedIds.has(c.name) ||
        (currentTeacher && c.classTeacherId === currentTeacher.id) ||
        c.classTeacherId === currentUser.id
    );
    return scoped.length > 0 ? scoped : classes;
  }, [classes, currentUser, teachers, teacherAssignments]);

  const [selectedClassId, setSelectedClassId] = useState<string>(() => availableClasses[0]?.id || 'cls-tahfiz-1');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('usr-student-1');

  React.useEffect(() => {
    if (availableClasses.length > 0 && !availableClasses.some((c) => c.id === selectedClassId)) {
      setSelectedClassId(availableClasses[0].id);
    }
  }, [availableClasses, selectedClassId]);

  // Daily Form State
  const [hifzSurah, setHifzSurah] = useState<string>('Surah Al-Kahf');
  const [hifzFromAyah, setHifzFromAyah] = useState<number>(40);
  const [hifzToAyah, setHifzToAyah] = useState<number>(55);
  const [hifzPages, setHifzPages] = useState<number>(1.5);
  const [currentJuz, setCurrentJuz] = useState<number>(15);

  const [sabkiSurah, setSabkiSurah] = useState<string>('Surah Al-Isra');
  const [sabkiRating, setSabkiRating] = useState<1 | 2 | 3 | 4 | 5>(5);

  const [manzilJuz, setManzilJuz] = useState<number>(14);
  const [manzilRating, setManzilRating] = useState<1 | 2 | 3 | 4 | 5>(5);

  const [revisionStatus, setRevisionStatus] = useState<string>('EXCELLENT_RETENTION');
  const [memorizationStatus, setMemorizationStatus] = useState<string>('ACTIVE_PROGRESS');
  const [studentBehaviour, setStudentBehaviour] = useState<'EXCELLENT' | 'VERY_GOOD' | 'GOOD' | 'NEEDS_IMPROVEMENT'>('EXCELLENT');
  const [teacherNotes, setTeacherNotes] = useState<string>('Masha-Allah! Excellent recitation with clear Makharij and strong Hifz retention.');

  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);

  // Class Roster Students
  const classStudents = useMemo(() => {
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  const targetStudent = useMemo(() => {
    return students.find((s) => s.id === selectedStudentId);
  }, [students, selectedStudentId]);

  // Automated Progress Calculation
  // Total Quran Juz = 30. Each Juz ~ 20 pages.
  const calculatedStats = useMemo(() => {
    const juzCompleted = Math.min(30, Math.max(0, currentJuz - 1));
    const remainingJuz = Math.max(0, 30 - juzCompleted);
    const completionPercentage = Math.round((juzCompleted / 30) * 100);
    return { juzCompleted, remainingJuz, completionPercentage };
  }, [currentJuz]);

  const handleSaveProgress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetStudent) return;

    const newRecord: Omit<TahfizRecord, 'id'> = {
      date: new Date().toISOString().split('T')[0],
      studentId: targetStudent.id,
      studentName: targetStudent.fullName,
      classId: selectedClassId,
      className: classes.find((c) => c.id === selectedClassId)?.name || 'Tahfiz Halqa',
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      hifzSurah,
      hifzFromAyah,
      hifzToAyah,
      hifzPages,
      currentJuz,
      sabkiSurah,
      sabkiRating,
      manzilJuz,
      manzilRating,
      revisionStatus,
      memorizationStatus,
      studentBehaviour,
      completionPercentage: calculatedStats.completionPercentage,
      teacherNotes,
    };

    saveTahfizRecord(newRecord);
    setIsSuccessModalOpen(true);
  };

  const studentLogs = useMemo(() => {
    return tahfizRecords.filter((r) => r.studentId === selectedStudentId);
  }, [tahfizRecords, selectedStudentId]);

  if (currentUser.role === 'STUDENT' || currentUser.role === 'PARENT') {
    const userStudents = filterStudentsForUser(currentUser, students, parents, teacherAssignments);
    const userTahfizLogs = filterTahfizForUser(currentUser, tahfizRecords, userStudents);
    const primaryStudent = userStudents[0] || targetStudent;

    return (
      <div className="space-y-6 font-poppins">
        <div className="p-4 sm:p-6 bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-2xl sm:rounded-3xl shadow-md space-y-4 overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <BookOpen className="w-4 h-4 shrink-0" />
              <span className="truncate">Personal Hifz Progress & Historical Record</span>
            </div>
            <span className="self-start sm:self-auto px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-bold uppercase shrink-0">
              {currentUser.role} Read-Only View
            </span>
          </div>

          <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
            Qur'an Memorization Summary: {primaryStudent?.fullName || 'Student'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
              <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Current Surah & Ayah</span>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                {primaryStudent?.hifzProgress.currentSurah || 'Surah Al-Kahf'} (Ayah {primaryStudent?.hifzProgress.currentAyah || 1})
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-1">
              <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400">Completed Juz</span>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                {primaryStudent?.hifzProgress.juzCompleted || 0} / 30 Juz
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-1">
              <span className="text-[10px] uppercase font-bold text-sky-600 dark:text-sky-400">Overall Hifz Progress</span>
              <p className="text-sm font-extrabold text-slate-900 dark:text-white">
                {Math.round(((primaryStudent?.hifzProgress.juzCompleted || 0) / 30) * 100)}% Complete
              </p>
            </div>
          </div>

          <div className="pt-4 overflow-hidden">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-emerald-300 pb-2">
              Teacher Logging History & Daily Feedback
            </h3>
            <div className="overflow-x-auto w-full -mx-4 sm:mx-0 px-4 sm:px-0">
              <table className="w-full text-left text-xs min-w-[500px]">
                <thead className="bg-slate-100 dark:bg-[#021810] text-slate-700 dark:text-emerald-300 uppercase font-bold border-b border-emerald-500/20">
                  <tr>
                    <th className="p-3">Date</th>
                    <th className="p-3">Daily Hifz</th>
                    <th className="p-3">Sabki (Revision)</th>
                    <th className="p-3">Manzil Juz</th>
                    <th className="p-3">Teacher Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-500/10">
                  {userTahfizLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-6 text-center text-slate-400">
                        No Tahfiz log entries recorded yet.
                      </td>
                    </tr>
                  ) : (
                    userTahfizLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-emerald-500/5 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-800 dark:text-emerald-200">{log.date}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white">
                          {log.hifzSurah} (Ayah {log.hifzFromAyah}-{log.hifzToAyah})
                        </td>
                        <td className="p-3 text-slate-600 dark:text-emerald-300">
                          {log.sabkiSurah || 'N/A'} ({log.sabkiRating || 5}/5 ★)
                        </td>
                        <td className="p-3 font-mono text-slate-700 dark:text-emerald-300">Juz {log.manzilJuz || 'N/A'}</td>
                        <td className="p-3 text-slate-500 dark:text-gray-300">{log.teacherNotes || 'Masha-Allah!'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-poppins">
      {/* Student Selector Bar */}
      <div className="p-6 bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
            <BookOpen className="w-4 h-4" />
            <span>Tahfiz Progress Tracking Engine</span>
          </div>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Daily Hifz, Sabki & Manzil Record
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-emerald-300 mb-1">Select Halqa Class</label>
            <select
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value);
                const matched = students.find((s) => s.classId === e.target.value);
                if (matched) setSelectedStudentId(matched.id);
              }}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-extrabold text-slate-500 dark:text-emerald-300 mb-1">Select Student</label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              {classStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.admissionNo})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Automated Progress Metrics Header */}
      {targetStudent && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-950 text-white rounded-3xl shadow-lg relative overflow-hidden">
            <div className="text-xs font-bold text-emerald-200">Current Juz Progress</div>
            <div className="text-2xl font-black mt-1">Juz {currentJuz} of 30</div>
            <div className="text-[11px] text-emerald-300/80 mt-1 font-mono">
              Target Completion: {calculatedStats.completionPercentage}%
            </div>
          </div>

          <div className="p-5 bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/20 rounded-3xl text-center">
            <div className="text-xs font-bold text-slate-500 dark:text-emerald-300/70">Completed Juz</div>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
              {calculatedStats.juzCompleted} Juz
            </div>
            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-extrabold mt-0.5">
              Verified Memorized
            </div>
          </div>

          <div className="p-5 bg-amber-500/10 border border-amber-500/30 rounded-3xl text-center">
            <div className="text-xs font-bold text-amber-700 dark:text-amber-300">Remaining Juz</div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">
              {calculatedStats.remainingJuz} Juz
            </div>
            <div className="text-[10px] text-amber-700 dark:text-amber-300 font-extrabold mt-0.5">
              To Reach 30-Juz Khatm
            </div>
          </div>

          <div className="p-5 bg-purple-500/10 border border-purple-500/30 rounded-3xl text-center">
            <div className="text-xs font-bold text-purple-700 dark:text-purple-300">Student Behaviour</div>
            <div className="text-xl font-black text-purple-700 dark:text-purple-300 mt-1 uppercase">
              {studentBehaviour}
            </div>
            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-extrabold mt-0.5">
              Akhlaq Rating
            </div>
          </div>
        </div>
      )}

      {/* Main Entry Form & Recent Logs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entry Form */}
        <form
          onSubmit={handleSaveProgress}
          className="lg:col-span-2 bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 space-y-5 shadow-lg"
        >
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-500/20 pb-4">
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-500" />
              Daily Tahfiz Performance Entry Form
            </h3>
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
              Active Entry Mode
            </span>
          </div>

          {/* Section 1: Hifz (New Memorization) */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              1. Daily Hifz (New Lesson)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-extrabold text-slate-600 dark:text-emerald-300 mb-1">
                  Current Surah Name
                </label>
                <input
                  type="text"
                  value={hifzSurah}
                  onChange={(e) => setHifzSurah(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 dark:text-emerald-300 mb-1">
                  Start Ayah
                </label>
                <input
                  type="number"
                  value={hifzFromAyah}
                  onChange={(e) => setHifzFromAyah(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 dark:text-emerald-300 mb-1">
                  End Ayah
                </label>
                <input
                  type="number"
                  value={hifzToAyah}
                  onChange={(e) => setHifzToAyah(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 dark:text-emerald-300 mb-1">
                  Pages Memorized Today
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={hifzPages}
                  onChange={(e) => setHifzPages(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 dark:text-emerald-300 mb-1">
                  Current Juz Number (1-30)
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={currentJuz}
                  onChange={(e) => setCurrentJuz(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Sabki & Manzil (Revision) */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-emerald-500/20">
            <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              2. Sabki (Recent Revision) & Manzil (Old Revision)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 dark:text-emerald-300 mb-1">
                  Sabki Surah / Portion
                </label>
                <input
                  type="text"
                  value={sabkiSurah}
                  onChange={(e) => setSabkiSurah(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 dark:text-emerald-300 mb-1">
                  Sabki Rating (Grade 1-5)
                </label>
                <select
                  value={sabkiRating}
                  onChange={(e) => setSabkiRating(Number(e.target.value) as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value={5}>Grade 5 (5/5 Excellent)</option>
                  <option value={4}>Grade 4 (4/5 Very Good)</option>
                  <option value={3}>Grade 3 (3/5 Good)</option>
                  <option value={2}>Grade 2 (2/5 Fair)</option>
                  <option value={1}>Grade 1 (1/5 Needs Review)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 dark:text-emerald-300 mb-1">
                  Manzil Revised Juz Number
                </label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={manzilJuz}
                  onChange={(e) => setManzilJuz(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 dark:text-emerald-300 mb-1">
                  Manzil Rating (Grade 1-5)
                </label>
                <select
                  value={manzilRating}
                  onChange={(e) => setManzilRating(Number(e.target.value) as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value={5}>Grade 5 (5/5 Strong Retention)</option>
                  <option value={4}>Grade 4 (4/5 Good)</option>
                  <option value={3}>Grade 3 (3/5 Moderate)</option>
                  <option value={2}>Grade 2 (2/5 Weak)</option>
                  <option value={1}>Grade 1 (1/5 Major Hesitation)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: Behaviour & Teacher Notes */}
          <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-emerald-500/20">
            <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
              3. Student Behaviour & Teacher Remarks
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 dark:text-emerald-300 mb-1">
                  Student Behaviour Rating
                </label>
                <select
                  value={studentBehaviour}
                  onChange={(e) => setStudentBehaviour(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="EXCELLENT">EXCELLENT (Mumtaz)</option>
                  <option value="VERY_GOOD">VERY GOOD (Jayyid Jiddan)</option>
                  <option value="GOOD">GOOD (Jayyid)</option>
                  <option value="NEEDS_IMPROVEMENT">NEEDS IMPROVEMENT</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-extrabold text-slate-600 dark:text-emerald-300 mb-1">
                  Memorization Status Tag
                </label>
                <input
                  type="text"
                  value={memorizationStatus}
                  onChange={(e) => setMemorizationStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-extrabold text-slate-600 dark:text-emerald-300 mb-1">
                Teacher Specific Guidance & Parent Comments
              </label>
              <textarea
                rows={3}
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none"
                placeholder="Enter detailed feedback regarding Tajweed, Makhraj, and homework expectations..."
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
          >
            <Save className="w-4 h-4" />
            <span>Save Tahfiz Progress & Notify Parent</span>
          </button>
        </form>

        {/* Historical Progress Side Panel */}
        <div className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-5 space-y-4 shadow-lg flex flex-col max-h-[600px] overflow-hidden">
          <div className="border-b border-slate-200 dark:border-emerald-500/20 pb-3">
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              Historical Tahfiz Logs
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-emerald-300/70">
              Recent entries for {targetStudent?.fullName}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3">
            {studentLogs.length > 0 ? (
              studentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between font-extrabold text-slate-900 dark:text-white">
                    <span>{log.hifzSurah}</span>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                      {log.date}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-600 dark:text-emerald-300 font-medium">
                    Ayah {log.hifzFromAyah}-{log.hifzToAyah} ({log.hifzPages} pages)
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-emerald-400 font-bold">
                    <span>Sabki: {log.sabkiSurah} ({log.sabkiRating}/5★)</span>
                    <span>•</span>
                    <span>Manzil: Juz {log.manzilJuz} ({log.manzilRating}/5★)</span>
                  </div>

                  <div className="text-[11px] text-slate-700 dark:text-emerald-200/90 italic bg-white dark:bg-emerald-950/40 p-2 rounded-xl border border-slate-200 dark:border-emerald-800/30">
                    "{log.teacherNotes}"
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 font-bold text-xs">
                No past Tahfiz logs recorded for this student yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#042419] border border-emerald-500/30 rounded-3xl w-full max-w-md shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Tahfiz Record Saved!
            </h3>
            <p className="text-xs text-slate-600 dark:text-emerald-200">
              The daily Hifz, Sabki, and Manzil progress has been recorded and an automated in-app alert dispatched to the student's guardian.
            </p>
            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-lg shadow-emerald-900/30"
            >
              Done / Continue Tracking
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
