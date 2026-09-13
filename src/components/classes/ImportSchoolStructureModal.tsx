'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  X,
  School,
  Users,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Loader2,
  ShieldCheck,
  Check,
} from 'lucide-react';
import {
  parseSchoolStructureExcelBuffer,
  validateSchoolStructureRows,
} from '@/lib/schoolStructureImporter';
import { ValidatedImportRow, ImportSchoolStructureSummary } from '@/types';

interface ImportSchoolStructureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ImportSchoolStructureModal({
  isOpen,
  onClose,
  onSuccess,
}: ImportSchoolStructureModalProps) {
  const { programmes, teachers, classes, importSchoolStructureBatch } = useApp();

  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Upload, 2: Preview & Map, 3: Success Summary
  const [file, setFile] = useState<File | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const [validatedRows, setValidatedRows] = useState<ValidatedImportRow[]>([]);
  const [emptyRowsCount, setEmptyRowsCount] = useState(0);
  const [validRowsCount, setValidRowsCount] = useState(0);
  const [warningRowsCount, setWarningRowsCount] = useState(0);
  const [errorRowsCount, setErrorRowsCount] = useState(0);

  const [filterTab, setFilterTab] = useState<'ALL' | 'VALID' | 'WARNING' | 'ERROR'>('ALL');
  const [importSummary, setImportSummary] = useState<ImportSchoolStructureSummary | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (uploadedFile: File) => {
    setFile(uploadedFile);
    setIsProcessingFile(true);

    try {
      const buffer = await uploadedFile.arrayBuffer();
      const rawRows = parseSchoolStructureExcelBuffer(buffer);
      const res = validateSchoolStructureRows(rawRows, programmes, teachers, classes);

      setValidatedRows(res.validatedRows);
      setEmptyRowsCount(res.emptyRowsCount);
      setValidRowsCount(res.validRowsCount);
      setWarningRowsCount(res.warningRowsCount);
      setErrorRowsCount(res.errorRowsCount);

      setStep(2);
    } catch (err: any) {
      alert(`Error reading Excel file: ${err?.message || 'Invalid file format'}`);
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Allow admin to manually map a missing teacher to an existing system teacher in preview
  const handleMapTeacher = (rowIndex: number, rawTeacherName: string, selectedTeacherId: string) => {
    const targetTeacher = teachers.find((t) => t.id === selectedTeacherId);

    setValidatedRows((prev) =>
      prev.map((row) => {
        if (row.rowIndex === rowIndex) {
          const updatedParsed = row.parsedTeachers.map((t) => {
            if (t.rawName === rawTeacherName) {
              return {
                ...t,
                matchedTeacherId: selectedTeacherId !== 'UNASSIGNED' ? selectedTeacherId : undefined,
                matchedTeacherName: targetTeacher ? targetTeacher.fullName : undefined,
                isNotFound: selectedTeacherId === 'UNASSIGNED',
              };
            }
            return t;
          });

          const stillHasMissing = updatedParsed.some((t) => t.isNotFound);
          return {
            ...row,
            parsedTeachers: updatedParsed,
            status: stillHasMissing ? 'WARNING' : 'VALID',
            statusMessage: stillHasMissing
              ? 'Teacher account not matched. Please resolve before import.'
              : 'Teacher assignment resolved successfully.',
          };
        }
        return row;
      })
    );
  };

  const handleConfirmImport = async () => {
    setIsImporting(true);
    try {
      const summary = await importSchoolStructureBatch(validatedRows);
      setImportSummary(summary);
      setStep(3);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      alert(`Import failed: ${err?.message || 'Unexpected error'}`);
    } finally {
      setIsImporting(false);
    }
  };

  const activeRowsToDisplay = validatedRows
    .filter((r) => !r.isEmptyRow)
    .filter((r) => {
      if (filterTab === 'ALL') return true;
      return r.status === filterTab;
    });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 font-poppins">
      <div className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-2xl sm:rounded-3xl w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header (Fixed) */}
        <div className="shrink-0 p-5 sm:p-6 bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black">School Structure Excel Importer</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[10px]">
                  Programmes • Subcategories • Classes • Teachers
                </span>
              </div>
              <p className="text-xs text-emerald-200/80">
                Upload "Markazu Classes and Teachers.xlsx" to validate and import school structure
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STEP 1: FILE UPLOAD */}
        {step === 1 && (
          <div className="flex-1 overflow-y-auto min-h-0 p-6 sm:p-8 space-y-6">
            <div className="rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 p-5 space-y-2">
              <div className="flex items-center gap-2 font-black text-sm text-emerald-900 dark:text-emerald-300">
                <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                Required Structure Column Headers
              </div>
              <p className="text-xs text-slate-700 dark:text-emerald-200/90 leading-relaxed">
                The Excel file must include these exact column headers: <strong>Programme</strong>, <strong>Subcategory (if any)</strong>, <strong>Class Name</strong>, <strong>Assigned Teacher</strong>, <strong>Subjects (Optional)</strong>, <strong>Notes</strong>.
              </p>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="border-2 border-dashed border-slate-300 dark:border-emerald-500/40 rounded-3xl p-8 text-center space-y-4 bg-slate-50 dark:bg-[#021810] hover:border-emerald-500 transition-colors"
            >
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                {isProcessingFile ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <Upload className="w-8 h-8" />
                )}
              </div>

              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Drag & Drop "Markazu Classes and Teachers.xlsx" here
                </h3>
                <p className="text-xs text-slate-500 dark:text-emerald-400/70 mt-1">
                  Supports .xlsx, .xls, and .csv files
                </p>
              </div>

              <div>
                <label className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg inline-flex items-center gap-2 cursor-pointer transition-all hover:scale-105">
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Browse Excel File</span>
                  <input
                    type="file"
                    accept=".xlsx, .xls, .csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Structure Summary Preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-500/20 space-y-1">
                <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <School className="w-4 h-4 text-emerald-500" /> Main Programmes
                </span>
                <p className="text-slate-600 dark:text-emerald-300/80">
                  Asuba & Maghrib, Super Markaz, Islamiyyah, Matan Aure
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-500/20 space-y-1">
                <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-500" /> Subcategories
                </span>
                <p className="text-slate-600 dark:text-emerald-300/80">
                  Asuba, Maghrib, Tahfiz (under Asuba & Maghrib)
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-500/20 space-y-1">
                <span className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-500" /> Multi-Teacher Support
                </span>
                <p className="text-slate-600 dark:text-emerald-300/80">
                  Handles multiple teachers per class & empty template rows automatically
                </p>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: PREVIEW & VALIDATION STEP */}
        {step === 2 && (
          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            {/* Status Counter Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20">
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-300">
                  Total Class Rows: {validatedRows.length - emptyRowsCount}
                </span>
                <span className="px-3 py-1 rounded-xl bg-slate-200 dark:bg-emerald-950 text-slate-700 dark:text-emerald-400">
                  Empty Rows Skipped: {emptyRowsCount}
                </span>
                {warningRowsCount > 0 && (
                  <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-800 dark:text-amber-300">
                    Teacher Mismatches: {warningRowsCount}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 font-extrabold text-xs hover:bg-slate-300 transition-all"
                >
                  Re-upload File
                </button>
                <button
                  onClick={handleConfirmImport}
                  disabled={isImporting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg flex items-center gap-2 transition-all hover:scale-105 disabled:opacity-50"
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Importing Structure...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Confirm & Import Structure</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-emerald-500/20 pb-3 text-xs font-bold">
              {[
                { id: 'ALL', label: `All Structure Rows (${validatedRows.length - emptyRowsCount})` },
                { id: 'VALID', label: `Valid (${validRowsCount})` },
                { id: 'WARNING', label: `Action Needed (${warningRowsCount})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilterTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl transition-all ${
                    filterTab === tab.id
                      ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-black'
                      : 'text-slate-500 dark:text-emerald-400/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Preview Table */}
            <div className="overflow-x-auto border border-slate-200 dark:border-emerald-500/30 rounded-2xl">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-emerald-500/20 bg-slate-100 dark:bg-[#021810] text-slate-500 dark:text-emerald-300/70 font-extrabold uppercase text-[10px]">
                    <th className="py-3 px-4">Row #</th>
                    <th className="py-3 px-4">Programme</th>
                    <th className="py-3 px-4">Subcategory</th>
                    <th className="py-3 px-4">Class Name</th>
                    <th className="py-3 px-4">Assigned Teacher(s)</th>
                    <th className="py-3 px-4">Subject(s)</th>
                    <th className="py-3 px-4">Status & Resolution</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-emerald-500/10">
                  {activeRowsToDisplay.map((row) => (
                    <tr
                      key={row.rowIndex}
                      className={`hover:bg-slate-50 dark:hover:bg-emerald-900/20 ${
                        row.status === 'WARNING' ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-500 dark:text-emerald-400/70">
                        Row {row.rowIndex}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {row.programmeName}
                      </td>
                      <td className="py-3.5 px-4">
                        {row.subcategory ? (
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
                            {row.subcategory}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-extrabold text-emerald-800 dark:text-emerald-200">
                        {row.className}
                      </td>

                      {/* Teachers Column with Inline Resolution Select */}
                      <td className="py-3.5 px-4 space-y-1">
                        {row.parsedTeachers.map((t, idx) => (
                          <div key={idx} className="flex flex-col gap-1">
                            {t.isNotFound ? (
                              <div className="flex flex-col gap-1">
                                <span className="text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 text-[11px]">
                                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                  Not Found: "{t.rawName}"
                                </span>

                                <select
                                  value={t.matchedTeacherId || 'UNASSIGNED'}
                                  onChange={(e) =>
                                    handleMapTeacher(row.rowIndex, t.rawName, e.target.value)
                                  }
                                  className="p-1.5 rounded-xl bg-white dark:bg-[#042419] border border-amber-400 text-xs font-bold text-slate-900 dark:text-white"
                                >
                                  <option value="UNASSIGNED">-- Select System Teacher --</option>
                                  {teachers.map((st) => (
                                    <option key={st.id} value={st.id}>
                                      {st.fullName} ({st.staffNo})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <span className="text-slate-800 dark:text-emerald-100 font-bold flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                {t.matchedTeacherName || t.rawName}
                              </span>
                            )}
                          </div>
                        ))}
                        {row.parsedTeachers.length === 0 && (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-bold text-slate-700 dark:text-emerald-200">
                        {row.parsedSubjects.join(', ') || <span className="text-slate-400">—</span>}
                      </td>

                      <td className="py-3.5 px-4">
                        {row.status === 'VALID' ? (
                          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-extrabold text-[10px] flex items-center gap-1 w-fit">
                            <CheckCircle2 className="w-3 h-3" /> Valid Entry
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold text-[10px] flex items-center gap-1 w-fit">
                            <AlertTriangle className="w-3 h-3" /> {row.statusMessage}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 3: SUCCESS SUMMARY STEP */}
        {step === 3 && importSummary && (
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-xl font-black text-slate-900 dark:text-white">
                School Structure Import Successful!
              </h3>
              <p className="text-xs text-slate-500 dark:text-emerald-300/80 mt-1">
                The school structure, subcategories, classes, teacher assignments, and subjects have been updated.
              </p>
            </div>

            {/* Metrics Breakdown Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-left">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30">
                <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400 block">
                  Programmes Verified
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                  {importSummary.programmesVerified}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30">
                <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400 block">
                  Subcategories Linked
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                  {importSummary.subcategoriesCount}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30">
                <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400 block">
                  Classes Imported
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                  {importSummary.classesImported}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30">
                <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400 block">
                  Teacher Assignments
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                  {importSummary.teacherAssignmentsCreated}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30">
                <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400 block">
                  Subjects Created
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                  {importSummary.subjectsCreated}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-100 dark:bg-emerald-950/20 border border-slate-200 dark:border-emerald-500/20">
                <span className="text-[10px] font-extrabold uppercase text-slate-500 dark:text-emerald-400/60 block">
                  Skipped Empty Rows
                </span>
                <span className="text-xl font-black text-slate-900 dark:text-white mt-1 block">
                  {importSummary.emptyRowsSkipped}
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-8 py-3 rounded-2xl bg-slate-900 dark:bg-emerald-900 hover:bg-slate-800 text-white font-black text-xs shadow-xl transition-all"
            >
              Done / Return to Classes Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
