'use client';

import React from 'react';
import { GradeRecord, AssessmentConfig } from '@/types';
import { Button } from '@/components/ui/ButtonSystem';
import { StatCard } from '@/components/ui/Card';
import {
  FileCheck2,
  AlertTriangle,
  Users,
  Award,
  CheckCircle2,
  TrendingUp,
  X,
  HelpCircle,
} from 'lucide-react';

interface ResultPreviewModalProps {
  grades: GradeRecord[];
  config: AssessmentConfig;
  programmeName: string;
  className: string;
  subjectName: string;
  term: string;
  session: string;
  onClose: () => void;
  onConfirmSaveDraft: () => void;
  onConfirmSubmitBatch: () => void;
}

export function ResultPreviewModal({
  grades,
  config,
  programmeName,
  className,
  subjectName,
  term,
  session,
  onClose,
  onConfirmSaveDraft,
  onConfirmSubmitBatch,
}: ResultPreviewModalProps) {
  const totalStudents = grades.length;
  const completedRecords = grades.filter((g) => g.totalScore > 0).length;
  const missingScores = totalStudents - completedRecords;

  const totalSum = grades.reduce((acc, g) => acc + g.totalScore, 0);
  const classAverage = totalStudents > 0 ? Number((totalSum / totalStudents).toFixed(1)) : 0;
  const highestScore = Math.max(...grades.map((g) => g.totalScore), 0);
  const lowestScore = Math.min(...grades.map((g) => g.totalScore), 0);

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 font-poppins">
      <div className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 rounded-3xl w-full max-w-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-slate-900 dark:text-white max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-800/60 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
              <FileCheck2 className="w-4 h-4" /> Pre-Submission Assessment Summary
            </div>
            <h2 className="text-xl font-black mt-1">Review Result Entry Batch</h2>
            <p className="text-xs text-slate-500 dark:text-emerald-300/80">
              {subjectName} • {className} ({programmeName})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-emerald-900/60 text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics Overview Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            title="Total Students"
            value={totalStudents}
            subtitle={`${completedRecords} Completed`}
            icon={<Users className="w-4 h-4" />}
            variant="emerald"
          />

          <StatCard
            title="Class Average"
            value={`${classAverage}%`}
            subtitle="Overall Mean Score"
            icon={<TrendingUp className="w-4 h-4" />}
            variant="sky"
          />

          <StatCard
            title="Highest Mark"
            value={`${highestScore}%`}
            subtitle="Top Class Score"
            icon={<Award className="w-4 h-4" />}
            variant="amber"
          />

          <StatCard
            title="Lowest Mark"
            value={`${lowestScore}%`}
            subtitle="Minimum Class Score"
            icon={<HelpCircle className="w-4 h-4" />}
            variant="rose"
          />
        </div>

        {/* Status Notification Banner */}
        {missingScores > 0 ? (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>{missingScores} Records Incomplete</span>
            </div>
            <p className="text-[11px] text-slate-600 dark:text-emerald-200">
              Some students have zero recorded marks. You may still save as draft or submit to administrator for verification.
            </p>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>All student records are complete and validated against administrator configuration.</span>
          </div>
        )}

        {/* Score Preview Snippet Table */}
        <div className="rounded-2xl border border-slate-200 dark:border-emerald-800/40 overflow-hidden text-xs">
          <div className="p-3 bg-slate-100 dark:bg-[#021810] font-bold border-b border-slate-200 dark:border-emerald-800/40 flex items-center justify-between">
            <span>Score Entry Roster Preview</span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400">Session: {session} ({term})</span>
          </div>
          <div className="divide-y divide-slate-100 dark:divide-emerald-950/60 max-h-48 overflow-y-auto">
            {grades.map((g) => (
              <div key={g.studentId} className="p-3 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">{g.studentName}</span>
                  <span className="text-[10px] text-slate-500 dark:text-emerald-300">{g.admissionNo || 'N/A'}</span>
                </div>
                <div className="flex items-center gap-3 font-mono">
                  <span className="text-slate-600 dark:text-emerald-300 text-[11px]">
                    CA: {((g.assignmentScore || 0) + g.ca1Score + g.ca2Score + (g.testScore || 0)).toFixed(0)} | Exam: {g.examScore}
                  </span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {g.totalScore}% ({g.grade})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-emerald-800/60">
          <Button variant="ghost" size="md" onClick={onClose}>
            Back to Editing
          </Button>

          <Button variant="secondary" size="md" onClick={onConfirmSaveDraft}>
            Save as Draft
          </Button>

          <Button variant="primary" size="md" onClick={onConfirmSubmitBatch}>
            Submit to Administrator Queue
          </Button>
        </div>
      </div>
    </div>
  );
}
