'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { PortalTheme } from '@/components/ui/PortalTheme';
import { PortalHeroBanner } from '@/components/ui/PortalHeroBanner';
import { QuickActionGrid, QuickActionItem } from '@/components/ui/QuickActionCard';
import { StatCard } from '@/components/ui/Card';
import { ResultEntryGrid } from './ResultEntryGrid';
import { ResultPreviewModal } from './ResultPreviewModal';
import { AdminApprovalQueue } from './AdminApprovalQueue';
import { AdminAssessmentConfig } from './AdminAssessmentConfig';
import { canTeacherGradeSubject } from '@/lib/rbac';
import { GradeRecord } from '@/types';
import {
  Award,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  Filter,
  Sliders,
  Users,
  AlertTriangle,
  PlusCircle,
  FileCheck2,
} from 'lucide-react';

export function AssessmentDashboard() {
  const {
    currentUser,
    programmes,
    classes,
    subjects,
    students,
    grades,
    teacherAssignments,
    assessmentConfig,
    resultSubmissions,
    currentSession,
    saveGradeGridDraft,
    submitResultBatch,
  } = useApp();

  const isTeacher = currentUser.role === 'TEACHER';
  const isAdmin = currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN';

  // Active Tab for Admin
  const [activeTab, setActiveTab] = useState<'ENTRY' | 'APPROVALS' | 'SETTINGS'>('ENTRY');

  // Step 1 & 2: Session & Term
  const [selectedSession, setSelectedSession] = useState(currentSession.sessionName);
  const [selectedTerm, setSelectedTerm] = useState(currentSession.activeTerm);

  // Step 3: Assigned Programmes for User
  const userTeacherAssignments = teacherAssignments.filter(
    (ta) => ta.teacherId === currentUser.id || isTeacher
  );

  const assignedProgrammeIds = Array.from(new Set(userTeacherAssignments.map((ta) => ta.programmeId)));
  const availableProgrammes = isTeacher
    ? programmes.filter((p) => assignedProgrammeIds.includes(p.id))
    : programmes;

  // Step 3 Selection
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>(
    availableProgrammes[0]?.id || programmes[0]?.id || ''
  );

  // Step 4: Assigned Classes under selected Programme
  const assignedClassIds = Array.from(
    new Set(
      userTeacherAssignments
        .filter((ta) => !selectedProgrammeId || ta.programmeId === selectedProgrammeId)
        .map((ta) => ta.classId)
    )
  );
  const availableClasses = isTeacher
    ? classes.filter((c) => assignedClassIds.includes(c.id) && c.programmeId === selectedProgrammeId)
    : classes.filter((c) => c.programmeId === selectedProgrammeId);

  // Step 4 Selection
  const [selectedClassId, setSelectedClassId] = useState<string>(
    availableClasses[0]?.id || ''
  );

  // Step 5: Assigned Subjects under selected Class
  const assignedSubjectIds = Array.from(
    new Set(
      userTeacherAssignments
        .filter((ta) => ta.classId === selectedClassId)
        .flatMap((ta) => ta.subjectIds)
    )
  );
  const availableSubjects = isTeacher
    ? subjects.filter((s) => assignedSubjectIds.includes(s.id))
    : subjects;

  // Step 5 Selection
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    availableSubjects[0]?.id || ''
  );

  // Step 6: Students enrolled in selected Class
  const activeClassObj = classes.find((c) => c.id === selectedClassId) || availableClasses[0];
  const enrolledStudents = students.filter((s) => s.classId === activeClassObj?.id);

  const activeProgrammeObj = programmes.find((p) => p.id === selectedProgrammeId) || availableProgrammes[0];
  const activeSubjectObj = subjects.find((s) => s.id === selectedSubjectId) || availableSubjects[0];

  // Preview Modal State
  const [previewGrades, setPreviewGrades] = useState<GradeRecord[] | null>(null);

  // Quick Action Items
  const assessmentQuickActions: QuickActionItem[] = [
    {
      label: 'Score Entry Grid',
      labelArabic: 'جدول إدخال الدرجات',
      href: '/dashboard/assessment',
      icon: FileSpreadsheet,
      color: 'from-emerald-600 to-emerald-700',
    },
    {
      label: 'Approval Queue',
      labelArabic: 'قائمة الموافقة',
      href: '/dashboard/assessment',
      icon: Clock,
      color: 'from-amber-600 to-amber-700',
    },
    {
      label: 'Class Attendance Register',
      labelArabic: 'سجل حضور الفصل',
      href: '/dashboard/attendance',
      icon: Award,
      color: 'from-sky-600 to-sky-700',
    },
    {
      label: 'Assessment Settings',
      labelArabic: 'إعدادات التقييم',
      href: '/dashboard/assessment',
      icon: Sliders,
      color: 'from-purple-600 to-purple-700',
    },
  ];

  // Grade records matching active selection
  const activeGrades = grades.filter(
    (g) => g.classId === selectedClassId && g.subjectId === selectedSubjectId
  );

  const handleSaveDraft = (draftGrades: GradeRecord[]) => {
    saveGradeGridDraft(draftGrades);
  };

  const handleConfirmSubmit = () => {
    if (!previewGrades || !activeProgrammeObj || !activeClassObj || !activeSubjectObj) return;

    const totalStudents = previewGrades.length;
    const completedRecords = previewGrades.filter((g) => g.totalScore > 0).length;
    const missingScores = totalStudents - completedRecords;
    const totalSum = previewGrades.reduce((acc, g) => acc + g.totalScore, 0);
    const classAverage = totalStudents > 0 ? Number((totalSum / totalStudents).toFixed(1)) : 0;
    const highestScore = Math.max(...previewGrades.map((g) => g.totalScore), 0);
    const lowestScore = Math.min(...previewGrades.map((g) => g.totalScore), 0);

    submitResultBatch({
      teacherId: currentUser.id,
      teacherName: currentUser.name,
      programmeId: activeProgrammeObj.id,
      programmeName: activeProgrammeObj.programme_name || activeProgrammeObj.programme_name_english || 'General',
      classId: activeClassObj.id,
      className: activeClassObj.name,
      subjectId: activeSubjectObj.id,
      subjectName: activeSubjectObj.name,
      term: selectedTerm,
      session: selectedSession,
      totalStudents,
      completedRecords,
      missingScores,
      classAverage,
      highestScore,
      lowestScore,
      grades: previewGrades,
    });

    setPreviewGrades(null);
  };

  return (
    <PortalTheme>
      <PortalHeroBanner
        badgeText="Enterprise Assessment Engine"
        badgeIcon={Award}
        title="Grading & Results Management Engine"
        description="Spreadsheet-style continuous assessment and examination score entry with instant automatic calculations, score validation, preview workflow, and administrator approval queue."
      />

      {/* Admin Mode Tab Switcher */}
      {isAdmin && (
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 border-b border-slate-200 dark:border-emerald-800/40 pb-3 font-poppins">
          <button
            onClick={() => setActiveTab('ENTRY')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 border ${
              activeTab === 'ENTRY'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-md scale-105'
                : 'bg-white dark:bg-[#042419] text-slate-700 dark:text-emerald-200 border-slate-200 dark:border-emerald-800/40 hover:bg-emerald-100/60'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 shrink-0" />
            <span>Score Entry Grid</span>
          </button>

          <button
            onClick={() => setActiveTab('APPROVALS')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 border ${
              activeTab === 'APPROVALS'
                ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105'
                : 'bg-white dark:bg-[#042419] text-slate-700 dark:text-emerald-200 border-slate-200 dark:border-emerald-800/40 hover:bg-emerald-100/60'
            }`}
          >
            <Clock className="w-4 h-4 shrink-0" />
            <span>Admin Review Queue ({resultSubmissions.filter((s) => s.status === 'PENDING').length})</span>
          </button>

          <button
            onClick={() => setActiveTab('SETTINGS')}
            className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 sm:gap-2 border ${
              activeTab === 'SETTINGS'
                ? 'bg-purple-600 text-white border-purple-500 shadow-md scale-105'
                : 'bg-white dark:bg-[#042419] text-slate-700 dark:text-emerald-200 border-slate-200 dark:border-emerald-800/40 hover:bg-emerald-100/60'
            }`}
          >
            <Sliders className="w-4 h-4 shrink-0" />
            <span>Assessment Configurations</span>
          </button>
        </div>
      )}

      {/* Render Admin Views */}
      {isAdmin && activeTab === 'APPROVALS' && <AdminApprovalQueue />}
      {isAdmin && activeTab === 'SETTINGS' && <AdminAssessmentConfig />}

      {/* Main Score Entry Workflow (Step 1 -> 6) */}
      {(activeTab === 'ENTRY' || isTeacher) && (
        <div className="space-y-6">
          {/* Quick Shortcuts */}
          <QuickActionGrid items={assessmentQuickActions} />

          {/* 6-Step Cascading Selector Bar */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-4 font-poppins">
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-emerald-800/40 pb-3">
              <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Step-by-Step Assignment Cascading Selector
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              {/* Step 1: Academic Session */}
              <div>
                <label className="block text-slate-600 dark:text-emerald-300 font-bold mb-1">
                  1. Session
                </label>
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 font-bold text-slate-900 dark:text-white"
                >
                  <option value="1447/1448 AH (2025/2026 AD)">1447/1448 AH (2025/2026 AD)</option>
                  <option value="1446/1447 AH (2024/2025 AD)">1446/1447 AH (2024/2025 AD)</option>
                </select>
              </div>

              {/* Step 2: Academic Term */}
              <div>
                <label className="block text-slate-600 dark:text-emerald-300 font-bold mb-1">
                  2. Term
                </label>
                <select
                  value={selectedTerm}
                  onChange={(e) => setSelectedTerm(e.target.value as 'Term 1' | 'Term 2' | 'Term 3')}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 font-bold text-slate-900 dark:text-white"
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>

              {/* Step 3: Programme */}
              <div>
                <label className="block text-slate-600 dark:text-emerald-300 font-bold mb-1">
                  3. Programme
                </label>
                <select
                  value={selectedProgrammeId}
                  onChange={(e) => {
                    setSelectedProgrammeId(e.target.value);
                    const matchingClasses = classes.filter((c) => c.programmeId === e.target.value);
                    if (matchingClasses.length > 0) {
                      setSelectedClassId(matchingClasses[0].id);
                    }
                  }}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 font-bold text-slate-900 dark:text-white"
                >
                  {availableProgrammes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.programme_name || p.programme_name_english || 'General'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 4: Class */}
              <div>
                <label className="block text-slate-600 dark:text-emerald-300 font-bold mb-1">
                  4. Class
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 font-bold text-slate-900 dark:text-white"
                >
                  {availableClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Step 5: Subject */}
              <div>
                <label className="block text-slate-600 dark:text-emerald-300 font-bold mb-1">
                  5. Subject
                </label>
                <select
                  value={selectedSubjectId}
                  onChange={(e) => setSelectedSubjectId(e.target.value)}
                  className="w-full p-2.5 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 font-bold text-slate-900 dark:text-white"
                >
                  {availableSubjects.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Interactive Spreadsheet Score Entry Grid */}
          {enrolledStudents.length > 0 ? (
            <ResultEntryGrid
              students={enrolledStudents}
              initialGrades={activeGrades}
              config={assessmentConfig}
              programmeName={activeProgrammeObj?.programme_name || activeProgrammeObj?.programme_name_english || 'General'}
              className={activeClassObj?.name || 'Class Roster'}
              subjectName={activeSubjectObj?.name || 'Subject Marks'}
              term={selectedTerm}
              session={selectedSession}
              teacherName={currentUser.name}
              onSaveDraft={handleSaveDraft}
              onOpenPreview={(gridData) => setPreviewGrades(gridData)}
            />
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-3 font-poppins">
              <Users className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No Enrolled Students Found</h3>
              <p className="text-xs text-slate-500 dark:text-emerald-300">
                There are currently no students assigned to {activeClassObj?.name || 'this class'}.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Pre-Submission Modal */}
      {previewGrades && (
        <ResultPreviewModal
          grades={previewGrades}
          config={assessmentConfig}
          programmeName={activeProgrammeObj?.programme_name || activeProgrammeObj?.programme_name_english || 'General'}
          className={activeClassObj?.name || 'Class Roster'}
          subjectName={activeSubjectObj?.name || 'Subject Marks'}
          term={selectedTerm}
          session={selectedSession}
          onClose={() => setPreviewGrades(null)}
          onConfirmSaveDraft={() => {
            saveGradeGridDraft(previewGrades);
            setPreviewGrades(null);
          }}
          onConfirmSubmitBatch={handleConfirmSubmit}
        />
      )}
    </PortalTheme>
  );
}
