'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { ReportCard } from '@/components/results/ReportCard';
import { ReportCardTemplateModal } from '@/components/results/ReportCardTemplateModal';
import { PortalTheme } from '@/components/ui/PortalTheme';
import { PortalHeroBanner } from '@/components/ui/PortalHeroBanner';
import { Award, Users, PlusCircle, FileSpreadsheet, AlertCircle, Palette, Sparkles } from 'lucide-react';
import { filterStudentsForUser, filterGradesForUser } from '@/lib/rbac';

export default function ResultsPage() {
  const { students, parents, grades, programmes, classes, currentSession, currentUser, teacherAssignments } = useApp();

  const userStudents = filterStudentsForUser(currentUser, students, parents, teacherAssignments);
  const userGrades = filterGradesForUser(currentUser, grades, userStudents);

  const [selectedProgramme, setSelectedProgramme] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState(userStudents[0]?.id || '');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'SINGLE' | 'ALL_BATCH'>('SINGLE');

  // Filter students by selected Programme and Class
  const filteredStudents = userStudents.filter((s) => {
    const matchesProg = selectedProgramme === 'ALL' || s.programmeId === selectedProgramme || s.programmeName === selectedProgramme;
    const matchesClass = selectedClass === 'ALL' || s.classId === selectedClass || s.className === selectedClass;
    return matchesProg && matchesClass;
  });

  const selectedStudent = filteredStudents.find((s) => s.id === selectedStudentId) || filteredStudents[0] || userStudents[0];

  // Section J Enforcement: ONLY APPROVED grade records appear on official Report Cards
  const getApprovedGradesForStudent = (stId: string) => {
    return userGrades.filter((g) => g.studentId === stId && g.status === 'APPROVED');
  };

  const approvedStudentGrades = getApprovedGradesForStudent(selectedStudent?.id);

  const pendingGradesCount = userGrades.filter(
    (g) => g.studentId === selectedStudent?.id && g.status !== 'APPROVED'
  ).length;

  const isAdminUser = currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN';

  return (
    <PortalTheme>
      <PortalHeroBanner
        badgeText="Official Academic Evaluation"
        badgeIcon={Award}
        title="Terminal Report Card Generator"
        description="Official terminal report card generator for Markazu Umar School. Displays verified and administrator-approved assessment results for student academic transcripts."
        actions={
          <div className="flex flex-wrap items-center gap-2.5">
            {isAdminUser && (
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                <Palette className="w-4 h-4" />
                <span>Customize Template & Signature</span>
              </button>
            )}

            {(isAdminUser || currentUser.role === 'TEACHER') && (
              <Link
                href="/dashboard/assessment"
                className="px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all hover:scale-105"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Assessment & Score Entry Engine</span>
              </Link>
            )}
          </div>
        }
      />

      {/* Filter & Batch Controls Bar */}
      <div className="no-print p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-4 font-poppins w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 dark:border-emerald-800/40 pb-4">
          <div className="flex flex-wrap items-center gap-3">
            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 dark:text-emerald-400 mb-1">Filter Programme</label>
              <select
                value={selectedProgramme}
                onChange={(e) => {
                  setSelectedProgramme(e.target.value);
                  setSelectedClass('ALL');
                }}
                className="bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="ALL">All Programmes ({programmes.length})</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>{p.programme_name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 dark:text-emerald-400 mb-1">Filter Class</label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white"
              >
                <option value="ALL">All Classes ({classes.length})</option>
                {classes
                  .filter((c) => selectedProgramme === 'ALL' || c.programmeId === selectedProgramme || c.programmeName === selectedProgramme)
                  .map((c) => (
                    <option key={c.id} value={c.id}>{c.class_name_english || c.name}</option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase text-slate-400 dark:text-emerald-400 mb-1">Select Student Profile</label>
              <select
                value={selectedStudentId}
                onChange={(e) => {
                  setSelectedStudentId(e.target.value);
                  setViewMode('SINGLE');
                }}
                className="bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 dark:text-white max-w-xs truncate"
              >
                {filteredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.className || 'General'}) - {s.admissionNo}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('SINGLE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                viewMode === 'SINGLE'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-emerald-950/60 text-slate-600 dark:text-emerald-300'
              }`}
            >
              Single Card Preview
            </button>

            {isAdminUser && (
              <button
                onClick={() => setViewMode('ALL_BATCH')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  viewMode === 'ALL_BATCH'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'bg-slate-100 dark:bg-emerald-950/60 text-slate-600 dark:text-emerald-300'
                }`}
              >
                Batch View All ({filteredStudents.length} Students)
              </button>
            )}
          </div>
        </div>

        {pendingGradesCount > 0 && (
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>{pendingGradesCount} unapproved subject scores are currently pending administrator review and omitted from report cards.</span>
          </div>
        )}
      </div>

      {/* Official Report Card Renderer */}
      {viewMode === 'ALL_BATCH' ? (
        <div className="space-y-8">
          <div className="no-print p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center justify-between">
            <span>Showing Batch Report Sheets for {filteredStudents.length} Students. Click Print to output all report sheets.</span>
            <button
              onClick={() => window.print()}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md"
            >
              Print All ({filteredStudents.length}) Sheets
            </button>
          </div>

          {filteredStudents.map((st) => (
            <div key={st.id} className="page-break-after">
              <ReportCard student={st} grades={getApprovedGradesForStudent(st.id)} session={currentSession} />
            </div>
          ))}
        </div>
      ) : selectedStudent ? (
        <ReportCard student={selectedStudent} grades={approvedStudentGrades} session={currentSession} />
      ) : (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md font-poppins">
          <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No Student Record Selected</h3>
        </div>
      )}

      {/* Admin Template Customization Modal */}
      <ReportCardTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      />
    </PortalTheme>
  );
}
