'use client';

import React, { useState } from 'react';
import { useApp } from '../../../lib/context';
import { Student } from '../../../types';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  BookOpen,
  Phone,
  Trash2,
  Edit,
  Eye,
  X,
  Download,
  Baby,
  HeartHandshake,
  Camera,
  Upload,
} from 'lucide-react';

import { filterStudentsForUser, filterProgrammesForUser, filterClassesForUser, getHeadmasterAssignedProgramme } from '../../../lib/rbac';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EnterpriseTable, Column } from '@/components/ui/EnterpriseTable';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormField';
import { Card } from '@/components/ui/Card';
import { StudentPhotoCaptureModal } from '@/components/students/StudentPhotoCaptureModal';
import { BulkStudentGridModal } from '@/components/students/BulkStudentGridModal';

export default function StudentsPage() {
  const { students, parents, classes, programmes, teacherAssignments, addStudent, bulkImportStudents, updateStudent, deleteStudent, currentUser, showConfirm, notify } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [programmeFilter, setProgrammeFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showGridBulkModal, setShowGridBulkModal] = useState(false);
  const [photoModalStudent, setPhotoModalStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Bulk CSV State
  const [bulkPreview, setBulkPreview] = useState<Omit<Student, 'id'>[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Gallery Lightbox Modal State
  const [galleryModalImg, setGalleryModalImg] = useState<string | null>(null);
  const [galleryModalTitle, setGalleryModalTitle] = useState<string>('');

  // RBAC Data Scoping
  const userStudents = filterStudentsForUser(currentUser, students, parents, teacherAssignments);

  const isHeadmaster = currentUser.role === 'HEADMASTER';
  const canManageStudents = currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN' || isHeadmaster;
  const isAdmin = currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN';

  const headmasterProg = isHeadmaster ? getHeadmasterAssignedProgramme(currentUser, programmes) : null;
  const availableProgrammes = filterProgrammesForUser(currentUser, programmes);
  const userClasses = isHeadmaster ? filterClassesForUser(currentUser, classes) : classes;

  // New Student Form State
  const [fullName, setFullName] = useState('');
  const [admissionNo, setAdmissionNo] = useState(`MU-${new Date().getFullYear()}-0${Math.floor(100 + Math.random() * 900)}`);
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>(() => {
    if (isHeadmaster && headmasterProg) return headmasterProg.id;
    return availableProgrammes[0]?.id || programmes[0]?.id || 'prog-01';
  });

  React.useEffect(() => {
    if (isHeadmaster && headmasterProg && selectedProgrammeId !== headmasterProg.id) {
      setSelectedProgrammeId(headmasterProg.id);
    }
  }, [isHeadmaster, headmasterProg, selectedProgrammeId]);

  const [classId, setClassId] = useState(userClasses[0]?.id || '');
  const [selectedParentId, setSelectedParentId] = useState(parents[0]?.id || '');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [parentMode, setParentMode] = useState<'EXISTING' | 'NEW'>('EXISTING');
  const [newParentName, setNewParentName] = useState('');
  const [newParentPhone, setNewParentPhone] = useState('');
  const [newParentEmail, setNewParentEmail] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [initialJuz, setInitialJuz] = useState(1);
  const [customPassword, setCustomPassword] = useState('');

  // Edit Student Form State
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editAdmissionNo, setEditAdmissionNo] = useState('');
  const [editGender, setEditGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [editProgrammeId, setEditProgrammeId] = useState('');
  const [editClassId, setEditClassId] = useState('');
  const [editGuardianName, setEditGuardianName] = useState('');
  const [editGuardianPhone, setEditGuardianPhone] = useState('');
  const [editCompletedJuz, setEditCompletedJuz] = useState(0);
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'GRADUATED' | 'SUSPENDED'>('ACTIVE');

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProgramme = programmes.find((p) => p.id === selectedProgrammeId);
    const targetClass = classes.find((c) => c.id === classId);
    const targetParent = parents.find((p) => p.id === selectedParentId);

    const cleanEmail = studentEmail.trim().toLowerCase();

    addStudent(
      {
        admissionNo,
        fullName,
        gender,
        email: cleanEmail || undefined,
        dob: '2013-05-10',
        dateEnrolled: new Date().toISOString().split('T')[0],
        programmeId: selectedProgrammeId,
        programmeName: targetProgramme?.programme_name || 'Super Markaz',
        classId: classId,
        className: targetClass?.name || 'Tahfiz Halqa',
        guardianId: parentMode === 'EXISTING' && targetParent ? targetParent.id : (parents[0]?.id || `usr-parent-${Date.now()}`),
        guardianName: parentMode === 'EXISTING' && targetParent ? targetParent.fullName : newParentName || 'Parent Guardian',
        guardianPhone: parentMode === 'EXISTING' && targetParent ? targetParent.phone : newParentPhone || '08000000000',
        parentName: parentMode === 'NEW' ? newParentName : undefined,
        parentPhone: parentMode === 'NEW' ? newParentPhone : undefined,
        parentEmail: parentMode === 'NEW' ? newParentEmail : undefined,
        status: 'ACTIVE',
        hifzProgress: {
          currentJuz: Number(initialJuz),
          juzCompleted: Math.max(0, Number(initialJuz) - 1),
          currentSurah: 'Surah Al-Baqarah',
          currentAyah: 1,
          completedSurahsCount: Number(initialJuz) * 2,
          tajweedRating: 4,
          sabkiRating: 4,
          manzilRating: 4,
        },
        akhlaqRating: 'EXCELLENT',
      },
      customPassword.trim() || undefined
    );

    notify({
      type: 'success',
      title: 'Student Enrolled',
      message: cleanEmail
        ? `Enrolled ${fullName} (${admissionNo}). Welcome email with portal credentials sent to ${cleanEmail}!`
        : `Enrolled ${fullName} (${admissionNo}) as offline student without login credentials.`,
    });

    setShowAddModal(false);
    setFullName('');
    setStudentEmail('');
    setGuardianName('');
    setGuardianPhone('');
    setNewParentName('');
    setNewParentPhone('');
    setNewParentEmail('');
    setCustomPassword('');
  };

  const handleDownloadTemplate = () => {
    const headers = "AdmissionNo,StudentName,Gender,Programme,Class,ParentName,ParentPhone,ParentEmail\n";
    const sample1 = "MUBK-STU-0010,Ahmad Abdullahi,MALE,Super Markaz,daar aliyu bn abi dalib,Alhaji Abdullahi,08031234567,abdullahi.parent@gmail.com\n";
    const sample2 = "MUBK-STU-0011,Fatima Abdullahi,FEMALE,Super Markaz,daar aliyu bn abi dalib,Alhaji Abdullahi,08031234567,abdullahi.parent@gmail.com\n";
    const blob = new Blob([headers + sample1 + sample2], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students_bulk_template.csv';
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

      const parsed: (Omit<Student, 'id'> & { parentName?: string; parentPhone?: string; parentEmail?: string })[] = [];
      let studentCounter = students.length + 1;
      const sessionParentCache = new Map<string, string>(); // Key: email/phone -> guardianId

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((col) => col.trim().replace(/^["']|["']$/g, ''));
        if (row.length < 1 || !row[0]) continue;

        let admNo = '';
        let studentName = '';
        let genderStr = 'MALE';
        let progStr = '';
        let classStr = '';
        let parentName = '';
        let parentPhone = '';
        let parentEmail = '';

        if (row[0] && (row[0].toUpperCase().startsWith('MUBK') || row[0].toUpperCase().startsWith('MU-') || row[0].toUpperCase().startsWith('STU'))) {
          admNo = row[0];
          studentName = row[1] || '';
          genderStr = (row[2] || 'MALE').toUpperCase();
          progStr = row[3] || '';
          classStr = row[4] || '';
          parentName = row[5] || '';
          parentPhone = row[6] || '';
          parentEmail = row[7] || '';
        } else {
          studentName = row[0] || '';
          genderStr = (row[1] || 'MALE').toUpperCase();
          progStr = row[2] || '';
          classStr = row[3] || '';
          parentName = row[4] || '';
          parentPhone = row[5] || '';
          parentEmail = row[6] || '';
          admNo = row[7] || '';
        }

        if (!admNo) {
          admNo = `MUBK-STU-${(studentCounter++).toString().padStart(4, '0')}`;
        }

        const matchedProg = programmes.find(
          (p) =>
            (progStr && p.id === progStr) ||
            (progStr && p.programme_code?.toLowerCase() === progStr.toLowerCase()) ||
            (progStr && p.programme_name_english?.toLowerCase() === progStr.toLowerCase()) ||
            (progStr && p.programme_name?.toLowerCase() === progStr.toLowerCase())
        ) || programmes[0];

        const matchedClass = classes.find(
          (c) => (classStr && c.id === classStr) || (classStr && c.name.toLowerCase() === classStr.toLowerCase())
        ) || classes[0];

        // Parent Resolution & De-duplication
        const cleanPEmail = parentEmail ? parentEmail.toLowerCase().trim() : '';
        const cleanPPhone = parentPhone ? parentPhone.trim() : '';
        const cacheKey = cleanPEmail || cleanPPhone || parentName.toLowerCase().trim();

        let resolvedGuardianId = '';
        let resolvedGuardianName = parentName || 'Guardian Parent';
        let resolvedGuardianPhone = parentPhone || '08000000000';

        // 1. Check existing parents in PostgreSQL context state
        const existingP = parents.find(
          (p) =>
            (cleanPEmail && p.email.toLowerCase() === cleanPEmail) ||
            (cleanPPhone && p.phone === cleanPPhone)
        );

        if (existingP) {
          resolvedGuardianId = existingP.id;
          resolvedGuardianName = existingP.fullName;
          resolvedGuardianPhone = existingP.phone;
        } else if (cacheKey && sessionParentCache.has(cacheKey)) {
          // 2. Check current CSV import session cache (sibling de-duplication)
          resolvedGuardianId = sessionParentCache.get(cacheKey)!;
        } else if (cacheKey) {
          resolvedGuardianId = `usr-parent-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;
          sessionParentCache.set(cacheKey, resolvedGuardianId);
        } else {
          resolvedGuardianId = parents[0]?.id || `usr-parent-${Date.now()}`;
        }

        parsed.push({
          admissionNo: admNo,
          fullName: studentName,
          gender: genderStr.startsWith('F') ? 'FEMALE' : 'MALE',
          email: `${admNo.toLowerCase()}@markazuumar.edu.ng`,
          dob: '2014-06-15',
          dateEnrolled: new Date().toISOString().split('T')[0],
          programmeId: matchedProg ? matchedProg.id : undefined,
          programmeName: matchedProg ? (matchedProg.programme_name_english || matchedProg.programme_name) : 'Super Markaz',
          classId: matchedClass ? matchedClass.id : (classes[0]?.id || 'cls-01'),
          className: matchedClass ? matchedClass.name : 'Tahfiz Class A',
          guardianId: resolvedGuardianId,
          guardianName: resolvedGuardianName,
          guardianPhone: resolvedGuardianPhone,
          parentName: parentName || undefined,
          parentPhone: parentPhone || undefined,
          parentEmail: parentEmail || undefined,
          status: 'ACTIVE',
          hifzProgress: {
            currentJuz: 1,
            juzCompleted: 0,
            currentSurah: 'Surah Al-Baqarah',
            currentAyah: 1,
            completedSurahsCount: 2,
            tajweedRating: 4,
            sabkiRating: 4,
            manzilRating: 4,
          },
          akhlaqRating: 'EXCELLENT',
        });
      }

      setBulkPreview(parsed);
    };
    reader.readAsText(file);
  };

  const handleExecuteBulkImport = () => {
    if (bulkPreview.length === 0) return;
    setIsImporting(true);

    const result = bulkImportStudents(bulkPreview);
    setIsImporting(false);
    setShowBulkModal(false);
    setBulkPreview([]);

    notify({
      type: 'success',
      title: 'Bulk Enrollment Complete',
      message: `Successfully enrolled ${result.successCount} students (${result.linkedParentsCount || 0} new parents created, ${result.duplicatesPreventedCount || 0} parent duplicates prevented). Welcome credentials emailed to parents/guardians!`,
    });
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setEditFullName(student.fullName);
    setEditEmail(student.email || '');
    setEditAdmissionNo(student.admissionNo);
    setEditGender(student.gender);
    setEditProgrammeId(student.programmeId || programmes[0]?.id || '');
    setEditClassId(student.classId);
    setEditGuardianName(student.guardianName);
    setEditGuardianPhone(student.guardianPhone);
    setEditCompletedJuz(student.hifzProgress.juzCompleted);
    setEditStatus(student.status);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const targetProgramme = programmes.find((p) => p.id === editProgrammeId);
    const targetClass = classes.find((c) => c.id === editClassId);
    const cleanEditEmail = editEmail.trim().toLowerCase();

    try {
      await updateStudent(editingStudent.id, {
        fullName: editFullName,
        email: cleanEditEmail || undefined,
        admissionNo: editAdmissionNo,
        gender: editGender,
        programmeId: editProgrammeId,
        programmeName: targetProgramme?.programme_name || editingStudent.programmeName,
        classId: editClassId,
        className: targetClass?.name || editingStudent.className,
        guardianName: editGuardianName,
        guardianPhone: editGuardianPhone,
        status: editStatus,
        hifzProgress: {
          ...editingStudent.hifzProgress,
          juzCompleted: Number(editCompletedJuz),
        },
      });

      notify({
        type: 'success',
        title: 'Student Details Saved',
        message: cleanEditEmail && !editingStudent.email
          ? `Updated student record. Student portal account activated and credentials sent to ${cleanEditEmail}!`
          : `Updated student record for ${editFullName}.`,
      });
      setEditingStudent(null);
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Failed to Save Student',
        message: err.message || 'Could not save student changes.',
      });
    }
  };

  const filteredStudents = userStudents.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.admissionNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.guardianName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = classFilter === 'ALL' || s.classId === classFilter;
    return matchesSearch && matchesClass;
  });

  const handleExportCSV = () => {
    if (!canManageStudents || currentUser.role === 'PARENT' || currentUser.role === 'STUDENT') return;
    const headers = 'Student ID,Full Name (English),Assigned Programme,Assigned Class\n';
    const rows = filteredStudents
      .map(
        (s) =>
          `${s.admissionNo},"${s.fullName}","${s.programmeName || 'Super Markaz Programme'}","${s.className}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Markazu_Umar_Students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const studentColumns: Column<Student>[] = [
    {
      header: 'Student Name',
      accessorKey: 'fullName',
      cell: (student) => (
        <div className="font-extrabold text-slate-900 dark:text-white flex items-center gap-2.5">
          <div
            className="relative group/avatar cursor-pointer"
            onClick={() => canManageStudents && setPhotoModalStudent(student)}
            title={canManageStudents ? 'Click to capture or change student passport photo' : undefined}
          >
            {student.avatar ? (
              <img
                src={student.avatar}
                alt={student.fullName}
                className="w-9 h-9 rounded-full object-cover border-2 border-emerald-500/40 shadow-sm group-hover/avatar:border-amber-400 transition-all"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black flex items-center justify-center text-xs border border-emerald-500/30 group-hover/avatar:border-amber-400 transition-all">
                {student.fullName[0]}
              </div>
            )}
            {canManageStudents && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-md border border-white dark:border-[#042419] opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                <Camera className="w-2.5 h-2.5" />
              </div>
            )}
          </div>
          <div>
            <div className="text-xs flex items-center gap-1.5">
              <span>{student.fullName}</span>
              {student.avatar && (
                <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1 py-0.2 rounded border border-amber-500/20">
                  Photo
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mt-0.5 min-w-0">
              <span className="text-[10px] text-slate-400 font-mono shrink-0">{student.admissionNo}</span>
              {student.email ? (
                <span className="text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-sans truncate max-w-[150px] sm:max-w-[220px]" title={student.email}>
                  {student.email}
                </span>
              ) : (
                <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded font-sans">
                  Offline
                </span>
              )}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: 'Class / Halqa',
      accessorKey: 'className',
      className: 'whitespace-nowrap min-w-[170px]',
      cell: (student) => (
        <div className="whitespace-nowrap">
          <div className="font-bold text-slate-800 dark:text-emerald-100 text-xs whitespace-nowrap">{student.className}</div>
          <div className="text-[10px] text-slate-500 dark:text-emerald-400/80 whitespace-nowrap">{student.programmeName || 'Asubah & Magrib'}</div>
        </div>
      ),
    },
    {
      header: 'Parent / Guardian',
      className: 'whitespace-nowrap min-w-[160px]',
      cell: (student) => (
        <div className="whitespace-nowrap">
          <div className="font-bold text-slate-900 dark:text-white text-xs whitespace-nowrap">{student.guardianName}</div>
          <div className="text-[10px] text-slate-500 dark:text-emerald-400/80 flex items-center gap-1 font-mono whitespace-nowrap">
            <Phone className="w-2.5 h-2.5 text-emerald-500 shrink-0" /> <span className="whitespace-nowrap">{student.guardianPhone}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Tahfiz Progress',
      className: 'whitespace-nowrap min-w-[120px]',
      cell: (student) => (
        <Badge variant="purple" className="whitespace-nowrap">
          {student.hifzProgress.juzCompleted} / 30 Juz
        </Badge>
      ),
    },
    {
      header: 'Status',
      className: 'whitespace-nowrap min-w-[90px]',
      cell: (student) => (
        <Badge variant={student.status === 'ACTIVE' ? 'emerald' : 'slate'} className="whitespace-nowrap">
          {student.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      className: 'whitespace-nowrap min-w-[120px] text-right',
      cell: (student) => (
        <div className="flex items-center justify-end gap-1">
          {canManageStudents && (
            <Button
              variant="ghost"
              size="sm"
              title="Capture / Upload Passport Photo"
              onClick={() => setPhotoModalStudent(student)}
            >
              <Camera className="w-3.5 h-3.5 text-amber-500 hover:text-amber-400" />
            </Button>
          )}
          <Button variant="ghost" size="sm" title="View Profile" onClick={() => setSelectedStudent(student)}>
            <Eye className="w-3.5 h-3.5 text-emerald-500" />
          </Button>
          {canManageStudents && (
            <>
              <Button variant="ghost" size="sm" title="Edit Student" onClick={() => handleOpenEdit(student)}>
                <Edit className="w-3.5 h-3.5 text-sky-500" />
              </Button>
              <Button variant="ghost" size="sm" title="Delete Student" onClick={() => {
                showConfirm({
                  title: 'Delete Student Profile',
                  description: `Are you sure you want to remove student profile for ${student.fullName} (${student.admissionNo})?`,
                  confirmLabel: 'Delete Student',
                  onConfirm: () => deleteStudent(student.id),
                  isDanger: true,
                });
              }}>
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              </Button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 text-slate-900 dark:text-gray-100 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#042f1e] via-[#064e3b] to-[#0284c7] text-white border border-emerald-500/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-widest mb-1">
            <Baby className="w-4 h-4 text-emerald-400" /> {isHeadmaster ? `Section Students (${currentUser.assignedProgrammeName || 'My Section'})` : 'Student & Child Management'}
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{isHeadmaster ? 'Section Children & Students Directory' : 'Children & Students Directory'}</h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
            {isHeadmaster
              ? `Managing student records, class allocations, and Hifz progress for ${currentUser.assignedProgrammeName || 'your assigned section'}.`
              : 'Managing student records, class allocations, Hifz progress, and parent/guardian linkages.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto w-full sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-initial">
          {canManageStudents && (
            <Button
              variant="secondary"
              size="md"
              onClick={handleExportCSV}
              leftIcon={<Download className="w-4 h-4" />}
              className="bg-white/10 hover:bg-white/20 text-white border border-white/20 whitespace-nowrap"
            >
              Export CSV
            </Button>
          )}

          {canManageStudents && (
            <>
              <Button
                variant="warning"
                size="md"
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-md whitespace-nowrap"
                leftIcon={<Users className="w-4 h-4 text-slate-950" />}
                onClick={() => setShowGridBulkModal(true)}
              >
                Quick Grid Enrol
              </Button>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => setShowBulkModal(true)}
                  className="inline-flex items-center justify-center font-bold text-xs sm:text-sm px-4 py-2.5 h-10 gap-2 rounded-2xl transition-all duration-200 bg-white hover:bg-slate-100 text-emerald-950 font-black border border-emerald-300 shadow-md whitespace-nowrap active:scale-95 shrink-0"
                  title="Upload CSV to Bulk Enroll Students"
                >
                  <Upload className="w-4 h-4 text-emerald-800 shrink-0" />
                  <span>Upload CSV</span>
                </button>
              )}
              <Button
                variant="primary"
                size="md"
                leftIcon={<UserPlus className="w-4 h-4" />}
                className="whitespace-nowrap"
                onClick={() => {
                  setAdmissionNo(`MU-${new Date().getFullYear()}-0${Math.floor(100 + Math.random() * 900)}`);
                  setShowAddModal(true);
                }}
              >
                Enrol New Student
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Enterprise Data Table */}
      <EnterpriseTable<Student>
        data={userStudents}
        columns={studentColumns}
        searchPlaceholder="Search by student name, admission no, or guardian..."
      />

      {/* Student Activity & Campus Life Gallery */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-emerald-500/20 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
              <Baby className="w-4 h-4 text-emerald-500" /> Student Campus Life & Recitation Events
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white mt-1">Students Photo Gallery</h2>
          </div>
          <Badge variant="emerald" className="text-xs">
            4 Campus Photos
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              title: 'Markazu Umar Female Tahfiz Students & Instructors',
              image: '/gallery/gallery-1.jpg',
              tag: 'Tahfiz Halqa',
            },
            {
              title: 'Annual Markazu Umar Islamiyyah Student Assembly',
              image: '/gallery/gallery-2.jpg',
              tag: 'Assembly',
            },
            {
              title: 'Outdoor Islamic Studies & Recitation Assembly',
              image: '/gallery/gallery-3.jpg',
              tag: 'Communal Recitation',
            },
            {
              title: 'Tahfiz Quran Recitation Class',
              image: '/gallery/gallery-4.jpg',
              tag: 'Hifz Class',
            },
          ].map((photo, pIdx) => (
            <div
              key={pIdx}
              onClick={() => {
                setGalleryModalImg(photo.image);
                setGalleryModalTitle(photo.title);
              }}
              className="rounded-3xl overflow-hidden glass-card border border-slate-200 dark:border-emerald-500/30 group hover:shadow-2xl hover:border-emerald-400/60 transition-all duration-300 cursor-pointer bg-slate-50 dark:bg-[#021d14] flex flex-col"
            >
              <div className="h-56 relative overflow-hidden bg-emerald-950/80 rounded-t-3xl">
                <img
                  src={photo.image}
                  alt={photo.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  onContextMenu={(e) => e.preventDefault()}
                />
                <span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-slate-950/80 text-amber-300 text-[10px] font-bold backdrop-blur-md border border-amber-500/30 shadow-md">
                  {photo.tag}
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-950/80 via-emerald-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                  <span className="px-4 py-2 rounded-2xl bg-amber-500 text-slate-950 font-extrabold text-xs shadow-xl tracking-wide transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                    Expand Full Image 🔍
                  </span>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed line-clamp-2">{photo.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Enrolment Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-900 dark:text-white text-xs">
            {/* Header (Fixed) */}
            <div className="shrink-0 p-5 sm:p-6 border-b border-slate-200 dark:border-emerald-800/60 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-500" /> Enrol New Student (Child)
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            {/* Body (Scrolls Independently) */}
            <form onSubmit={handleAddSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-4">
                <div>
                  <label className="block text-slate-700 dark:text-emerald-300 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ahmad Ibrahim Kano"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-emerald-300 font-semibold mb-1">Admission Number</label>
                    <input
                      type="text"
                      value={admissionNo}
                      onChange={(e) => setAdmissionNo(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-emerald-300 font-semibold mb-1">Gender</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2 text-slate-900 dark:text-white"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-emerald-300 font-bold mb-1">
                      Step 1: Programme <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={selectedProgrammeId}
                      onChange={(e) => {
                        setSelectedProgrammeId(e.target.value);
                        const matchingClasses = classes.filter((c) => c.programmeId === e.target.value);
                        if (matchingClasses.length > 0) setClassId(matchingClasses[0].id);
                      }}
                      className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2 text-slate-900 dark:text-white font-poppins font-bold"
                    >
                      {availableProgrammes.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.programme_name} ({p.programme_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-emerald-300 font-bold mb-1">
                      Step 2: Class under Programme <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2 text-slate-900 dark:text-white font-poppins font-bold"
                    >
                      {userClasses
                        .filter((c) => c.programmeId === selectedProgrammeId || !selectedProgrammeId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2 border-t border-b border-slate-200 dark:border-emerald-800/60 py-3">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 dark:text-emerald-300 font-bold">
                      Parent / Guardian Option <span className="text-rose-500">*</span>
                    </label>
                    <div className="flex bg-slate-100 dark:bg-emerald-950 p-1 rounded-xl gap-1">
                      <button
                        type="button"
                        onClick={() => setParentMode('EXISTING')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          parentMode === 'EXISTING'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-500 dark:text-emerald-400 hover:text-slate-900'
                        }`}
                      >
                        Option A: Select Existing
                      </button>
                      <button
                        type="button"
                        onClick={() => setParentMode('NEW')}
                        className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          parentMode === 'NEW'
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'text-slate-500 dark:text-emerald-400 hover:text-slate-900'
                        }`}
                      >
                        Option B: Register New
                      </button>
                    </div>
                  </div>

                  {parentMode === 'EXISTING' ? (
                    <div>
                      <select
                        value={selectedParentId}
                        onChange={(e) => {
                          setSelectedParentId(e.target.value);
                          const p = parents.find((pr) => pr.id === e.target.value);
                          if (p) {
                            setGuardianName(p.fullName);
                            setGuardianPhone(p.phone);
                          }
                        }}
                        className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2.5 text-slate-900 dark:text-white font-semibold"
                      >
                        {parents.length === 0 && <option value="">No existing parents found (Use Option B)</option>}
                        {parents.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.fullName} ({p.phone})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div>
                        <input
                          type="text"
                          required={parentMode === 'NEW'}
                          placeholder="Parent Full Name (e.g. Alhaji Abdullahi)"
                          value={newParentName}
                          onChange={(e) => setNewParentName(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2 text-slate-900 dark:text-white"
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input
                          type="text"
                          required={parentMode === 'NEW'}
                          placeholder="Phone Number (e.g. 08031234567)"
                          value={newParentPhone}
                          onChange={(e) => setNewParentPhone(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2 text-slate-900 dark:text-white"
                        />
                        <input
                          type="email"
                          required={parentMode === 'NEW'}
                          placeholder="Email Address"
                          value={newParentEmail}
                          onChange={(e) => setNewParentEmail(e.target.value)}
                          className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2 text-slate-900 dark:text-white"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-emerald-300 font-semibold mb-1">Current Hifz Starting Juz (1-30)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={initialJuz}
                    onChange={(e) => setInitialJuz(Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/40">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 dark:text-emerald-300 font-bold text-xs">
                      Student Email Address <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Portal Login
                    </span>
                  </div>
                  <input
                    type="email"
                    placeholder="student@example.com (Leave blank for offline student)"
                    value={studentEmail}
                    onChange={(e) => setStudentEmail(e.target.value)}
                    className="w-full bg-white dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-emerald-300/70 leading-relaxed">
                    Optional: If provided, a student portal account is automatically generated and login credentials will be emailed to the student. If left blank, the student will be enrolled without portal login details (can be updated later).
                  </p>
                </div>
              </div>

              {/* Footer (Fixed / Non-scrolling) */}
              <div className="shrink-0 p-4 sm:p-5 border-t border-slate-200 dark:border-emerald-800/60 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-[#021810]">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-emerald-900/60 text-slate-700 dark:text-emerald-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md"
                >
                  Save Enrolment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-900 dark:text-white text-xs">
            {/* Header (Fixed) */}
            <div className="shrink-0 p-5 sm:p-6 border-b border-slate-200 dark:border-emerald-800/60 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-sky-500" /> Edit Student Details
              </h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            {/* Body (Scrolls Independently) */}
            <form onSubmit={handleEditSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-4">
                <div>
                  <label className="block text-slate-700 dark:text-emerald-300 font-semibold mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2.5 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-emerald-300 font-semibold mb-1">Admission Number</label>
                    <input
                      type="text"
                      required
                      value={editAdmissionNo}
                      onChange={(e) => setEditAdmissionNo(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2 text-slate-900 dark:text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-emerald-300 font-semibold mb-1">Gender</label>
                    <select
                      value={editGender}
                      onChange={(e) => setEditGender(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2 text-slate-900 dark:text-white"
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-emerald-300 font-bold mb-1">
                      Programme <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={editProgrammeId}
                      onChange={(e) => {
                        setEditProgrammeId(e.target.value);
                        const matchingClasses = classes.filter((c) => c.programmeId === e.target.value);
                        if (matchingClasses.length > 0) setEditClassId(matchingClasses[0].id);
                      }}
                      className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2 text-slate-900 dark:text-white font-poppins font-bold"
                    >
                      {availableProgrammes.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.programme_name} ({p.programme_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-emerald-300 font-bold mb-1">
                      Class <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={editClassId}
                      onChange={(e) => setEditClassId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2 text-slate-900 dark:text-white font-poppins font-bold"
                    >
                      {userClasses
                        .filter((c) => c.programmeId === editProgrammeId || !editProgrammeId)
                        .map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-emerald-300 font-semibold mb-1">Guardian Name</label>
                    <input
                      type="text"
                      required
                      value={editGuardianName}
                      onChange={(e) => setEditGuardianName(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-emerald-300 font-semibold mb-1">Guardian Phone</label>
                    <input
                      type="text"
                      required
                      value={editGuardianPhone}
                      onChange={(e) => setEditGuardianPhone(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-700 dark:text-emerald-300 font-semibold mb-1">Juz Completed (0-30)</label>
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={editCompletedJuz}
                      onChange={(e) => setEditCompletedJuz(Number(e.target.value))}
                      className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-700 dark:text-emerald-300 font-semibold mb-1">Enrolment Status</label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as any)}
                      className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2 text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="GRADUATED">GRADUATED</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5 p-3 rounded-2xl bg-slate-50 dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/40">
                  <div className="flex items-center justify-between">
                    <label className="block text-slate-700 dark:text-emerald-300 font-bold text-xs">
                      Student Email Address <span className="text-slate-400 font-normal text-[10px]">(Optional)</span>
                    </label>
                    <span className="text-[10px] font-semibold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20">
                      Portal Access
                    </span>
                  </div>
                  <input
                    type="email"
                    placeholder="student@example.com (Leave blank for offline student)"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    className="w-full bg-white dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2.5 text-slate-900 dark:text-white text-xs"
                  />
                  <p className="text-[10px] text-slate-500 dark:text-emerald-300/70 leading-relaxed">
                    Adding an email to an offline student will activate their student portal login and dispatch login credentials immediately.
                  </p>
                </div>
              </div>

              {/* Footer (Fixed) */}
              <div className="shrink-0 p-4 sm:p-5 border-t border-slate-200 dark:border-emerald-800/60 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-[#021810]">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-emerald-900/60 text-slate-700 dark:text-emerald-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Profile Modal */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden shadow-2xl text-slate-900 dark:text-white text-xs">
            {/* Header (Fixed) */}
            <div className="shrink-0 p-5 sm:p-6 border-b border-slate-200 dark:border-emerald-800/60 flex items-center justify-between">
              <h3 className="text-base font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" /> Student Profile Details
              </h3>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            {/* Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-4">
              {/* Profile Card with Passport Photo */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-emerald-950/80 border border-slate-200 dark:border-emerald-800/40 flex items-center gap-4">
                <div className="relative group/photo shrink-0">
                  {selectedStudent.avatar ? (
                    <img
                      src={selectedStudent.avatar}
                      alt={selectedStudent.fullName}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-500 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-black text-xl flex items-center justify-center border-2 border-dashed border-emerald-500/40">
                      {selectedStudent.fullName[0]}
                    </div>
                  )}
                  {canManageStudents && (
                    <button
                      onClick={() => setPhotoModalStudent(selectedStudent)}
                      title="Update Passport Photo"
                      className="absolute -bottom-1 -right-1 p-1.5 rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-lg transition-transform hover:scale-110"
                    >
                      <Camera className="w-3.5 h-3.5 font-bold" />
                    </button>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">{selectedStudent.fullName}</h4>
                  <p className="text-emerald-600 dark:text-emerald-300 font-mono mt-0.5">{selectedStudent.admissionNo} • {selectedStudent.className}</p>
                  {canManageStudents && (
                    <button
                      onClick={() => setPhotoModalStudent(selectedStudent)}
                      className="mt-2 text-[11px] font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1"
                    >
                      <Camera className="w-3 h-3" />
                      {selectedStudent.avatar ? 'Change Passport Photo' : 'Capture / Upload Photo'}
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30">
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold block">Juz Memorized</span>
                  <span className="text-lg font-black text-amber-500">{selectedStudent.hifzProgress.juzCompleted} / 30 Juz</span>
                </div>
                <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-500/30">
                  <span className="text-[10px] text-sky-700 dark:text-sky-300 font-bold block">Akhlaq Rating</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedStudent.akhlaqRating}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-emerald-950/80 border border-slate-200 dark:border-emerald-800/40 space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Parent / Guardian Info</span>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedStudent.guardianName}</p>
                <p className="text-emerald-600 dark:text-emerald-300 font-mono">{selectedStudent.guardianPhone}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-emerald-950/80 border border-slate-200 dark:border-emerald-800/40 space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Student Portal Access</span>
                {selectedStudent.email ? (
                  <p className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <span className="text-emerald-500 font-bold">✓ Portal Active:</span> {selectedStudent.email}
                  </p>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 italic">
                    Offline Student (No email assigned. Portal login can be activated by editing student profile).
                  </p>
                )}
              </div>
            </div>

            {/* Footer (Fixed) */}
            <div className="shrink-0 p-4 sm:p-5 border-t border-slate-200 dark:border-emerald-800/60 flex justify-end bg-slate-50/50 dark:bg-[#021810]">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-5 py-2 rounded-xl bg-emerald-600 text-white font-bold shadow-md"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk CSV Upload Modal */}
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
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">Bulk CSV Student Enrollment</h3>
                  <p className="text-xs text-slate-500 dark:text-emerald-300/70">
                    Batch enroll students & dispatch initial portal login credentials to parents/guardians via email
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkPreview([]);
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
                      Download pre-formatted CSV template to populate student admission records.
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

              {/* Preview Parsed Data */}
              {bulkPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Preview Ready Student Records ({bulkPreview.length} Students)
                    </h4>
                    <span className="text-[10px] text-emerald-400 font-mono">Credentials emailed to parents</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 dark:border-emerald-500/30 divide-y divide-slate-200 dark:divide-emerald-500/20">
                    {bulkPreview.map((s, idx) => (
                      <div key={idx} className="p-3 bg-white dark:bg-[#021810] flex items-center justify-between text-[11px]">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{s.fullName}</div>
                          <div className="text-slate-500 dark:text-emerald-400/80 font-mono text-[10px]">{s.admissionNo} • {s.className}</div>
                        </div>
                        <Badge variant="emerald" className="text-[10px]">
                          Ready to Enroll
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
                {isImporting ? 'Enrolling & Sending Emails...' : `Confirm & Import Students (${bulkPreview.length})`}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Gallery Photo Lightbox Modal */}
      {galleryModalImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setGalleryModalImg(null)}
        >
          <div
            className="max-w-4xl w-full bg-slate-900 border border-emerald-500/40 rounded-3xl p-4 sm:p-6 space-y-4 shadow-2xl relative text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white tracking-wide truncate pr-4">{galleryModalTitle}</h3>
              <button
                onClick={() => setGalleryModalImg(null)}
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
                title="Close Lightbox"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-[75vh] overflow-hidden rounded-2xl border border-slate-800 bg-black flex items-center justify-center">
              <img
                src={galleryModalImg}
                alt={galleryModalTitle}
                className="max-h-[72vh] w-auto object-contain rounded-2xl shadow-2xl"
                onContextMenu={(e) => e.preventDefault()}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1 font-mono">
              <span>Markazu Umar Bn Al-Khattab Centre</span>
              <Button variant="secondary" size="sm" onClick={() => setGalleryModalImg(null)}>
                Close Preview
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Student Passport Photo Webcam Capture & Upload Modal */}
      {photoModalStudent && (
        <StudentPhotoCaptureModal
          isOpen={!!photoModalStudent}
          onClose={() => setPhotoModalStudent(null)}
          studentId={photoModalStudent.id}
          studentName={photoModalStudent.fullName}
          admissionNo={photoModalStudent.admissionNo}
          currentAvatar={photoModalStudent.avatar}
          onPhotoSaved={(avatarUrl) => {
            updateStudent(photoModalStudent.id, { avatar: avatarUrl });
            if (selectedStudent && selectedStudent.id === photoModalStudent.id) {
              setSelectedStudent({ ...selectedStudent, avatar: avatarUrl });
            }
            setPhotoModalStudent(null);
          }}
        />
      )}

      {/* Bulk Fast Data Grid Enrollment Modal */}
      <BulkStudentGridModal
        isOpen={showGridBulkModal}
        onClose={() => setShowGridBulkModal(false)}
        availableProgrammes={availableProgrammes}
        availableClasses={classes}
      />
    </div>
  );
}
