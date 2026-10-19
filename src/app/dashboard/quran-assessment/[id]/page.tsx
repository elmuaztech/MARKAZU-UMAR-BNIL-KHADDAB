'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/lib/context';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  XCircle,
  Clock,
  Save,
  Send,
  Lock,
  Unlock,
  Printer,
  AlertTriangle,
  RefreshCw,
  FileCheck,
  User,
  School,
  Award,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { evaluateQuranAssessment, EngineCalculationResult } from '@/lib/quranAssessmentEngine';

interface Rule {
  id: string;
  studentType: string;
  mistakeCategory: string;
  threshold: number;
  action: string;
  active: boolean;
}

interface DailyRecord {
  id?: string;
  dayNumber: number;
  date: string;
  fromHizb: string;
  toHizb: string;
  tajweedMistakes: number;
  tilawaMistakes: number;
  categoryMistakes: Record<string, number>;
  notes: string;
}

interface CandidateDetail {
  id: string;
  studentId: string;
  studentType: string;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED';
  finalResult: 'PENDING' | 'QUALIFIED' | 'DISQUALIFIED';
  disqualificationReason?: string | null;
  disqualificationMistakes?: number | null;
  disqualificationThreshold?: number | null;
  disqualifiedOnDay?: number | null;
  disqualifiedDate?: string | null;
  notes?: string | null;
  submittedAt?: string | null;
  submittedBy?: string | null;
  approvedAt?: string | null;
  approvedBy?: string | null;
  student: {
    id: string;
    fullName: string;
    admissionNo: string;
    gender: string;
    currentJuz: number;
    currentSurah: string;
    tajweedRating: number;
  };
  schoolClass: {
    id: string;
    name: string;
    section: string;
  };
  teacher?: {
    id: string;
    fullName: string;
    staffNo: string;
    phone: string;
  } | null;
  examinerName?: string | null;
  event: {
    id: string;
    name: string;
    durationDays: number;
    startDate?: string | null;
    endDate?: string | null;
  };
  ruleSet: {
    id: string;
    name: string;
    version: number;
  };
  applicableRules: Rule[];
  dailyRecords: DailyRecord[];
  calculation?: EngineCalculationResult;
}

