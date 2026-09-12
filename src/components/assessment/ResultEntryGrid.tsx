'use client';

import React, { useState, useEffect } from 'react';
import { GradeRecord, AssessmentConfig, Student } from '@/types';
import { Button } from '@/components/ui/ButtonSystem';
import { exportResultGridToCSV, printOrExportPDFReference } from '@/lib/exportUtils';
import {
  Save,
  Send,
  Download,
  Printer,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface ResultEntryGridProps {
  students: Student[];
  initialGrades: GradeRecord[];
  config: AssessmentConfig;
  programmeName: string;
  className: string;
  subjectName: string;
  term: string;
  session: string;
  teacherName: string;
  onSaveDraft: (updatedGrades: GradeRecord[]) => void;
  onOpenPreview: (updatedGrades: GradeRecord[]) => void;
}

export function ResultEntryGrid({
  students,
  initialGrades,
  config,
  programmeName,
  className,
  subjectName,
  term,
  session,
  teacherName,
  onSaveDraft,
  onOpenPreview,
}: ResultEntryGridProps) {
  // Local state for interactive spreadsheet editing
  const [gridGrades, setGridGrades] = useState<GradeRecord[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Sync initialGrades or build rows for enrolled students
  useEffect(() => {
    const rows: GradeRecord[] = students.map((std) => {
      const existing = initialGrades.find((g) => g.studentId === std.id);
      if (existing) {
        return existing;
      }
      return {
        id: `grd-temp-${std.id}`,
        studentId: std.id,
        studentName: std.fullName,
        admissionNo: std.admissionNo,
        programmeId: std.programmeId,
        programmeName: std.programmeName,
        classId: std.classId,
        className: std.className,
        subjectId: '',
        subjectName,
        term,
        session,
        assignmentScore: 0,
        ca1Score: 0,
        ca2Score: 0,
        testScore: 0,
        projectScore: 0,
        practicalScore: 0,
        examScore: 0,
        totalScore: 0,
        grade: 'F',
        remarks: 'Satisfactory effort.',
        status: 'DRAFT',
      };
    });

    setGridGrades(rows);
  }, [students, initialGrades, subjectName, term, session]);

  // Helper to calculate total, grade, remark
  const calculateScore = (record: Partial<GradeRecord>) => {
    let total = 0;
    if (config.enableAssignment) total += Number(record.assignmentScore || 0);
    if (config.enableCa1) total += Number(record.ca1Score || 0);
    if (config.enableCa2) total += Number(record.ca2Score || 0);
    if (config.enableTest) total += Number(record.testScore || 0);
    if (config.enableProject) total += Number(record.projectScore || 0);
    if (config.enablePractical) total += Number(record.practicalScore || 0);
    if (config.enableExam) total += Number(record.examScore || 0);

    let calculatedGrade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    let calculatedRemark = 'Fail';

    for (const item of config.gradingScale) {
      if (total >= item.minScore && total <= item.maxScore) {
        calculatedGrade = item.grade;
        calculatedRemark = item.remark;
        break;
      }
    }

    return { totalScore: Math.min(100, Math.max(0, total)), grade: calculatedGrade, remarks: calculatedRemark };
  };

  // Score Change Handler
  const handleScoreChange = (
    studentId: string,
    field: keyof GradeRecord,
    val: number | string,
    maxLimit?: number
  ) => {
    const numVal = Number(val);
    const errKey = `${studentId}-${field}`;

    // Validate score limits
    if (maxLimit !== undefined && (numVal < 0 || numVal > maxLimit)) {
      setValidationErrors((prev) => ({
        ...prev,
        [errKey]: `Score cannot be less than 0 or exceed maximum of ${maxLimit}`,
      }));
    } else {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[errKey];
        return copy;
      });
    }

    setGridGrades((prev) =>
      prev.map((item) => {
        if (item.studentId === studentId) {
          const updated = { ...item, [field]: numVal };
          const calc = calculateScore(updated);
          return { ...updated, ...calc };
        }
        return item;
      })
    );
  };

  const handleRemarkChange = (studentId: string, val: string) => {
    setGridGrades((prev) =>
      prev.map((item) => (item.studentId === studentId ? { ...item, remarks: val } : item))
    );
  };

  const missingScoresCount = gridGrades.filter(
    (g) => (g.ca1Score === 0 && config.enableCa1) || (g.examScore === 0 && config.enableExam)
  ).length;

  const errorCount = Object.keys(validationErrors).length;

  return (
    <div className="space-y-4 font-poppins">
      {/* Header Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
            <FileSpreadsheet className="w-4 h-4" /> Score Entry Grid • {subjectName}
          </div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white mt-1">
            {className} ({students.length} Enrolled Students)
          </h2>
          <p className="text-xs text-slate-500 dark:text-emerald-300/80">
            Session: {session} • Term: {term} • Evaluator: {teacherName}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-initial">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download className="w-4 h-4" />}
            onClick={() => exportResultGridToCSV(gridGrades, programmeName, className, subjectName, session, term, config)}
          >
            CSV
          </Button>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Printer className="w-4 h-4" />}
            onClick={() => printOrExportPDFReference(gridGrades, programmeName, className, subjectName, session, term, teacherName, config)}
          >
            PDF Reference
          </Button>

          <Button
            variant="secondary"
            size="sm"
            leftIcon={<Save className="w-4 h-4" />}
            onClick={() => onSaveDraft(gridGrades)}
          >
            Save Draft
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Send className="w-4 h-4" />}
            disabled={errorCount > 0}
            onClick={() => onOpenPreview(gridGrades)}
          >
            Preview & Submit
          </Button>
        </div>
      </div>

      {/* Validation Warning Alert */}
      {errorCount > 0 && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center justify-between font-semibold">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-500" />
            <span>Found {errorCount} validation errors exceeding max component limits. Please fix highlighted fields before submitting.</span>
          </div>
        </div>
      )}

      {missingScoresCount > 0 && errorCount === 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs flex items-center justify-between font-semibold">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            <span>Note: {missingScoresCount} student records have zero scores entered. Verify before final approval submission.</span>
          </div>
        </div>
      )}

      {/* Interactive Spreadsheet Data Table */}
      <div className="rounded-2xl sm:rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl overflow-x-auto">
        <table className="w-full min-w-[850px] text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-[#021810] text-slate-700 dark:text-emerald-300 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-emerald-800/40">
              <th className="p-3 text-center">#</th>
              <th className="p-3">Admission No</th>
              <th className="p-3">Student Name</th>
              {config.enableAssignment && <th className="p-3 text-center">Assign ({config.maxAssignment})</th>}
              {config.enableCa1 && <th className="p-3 text-center">CA1 ({config.maxCa1})</th>}
              {config.enableCa2 && <th className="p-3 text-center">CA2 ({config.maxCa2})</th>}
              {config.enableTest && <th className="p-3 text-center">Test ({config.maxTest})</th>}
              {config.enableProject && <th className="p-3 text-center">Project ({config.maxProject})</th>}
              {config.enablePractical && <th className="p-3 text-center">Practical ({config.maxPractical})</th>}
              {config.enableExam && <th className="p-3 text-center">Exam ({config.maxExam})</th>}
              <th className="p-3 text-center">Total (100)</th>
              <th className="p-3 text-center">Grade</th>
              <th className="p-3">Performance Remark</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-emerald-950/60 font-medium">
            {gridGrades.map((record, index) => {
              const hasErr = Object.keys(validationErrors).some((k) => k.startsWith(record.studentId));
              return (
                <tr
                  key={record.studentId}
                  className={`hover:bg-slate-50 dark:hover:bg-emerald-950/40 transition-colors ${
                    hasErr ? 'bg-rose-500/5' : ''
                  }`}
                >
                  <td className="p-3 text-center text-slate-400">{index + 1}</td>
                  <td className="p-3 font-mono font-bold text-slate-700 dark:text-emerald-300">
                    {record.admissionNo || 'N/A'}
                  </td>
                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                    {record.studentName}
                  </td>

                  {/* Assignment Field */}
                  {config.enableAssignment && (
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={config.maxAssignment}
                        value={record.assignmentScore ?? 0}
                        onChange={(e) =>
                          handleScoreChange(record.studentId, 'assignmentScore', e.target.value, config.maxAssignment)
                        }
                        className={`w-16 p-2 rounded-xl text-center font-bold bg-slate-50 dark:bg-[#021810] border ${
                          validationErrors[`${record.studentId}-assignmentScore`]
                            ? 'border-rose-500 text-rose-500 focus:ring-rose-500'
                            : 'border-slate-200 dark:border-emerald-800/40 text-slate-900 dark:text-white'
                        }`}
                      />
                    </td>
                  )}

                  {/* CA1 Field */}
                  {config.enableCa1 && (
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={config.maxCa1}
                        value={record.ca1Score}
                        onChange={(e) =>
                          handleScoreChange(record.studentId, 'ca1Score', e.target.value, config.maxCa1)
                        }
                        className={`w-16 p-2 rounded-xl text-center font-bold bg-slate-50 dark:bg-[#021810] border ${
                          validationErrors[`${record.studentId}-ca1Score`]
                            ? 'border-rose-500 text-rose-500 focus:ring-rose-500'
                            : 'border-slate-200 dark:border-emerald-800/40 text-slate-900 dark:text-white'
                        }`}
                      />
                    </td>
                  )}

                  {/* CA2 Field */}
                  {config.enableCa2 && (
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={config.maxCa2}
                        value={record.ca2Score}
                        onChange={(e) =>
                          handleScoreChange(record.studentId, 'ca2Score', e.target.value, config.maxCa2)
                        }
                        className={`w-16 p-2 rounded-xl text-center font-bold bg-slate-50 dark:bg-[#021810] border ${
                          validationErrors[`${record.studentId}-ca2Score`]
                            ? 'border-rose-500 text-rose-500 focus:ring-rose-500'
                            : 'border-slate-200 dark:border-emerald-800/40 text-slate-900 dark:text-white'
                        }`}
                      />
                    </td>
                  )}

                  {/* Test Field */}
                  {config.enableTest && (
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={config.maxTest}
                        value={record.testScore ?? 0}
                        onChange={(e) =>
                          handleScoreChange(record.studentId, 'testScore', e.target.value, config.maxTest)
                        }
                        className={`w-16 p-2 rounded-xl text-center font-bold bg-slate-50 dark:bg-[#021810] border ${
                          validationErrors[`${record.studentId}-testScore`]
                            ? 'border-rose-500 text-rose-500 focus:ring-rose-500'
                            : 'border-slate-200 dark:border-emerald-800/40 text-slate-900 dark:text-white'
                        }`}
                      />
                    </td>
                  )}

                  {/* Project Field */}
                  {config.enableProject && (
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={config.maxProject}
                        value={record.projectScore ?? 0}
                        onChange={(e) =>
                          handleScoreChange(record.studentId, 'projectScore', e.target.value, config.maxProject)
                        }
                        className={`w-16 p-2 rounded-xl text-center font-bold bg-slate-50 dark:bg-[#021810] border ${
                          validationErrors[`${record.studentId}-projectScore`]
                            ? 'border-rose-500 text-rose-500 focus:ring-rose-500'
                            : 'border-slate-200 dark:border-emerald-800/40 text-slate-900 dark:text-white'
                        }`}
                      />
                    </td>
                  )}

                  {/* Practical Field */}
                  {config.enablePractical && (
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={config.maxPractical}
                        value={record.practicalScore ?? 0}
                        onChange={(e) =>
                          handleScoreChange(record.studentId, 'practicalScore', e.target.value, config.maxPractical)
                        }
                        className={`w-16 p-2 rounded-xl text-center font-bold bg-slate-50 dark:bg-[#021810] border ${
                          validationErrors[`${record.studentId}-practicalScore`]
                            ? 'border-rose-500 text-rose-500 focus:ring-rose-500'
                            : 'border-slate-200 dark:border-emerald-800/40 text-slate-900 dark:text-white'
                        }`}
                      />
                    </td>
                  )}

                  {/* Exam Field */}
                  {config.enableExam && (
                    <td className="p-2 text-center">
                      <input
                        type="number"
                        min={0}
                        max={config.maxExam}
                        value={record.examScore}
                        onChange={(e) =>
                          handleScoreChange(record.studentId, 'examScore', e.target.value, config.maxExam)
                        }
                        className={`w-18 p-2 rounded-xl text-center font-black bg-slate-50 dark:bg-[#021810] border ${
                          validationErrors[`${record.studentId}-examScore`]
                            ? 'border-rose-500 text-rose-500 focus:ring-rose-500'
                            : 'border-slate-200 dark:border-emerald-800/40 text-slate-900 dark:text-white'
                        }`}
                      />
                    </td>
                  )}

                  {/* Live Total Score */}
                  <td className="p-3 text-center">
                    <span className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                      {record.totalScore}%
                    </span>
                  </td>

                  {/* Live Letter Grade */}
                  <td className="p-3 text-center">
                    <span
                      className={`px-2.5 py-1 rounded-xl font-black border text-xs ${
                        record.grade === 'A'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                          : record.grade === 'B'
                          ? 'bg-sky-500/10 text-sky-600 border-sky-500/30'
                          : record.grade === 'C'
                          ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                      }`}
                    >
                      {record.grade}
                    </span>
                  </td>

                  {/* Remarks Input */}
                  <td className="p-2">
                    <input
                      type="text"
                      value={record.remarks}
                      onChange={(e) => handleRemarkChange(record.studentId, e.target.value)}
                      className="w-full p-2 rounded-xl text-xs bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 text-slate-900 dark:text-white"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
