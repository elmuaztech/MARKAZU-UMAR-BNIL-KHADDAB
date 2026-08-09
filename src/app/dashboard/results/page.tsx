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
  const { students, parents, grades, currentSession, currentUser, teacherAssignments } = useApp();

  const userStudents = filterStudentsForUser(currentUser, students, parents, teacherAssignments);
  const userGrades = filterGradesForUser(currentUser, grades, userStudents);

  const [selectedStudentId, setSelectedStudentId] = useState(userStudents[0]?.id || '');
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const selectedStudent = userStudents.find((s) => s.id === selectedStudentId) || userStudents[0];

  // Section J Enforcement: ONLY APPROVED grade records appear on official Report Cards
  const approvedStudentGrades = userGrades.filter(
    (g) => g.studentId === selectedStudent?.id && g.status === 'APPROVED'
  );

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

      {/* Student Selector Bar */}
      <div className="no-print p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-poppins overflow-hidden w-full">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto min-w-0 max-w-full">
          <div className="flex items-center gap-2 shrink-0">
            <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider whitespace-nowrap">
              Select Student Profile:
            </span>
          </div>
          <select
            value={selectedStudentId}
            onChange={(e) => setSelectedStudentId(e.target.value)}
            className="w-full sm:w-auto max-w-full bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none truncate"
          >
            {userStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {s.fullName} [{s.programmeName || 'General'}] ({s.className}) - {s.admissionNo}
              </option>
            ))}
          </select>
        </div>

        {pendingGradesCount > 0 && (
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <span>{pendingGradesCount} unapproved subject scores are currently pending administrator review and omitted from report card.</span>
          </div>
        )}
      </div>

      {/* Official Report Card Renderer */}
      {selectedStudent ? (
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
