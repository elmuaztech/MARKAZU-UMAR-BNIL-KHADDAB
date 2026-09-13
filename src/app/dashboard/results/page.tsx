'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/lib/context';
import { ReportCard } from '@/components/results/ReportCard';
import { ReportCardTemplateModal } from '@/components/results/ReportCardTemplateModal';
import { PortalTheme } from '@/components/ui/PortalTheme';
import { PortalHeroBanner } from '@/components/ui/PortalHeroBanner';
import { filterStudentsForUser, filterGradesForUser, filterClassesForUser, getHeadmasterAssignedProgramme } from '@/lib/rbac';
import {
  Award,
  Palette,
  FileSpreadsheet,
  Printer,
  AlertCircle,
  Users,
  ShieldAlert,
  Clock,
  Send,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

function ResultsContent() {
  const searchParams = useSearchParams();
  const deepLinkStudentId = searchParams.get('studentId');

  const { students, parents, grades, programmes, classes, currentSession, currentUser, teacherAssignments } = useApp();

  const isHeadmaster = currentUser.role === 'HEADMASTER';
  const isAdminUser = currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN';
  const isParent = currentUser.role === 'PARENT';
  const isStudent = currentUser.role === 'STUDENT';

  const assignedProg = isHeadmaster ? getHeadmasterAssignedProgramme(currentUser, programmes) : null;

  const userStudents = filterStudentsForUser(currentUser, students, parents, teacherAssignments);
  const userGrades = filterGradesForUser(currentUser, grades, userStudents);

  const [liveReportData, setLiveReportData] = useState<any>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);

  // Authoritative Security Check for deep links:
  // If backend returns 403 / isUnauthorized, or if client list is populated and lacks student, mark unauthorized
  const isDeepLinkUnauthorized = Boolean(
    deepLinkStudentId &&
    (liveReportData?.isUnauthorized === true ||
      (liveReportData && !liveReportData.success && liveReportData.status === 403) ||
      (!isLoadingReport && liveReportData === null && userStudents.length > 0 && !userStudents.some((s) => s.id === deepLinkStudentId)))
  );

  const [selectedProgramme, setSelectedProgramme] = useState(() => {
    if (isHeadmaster && assignedProg) return assignedProg.id;
    return 'ALL';
  });

  useEffect(() => {
    if (isHeadmaster && assignedProg && selectedProgramme !== assignedProg.id) {
      setSelectedProgramme(assignedProg.id);
    }
  }, [isHeadmaster, assignedProg, selectedProgramme]);

  const userClasses = isHeadmaster
    ? filterClassesForUser(currentUser, classes, teacherAssignments)
    : classes;

  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState(() => {
    if (deepLinkStudentId) return deepLinkStudentId;
    return userStudents[0]?.id || '';
  });

  useEffect(() => {
    if (deepLinkStudentId) {
      setSelectedStudentId(deepLinkStudentId);
    }
  }, [deepLinkStudentId]);

  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'SINGLE' | 'ALL_BATCH'>('SINGLE');
  const [isReleasing, setIsReleasing] = useState(false);
  const [releaseSuccessMessage, setReleaseSuccessMessage] = useState<string | null>(null);
  const [releaseErrorMessage, setReleaseErrorMessage] = useState<string | null>(null);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Filter students by selected Programme and Class
  const filteredStudents = userStudents.filter((s) => {
    const matchesProg = selectedProgramme === 'ALL' || s.programmeId === selectedProgramme || s.programmeName === selectedProgramme;
    const matchesClass = selectedClass === 'ALL' || s.classId === selectedClass || s.className === selectedClass;
    return matchesProg && matchesClass;
  });

  const selectedStudent =
    liveReportData?.student ||
    filteredStudents.find((s) => s.id === selectedStudentId) ||
    filteredStudents[0] ||
    userStudents[0];

  useEffect(() => {
    const targetId = deepLinkStudentId || selectedStudentId;
    if (!targetId) return;
    setIsLoadingReport(true);
    fetch(`/api/reports/download?studentId=${targetId}&format=json`)
      .then(async (r) => {
        if (r.status === 403 || r.status === 401) {
          setLiveReportData({ isUnauthorized: true, status: r.status, success: false });
          return null;
        }
        return r.json();
      })
      .then((data) => {
        if (!data) return;
        if (data.success) {
          setLiveReportData({ ...data, status: 200 });
        } else {
          setLiveReportData({ isReleased: false, notReady: data.notReady, status: 200, success: false });
        }
      })
      .catch(() => setLiveReportData(null))
      .finally(() => setIsLoadingReport(false));
  }, [deepLinkStudentId, selectedStudentId, currentSession?.id, currentSession?.activeTerm]);

  // Section J Enforcement: ONLY APPROVED grade records appear on official Report Cards
  const getApprovedGradesForStudent = (stId: string) => {
    return userGrades.filter((g) => g.studentId === stId && g.status === 'APPROVED');
  };

  const approvedStudentGrades = getApprovedGradesForStudent(selectedStudent?.id);

  // Workflow Enforcement: REPORT RELEASE != RESULT APPROVAL
  // Only officially RELEASED reports are visible to Parents & Students
  const isReportReleased = liveReportData?.isReleased ?? (approvedStudentGrades.length > 0 && approvedStudentGrades.some((g) => g.isReleased === true));
  const displayGrades = liveReportData?.grades?.length ? liveReportData.grades : approvedStudentGrades;

  const pendingGradesCount = userGrades.filter(
    (g) => g.studentId === selectedStudent?.id && g.status !== 'APPROVED'
  ).length;

  // Handle Official Release to Parents
  const handleReleaseReportCards = async () => {
    if (!isAdminUser && !isHeadmaster) return;
    try {
      setIsReleasing(true);
      setReleaseSuccessMessage(null);
      setReleaseErrorMessage(null);

      const res = await fetch('/api/reports/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession?.id,
          term: currentSession?.activeTerm || 'Term 1',
          classId: selectedClass !== 'ALL' ? selectedClass : undefined,
          programmeId: selectedProgramme !== 'ALL' ? selectedProgramme : undefined,
          studentId: selectedStudent?.id,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to release report cards.');
      }

      setReleaseSuccessMessage(data.message || 'Report cards officially released to parents.');
      // Update local state to reflect release
      approvedStudentGrades.forEach((g) => {
        g.isReleased = true;
      });
    } catch (err: any) {
      setReleaseErrorMessage(err.message || 'Error releasing report cards.');
    } finally {
      setIsReleasing(false);
    }
  };

  return (
    <PortalTheme>
      <PortalHeroBanner
        badgeText="Official Academic Evaluation"
        badgeIcon={Award}
        title={isParent ? 'Report Cards' : 'Official Report Cards'}
        description={
          isParent
            ? "View and download official academic and Tahfiz evaluation report cards for your children."
            : "Official terminal report card generator for Markazu Umar School. Displays verified and administrator-approved assessment results for student academic transcripts."
        }
        actions={
          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {isAdminUser && (
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:scale-105"
              >
                <Palette className="w-4 h-4" />
                <span>Customize Template & Signature</span>
              </button>
            )}

            {(isAdminUser || currentUser.role === 'TEACHER') && (
              <Link
                href="/dashboard/assessment"
                className="w-full sm:w-auto px-5 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg transition-all hover:scale-105"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Assessment & Score Entry</span>
              </Link>
            )}
          </div>
        }
      />

      {/* Security Rejection Screen for Unauthorized Deep Links */}
      {isDeepLinkUnauthorized ? (
        <div className="p-8 text-center rounded-3xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-800 dark:text-rose-200 font-poppins space-y-3">
          <ShieldAlert className="w-12 h-12 mx-auto text-rose-500" />
          <h2 className="text-lg font-black">Access Denied</h2>
          <p className="text-xs max-w-md mx-auto">
            You are not authorized to view or download the report card for this child. Student records are strictly confidential and scoped to registered parents.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/results"
              className="inline-block px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-md transition-all"
            >
              {isParent ? 'View Your Children' : 'Return to Authorized Results'}
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Filter & Batch Controls Bar */}
          <div className="no-print p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-4 font-poppins w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-end">
              {!isParent && !isStudent && currentUser.role !== 'HEADMASTER' && (
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-emerald-400 mb-1.5">
                    Filter Programme
                  </label>
                  <select
                    value={selectedProgramme}
                    onChange={(e) => {
                      setSelectedProgramme(e.target.value);
                      setSelectedClass('ALL');
                    }}
                    className="w-full bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="ALL">All Programmes ({programmes.length})</option>
                    {programmes.map((p) => (
                      <option key={p.id} value={p.id}>{p.programme_name_english || p.programme_name}</option>
                    ))}
                  </select>
                </div>
              )}

              {currentUser.role === 'HEADMASTER' && (
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-emerald-400 mb-1.5">
                    Your Section Programme
                  </label>
                  <div className="w-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/40 rounded-xl px-3.5 py-2.5 text-xs font-black text-emerald-900 dark:text-emerald-200 truncate">
                    {assignedProg?.programme_name || assignedProg?.programme_name_english || currentUser.assignedProgrammeName || 'Your Section'}
                  </div>
                </div>
              )}

              {!isParent && !isStudent && (
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-emerald-400 mb-1.5">
                    Filter Class
                  </label>
                  <select
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                  >
                    <option value="ALL">All Classes in Section ({userClasses.filter((c) => selectedProgramme === 'ALL' || c.programmeId === selectedProgramme || c.programmeName === selectedProgramme).length})</option>
                    {userClasses
                      .filter((c) => selectedProgramme === 'ALL' || c.programmeId === selectedProgramme || c.programmeName === selectedProgramme)
                      .map((c) => (
                        <option key={c.id} value={c.id}>{c.class_name_english || c.name}</option>
                      ))}
                  </select>
                </div>
              )}

              <div className={isParent || isStudent ? 'col-span-full sm:col-span-2' : 'sm:col-span-2 lg:col-span-1 xl:col-span-2'}>
                <label className="block text-[11px] font-extrabold uppercase text-slate-500 dark:text-emerald-400 mb-1.5">
                  {isParent ? 'Select Child' : 'Select Student Profile'}
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => {
                    setSelectedStudentId(e.target.value);
                    setViewMode('SINGLE');
                  }}
                  className="w-full bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {filteredStudents.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.className || 'General'}) — Reg: {s.admissionNo}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-emerald-800/40">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setViewMode('SINGLE')}
                  className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                    viewMode === 'SINGLE'
                      ? 'bg-emerald-600 text-white shadow-md font-black'
                      : 'bg-slate-100 dark:bg-emerald-950/60 text-slate-600 dark:text-emerald-300 hover:bg-slate-200'
                  }`}
                >
                  Single Card Preview
                </button>

                {isAdminUser && (
                  <button
                    onClick={() => setViewMode('ALL_BATCH')}
                    className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition-all text-center ${
                      viewMode === 'ALL_BATCH'
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'bg-slate-100 dark:bg-emerald-950/60 text-slate-600 dark:text-emerald-300 hover:bg-slate-200'
                    }`}
                  >
                    Batch View All ({filteredStudents.length} Students)
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {(isAdminUser || isHeadmaster) && (
                  <button
                    onClick={handleReleaseReportCards}
                    disabled={isReleasing}
                    className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50"
                  >
                    {isReleasing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{isReleasing ? 'Releasing...' : 'Release Report Cards to Parents'}</span>
                  </button>
                )}

                <button
                  onClick={handlePrint}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-slate-900 text-white dark:bg-emerald-600 hover:bg-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Transcripts</span>
                </button>
              </div>
            </div>

            {releaseSuccessMessage && (
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-3.5 py-2.5 rounded-xl border border-emerald-500/30">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>{releaseSuccessMessage}</span>
              </div>
            )}

            {releaseErrorMessage && (
              <div className="flex items-center gap-2 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-500/10 px-3.5 py-2.5 rounded-xl border border-rose-500/30">
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{releaseErrorMessage}</span>
              </div>
            )}

            {pendingGradesCount > 0 && (
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-600 dark:text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20">
                <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{pendingGradesCount} unapproved subject scores are currently pending administrator review and omitted from report cards.</span>
              </div>
            )}
          </div>

          {/* Official Report Card Renderer */}
          {viewMode === 'ALL_BATCH' ? (
            <div className="space-y-8">
              <div className="no-print p-4 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center justify-between">
                <span>Showing Batch Report Cards for {filteredStudents.length} Students. Click Print to output all report sheets.</span>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md"
                >
                  Print All ({filteredStudents.length}) Cards
                </button>
              </div>

              {filteredStudents.map((st) => (
                <div key={st.id} className="page-break-after">
                  <ReportCard student={st} grades={getApprovedGradesForStudent(st.id)} session={currentSession} />
                </div>
              ))}
            </div>
          ) : selectedStudent ? (
            // Parents and Students see the Pending State until the report is officially RELEASED
            (isParent || isStudent) && !isReportReleased ? (
              <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#042419] border border-amber-300 dark:border-amber-600/40 shadow-lg font-poppins space-y-4 max-w-xl mx-auto">
                <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-400 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
                  <Clock className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-black text-slate-900 dark:text-white">Report not available yet</h2>
                  <p className="text-xs text-slate-600 dark:text-emerald-200/80">You'll be notified when your child's report is ready.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-left pt-1">
                  <div className="p-3 rounded-xl bg-white dark:bg-emerald-950/60 border border-slate-200 dark:border-emerald-500/20 shadow-2xs">
                    <span className="text-[10px] text-slate-500 dark:text-emerald-400 font-extrabold uppercase block mb-0.5">Child</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">{selectedStudent.fullName}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-emerald-950/60 border border-slate-200 dark:border-emerald-500/20 shadow-2xs">
                    <span className="text-[10px] text-slate-500 dark:text-emerald-400 font-extrabold uppercase block mb-0.5">Class</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">{selectedStudent.className || 'Assigned Class'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-white dark:bg-emerald-950/60 border border-slate-200 dark:border-emerald-500/20 shadow-2xs">
                    <span className="text-[10px] text-slate-500 dark:text-emerald-400 font-extrabold uppercase block mb-0.5">Session</span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white truncate block">{currentSession?.sessionName} ({currentSession?.activeTerm})</span>
                  </div>
                </div>
              </div>
            ) : (
              <ReportCard student={selectedStudent} grades={displayGrades} session={currentSession} />
            )
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md font-poppins">
              <Users className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isParent ? 'No Child Record Selected' : 'No Student Record Selected'}
              </h3>
            </div>
          )}
        </>
      )}

      {/* Admin Template Customization Modal */}
      <ReportCardTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      />
    </PortalTheme>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-bold text-slate-500">Loading Report Cards...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
