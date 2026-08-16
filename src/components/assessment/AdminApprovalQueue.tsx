'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { ResultApprovalSubmission, GradeRecord } from '@/types';
import { EnterpriseTable, Column } from '@/components/ui/EnterpriseTable';
import { Button } from '@/components/ui/ButtonSystem';
import {
  CheckCircle,
  XCircle,
  RotateCcw,
  MessageSquare,
  Clock,
  Award,
  BookOpen,
  Eye,
  Filter,
} from 'lucide-react';

export function AdminApprovalQueue() {
  const {
    resultSubmissions,
    grades,
    approveResultSubmission,
    rejectResultSubmission,
    returnResultSubmission,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED'>('PENDING');

  // Review Modal State
  const [selectedSub, setSelectedSub] = useState<ResultApprovalSubmission | null>(null);
  const [actionType, setActionType] = useState<'APPROVE' | 'REJECT' | 'RETURN' | null>(null);
  const [commentText, setCommentText] = useState('');

  const filteredSubmissions = resultSubmissions.filter((s) => s.status === activeTab);

  const handleActionConfirm = () => {
    if (!selectedSub || !actionType) return;

    if (actionType === 'APPROVE') {
      approveResultSubmission(selectedSub.id, commentText);
    } else if (actionType === 'REJECT') {
      rejectResultSubmission(selectedSub.id, commentText || 'Scores rejected by Administrator');
    } else if (actionType === 'RETURN') {
      returnResultSubmission(selectedSub.id, commentText || 'Returned for score review and correction');
    }

    setSelectedSub(null);
    setActionType(null);
    setCommentText('');
  };

  const columns: Column<ResultApprovalSubmission>[] = [
    {
      header: 'Subject & Class',
      cell: (sub) => (
        <div>
          <span className="font-bold text-slate-900 dark:text-white block">{sub.subjectName}</span>
          <span className="text-[11px] text-slate-500 dark:text-emerald-300/80 font-medium">
            {sub.className} • {sub.programmeName}
          </span>
        </div>
      ),
    },
    {
      header: 'Submitted By',
      cell: (sub) => (
        <div>
          <span className="font-bold text-slate-800 dark:text-emerald-200 block">{sub.teacherName}</span>
          <span className="text-[10px] text-slate-400 font-mono">
            {new Date(sub.submittedAt).toLocaleDateString()}
          </span>
        </div>
      ),
    },
    {
      header: 'Class Metrics',
      cell: (sub) => (
        <div className="text-xs font-mono">
          <span className="text-emerald-600 dark:text-emerald-400 font-bold block">Avg: {sub.classAverage}%</span>
          <span className="text-[10px] text-slate-500 dark:text-emerald-300">
            High: {sub.highestScore}% | Low: {sub.lowestScore}%
          </span>
        </div>
      ),
    },
    {
      header: 'Completion',
      cell: (sub) => (
        <span className="px-2.5 py-1 rounded-xl text-xs font-bold bg-slate-100 dark:bg-emerald-950/60 text-slate-700 dark:text-emerald-200 border border-slate-200 dark:border-emerald-800/40">
          {sub.completedRecords} / {sub.totalStudents} Records
        </span>
      ),
    },
    {
      header: 'Status',
      align: 'center',
      cell: (sub) => (
        <span
          className={`px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider border ${
            sub.status === 'PENDING'
              ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
              : sub.status === 'APPROVED'
              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
              : sub.status === 'RETURNED'
              ? 'bg-purple-500/10 text-purple-600 border-purple-500/30'
              : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
          }`}
        >
          {sub.status}
        </span>
      ),
    },
    {
      header: 'Action',
      align: 'right',
      cell: (sub) => (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<Eye className="w-3.5 h-3.5" />}
          onClick={() => setSelectedSub(sub)}
        >
          Review Batch
        </Button>
      ),
    },
  ];

  // Submission Grades Preview
  const subGrades = selectedSub
    ? grades.filter((g) => g.subjectId === selectedSub.subjectId && g.classId === selectedSub.classId)
    : [];

  return (
    <div className="space-y-6 font-poppins">
      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-emerald-800/40 pb-3">
        {(['PENDING', 'APPROVED', 'RETURNED', 'REJECTED'] as const).map((tab) => {
          const count = resultSubmissions.filter((s) => s.status === tab).length;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
                activeTab === tab
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md scale-105'
                  : 'bg-white dark:bg-[#042419] text-slate-700 dark:text-emerald-300 border-slate-200 dark:border-emerald-800/40 hover:bg-emerald-100/60'
              }`}
            >
              <span>
                {tab === 'PENDING'
                  ? 'Pending Reviews'
                  : tab === 'APPROVED'
                  ? 'Approved Results'
                  : tab === 'RETURNED'
                  ? 'Returned for Correction'
                  : 'Rejected Results'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-900/10 font-mono">
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Submissions Table */}
      <EnterpriseTable
        title={`Administrator Review Queue (${activeTab})`}
        subtitle="Review, approve, reject, or return teacher score submissions before official report sheet generation"
        columns={columns}
        data={filteredSubmissions}
        searchPlaceholder="Search by subject, class, or teacher..."
      />

      {/* Review & Approval Modal Dialog */}
      {selectedSub && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-900 dark:text-white">
            {/* Header (Fixed) */}
            <div className="shrink-0 p-5 sm:p-6 flex items-center justify-between border-b border-slate-200 dark:border-emerald-800/60">
              <div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Batch Evaluation Review • {selectedSub.subjectName}
                </span>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mt-1">
                  {selectedSub.className} ({selectedSub.programmeName})
                </h3>
                <p className="text-xs text-slate-500 dark:text-emerald-300">
                  Submitted by {selectedSub.teacherName} on {new Date(selectedSub.submittedAt).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedSub(null);
                  setActionType(null);
                }}
                className="text-slate-400 hover:text-slate-700 dark:hover:text-white text-lg font-bold p-2"
              >
                ✕
              </button>
            </div>

            {/* Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-6">
              {/* Metrics Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40">
                  <span className="text-[10px] text-slate-500 dark:text-emerald-400 block font-semibold">Total Students</span>
                  <span className="font-poppins text-lg font-black">{selectedSub.totalStudents}</span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40">
                  <span className="text-[10px] text-slate-500 dark:text-emerald-400 block font-semibold">Class Average</span>
                  <span className="font-poppins text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {selectedSub.classAverage}%
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40">
                  <span className="text-[10px] text-slate-500 dark:text-emerald-400 block font-semibold">Highest Score</span>
                  <span className="font-poppins text-lg font-black text-amber-600 dark:text-amber-400">
                    {selectedSub.highestScore}%
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40">
                  <span className="text-[10px] text-slate-500 dark:text-emerald-400 block font-semibold">Lowest Score</span>
                  <span className="font-poppins text-lg font-black text-rose-600 dark:text-rose-400">
                    {selectedSub.lowestScore}%
                  </span>
                </div>
              </div>

              {/* Student Marks Preview Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-emerald-800/40 overflow-hidden text-xs">
                <div className="p-3 bg-slate-100 dark:bg-[#021810] font-bold border-b border-slate-200 dark:border-emerald-800/40 flex justify-between">
                  <span>Student Score Entry Details</span>
                  <span className="text-emerald-600 dark:text-emerald-400">{subGrades.length} Records Loaded</span>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-emerald-950/60 max-h-48 overflow-y-auto font-mono">
                  {subGrades.map((g) => (
                    <div key={g.id} className="p-3 flex items-center justify-between">
                      <div>
                        <span className="font-bold text-slate-900 dark:text-white block font-sans">{g.studentName}</span>
                        <span className="text-[10px] text-slate-400">{g.admissionNo || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-slate-600 dark:text-emerald-300 text-[11px]">
                          CA: {((g.assignmentScore || 0) + g.ca1Score + g.ca2Score + (g.testScore || 0)).toFixed(0)} | Exam: {g.examScore}
                        </span>
                        <span className="font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {g.totalScore}% ({g.grade})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Prompt & Comments Area */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-slate-800 dark:text-emerald-300">
                  Administrator Review Comments / Correction Feedback:
                </label>
                <textarea
                  rows={3}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Enter feedback or comments for teacher (required when returning for correction or rejecting)..."
                  className="w-full p-3 rounded-2xl text-xs bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Action Buttons (Fixed) */}
            <div className="shrink-0 p-4 sm:p-5 flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 dark:border-emerald-800/60 bg-slate-50/50 dark:bg-[#021810]">
              <Button
                variant="danger"
                size="md"
                leftIcon={<XCircle className="w-4 h-4" />}
                onClick={() => {
                  setActionType('REJECT');
                  handleActionConfirm();
                }}
              >
                Reject Batch
              </Button>

              <Button
                variant="warning"
                size="md"
                leftIcon={<RotateCcw className="w-4 h-4" />}
                onClick={() => {
                  setActionType('RETURN');
                  handleActionConfirm();
                }}
              >
                Return for Correction
              </Button>

              <Button
                variant="primary"
                size="md"
                leftIcon={<CheckCircle className="w-4 h-4" />}
                onClick={() => {
                  setActionType('APPROVE');
                  handleActionConfirm();
                }}
              >
                Approve & Publish to Report Sheet
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
