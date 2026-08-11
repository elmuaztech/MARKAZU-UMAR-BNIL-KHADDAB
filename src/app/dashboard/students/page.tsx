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
} from 'lucide-react';

import { filterStudentsForUser } from '../../../lib/rbac';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EnterpriseTable, Column } from '@/components/ui/EnterpriseTable';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormField';
import { Card } from '@/components/ui/Card';

export default function StudentsPage() {
  const { students, parents, classes, programmes, teacherAssignments, addStudent, bulkImportStudents, updateStudent, deleteStudent, currentUser, showConfirm, notify } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [programmeFilter, setProgrammeFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
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

  // New Student Form State
  const [fullName, setFullName] = useState('');
  const [admissionNo, setAdmissionNo] = useState(`MU-${new Date().getFullYear()}-0${Math.floor(100 + Math.random() * 900)}`);
  const [gender, setGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [selectedProgrammeId, setSelectedProgrammeId] = useState(programmes[0]?.id || 'prog-01');
  const [classId, setClassId] = useState(classes[0]?.id || '');
  const [selectedParentId, setSelectedParentId] = useState(parents[0]?.id || '');
  const [guardianName, setGuardianName] = useState('');
  const [guardianPhone, setGuardianPhone] = useState('');
  const [initialJuz, setInitialJuz] = useState(1);
  const [customPassword, setCustomPassword] = useState('');

  // Edit Student Form State
  const [editFullName, setEditFullName] = useState('');
  const [editAdmissionNo, setEditAdmissionNo] = useState('');
  const [editGender, setEditGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [editProgrammeId, setEditProgrammeId] = useState('');
  const [editClassId, setEditClassId] = useState('');
  const [editGuardianName, setEditGuardianName] = useState('');
  const [editGuardianPhone, setEditGuardianPhone] = useState('');
  const [editCompletedJuz, setEditCompletedJuz] = useState(0);
  const [editStatus, setEditStatus] = useState<'ACTIVE' | 'GRADUATED' | 'SUSPENDED'>('ACTIVE');
  const isHeadmaster = currentUser.role === 'HEADMASTER';
  const canManageStudents = currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN' || isHeadmaster;
  const isAdmin = currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN';

  const availableProgrammes = isHeadmaster
    ? programmes.filter(
        (p) =>
          p.id === currentUser.assignedProgrammeId ||
          (p.programme_name_english &&
            currentUser.assignedProgrammeName &&
            p.programme_name_english.toLowerCase() === currentUser.assignedProgrammeName.toLowerCase()) ||
          (p.programme_name &&
            currentUser.assignedProgrammeName &&
            p.programme_name.toLowerCase() === currentUser.assignedProgrammeName.toLowerCase())
      )
    : programmes;

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProgramme = programmes.find((p) => p.id === selectedProgrammeId);
    const targetClass = classes.find((c) => c.id === classId);
    const targetParent = parents.find((p) => p.id === selectedParentId);

    addStudent(
      {
        admissionNo,
        fullName,
        gender,
        dob: '2013-05-10',
        dateEnrolled: new Date().toISOString().split('T')[0],
        programmeId: selectedProgrammeId,
        programmeName: targetProgramme?.programme_name || 'Super Markaz',
        classId: classId,
        className: targetClass?.name || 'Tahfiz Halqa',
        guardianId: targetParent ? targetParent.id : `usr-parent-${Date.now()}`,
        guardianName: targetParent ? targetParent.fullName : guardianName || 'Alhaji Parent',
        guardianPhone: targetParent ? targetParent.phone : guardianPhone || '+234 803 000 0000',
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
      message: `Enrolled ${fullName} (${admissionNo}). Welcome email with portal credentials sent to parent/guardian!`,
    });

    setShowAddModal(false);
    setFullName('');
    setGuardianName('');
    setGuardianPhone('');
    setCustomPassword('');
  };

  const handleDownloadTemplate = () => {
    const headers = "Full Name,Gender,Assigned Programme,Assigned Class,Guardian Phone,Student ID (Optional)\n";
    const sample = "Zaid Ibrahim,MALE,Asubah & Maghrib,Tahfiz Halqa 1,+2348031234567,\n";
    const blob = new Blob([headers + sample], { type: 'text/csv;charset=utf-8;' });
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

      const parsed: Omit<Student, 'id'>[] = [];
      let studentCounter = students.length + 1;

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(',').map((col) => col.trim().replace(/^["']|["']$/g, ''));
        if (row.length < 1 || !row[0]) continue;

        let admNo = '';
        let studentName = '';
        let genderStr = 'MALE';
        let progStr = 'prog-01';
        let classStr = 'Tahfiz Halqa 1';
        let guardianPhone = '+234 803 000 0000';

        if (row[0] && (row[0].toUpperCase().startsWith('MUBK') || row[0].toUpperCase().startsWith('MU-'))) {
          admNo = row[0];
          studentName = row[1] || '';
          genderStr = (row[2] || 'MALE').toUpperCase();
          progStr = row[3] || 'prog-01';
          classStr = row[4] || 'Tahfiz Halqa 1';
          guardianPhone = row[5] || '+234 803 000 0000';
        } else {
          studentName = row[0] || '';
          genderStr = (row[1] || 'MALE').toUpperCase();
          progStr = row[2] || 'prog-01';
          classStr = row[3] || 'Tahfiz Halqa 1';
          guardianPhone = row[4] || '+234 803 000 0000';
          admNo = row[5] || '';
        }

        if (!admNo) {
          admNo = `MUBK-STU-${(studentCounter++).toString().padStart(4, '0')}`;
        }

        const matchedProg = programmes.find(
          (p) =>
            p.id === progStr ||
            p.programme_code?.toLowerCase() === progStr.toLowerCase() ||
            p.programme_name_english?.toLowerCase() === progStr.toLowerCase() ||
            p.programme_name?.toLowerCase() === progStr.toLowerCase()
        );

        const matchedClass = classes.find(
          (c) => c.id === classStr || c.name.toLowerCase() === classStr.toLowerCase()
        );

        parsed.push({
          admissionNo: admNo,
          fullName: studentName,
          gender: genderStr.startsWith('F') ? 'FEMALE' : 'MALE',
          email: `${admNo.toLowerCase()}@markazuumar.edu.ng`,
          dob: '2014-06-15',
          dateEnrolled: new Date().toISOString().split('T')[0],
          programmeId: matchedProg ? matchedProg.id : 'prog-01',
          programmeName: matchedProg ? (matchedProg.programme_name_english || matchedProg.programme_name) : progStr,
          classId: matchedClass ? matchedClass.id : 'cls-tahfiz-1',
          className: matchedClass ? matchedClass.name : classStr,
          guardianId: `usr-parent-${Date.now()}`,
          guardianName: 'Guardian Parent',
          guardianPhone: guardianPhone,
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
      message: `Successfully enrolled ${result.successCount} students. Welcome credentials emailed to parents/guardians!`,
    });
  };

  const handleOpenEdit = (student: Student) => {
    setEditingStudent(student);
    setEditFullName(student.fullName);
    setEditAdmissionNo(student.admissionNo);
    setEditGender(student.gender);
    setEditProgrammeId(student.programmeId || programmes[0]?.id || '');
    setEditClassId(student.classId);
    setEditGuardianName(student.guardianName);
    setEditGuardianPhone(student.guardianPhone);
    setEditCompletedJuz(student.hifzProgress.juzCompleted);
    setEditStatus(student.status);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    const targetProgramme = programmes.find((p) => p.id === editProgrammeId);
    const targetClass = classes.find((c) => c.id === editClassId);

    updateStudent(editingStudent.id, {
      fullName: editFullName,
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

    setEditingStudent(null);
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
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black flex items-center justify-center text-xs border border-emerald-500/30">
            {student.fullName[0]}
          </div>
          <div>
            <div className="text-xs">{student.fullName}</div>
            <div className="text-[10px] text-slate-400 font-mono">{student.admissionNo}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Class / Halqa',
      accessorKey: 'className',
      cell: (student) => (
        <div>
          <div className="font-bold text-slate-800 dark:text-emerald-100 text-xs">{student.className}</div>
          <div className="text-[10px] text-slate-500 dark:text-emerald-400/80">{student.programmeName || 'Asubah & Magrib'}</div>
        </div>
      ),
    },
    {
      header: 'Parent / Guardian',
      cell: (student) => (
        <div>
          <div className="font-bold text-slate-900 dark:text-white text-xs">{student.guardianName}</div>
          <div className="text-[10px] text-slate-500 dark:text-emerald-400/80 flex items-center gap-1 font-mono">
            <Phone className="w-2.5 h-2.5 text-emerald-500" /> {student.guardianPhone}
          </div>
        </div>
      ),
    },
    {
      header: 'Tahfiz Progress',
      cell: (student) => (
        <Badge variant="purple">
          {student.hifzProgress.juzCompleted} / 30 Juz
        </Badge>
      ),
    },
    {
      header: 'Status',
      cell: (student) => (
        <Badge variant={student.status === 'ACTIVE' ? 'emerald' : 'slate'}>
          {student.status}
        </Badge>
      ),
    },
    {
      header: 'Actions',
      cell: (student) => (
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="sm" onClick={() => setSelectedStudent(student)}>
            <Eye className="w-3.5 h-3.5 text-emerald-500" />
          </Button>
          {canManageStudents && (
            <>
              <Button variant="ghost" size="sm" onClick={() => handleOpenEdit(student)}>
                <Edit className="w-3.5 h-3.5 text-sky-500" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => {
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

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <Button variant="secondary" size="md" onClick={handleExportCSV} leftIcon={<Download className="w-4 h-4" />}>
            Export CSV
          </Button>

          {canManageStudents && (
            <>
              {isAdmin && (
                <Button
                  variant="outline"
                  size="md"
                  className="bg-emerald-500/20 text-white hover:bg-emerald-500/30 border-emerald-400/40"
                  onClick={() => setShowBulkModal(true)}
                >
                  Upload CSV
                </Button>
              )}
              <Button
                variant="primary"
                size="md"
                leftIcon={<UserPlus className="w-4 h-4" />}
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white relative text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-800/60 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-500" /> Enrol New Student (Child)
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-3">
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

              <div className="grid grid-cols-2 gap-3">
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
                    {classes
                      .filter((c) => c.programmeId === selectedProgrammeId || !selectedProgrammeId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-emerald-300 font-semibold mb-1">Select Parent / Guardian</label>
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
                  {parents.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.phone})
                    </option>
                  ))}
                </select>
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

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-emerald-800/60">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-emerald-900/60 text-slate-700 dark:text-emerald-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 rounded-3xl w-full max-w-md max-h-[85vh] overflow-y-auto p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white relative text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-800/60 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Edit className="w-5 h-5 text-sky-500" /> Edit Student Details
              </h3>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3">
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

              <div className="grid grid-cols-2 gap-3">
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
                    Class under Programme <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editClassId}
                    onChange={(e) => setEditClassId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-700 rounded-xl p-2 text-slate-900 dark:text-white font-poppins font-bold"
                  >
                    {classes
                      .filter((c) => c.programmeId === editProgrammeId || !editProgrammeId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-emerald-300 font-semibold mb-1">Parent / Guardian Name</label>
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

              <div className="grid grid-cols-2 gap-3">
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

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-emerald-800/60">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-emerald-900/60 text-slate-700 dark:text-emerald-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
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
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl text-slate-900 dark:text-white relative text-xs">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-800/60 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-500" /> Student Profile Details
              </h3>
              <button onClick={() => setSelectedStudent(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-emerald-950/80 border border-slate-200 dark:border-emerald-800/40">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{selectedStudent.fullName}</h4>
                <p className="text-emerald-600 dark:text-emerald-300 font-mono mt-0.5">{selectedStudent.admissionNo} • {selectedStudent.className}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30">
                  <span className="text-[10px] text-purple-700 dark:text-purple-300 font-bold block">Juz Memorized</span>
                  <span className="text-lg font-black text-amber-500">{selectedStudent.hifzProgress.juzCompleted} / 30 Juz</span>
                </div>
                <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-500/30">
                  <span className="text-[10px] text-sky-700 dark:text-sky-300 font-bold block">Akhlaq Rating</span>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedStudent.akhlaqRating}</span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-emerald-950/80 border border-slate-200 dark:border-emerald-800/40 space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Parent / Guardian Info</span>
                <p className="font-semibold text-slate-900 dark:text-white">{selectedStudent.guardianName}</p>
                <p className="text-emerald-600 dark:text-emerald-300 font-mono">{selectedStudent.guardianPhone}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-200 dark:border-emerald-800/60">
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold"
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
    </div>
  );
}