export default function CandidateAssessmentEntryPage() {
  const params = useParams();
  const router = useRouter();
  const candidateId = params?.id as string;
  const { currentUser, notify } = useApp();

  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [records, setRecords] = useState<DailyRecord[]>([]);
  const [localCalculation, setLocalCalculation] = useState<EngineCalculationResult | null>(null);

  const canApprove =
    currentUser.role === 'SUPER_ADMIN' ||
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'HEADMASTER';

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';
  const isLocked = candidate?.status === 'APPROVED';

  const fetchCandidateData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/quran-assessment/candidates/${candidateId}`);
      if (!res.ok) {
        throw new Error('Failed to load candidate assessment record.');
      }
      const data = await res.json();
      const cand: CandidateDetail = data.candidate;
      setCandidate(cand);

      // Initialize daily records up to durationDays
      const totalDays = cand.event.durationDays || 30;
      const existingMap = new Map<number, any>();
      (cand.dailyRecords || []).forEach((r: any) => {
        existingMap.set(r.dayNumber, r);
      });

      const initialDays: DailyRecord[] = [];
      const startDate = cand.event.startDate ? new Date(cand.event.startDate) : new Date();

      for (let day = 1; day <= totalDays; day++) {
        const existing = existingMap.get(day);
        const dayDate = new Date(startDate);
        dayDate.setDate(dayDate.getDate() + (day - 1));

        initialDays.push({
          id: existing?.id,
          dayNumber: day,
          date: existing?.date ? new Date(existing.date).toISOString().split('T')[0] : dayDate.toISOString().split('T')[0],
          fromHizb: existing?.fromHizb || '',
          toHizb: existing?.toHizb || '',
          tajweedMistakes: existing?.tajweedMistakes || 0,
          tilawaMistakes: existing?.tilawaMistakes || 0,
          categoryMistakes: existing?.categoryMistakes || {},
          notes: existing?.notes || '',
        });
      }

      setRecords(initialDays);

      // Run calculation preview
      const preview = evaluateQuranAssessment(
        cand.applicableRules || [],
        cand.studentType,
        initialDays
      );
      setLocalCalculation(preview);
    } catch (err: any) {
      console.error(err);
      notify({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (candidateId) {
      fetchCandidateData();
    }
  }, [candidateId]);

  // Recalculate whenever records or candidate updates
  const updateRecordField = (
    dayIndex: number,
    field: keyof DailyRecord,
    value: any
  ) => {
    if (isLocked && !isSuperAdmin) return;

    setRecords((prev) => {
      const next = [...prev];
      next[dayIndex] = {
        ...next[dayIndex],
        [field]: value,
      };

      if (candidate?.applicableRules) {
        const preview = evaluateQuranAssessment(
          candidate.applicableRules,
          candidate.studentType,
          next
        );
        setLocalCalculation(preview);
      }

      return next;
    });
  };

  const updateCategoryMistake = (
    dayIndex: number,
    categoryName: string,
    count: number
  ) => {
    if (isLocked && !isSuperAdmin) return;

    setRecords((prev) => {
      const next = [...prev];
      const currentCatMistakes = { ...(next[dayIndex].categoryMistakes || {}) };
      currentCatMistakes[categoryName] = Math.max(0, count);

      next[dayIndex] = {
        ...next[dayIndex],
        categoryMistakes: currentCatMistakes,
      };

      if (candidate?.applicableRules) {
        const preview = evaluateQuranAssessment(
          candidate.applicableRules,
          candidate.studentType,
          next
        );
        setLocalCalculation(preview);
      }

      return next;
    });
  };

  // Save Daily Records
  const handleSaveRecords = async () => {
    try {
      setSaving(true);
      const res = await fetch(`/api/quran-assessment/candidates/${candidateId}/daily-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save daily assessment records');

      notify({ type: 'success', title: 'Saved Successfully', message: 'Physical form assessment records saved and verified.' });
      if (data.candidate) {
        setCandidate((prev) => (prev ? { ...prev, ...data.candidate } : data.candidate));
      }
      if (data.calculation) {
        setLocalCalculation(data.calculation);
      }
      await fetchCandidateData();
    } catch (err: any) {
      notify({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Change Status (Submit, Approve, Reopen)
  const handleStatusChange = async (action: 'SUBMIT' | 'APPROVE' | 'REOPEN') => {
    const confirmMessages = {
      SUBMIT: 'Submit this completed assessment for administrative review?',
      APPROVE: 'Are you sure you want to officially APPROVE and permanently seal this assessment? Once approved, records cannot be edited.',
      REOPEN: 'Reopen this approved assessment for authorized corrections?',
    };

    if (!confirm(confirmMessages[action])) return;

    try {
      setSaving(true);
      // Auto-save any pending records first
      await fetch(`/api/quran-assessment/candidates/${candidateId}/daily-records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ records }),
      });

      const res = await fetch(`/api/quran-assessment/candidates/${candidateId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Failed to ${action.toLowerCase()} assessment.`);

      notify({
        type: action === 'APPROVE' ? 'success' : 'info',
        title: `Status: ${action}`,
        message: data.message,
      });

      if (data.candidate) {
        setCandidate((prev) => (prev ? { ...prev, ...data.candidate } : data.candidate));
      }
      if (data.calculation) {
        setLocalCalculation(data.calculation);
      }
      await fetchCandidateData();
    } catch (err: any) {
      notify({ type: 'error', title: 'Action Failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center text-sm text-slate-500 max-w-4xl mx-auto py-24">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-3" />
        Loading candidate assessment details...
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-2" />
        <h2 className="text-lg font-bold text-slate-900">Candidate Not Found</h2>
        <Link href="/dashboard/quran-assessment" className="text-emerald-600 underline text-sm mt-2 inline-block">
          Return to Qur’an Assessment Portal
        </Link>
      </div>
    );
  }

  const isMasuBiye = candidate.studentType.toLowerCase().includes('biye');
  const rules = candidate.applicableRules || [];
  const calc = localCalculation || candidate.calculation;
  const isDisqualified = calc?.finalResult === 'DISQUALIFIED';
  const isQualified = calc?.finalResult === 'QUALIFIED';

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/quran-assessment"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-emerald-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Assessment Candidates
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition"
          >
            <Printer className="w-3.5 h-3.5" /> Print Sheet
          </button>
        </div>
      </div>

      {/* Candidate Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 flex items-center justify-center font-bold text-lg font-poppins flex-shrink-0">
              {candidate.student.fullName.charAt(0)}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white font-poppins">
                  {candidate.student.fullName}
                </h1>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {candidate.student.admissionNo}
                </span>
                <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
                  {candidate.studentType}
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Rule Set v{candidate.ruleSet?.version || 1}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span>Class: <strong className="text-slate-700 dark:text-slate-200">{candidate.schoolClass?.name || 'Class'}</strong></span>
                <span>Teacher: <strong className="text-slate-700 dark:text-slate-200">{candidate.teacher?.fullName || 'Not assigned'}</strong></span>
                <span>Examiner: <strong className="text-slate-700 dark:text-slate-200">{candidate.examinerName || 'Staff'}</strong></span>
                <span>Event: <strong className="text-slate-700 dark:text-slate-200">{candidate.event?.name || 'Assessment Event'}</strong></span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-center">
            {isLocked ? (
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  <Lock className="w-3.5 h-3.5" /> Approved & Sealed
                </span>
                {isSuperAdmin && (
                  <button
                    onClick={() => handleStatusChange('REOPEN')}
                    disabled={saving}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950 text-amber-800 dark:text-amber-200 hover:bg-amber-100 transition"
                  >
                    <Unlock className="w-3.5 h-3.5" /> Reopen
                  </button>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={handleSaveRecords}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Draft'}
                </button>

                {candidate.status === 'DRAFT' && (
                  <button
                    onClick={() => handleStatusChange('SUBMIT')}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-900 text-white transition disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Assessment
                  </button>
                )}

                {canApprove && (candidate.status === 'SUBMITTED' || candidate.status === 'DRAFT') && (
                  <button
                    onClick={() => handleStatusChange('APPROVE')}
                    disabled={saving}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-lg bg-emerald-800 hover:bg-emerald-900 text-emerald-100 transition disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Approve & Seal
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        {/* Real-time Authoritative Result Banner */}
        {isDisqualified ? (
          <div className="bg-red-50 dark:bg-red-950/50 border-2 border-red-500 rounded-xl p-4 sm:p-5 text-red-900 dark:text-red-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 text-white">
                    Result: DISQUALIFIED
                  </span>
                  <span className="text-xs font-semibold text-red-700 dark:text-red-300">
                    Triggered on Day {calc?.disqualifiedOnDay}
                  </span>
                </div>
                <h3 className="text-lg font-black text-red-950 dark:text-white mt-1 font-poppins">
                  Disqualification Reason: {calc?.disqualificationReason}
                </h3>
                <p className="text-xs sm:text-sm text-red-800 dark:text-red-300 mt-0.5">
                  The candidate accumulated{' '}
                  <strong>
                    {calc?.disqualificationMistakes} mistake(s)
                  </strong>{' '}
                  in category &quot;{calc?.disqualificationReason}&quot;, reaching the configured disqualification threshold of{' '}
                  <strong>{calc?.disqualificationThreshold} mistakes</strong>.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-red-200 dark:border-red-900 text-center flex-shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Mistakes</span>
              <span className="text-2xl font-black text-red-600 dark:text-red-400 font-poppins">
                {calc?.totalMistakes}
              </span>
            </div>
          </div>
        ) : isQualified ? (
          <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800 rounded-xl p-4 sm:p-5 text-emerald-900 dark:text-emerald-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-600 text-white">
                    Result: QUALIFIED
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                    Within All Limits
                  </span>
                </div>
                <h3 className="text-lg font-black text-emerald-950 dark:text-white mt-1 font-poppins">
                  Candidate Maintained Required Standards
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 mt-0.5">
                  All mistake counts across all individual categories remain strictly below the configured disqualification thresholds.
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 text-center flex-shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Mistakes</span>
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-poppins">
                {calc?.totalMistakes}
              </span>
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Assessment In Progress • Status: <strong>{candidate.status}</strong> • Enter physical form daily scores below.</span>
            </div>
            <span className="font-bold text-slate-900 dark:text-white">{calc?.totalMistakes || 0} Total Mistakes Recorded</span>
          </div>
        )}

        {/* Configured Thresholds Summary for this Candidate's Student Type */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 font-bold">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Configured Disqualification Thresholds ({candidate.studentType}):</span>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {rules.map((r) => {
              const currentCount = calc?.categoryTotals?.[r.mistakeCategory] || 0;
              const isOver = currentCount >= r.threshold;
              return (
                <div
                  key={r.id}
                  className={`px-2.5 py-1 rounded-md border text-xs font-semibold flex items-center gap-1.5 ${
                    isOver
                      ? 'bg-red-50 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
                      : 'bg-white text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:border-slate-700'
                  }`}
                >
                  <span>{r.mistakeCategory}:</span>
                  <strong className={isOver ? 'text-red-600' : 'text-emerald-600 dark:text-emerald-400'}>
                    {currentCount} / {r.threshold}
                  </strong>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 30-Day Physical Hausa Paper Form Entry Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 font-poppins">
              <FileCheck className="w-5 h-5 text-emerald-600" />
              Daily Assessment Record (Takardar Gwaji ta Ranaku 30)
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter data directly from the physical paper form. Mistakes are counted continuously and evaluated independently per category.
            </p>
          </div>

          {!isLocked && (
            <button
              onClick={handleSaveRecords}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50 self-start sm:self-auto"
            >
              <Save className="w-3.5 h-3.5" /> Save Changes
            </button>
          )}
        </div>

        {/* The Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700 text-center w-12">
                  Day<br /><span className="text-[10px] text-slate-400 font-normal">Ranar</span>
                </th>
                <th className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700 w-32">
                  Date<br /><span className="text-[10px] text-slate-400 font-normal">Kwanan Wata</span>
                </th>
                <th className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700 w-24">
                  From Hizb<br /><span className="text-[10px] text-slate-400 font-normal">Daga Hizbi</span>
                </th>
                <th className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700 w-24">
                  To Hizb<br /><span className="text-[10px] text-slate-400 font-normal">Zuwa Hizbi</span>
                </th>

                {/* Dynamic Category Columns according to rules */}
                {rules.map((rule) => (
                  <th key={rule.id} className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700 text-center min-w-[120px]">
                    <span className="text-emerald-800 dark:text-emerald-300 font-bold">{rule.mistakeCategory}</span>
                    <br />
                    <span className="text-[10px] text-slate-400 font-normal">Threshold: {rule.threshold}</span>
                  </th>
                ))}

                <th className="py-2.5 px-3 border-b border-slate-200 dark:border-slate-700 min-w-[140px]">
                  Notes / Observations<br /><span className="text-[10px] text-slate-400 font-normal">Bayanai</span>
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
              {records.map((rec, index) => {
                const isTriggerDay = calc?.disqualifiedOnDay === rec.dayNumber;

                return (
                  <tr
                    key={rec.dayNumber}
                    className={`transition ${
                      isTriggerDay
                        ? 'bg-red-50/80 dark:bg-red-950/30'
                        : index % 2 === 0
                        ? 'bg-white dark:bg-slate-900'
                        : 'bg-slate-50/50 dark:bg-slate-800/20'
                    }`}
                  >
                    {/* Day Number */}
                    <td className="py-2 px-3 text-center font-bold text-slate-700 dark:text-slate-300">
                      <span className={`inline-block w-6 h-6 rounded-full leading-6 text-center text-xs ${
                        isTriggerDay ? 'bg-red-600 text-white font-black' : 'bg-slate-100 dark:bg-slate-800'
                      }`}>
                        {rec.dayNumber}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-2 px-3">
                      <input
                        type="date"
                        disabled={isLocked && !isSuperAdmin}
                        value={rec.date}
                        onChange={(e) => updateRecordField(index, 'date', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60"
                      />
                    </td>

                    {/* From Hizb */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="e.g. 1"
                        disabled={isLocked && !isSuperAdmin}
                        value={rec.fromHizb}
                        onChange={(e) => updateRecordField(index, 'fromHizb', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60"
                      />
                    </td>

                    {/* To Hizb */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="e.g. 2"
                        disabled={isLocked && !isSuperAdmin}
                        value={rec.toHizb}
                        onChange={(e) => updateRecordField(index, 'toHizb', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60"
                      />
                    </td>

                    {/* Dynamic mistake category inputs */}
                    {rules.map((rule) => {
                      const count = rec.categoryMistakes?.[rule.mistakeCategory] || 0;

                      return (
                        <td key={rule.id} className="py-2 px-3 text-center">
                          <input
                            type="number"
                            min="0"
                            max="99"
                            disabled={isLocked && !isSuperAdmin}
                            value={count}
                            onChange={(e) =>
                              updateCategoryMistake(
                                index,
                                rule.mistakeCategory,
                                parseInt(e.target.value, 10) || 0
                              )
                            }
                            className={`w-16 px-2 py-1 text-center font-bold text-xs rounded border ${
                              count > 0
                                ? 'border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-200'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            } disabled:opacity-60`}
                          />
                        </td>
                      );
                    })}

                    {/* Notes */}
                    <td className="py-2 px-3">
                      <input
                        type="text"
                        placeholder="Optional remarks..."
                        disabled={isLocked && !isSuperAdmin}
                        value={rec.notes}
                        onChange={(e) => updateRecordField(index, 'notes', e.target.value)}
                        className="w-full px-2 py-1 text-xs rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white disabled:opacity-60"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer info & save */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500">
          <div>
            <span>{records.length} assessment days displayed.</span>
            {candidate.approvedAt && (
              <span className="ml-2 font-semibold text-emerald-700 dark:text-emerald-400">
                • Approved by {candidate.approvedBy || 'Admin'} on {new Date(candidate.approvedAt).toLocaleDateString()}
              </span>
            )}
          </div>

          {!isLocked && (
            <button
              onClick={handleSaveRecords}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" /> Save All Days
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
