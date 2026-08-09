'use client';

import React, { useState } from 'react';
import { useApp } from '../../../lib/context';
import {
  UserCheck,
  Users,
  ShieldCheck,
  Mail,
  Phone,
  BookOpen,
  Award,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit,
  X,
  Download,
  CheckCircle2,
  ShieldAlert,
} from 'lucide-react';
import { Teacher } from '../../../types';
import { BilingualText } from '@/components/ui/BilingualText';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormField';

export default function TeachersPage() {
  const { teachers, users, classes, programmes, subjects, addTeacher, bulkImportTeachers, updateTeacher, deleteTeacher, currentUser, showConfirm, notify } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [specializationFilter, setSpecializationFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  // Add Form State
  const [fullNameEnglish, setFullNameEnglish] = useState('');
  const [fullNameArabic, setFullNameArabic] = useState('');
  const [staffNo, setStaffNo] = useState(`TCH-${Math.floor(100 + Math.random() * 900)}`);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [customPassword, setCustomPassword] = useState('');
  const [selectedProgrammes, setSelectedProgrammes] = useState<string[]>(['prog-02']);
  const [selectedClasses, setSelectedClasses] = useState<string[]>(['cls-tahfiz-1']);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(["Qur'an"]);

  // Bulk CSV State
  const [bulkPreview, setBulkPreview] = useState<Omit<Teacher, 'id'>[]>([]);
  const [validationErrors, setValidationErrors] = useState<{
    rowNumber: number;
    staffId: string;
    name: string;
    email: string;
    errors: string[];
  }[]>([]);
  const [importSummary, setImportSummary] = useState<{
    teachersImported: number;
    teachersUpdated: number;
    duplicateRecords: number;
    assignmentsCreated: number;
    emailsSent: number;
    failedRecords: number;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Edit Form State
  const [editFullNameEnglish, setEditFullNameEnglish] = useState('');
  const [editFullNameArabic, setEditFullNameArabic] = useState('');
  const [editStaffNo, setEditStaffNo] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editSelectedProgrammes, setEditSelectedProgrammes] = useState<string[]>([]);
  const [editSelectedClasses, setEditSelectedClasses] = useState<string[]>([]);

  const toggleArrayItem = (item: string, array: string[], setArray: (arr: string[]) => void) => {
    if (array.includes(item)) {
      setArray(array.filter((i) => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const isAdmin = currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN';

  const filteredTeachers = teachers.filter((t) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      (t.full_name_english || t.fullName || '').toLowerCase().includes(query) ||
      t.staffNo.toLowerCase().includes(query) ||
      t.email.toLowerCase().includes(query);

    return matchesSearch;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullNameEnglish || !email || !phone) return;

    addTeacher(
      {
        staffNo: staffNo || `TCH-${Math.floor(100 + Math.random() * 900)}`,
        full_name_english: fullNameEnglish.trim(),
        full_name_arabic: fullNameArabic.trim(),
        fullName: fullNameEnglish.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        programmeIds: selectedProgrammes.length ? selectedProgrammes : ['prog-02'],
        classesAssigned: selectedClasses.length ? selectedClasses : ['cls-tahfiz-1'],
        subjectsAssigned: selectedSubjects.length ? selectedSubjects : ["Qur'an"],
        dateJoined: new Date().toISOString().split('T')[0],
        status: 'ACTIVE',
      },
      customPassword.trim() || undefined
    );

    notify({
      type: 'success',
      title: 'Teacher Registered',
      message: `Account created for ${fullNameEnglish}. Welcome email with login credentials has been sent!`,
    });

    setFullNameEnglish('');
    setFullNameArabic('');
    setEmail('');
    setPhone('');
    setCustomPassword('');
    setShowAddModal(false);
  };

  const handleDownloadTemplate = () => {
    const headers = "Staff ID,Full Name (English),Phone Number,Email Address,Assigned Programmes,Assigned Classes,Assigned Subjects\n";
    const sample = "MU-2026-001,Ustaz Abubakar Al-Kanawi,+2348031234567,abubakar@markazuumar.edu.ng,prog-02;prog-01,cls-tahfiz-1;Tahfiz Halqa 1,Qur'an;Hadith\n";
    const blob = new Blob([headers + sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'teachers_bulk_template.csv';
    a.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (!text) return;

      const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
      if (lines.length <= 1) {
        notify({ type: 'warning', title: 'Empty CSV', message: 'CSV file must contain a header row and at least 1 data row.' });
        return;
      }

      const parsed: Omit<Teacher, 'id'>[] = [];
      const errors: { rowNumber: number; staffId: string; name: string; email: string; errors: string[] }[] = [];
      const seenStaffNos = new Set<string>();
      const seenEmails = new Set<string>();

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((col) => col.trim().replace(/^["']|["']$/g, ''));
        const rowNum = i + 1;
        const rowErrors: string[] = [];

        const staffId = row[0] || '';
        const fullName = row[1] || '';
        const phoneNo = row[2] || '+234 800 000 0000';
        const emailAddr = row[3] ? row[3].toLowerCase() : '';
        const progStr = row[4] || '';
        const classStr = row[5] || '';
        const subjStr = row[6] || '';

        if (!staffId) rowErrors.push('Missing Staff ID');
        if (!fullName) rowErrors.push('Missing Full Name');
        if (!emailAddr) rowErrors.push('Missing Email Address');

        // Check Duplicate Staff ID
        if (
          staffId &&
          (seenStaffNos.has(staffId.toLowerCase()) || teachers.some((t) => t.staffNo.toLowerCase() === staffId.toLowerCase()))
        ) {
          rowErrors.push(`Duplicate Staff ID "${staffId}" (Already exists in database or file)`);
        }
        if (staffId) seenStaffNos.add(staffId.toLowerCase());

        // Check Duplicate Email
        if (
          emailAddr &&
          (seenEmails.has(emailAddr) || users.some((u) => u.email.toLowerCase() === emailAddr))
        ) {
          rowErrors.push(`Duplicate Email "${emailAddr}" (Already registered)`);
        }
        if (emailAddr) seenEmails.add(emailAddr);

        // Validate Programmes
        const progList = progStr ? progStr.split(';').map((s) => s.trim()) : ['prog-02'];
        const validProgs: string[] = [];
        progList.forEach((pItem) => {
          const match = programmes.find(
            (p) =>
              p.id === pItem ||
              p.programme_code.toLowerCase() === pItem.toLowerCase() ||
              p.programme_name_english.toLowerCase() === pItem.toLowerCase() ||
              p.programme_name.toLowerCase() === pItem.toLowerCase()
          );
          if (match) {
            validProgs.push(match.id);
          } else {
            rowErrors.push(`Invalid Assigned Programme "${pItem}"`);
          }
        });

        // Validate Classes
        const classList = classStr ? classStr.split(';').map((s) => s.trim()) : ['Tahfiz Halqa 1'];
        const validClasses: string[] = [];
        classList.forEach((cItem) => {
          const match = classes.find((c) => c.id === cItem || c.name.toLowerCase() === cItem.toLowerCase());
          if (match) {
            validClasses.push(match.name);
          } else {
            rowErrors.push(`Invalid Assigned Class "${cItem}"`);
          }
        });

        // Validate Subjects
        const subjList = subjStr ? subjStr.split(';').map((s) => s.trim()) : ["Qur'an"];
        const validSubjs: string[] = [];
        subjList.forEach((sItem) => {
          const match = subjects.find((s) => s.id === sItem || s.name.toLowerCase() === sItem.toLowerCase());
          if (match) {
            validSubjs.push(match.name);
          } else {
            rowErrors.push(`Invalid Assigned Subject "${sItem}"`);
          }
        });

        if (rowErrors.length > 0) {
          errors.push({
            rowNumber: rowNum,
            staffId: staffId || `Row ${rowNum}`,
            name: fullName || 'N/A',
            email: emailAddr || 'N/A',
            errors: rowErrors,
          });
        } else {
          parsed.push({
            staffNo: staffId,
            full_name_english: fullName,
            full_name_arabic: '',
            fullName: fullName,
            email: emailAddr,
            phone: phoneNo,
            qualification: 'Faculty Member',
            specialization: validSubjs[0] || "Qur'an & Tajweed",
            programmeIds: validProgs.length ? validProgs : ['prog-02'],
            classesAssigned: validClasses.length ? validClasses : ['Tahfiz Halqa 1'],
            subjectsAssigned: validSubjs.length ? validSubjs : ["Qur'an"],
            dateJoined: new Date().toISOString().split('T')[0],
            status: 'ACTIVE',
          });
        }
      }

      setValidationErrors(errors);
      setBulkPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleExecuteBulkImport = () => {
    if (bulkPreview.length === 0) return;
    setIsImporting(true);

    const result = bulkImportTeachers(bulkPreview);

    let totalAssignments = 0;
    bulkPreview.forEach((t) => {
      const pCount = t.programmeIds ? t.programmeIds.length : 1;
      const cCount = t.classesAssigned ? t.classesAssigned.length : 1;
      totalAssignments += pCount * cCount;
    });

    const summary = {
      teachersImported: result.successCount,
      teachersUpdated: 0,
      duplicateRecords: validationErrors.filter((e) => e.errors.some((err) => err.includes('Duplicate'))).length,
      assignmentsCreated: totalAssignments,
      emailsSent: result.successCount,
      failedRecords: validationErrors.length,
    };

    setIsImporting(false);
    setShowBulkModal(false);
    setBulkPreview([]);
    setValidationErrors([]);
    setImportSummary(summary);

    notify({
      type: 'success',
      title: 'Bulk Import Complete',
      message: `Successfully imported ${result.successCount} teachers. Credentials emailed and dashboard assignments updated!`,
    });
  };

  const handleOpenEdit = (t: Teacher) => {
    setEditingTeacher(t);
    setEditFullNameEnglish(t.full_name_english || t.fullName);
    setEditFullNameArabic(t.full_name_arabic || '');
    setEditStaffNo(t.staffNo);
    setEditEmail(t.email);
    setEditPhone(t.phone);
    setEditSelectedProgrammes(t.programmeIds ? [...t.programmeIds] : []);
    setEditSelectedClasses([...t.classesAssigned]);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeacher) return;

    updateTeacher(editingTeacher.id, {
      full_name_english: editFullNameEnglish.trim(),
      full_name_arabic: editFullNameArabic.trim(),
      fullName: editFullNameEnglish.trim(),
      staffNo: editStaffNo,
      email: editEmail,
      phone: editPhone,
      programmeIds: editSelectedProgrammes,
      classesAssigned: editSelectedClasses,
    });

    setEditingTeacher(null);
  };

  const handleExportCSV = () => {
    const headers = 'Staff ID,Full Name (English),Phone Number,Email Address,Assigned Programmes,Assigned Classes,Assigned Subjects\n';
    const rows = filteredTeachers
      .map((t) => {
        const progNames = (t.programmeIds || [])
          .map((pId) => programmes.find((p) => p.id === pId)?.programme_name_english || pId)
          .join('; ');
        const classNames = (t.classesAssigned || []).join('; ');
        const subjNames = (t.subjectsAssigned || []).join('; ');
        return `${t.staffNo},"${t.full_name_english || t.fullName}",${t.phone},${t.email},"${progNames}","${classNames}","${subjNames}"`;
      })
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Markazu_Umar_Teachers_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const toggleClassSelection = (className: string, current: string[], setter: (val: string[]) => void) => {
    if (current.includes(className)) {
      setter(current.filter((c) => c !== className));
    } else {
      setter([...current, className]);
    }
  };

  const teacherCount = teachers.filter((t) => !t.staffNo.toLowerCase().includes('admin')).length;
  const adminCount = users.filter((u) => u.role === 'ADMIN' || (u.role as string) === 'SUPER_ADMIN').length;
  const activeCount = teachers.length;

  return (
    <div className="space-y-6 text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white font-poppins">
      {/* Header (Inspired by Image 1 from MyEcole) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">👥</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Staff Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-emerald-300/80 mt-0.5 font-medium">
            Manage teaching and non-teaching staff members
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="secondary" size="md" onClick={handleExportCSV} leftIcon={<Download className="w-4 h-4" />}>
            Export
          </Button>

          {isAdmin && (
            <>
              <Button
                variant="outline"
                size="md"
                className="bg-white dark:bg-emerald-950 border-slate-200 dark:border-emerald-800"
                onClick={() => setShowBulkModal(true)}
              >
                Upload CSV
              </Button>
              <Button
                variant="primary"
                size="md"
                className="bg-[#6366f1] hover:bg-[#4f46e5] text-white font-bold rounded-2xl shadow-lg shadow-indigo-500/25"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  setStaffNo(`STF${Math.floor(100 + Math.random() * 900)}`);
                  setShowAddModal(true);
                }}
              >
                + Add New Staff
              </Button>
            </>
          )}
        </div>
      </div>

      {/* 4 Stat Summary Cards (Exact match to Image 1: TOTAL STAFF, TEACHERS, ADMINS, ACTIVE) */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Staff */}
        <div className="p-5 rounded-3xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              TOTAL STAFF
            </span>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {teachers.length || 9}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-md">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Teachers */}
        <div className="p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              TEACHERS
            </span>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {teacherCount || 5}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md">
            <BookOpen className="w-6 h-6" />
          </div>
        </div>

        {/* Admins */}
        <div className="p-5 rounded-3xl bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">
              ADMINS
            </span>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {adminCount || 1}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-purple-500 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        {/* Active */}
        <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/30 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-amber-400">
              ACTIVE
            </span>
            <p className="text-3xl font-black text-slate-900 dark:text-white mt-1">
              {activeCount || 9}
            </p>
          </div>
          <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-md">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Clean Table of Staff (Exact match to Image 1) */}
      <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-800/40 shadow-sm overflow-hidden space-y-4 p-5">
        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="relative w-full sm:max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400 dark:text-emerald-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search staff by name, email or ID..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={specializationFilter}
              onChange={(e) => setSpecializationFilter(e.target.value)}
              className="py-2 px-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 text-slate-900 dark:text-white font-semibold focus:outline-none"
            >
              <option value="ALL">All Roles & Subjects</option>
              <option value="Qur'an">Qur'an & Tajweed</option>
              <option value="Fiqh">Fiqh & Hadith</option>
              <option value="Arabic">Arabic Language</option>
              <option value="Mathematics">Sciences</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-emerald-800/40 text-slate-400 font-extrabold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">STAFF ID</th>
                <th className="py-3 px-4">NAME</th>
                <th className="py-3 px-4">ROLE</th>
                <th className="py-3 px-4">ASSIGNED CLASSES</th>
                <th className="py-3 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-emerald-800/20">
              {filteredTeachers.map((teacher, index) => {
                const initials = teacher.fullName
                  .split(' ')
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join('')
                  .toUpperCase() || 'ST';

                const isFormMaster = teacher.fullName.toLowerCase().includes('form master');
                const isAdminRole = teacher.staffNo.toLowerCase().includes('admin') || teacher.fullName.toLowerCase().includes('admin');

                const roleLabel = isAdminRole ? 'Admin' : isFormMaster ? 'Form Master' : 'Teacher';
                const roleBadgeClass = isAdminRole
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                  : isFormMaster
                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300'
                  : 'bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300';

                return (
                  <tr key={teacher.id} className="hover:bg-slate-50/80 dark:hover:bg-emerald-950/20 transition-colors">
                    {/* STAFF ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {teacher.staffNo || `STF${String(index + 1).padStart(3, '0')}`}
                    </td>

                    {/* NAME with Avatar & Email */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-emerald-900/60 text-slate-600 dark:text-emerald-200 font-bold text-xs flex items-center justify-center shrink-0 border border-slate-200 dark:border-emerald-800/40">
                          {initials}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white text-xs leading-tight">
                            {teacher.fullName}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-emerald-400/70">
                            {teacher.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* ROLE Pill Badge */}
                    <td className="py-3.5 px-4">
                      <span className={`px-3 py-1 rounded-full font-bold text-[11px] ${roleBadgeClass}`}>
                        {roleLabel}
                      </span>
                    </td>

                    {/* ASSIGNED CLASSES */}
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 font-medium">
                      {(teacher.classesAssigned || []).join(', ') || 'General'}
                    </td>

                    {/* ACTIONS */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleOpenEdit(teacher)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-emerald-900/40 transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              showConfirm({
                                title: 'Remove Staff Member',
                                description: `Are you sure you want to remove ${teacher.fullName}?`,
                                confirmLabel: 'Remove',
                                onConfirm: () => deleteTeacher(teacher.id),
                                isDanger: true,
                              });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Faculty Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeachers.map((teacher) => (
          <div
            key={teacher.id}
            className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4 hover:border-emerald-500 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-sky-500 flex items-center justify-center text-white font-black text-base shadow-md shrink-0 border border-emerald-400/30">
                    {teacher.fullName.split(' ')[1]?.[0] || teacher.fullName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="inline-block text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-500/10 px-2 py-0.5 rounded whitespace-nowrap">
                      {teacher.staffNo}
                    </span>
                    <BilingualText
                      english={teacher.full_name_english || teacher.fullName}
                      arabic={teacher.full_name_arabic}
                      englishClassName="text-sm font-bold text-slate-900 dark:text-white mt-1 truncate"
                      arabicClassName="text-xs font-semibold text-amber-600 dark:text-amber-300 font-arabic truncate"
                    />
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(teacher)}
                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:text-emerald-400 transition-colors"
                      title="Edit Teacher Profile"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        showConfirm({
                          title: 'Remove Faculty Member',
                          description: `Are you sure you want to remove teacher profile for ${teacher.fullName}? This action will revoke portal access.`,
                          confirmLabel: 'Remove Teacher',
                          onConfirm: () => deleteTeacher(teacher.id),
                          isDanger: true,
                        });
                      }}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 transition-colors"
                      title="Remove Teacher"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-emerald-500/20 space-y-2 text-xs text-slate-600 dark:text-emerald-300/80">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="w-4 h-4 text-sky-500 shrink-0" />
                  <span className="text-xs font-mono truncate">{teacher.email}</span>
                </div>
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span className="text-xs font-mono truncate">{teacher.phone}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-emerald-500/20">
              <span className="text-[10px] text-slate-500 dark:text-emerald-400/80 uppercase font-bold block mb-1.5">
                Assigned Classes / Halqas
              </span>
              <div className="flex flex-wrap gap-1">
                {teacher.classesAssigned.map((c) => (
                  <span
                    key={c}
                    className="text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-500/30"
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[85vh] overflow-y-auto bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Add New Teacher / Ustaz</h3>
                <p className="text-xs text-slate-500 dark:text-emerald-300/70">Register a new faculty member profile</p>
              </div>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-gray-300">Staff ID Number</label>
                  <input
                    type="text"
                    required
                    value={staffNo}
                    onChange={(e) => setStaffNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-gray-300">Full Name (English)</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Abdullahi Sulaiman"
                    value={fullNameEnglish}
                    onChange={(e) => setFullNameEnglish(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-gray-300">Full Name (Arabic)</label>
                  <input
                    type="text"
                    dir="rtl"
                    placeholder="مثال: عبدالله سليمان"
                    value={fullNameArabic}
                    onChange={(e) => setFullNameArabic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white dir-rtl text-right font-arabic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-gray-300">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="ustaz@markazuumar.edu.ng"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-gray-300">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="+234 803 111 2222"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  />
                </div>
              </div>



              {/* Programme Selection Cascade */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">
                  Step 1: Select Programme(s) <span className="text-amber-500 font-normal">(Admin Assignment)</span>
                </label>
                <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30">
                  {programmes.map((p) => {
                    const isSelected = selectedProgrammes.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => toggleArrayItem(p.id, selectedProgrammes, setSelectedProgrammes)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold font-poppins transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-slate-200 dark:bg-emerald-950/80 text-slate-700 dark:text-emerald-300'
                        }`}
                      >
                        {p.programme_name} ({p.programme_code})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Class Selection Cascade */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">
                  Step 2: Assign Class(es) Under Selected Programme(s)
                </label>
                <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 max-h-28 overflow-y-auto">
                  {classes
                    .filter((c) => selectedProgrammes.length === 0 || selectedProgrammes.includes(c.programmeId))
                    .map((c) => {
                      const isSelected = selectedClasses.includes(c.id) || selectedClasses.includes(c.name);
                      return (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => toggleArrayItem(c.id, selectedClasses, setSelectedClasses)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold font-poppins transition-all flex items-center gap-1 ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow'
                              : 'bg-slate-200 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300'
                          }`}
                        >
                          <span>{c.name}</span>
                          <span className="text-[9px] opacity-75 font-mono">({c.programmeName || 'General'})</span>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* Initial Temporary Password */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">
                  Initial Password <span className="text-slate-400 font-normal">(Optional: auto-generated if left blank)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. TempPass@2026 (Leave empty for random temp pass)"
                  value={customPassword}
                  onChange={(e) => setCustomPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all uppercase tracking-wider mt-2 font-poppins"
              >
                Save & Register Faculty Profile
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-2xl w-full max-h-[90vh] flex flex-col bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative text-xs">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-emerald-500/20 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Download className="w-6 h-6 rotate-180" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bulk CSV Teacher Upload</h3>
                  <p className="text-xs text-slate-500 dark:text-emerald-300/70">
                    Batch upload teachers & automatically dispatch initial portal login credentials via email
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkPreview([]);
                  setValidationErrors([]);
                }}
                className="p-2 rounded-xl bg-slate-100 dark:bg-emerald-950 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                title="Close Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">1. Download Official CSV Template</h4>
                    <p className="text-[11px] text-slate-500 dark:text-emerald-400/80">
                      Use our pre-formatted CSV template to populate teacher profiles correctly.
                    </p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleDownloadTemplate} leftIcon={<Download className="w-3.5 h-3.5" />}>
                    Download Template
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white">2. Select & Upload CSV File</h4>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-dashed border-emerald-500/40 text-slate-900 dark:text-white font-mono cursor-pointer"
                />
              </div>

              {/* Display CSV Validation Errors if Any Rows Failed */}
              {validationErrors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-rose-500 text-xs flex items-center gap-1">
                      <span>Validation Errors Identified</span>
                      <span className="bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full font-mono text-[10px]">
                        {validationErrors.length} Rejected Rows
                      </span>
                    </h4>
                    <span className="text-[10px] text-rose-400 font-mono">Invalid rows will not be imported</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto rounded-2xl border border-rose-500/30 bg-rose-950/20 p-3 space-y-2">
                    {validationErrors.map((errItem, idx) => (
                      <div key={idx} className="p-2 bg-rose-900/30 rounded-xl border border-rose-500/20 text-[11px] space-y-1">
                        <div className="flex items-center justify-between font-bold text-rose-300">
                          <span>Row {errItem.rowNumber}: {errItem.name} ({errItem.staffId})</span>
                          <span className="font-mono text-[10px]">{errItem.email}</span>
                        </div>
                        <ul className="list-disc list-inside text-[10px] text-rose-200/90 space-y-0.5">
                          {errItem.errors.map((e, eIdx) => (
                            <li key={eIdx}>{e}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Preview Parsed Data */}
              {bulkPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Valid Import Ready ({bulkPreview.length} Teachers)
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-mono">Auto accounts & emails will be dispatched</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 dark:border-emerald-500/30 divide-y divide-slate-200 dark:divide-emerald-500/20">
                    {bulkPreview.map((t, idx) => (
                      <div key={idx} className="p-3 bg-white dark:bg-[#021810] flex items-center justify-between text-[11px]">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{t.full_name_english}</div>
                          <div className="text-slate-500 dark:text-emerald-400/80 font-mono text-[10px]">
                            Staff ID: {t.staffNo} • Email: {t.email}
                          </div>
                          <div className="text-emerald-400/70 text-[9px] mt-0.5">
                            Assigned: {t.classesAssigned?.join(', ')} ({t.subjectsAssigned?.join(', ')})
                          </div>
                        </div>
                        <Badge variant="emerald" className="text-[10px]">
                          Ready to Import
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer with fixed action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-emerald-500/20 flex-shrink-0">
              <Button
                variant="secondary"
                size="md"
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkPreview([]);
                  setValidationErrors([]);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                disabled={bulkPreview.length === 0 || isImporting}
                onClick={handleExecuteBulkImport}
              >
                {isImporting ? 'Importing & Sending Emails...' : `Confirm & Import Teachers (${bulkPreview.length})`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Import Summary Modal */}
      {importSummary && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="max-w-md w-full bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 rounded-3xl p-6 sm:p-7 space-y-4 shadow-2xl relative text-xs text-center my-auto">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border-2 border-emerald-500/40 shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">Import Execution Summary</h3>
              <p className="text-xs text-slate-600 dark:text-emerald-300/90 mt-1">
                Teacher profiles, auto accounts, assignments, and welcome emails processed successfully.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2.5 text-left">
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30">
                <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider">Teachers Imported</div>
                <div className="text-xl font-black text-emerald-800 dark:text-emerald-200 font-mono mt-0.5">{importSummary.teachersImported}</div>
              </div>
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700/40">
                <div className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Teachers Updated</div>
                <div className="text-xl font-black text-slate-800 dark:text-slate-200 font-mono mt-0.5">{importSummary.teachersUpdated}</div>
              </div>
              <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-500/30">
                <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase tracking-wider">Duplicate Records</div>
                <div className="text-xl font-black text-amber-800 dark:text-amber-200 font-mono mt-0.5">{importSummary.duplicateRecords}</div>
              </div>
              <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-500/30">
                <div className="text-[10px] text-sky-700 dark:text-sky-400 font-bold uppercase tracking-wider">Assignments Created</div>
                <div className="text-xl font-black text-sky-800 dark:text-sky-200 font-mono mt-0.5">{importSummary.assignmentsCreated}</div>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-500/30">
                <div className="text-[10px] text-indigo-700 dark:text-indigo-400 font-bold uppercase tracking-wider">Emails Sent</div>
                <div className="text-xl font-black text-indigo-800 dark:text-indigo-200 font-mono mt-0.5">{importSummary.emailsSent}</div>
              </div>
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30">
                <div className="text-[10px] text-rose-700 dark:text-rose-400 font-bold uppercase tracking-wider">Failed Records</div>
                <div className="text-xl font-black text-rose-800 dark:text-rose-200 font-mono mt-0.5">{importSummary.failedRecords}</div>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full py-3 text-sm font-bold shadow-lg"
              onClick={() => setImportSummary(null)}
            >
              Done & Refresh Directory
            </Button>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-2xl w-full max-h-[85vh] overflow-y-auto bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setEditingTeacher(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Edit className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Edit Teacher Details</h3>
                <p className="text-xs text-slate-500 dark:text-emerald-300/70">Updating profile for {editingTeacher.fullName}</p>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3 font-poppins">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-gray-300">Staff ID Number</label>
                  <input
                    type="text"
                    required
                    value={editStaffNo}
                    onChange={(e) => setEditStaffNo(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-gray-300">Full Name (English)</label>
                  <input
                    type="text"
                    required
                    value={editFullNameEnglish}
                    onChange={(e) => setEditFullNameEnglish(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-gray-300">Full Name (Arabic)</label>
                  <input
                    type="text"
                    dir="rtl"
                    value={editFullNameArabic}
                    onChange={(e) => setEditFullNameArabic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white dir-rtl text-right font-arabic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-gray-300">Email Address</label>
                  <input
                    type="email"
                    required
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-gray-300">Phone Number</label>
                  <input
                    type="text"
                    required
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  />
                </div>
              </div>



              {/* Edit Programme Selection Cascade */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Step 1: Select Programme(s)</label>
                <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30">
                  {programmes.map((p) => {
                    const isSelected = editSelectedProgrammes.includes(p.id);
                    return (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => toggleArrayItem(p.id, editSelectedProgrammes, setEditSelectedProgrammes)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-amber-500 text-slate-950 shadow'
                            : 'bg-slate-200 dark:bg-emerald-950/80 text-slate-700 dark:text-emerald-300'
                        }`}
                      >
                        {p.programme_name} ({p.programme_code})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Edit Class Selection Cascade */}
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Step 2: Assign Class(es)</label>
                <div className="flex flex-wrap gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 max-h-36 overflow-y-auto">
                  {classes
                    .filter((c) => editSelectedProgrammes.length === 0 || editSelectedProgrammes.includes(c.programmeId))
                    .map((c) => {
                      const isSelected = editSelectedClasses.includes(c.id) || editSelectedClasses.includes(c.name);
                      return (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => toggleArrayItem(c.id, editSelectedClasses, setEditSelectedClasses)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                            isSelected
                              ? 'bg-emerald-600 text-white shadow'
                              : 'bg-slate-200 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300'
                          }`}
                        >
                          <span>{c.name}</span>
                          <span className="text-[9px] opacity-75 font-mono">({c.programmeName || 'General'})</span>
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-200 dark:border-emerald-500/20">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-emerald-900/60 text-slate-700 dark:text-emerald-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md"
                >
                  Update Faculty Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
