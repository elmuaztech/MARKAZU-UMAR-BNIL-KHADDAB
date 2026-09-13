'use client';

import React, { useState, useId } from 'react';
import {
  X,
  Plus,
  Trash2,
  Copy,
  CheckCircle2,
  AlertCircle,
  Users,
  ArrowDown,
  Mail,
  Phone,
  School,
  GraduationCap,
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { Programme, SchoolClass } from '@/types';
import { generateTemporaryPassword } from '@/lib/security';

export interface BulkStudentRow {
  id: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE';
  programmeId: string;
  classId: string;
  admissionNo: string;
  studentEmail: string;
  guardianName: string;
  guardianPhone: string;
  guardianEmail: string;
  relationship: 'Father' | 'Mother' | 'Guardian';
  guardianOccupation: string;
}

interface BulkStudentGridModalProps {
  isOpen: boolean;
  onClose: () => void;
  availableProgrammes: Programme[];
  availableClasses: SchoolClass[];
}

export function BulkStudentGridModal({
  isOpen,
  onClose,
  availableProgrammes,
  availableClasses,
}: BulkStudentGridModalProps) {
  const { addStudent, addParent, parents, students, notify, addAuditLog, currentUser } = useApp();

  const createInitialRow = (index: number): BulkStudentRow => {
    const year = new Date().getFullYear();
    const rand = Math.floor(1000 + Math.random() * 9000);
    const defaultProg = availableProgrammes[0]?.id || '';
    const defaultClassesForProg = availableClasses.filter(
      (c) => !c.programmeId || c.programmeId === defaultProg
    );
    const defaultClass = defaultClassesForProg[0]?.id || availableClasses[0]?.id || '';

    return {
      id: `grid-row-${Date.now()}-${index}-${Math.random().toString(36).substr(2, 4)}`,
      fullName: '',
      gender: 'MALE',
      programmeId: defaultProg,
      classId: defaultClass,
      admissionNo: `MUBK-${year}-${rand}`,
      studentEmail: '',
      guardianName: '',
      guardianPhone: '',
      guardianEmail: '',
      relationship: 'Father',
      guardianOccupation: '',
    };
  };

  const [rows, setRows] = useState<BulkStudentRow[]>([
    createInitialRow(1),
    createInitialRow(2),
    createInitialRow(3),
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionErrors, setSubmissionErrors] = useState<{ rowIdx: number; msg: string }[]>([]);

  if (!isOpen) return null;

  // Add multiple rows helper
  const addRows = (count: number) => {
    const currentLen = rows.length;
    const newItems: BulkStudentRow[] = [];
    for (let i = 0; i < count; i++) {
      newItems.push(createInitialRow(currentLen + i + 1));
    }
    setRows((prev) => [...prev, ...newItems]);
  };

  // Remove individual row
  const removeRow = (id: string) => {
    if (rows.length <= 1) {
      notify({ type: 'warning', title: 'Minimum 1 Row', message: 'At least one student row must remain.' });
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  // Update field for a specific row
  const updateRowField = (id: string, field: keyof BulkStudentRow, value: any) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const updated = { ...r, [field]: value };
          // If programme changed, auto-select first matching class
          if (field === 'programmeId') {
            const matchingClasses = availableClasses.filter(
              (c) => !c.programmeId || c.programmeId === value
            );
            updated.classId = matchingClasses[0]?.id || '';
          }
          return updated;
        }
        return r;
      })
    );
  };

  // Copy Programme & Class from Row 1 down to all rows
  const handleFillDownAcademics = () => {
    if (rows.length === 0) return;
    const firstRow = rows[0];
    setRows((prev) =>
      prev.map((r, idx) =>
        idx === 0
          ? r
          : {
              ...r,
              programmeId: firstRow.programmeId,
              classId: firstRow.classId,
            }
      )
    );
    notify({
      type: 'info',
      title: 'Academics Filled Down',
      message: 'Copied Programme and Class from Row 1 to all rows below.',
    });
  };

  // Remove blank rows
  const handleRemoveBlankRows = () => {
    const filled = rows.filter(
      (r) => r.fullName.trim() || r.guardianName.trim() || r.guardianEmail.trim()
    );
    if (filled.length === 0) {
      setRows([createInitialRow(1)]);
    } else {
      setRows(filled);
    }
  };

  // Validate & Submit Batch
  const handleBatchEnroll = async () => {
    setSubmissionErrors([]);
    const errors: { rowIdx: number; msg: string }[] = [];

    // Filter non-empty rows
    const activeRows = rows.filter(
      (r) => r.fullName.trim() || r.guardianName.trim() || r.guardianEmail.trim()
    );

    if (activeRows.length === 0) {
      notify({ type: 'warning', title: 'No Student Data', message: 'Please enter at least one student with required details.' });
      return;
    }

    activeRows.forEach((r, idx) => {
      const displayIdx = idx + 1;
      if (!r.fullName.trim()) {
        errors.push({ rowIdx: displayIdx, msg: `Row #${displayIdx}: Student Full Name is required.` });
      }
      if (!r.classId) {
        errors.push({ rowIdx: displayIdx, msg: `Row #${displayIdx}: Class selection is required.` });
      }
      if (!r.guardianName.trim()) {
        errors.push({ rowIdx: displayIdx, msg: `Row #${displayIdx}: Guardian Full Name is required.` });
      }
      if (!r.guardianPhone.trim()) {
        errors.push({ rowIdx: displayIdx, msg: `Row #${displayIdx}: Guardian Phone is required.` });
      }
      if (!r.guardianEmail.trim()) {
        errors.push({ rowIdx: displayIdx, msg: `Row #${displayIdx}: Guardian Email is mandatory to create parent portal account.` });
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.guardianEmail.trim())) {
        errors.push({ rowIdx: displayIdx, msg: `Row #${displayIdx}: Invalid Guardian Email format.` });
      }
      if (r.studentEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.studentEmail.trim())) {
        errors.push({ rowIdx: displayIdx, msg: `Row #${displayIdx}: Invalid Student Email format.` });
      }
    });

    if (errors.length > 0) {
      setSubmissionErrors(errors);
      notify({
        type: 'error',
        title: 'Validation Errors Found',
        message: `Please correct ${errors.length} error(s) highlighted below.`,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      let enrolledCount = 0;
      let parentAccountsCreated = 0;
      let studentAccountsCreated = 0;

      const parentSessionCache = new Map<string, string>(); // Email -> Parent ID

      for (const row of activeRows) {
        const cleanGuardianEmail = row.guardianEmail.trim().toLowerCase();
        const cleanGuardianPhone = row.guardianPhone.trim();
        const cleanGuardianName = row.guardianName.trim();
        const cleanStudentEmail = row.studentEmail.trim().toLowerCase();

        let targetGuardianId = parentSessionCache.get(cleanGuardianEmail);

        if (!targetGuardianId) {
          // Check if parent already exists in database/context
          const existingParent = parents.find(
            (p) =>
              p.email.toLowerCase() === cleanGuardianEmail ||
              p.phone === cleanGuardianPhone
          );

          if (existingParent) {
            targetGuardianId = existingParent.id;
            parentSessionCache.set(cleanGuardianEmail, existingParent.id);
          } else {
            // Provision brand new Parent account with temporary password & welcome message
            const newParentId = `usr-parent-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
            const tempParentPassword = generateTemporaryPassword();

            await addParent(
              {
                fullName: cleanGuardianName,
                email: cleanGuardianEmail,
                phone: cleanGuardianPhone,
                occupation: row.guardianOccupation || 'Parent / Guardian',
                address: 'Kano, Nigeria',
              },
              tempParentPassword
            );

            targetGuardianId = newParentId;
            parentSessionCache.set(cleanGuardianEmail, newParentId);
            parentAccountsCreated++;
          }
        }

        // Target Programme and Class
        const targetProg = availableProgrammes.find((p) => p.id === row.programmeId);
        const targetClass = availableClasses.find((c) => c.id === row.classId);

        // Enroll Student
        const studentAdm = row.admissionNo.trim() || `MUBK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        await addStudent({
          admissionNo: studentAdm,
          fullName: row.fullName.trim(),
          gender: row.gender,
          email: cleanStudentEmail || undefined,
          dob: '2014-01-01',
          dateEnrolled: new Date().toISOString().split('T')[0],
          programmeId: row.programmeId,
          programmeName: targetProg?.programme_name || 'Markaz Academic Program',
          classId: row.classId,
          className: targetClass?.name || 'Class',
          guardianId: targetGuardianId || `usr-parent-${Date.now()}`,
          guardianName: cleanGuardianName,
          guardianPhone: cleanGuardianPhone,
          parentName: cleanGuardianName,
          parentPhone: cleanGuardianPhone,
          parentEmail: cleanGuardianEmail,
          status: 'ACTIVE',
          hifzProgress: {
            currentJuz: 1,
            juzCompleted: 0,
            currentSurah: 'Surah Al-Fatihah',
            currentAyah: 1,
            completedSurahsCount: 0,
            tajweedRating: 5,
            sabkiRating: 5,
            manzilRating: 5,
          },
          akhlaqRating: 'EXCELLENT',
        });

        enrolledCount++;
        if (cleanStudentEmail) {
          studentAccountsCreated++;
        }
      }

      notify({
        type: 'success',
        title: 'Bulk Enrollment Complete!',
        message: `Enrolled ${enrolledCount} students successfully. Provisioned ${parentAccountsCreated} new parent portal accounts and dispatched welcome credentials.`,
      });

      addAuditLog({
        action: 'STUDENT_CREATED',
        performedBy: currentUser.name,
        userRole: currentUser.role,
        details: `Interactive bulk enrolled ${enrolledCount} students (${parentAccountsCreated} parent accounts created)`,
        ipAddress: '197.210.227.14',
        status: 'SUCCESS',
      });

      onClose();
    } catch (err: any) {
      console.error('[BULK_GRID_ENROLL_ERROR]', err);
      notify({
        type: 'error',
        title: 'Enrollment Encountered An Issue',
        message: err.message || 'Could not complete all enrollments.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-[96vw] xl:max-w-7xl h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-[#041a13] border border-slate-200 dark:border-emerald-500/30 shadow-2xl overflow-hidden text-slate-900 dark:text-gray-100">
        {/* Top Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 sm:p-5 border-b border-slate-100 dark:border-emerald-800/40 bg-slate-50/50 dark:bg-emerald-950/40">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black uppercase tracking-tight text-slate-900 dark:text-white">
                  Interactive Bulk Student Enrollment
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {rows.length} {rows.length === 1 ? 'Row' : 'Rows'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-emerald-300/70">
                Direct in-table registration. Guardian email is mandatory to create Parent Portal login accounts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-emerald-900/40 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Toolbar (Add Rows, Fill Down, Cleanup) */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white dark:bg-[#052118] border-b border-slate-100 dark:border-emerald-800/30 text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-bold text-slate-600 dark:text-emerald-300 mr-1 text-[11px]">Add Rows:</span>
            <button
              type="button"
              onClick={() => addRows(1)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 1
            </button>
            <button
              type="button"
              onClick={() => addRows(5)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 5
            </button>
            <button
              type="button"
              onClick={() => addRows(10)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 10
            </button>
            <button
              type="button"
              onClick={() => addRows(20)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 20
            </button>
            <button
              type="button"
              onClick={() => addRows(30)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 30
            </button>
            <button
              type="button"
              onClick={() => addRows(50)}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/20 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 50
            </button>
            <button
              type="button"
              onClick={() => addRows(100)}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-black border border-amber-500/30 transition-all flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> 100
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleFillDownAcademics}
              title="Copy Programme and Class from Row 1 down to all rows"
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-emerald-900/40 hover:bg-slate-200 dark:hover:bg-emerald-800/40 text-slate-700 dark:text-emerald-200 font-bold flex items-center gap-1.5 transition-all"
            >
              <ArrowDown className="w-3.5 h-3.5 text-emerald-500" />
              <span>Fill Down Academics</span>
            </button>
            <button
              type="button"
              onClick={handleRemoveBlankRows}
              className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-emerald-900/40 hover:bg-slate-200 dark:hover:bg-emerald-800/40 text-slate-700 dark:text-emerald-200 font-bold transition-all"
            >
              Clean Empty Rows
            </button>
          </div>
        </div>

        {/* Error Callout Banner */}
        {submissionErrors.length > 0 && (
          <div className="p-3 mx-4 mt-3 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Please review the following requirements before submitting:</span>
            </div>
            <ul className="list-disc pl-6 space-y-0.5 max-h-24 overflow-y-auto font-mono text-[11px]">
              {submissionErrors.slice(0, 5).map((err, i) => (
                <li key={i}>{err.msg}</li>
              ))}
              {submissionErrors.length > 5 && (
                <li>... and {submissionErrors.length - 5} more error(s).</li>
              )}
            </ul>
          </div>
        )}

        {/* Spreadsheet Table Grid Container */}
        <div className="flex-1 overflow-auto p-4">
          <div className="min-w-[1400px] border border-slate-200 dark:border-emerald-800/40 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-emerald-900/90 text-white font-black text-[11px] uppercase tracking-wider sticky top-0 z-10">
                <tr>
                  <th className="p-3 w-12 text-center border-b border-emerald-800">#</th>
                  <th className="p-3 min-w-[180px] border-b border-emerald-800">Student Full Name *</th>
                  <th className="p-3 min-w-[100px] border-b border-emerald-800">Gender *</th>
                  <th className="p-3 min-w-[170px] border-b border-emerald-800">Programme *</th>
                  <th className="p-3 min-w-[160px] border-b border-emerald-800">Class *</th>
                  <th className="p-3 min-w-[140px] border-b border-emerald-800">Admission No</th>
                  <th className="p-3 min-w-[180px] border-b border-emerald-800">Student Email (Optional)</th>
                  <th className="p-3 min-w-[180px] border-b border-emerald-800 bg-emerald-950/70">Guardian Full Name *</th>
                  <th className="p-3 min-w-[140px] border-b border-emerald-800 bg-emerald-950/70">Guardian Phone *</th>
                  <th className="p-3 min-w-[200px] border-b border-emerald-800 bg-emerald-950/70">Guardian Email * (Mandatory)</th>
                  <th className="p-3 min-w-[120px] border-b border-emerald-800 bg-emerald-950/70">Relationship</th>
                  <th className="p-3 min-w-[140px] border-b border-emerald-800">Occupation</th>
                  <th className="p-3 w-12 text-center border-b border-emerald-800">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-emerald-900/40 bg-white dark:bg-[#06241a]">
                {rows.map((row, idx) => {
                  const filteredClasses = availableClasses.filter(
                    (c) => !c.programmeId || c.programmeId === row.programmeId
                  );

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/30 transition-colors"
                    >
                      {/* Row Index */}
                      <td className="p-2 text-center font-mono font-bold text-slate-400 dark:text-emerald-500 text-xs">
                        {idx + 1}
                      </td>

                      {/* Student Full Name */}
                      <td className="p-2">
                        <input
                          type="text"
                          required
                          value={row.fullName}
                          onChange={(e) => updateRowField(row.id, 'fullName', e.target.value)}
                          placeholder="e.g. Ibrahim Abubakar"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-emerald-800/60 bg-transparent text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </td>

                      {/* Gender */}
                      <td className="p-2">
                        <select
                          value={row.gender}
                          onChange={(e) => updateRowField(row.id, 'gender', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-emerald-800/60 bg-transparent text-slate-900 dark:text-white font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="MALE" className="dark:bg-emerald-950">MALE</option>
                          <option value="FEMALE" className="dark:bg-emerald-950">FEMALE</option>
                        </select>
                      </td>

                      {/* Programme */}
                      <td className="p-2">
                        <select
                          value={row.programmeId}
                          onChange={(e) => updateRowField(row.id, 'programmeId', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-emerald-800/60 bg-transparent text-slate-900 dark:text-white text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        >
                          {availableProgrammes.map((p) => (
                            <option key={p.id} value={p.id} className="dark:bg-emerald-950">
                              {p.programme_name_english || p.programme_name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Class */}
                      <td className="p-2">
                        <select
                          value={row.classId}
                          onChange={(e) => updateRowField(row.id, 'classId', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-emerald-800/60 bg-transparent text-slate-900 dark:text-white text-xs font-semibold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        >
                          {filteredClasses.map((c) => (
                            <option key={c.id} value={c.id} className="dark:bg-emerald-950">
                              {c.name || c.class_name_english}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Admission Number */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.admissionNo}
                          onChange={(e) => updateRowField(row.id, 'admissionNo', e.target.value)}
                          placeholder="MUBK-2026-XXXX"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-emerald-800/60 bg-transparent text-slate-900 dark:text-white font-mono text-[11px] focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </td>

                      {/* Student Email (Optional) */}
                      <td className="p-2">
                        <input
                          type="email"
                          value={row.studentEmail}
                          onChange={(e) => updateRowField(row.id, 'studentEmail', e.target.value)}
                          placeholder="student@example.com"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-emerald-800/60 bg-transparent text-slate-900 dark:text-white text-[11px] focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </td>

                      {/* Guardian Full Name */}
                      <td className="p-2 bg-emerald-50/20 dark:bg-emerald-950/20">
                        <input
                          type="text"
                          required
                          value={row.guardianName}
                          onChange={(e) => updateRowField(row.id, 'guardianName', e.target.value)}
                          placeholder="e.g. Alhaji Umar"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-emerald-800/60 bg-transparent text-slate-900 dark:text-white font-medium focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </td>

                      {/* Guardian Phone */}
                      <td className="p-2 bg-emerald-50/20 dark:bg-emerald-950/20">
                        <input
                          type="tel"
                          required
                          value={row.guardianPhone}
                          onChange={(e) => updateRowField(row.id, 'guardianPhone', e.target.value)}
                          placeholder="08031234567"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-emerald-800/60 bg-transparent text-slate-900 dark:text-white font-mono text-[11px] focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </td>

                      {/* Guardian Email (Mandatory) */}
                      <td className="p-2 bg-emerald-50/20 dark:bg-emerald-950/20">
                        <input
                          type="email"
                          required
                          value={row.guardianEmail}
                          onChange={(e) => updateRowField(row.id, 'guardianEmail', e.target.value)}
                          placeholder="guardian.parent@gmail.com"
                          className="w-full px-2.5 py-1.5 rounded-lg border border-amber-500/40 dark:border-amber-400/40 bg-transparent text-slate-900 dark:text-white text-[11px] font-semibold focus:ring-1 focus:ring-amber-500 focus:outline-none"
                        />
                      </td>

                      {/* Relationship */}
                      <td className="p-2 bg-emerald-50/20 dark:bg-emerald-950/20">
                        <select
                          value={row.relationship}
                          onChange={(e) => updateRowField(row.id, 'relationship', e.target.value)}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-emerald-800/60 bg-transparent text-slate-900 dark:text-white text-xs font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        >
                          <option value="Father" className="dark:bg-emerald-950">Father</option>
                          <option value="Mother" className="dark:bg-emerald-950">Mother</option>
                          <option value="Guardian" className="dark:bg-emerald-950">Guardian</option>
                        </select>
                      </td>

                      {/* Occupation */}
                      <td className="p-2">
                        <input
                          type="text"
                          value={row.guardianOccupation}
                          onChange={(e) => updateRowField(row.id, 'guardianOccupation', e.target.value)}
                          placeholder="Businessman, Civil Servant..."
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-emerald-800/60 bg-transparent text-slate-900 dark:text-white text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                        />
                      </td>

                      {/* Delete Row Button */}
                      <td className="p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(row.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition-colors"
                          title="Delete Row"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Submission Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-5 border-t border-slate-100 dark:border-emerald-800/40 bg-slate-50/50 dark:bg-emerald-950/40">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>
              All parents will receive a Welcome email with temporary login credentials to access the Parent Portal.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-emerald-800/40 hover:bg-slate-100 dark:hover:bg-emerald-900/40 text-slate-700 dark:text-emerald-200 font-bold text-xs transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleBatchEnroll}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
              <span>Enroll All Students ({rows.filter((r) => r.fullName.trim()).length || rows.length})</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
