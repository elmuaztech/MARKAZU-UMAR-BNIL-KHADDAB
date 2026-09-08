'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { PortalTheme } from '@/components/ui/PortalTheme';
import { PortalHeroBanner } from '@/components/ui/PortalHeroBanner';
import { EnterpriseTable, Column } from '@/components/ui/EnterpriseTable';
import { Button, IconButton } from '@/components/ui/ButtonSystem';
import { Subject } from '@/types';
import { filterSubjectsForUser } from '@/lib/rbac';
import {
  BookOpen,
  Plus,
  Edit,
  Trash2,
  Filter,
  CheckCircle2,
  AlertTriangle,
  X,
  Layers,
  School,
  Sparkles,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function SubjectsPage() {
  const { subjects, programmes, classes, addSubject, updateSubject, deleteSubject, currentUser, showConfirm } = useApp();

  const isHeadmaster = currentUser.role === 'HEADMASTER';
  const canManage = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'HEADMASTER';

  const userProgrammes = isHeadmaster
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

  const [selectedProgrammeFilter, setSelectedProgrammeFilter] = useState<string>(
    isHeadmaster && userProgrammes[0]?.id ? userProgrammes[0].id : 'ALL'
  );
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);

  // Form Fields
  const [nameEnglish, setNameEnglish] = useState('');
  const [nameArabic, setNameArabic] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState<'TAHFIZ' | 'ISLAMIC' | 'GENERAL'>('ISLAMIC');
  const [description, setDescription] = useState('');
  const [programmeId, setProgrammeId] = useState(isHeadmaster && userProgrammes[0]?.id ? userProgrammes[0].id : '');
  const [classId, setClassId] = useState('');
  const [displayOrder, setDisplayOrder] = useState(1);
  const [errorMessage, setErrorMessage] = useState('');

  // Dynamically filter classes based on selected Programme in modal form
  const modalClasses = classes.filter(
    (c) => !programmeId || c.programmeId === programmeId
  );

  const handleOpenAddModal = () => {
    setEditingSubject(null);
    setNameEnglish('');
    setNameArabic('');
    setCode('');
    setCategory('ISLAMIC');
    setDescription('');
    setProgrammeId(isHeadmaster && userProgrammes[0]?.id ? userProgrammes[0].id : '');
    setClassId('');
    setDisplayOrder(1);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setNameEnglish(subject.nameEnglish || subject.name);
    setNameArabic(subject.arabicName || '');
    setCode(subject.code);
    setCategory(subject.category);
    setDescription(subject.description);
    setProgrammeId(subject.programmeId || (isHeadmaster && userProgrammes[0]?.id ? userProgrammes[0].id : ''));
    setClassId(subject.classId || '');
    setDisplayOrder(subject.displayOrder || 1);
    setErrorMessage('');
    setIsModalOpen(true);
  };

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!nameEnglish || !code) {
      setErrorMessage('English Name and Subject Code are required.');
      return;
    }

    // Duplicate Code Validation inside the same Programme/Class
    const isDuplicate = subjects.some(
      (s) =>
        s.code.toLowerCase() === code.trim().toLowerCase() &&
        s.programmeId === programmeId &&
        s.id !== editingSubject?.id
    );

    if (isDuplicate) {
      setErrorMessage(`Subject code '${code.toUpperCase()}' already exists in this programme.`);
      return;
    }

    if (editingSubject) {
      updateSubject(editingSubject.id, {
        name: nameEnglish,
        nameEnglish,
        arabicName: nameArabic,
        code: code.toUpperCase(),
        category,
        description,
        programmeId,
        classId,
        displayOrder,
      });
    } else {
      addSubject({
        name: nameEnglish,
        nameEnglish,
        arabicName: nameArabic,
        code: code.toUpperCase(),
        category,
        description,
        programmeId,
        classId,
        status: 'ACTIVE',
        displayOrder,
      });
    }

    setIsModalOpen(false);
  };

  const userSubjects = filterSubjectsForUser(currentUser, subjects);

  // Filtered Subject List for Table
  const filteredSubjects = userSubjects.filter((s) => {
    const matchesProgramme = selectedProgrammeFilter === 'ALL' || s.programmeId === selectedProgrammeFilter;
    const matchesClass = selectedClassFilter === 'ALL' || s.classId === selectedClassFilter;
    return matchesProgramme && matchesClass;
  });

  const columns: Column<Subject>[] = [
    {
      header: 'Subject & Code',
      cell: (item) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white font-poppins">{item.nameEnglish || item.name}</span>
            <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
              {item.code}
            </span>
          </div>
          {item.arabicName && (
            <p className="text-xs text-amber-600 dark:text-amber-400 font-arabic font-semibold">{item.arabicName}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Programme & Class',
      cell: (item) => {
        const prog = programmes.find((p) => p.id === item.programmeId);
        const cls = classes.find((c) => c.id === item.classId);
        return (
          <div className="space-y-0.5 text-xs">
            <p className="font-semibold text-slate-700 dark:text-emerald-200">
              {prog ? prog.programme_name_english || prog.programme_name : 'All Programmes'}
            </p>
            <p className="text-[11px] text-slate-500 dark:text-emerald-400/80">
              {cls ? cls.name : 'All Class Streams'}
            </p>
          </div>
        );
      },
    },
    {
      header: 'Category',
      cell: (item) => (
        <div className="flex items-center gap-1">
          <span
            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase ${
              item.category === 'TAHFIZ'
                ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                : item.category === 'ISLAMIC'
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                : 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
            }`}
          >
            {item.category}
          </span>
        </div>
      ),
    },
    {
      header: 'Status',
      cell: (item) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
            item.status === 'ACTIVE'
              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
          }`}
        >
          {item.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      cell: (item) => (
        canManage ? (
          <div className="flex items-center justify-end gap-1">
            <IconButton icon={<Edit className="w-3.5 h-3.5" />} onClick={() => handleOpenEditModal(item)} />
            <IconButton
              icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              onClick={() =>
                showConfirm({
                  title: 'Confirm Permanent Subject Deletion',
                  message: `Are you sure you want to permanently delete subject "${item.name}" (${item.code})? It cannot be recovered!`,
                  confirmText: 'Yes, Delete Permanently',
                  cancelText: 'Cancel',
                  variant: 'danger',
                  onConfirm: () => deleteSubject(item.id),
                })
              }
            />
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 font-semibold uppercase">View Only</span>
        )
      ),
    },
  ];

  return (
    <PortalTheme>
      <PortalHeroBanner
        badgeText={isHeadmaster ? `Section Curriculum (${currentUser.assignedProgrammeName || 'My Section'})` : "Curriculum & Academic Subjects"}
        title={isHeadmaster ? "Section Subject Management" : "Enterprise Subject Management"}
        titleArabic="إدارة المواد الدراسية"
        description={
          isHeadmaster
            ? `Standardized subject catalog and curriculum structure for ${currentUser.assignedProgrammeName || 'your assigned section'}.`
            : "Hierarchical subject catalog organized by Programme & Class streams. Prevents duplicates and maintains standardized curriculum ordering."
        }
        actions={
          canManage && (
            <Button variant="primary" icon={<Plus className="w-4 h-4" />} onClick={handleOpenAddModal}>
              Create Subject
            </Button>
          )
        }
      />

      {/* Cascading Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-bold font-poppins">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-500" />
          <span>Filter Subjects:</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {!isHeadmaster && (
            <select
              value={selectedProgrammeFilter}
              onChange={(e) => {
                setSelectedProgrammeFilter(e.target.value);
                setSelectedClassFilter('ALL');
              }}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
            >
              <option value="ALL">All Programmes</option>
              {userProgrammes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.programme_name_english || p.programme_name} ({p.programme_code})
                </option>
              ))}
            </select>
          )}

          <select
            value={selectedClassFilter}
            onChange={(e) => setSelectedClassFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
          >
            <option value="ALL">All Classes</option>
            {classes
              .filter((c) => selectedProgrammeFilter === 'ALL' || c.programmeId === selectedProgrammeFilter)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      {/* Subject Enterprise Table */}
      <EnterpriseTable
        title="Subject Master Roster"
        subtitle={`Showing ${filteredSubjects.length} subjects`}
        columns={columns}
        data={filteredSubjects}
        searchPlaceholder="Search subject name, code, description..."
      />

      {/* Add / Edit Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md font-poppins">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-2xl"
          >
            {/* Header (Fixed) */}
            <div className="shrink-0 p-5 sm:p-6 flex items-center justify-between border-b border-slate-200 dark:border-emerald-500/20">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-500" />
                {editingSubject ? 'Edit Subject Details' : 'Create New Academic Subject'}
              </h3>
              <IconButton icon={<X className="w-4 h-4" />} onClick={() => setIsModalOpen(false)} />
            </div>

            {/* Body (Scrollable) */}
            <form onSubmit={handleSaveSubject} className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-4 text-xs font-bold">
                {errorMessage && (
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-600 dark:text-emerald-300">English Name *</label>
                    <input
                      type="text"
                      required
                      value={nameEnglish}
                      onChange={(e) => setNameEnglish(e.target.value)}
                      placeholder="e.g. Hadith Studies"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-600 dark:text-emerald-300">Arabic Name (Optional)</label>
                    <input
                      type="text"
                      value={nameArabic}
                      onChange={(e) => setNameArabic(e.target.value)}
                      placeholder="دراسات الحديث"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-arabic"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-600 dark:text-emerald-300">Subject Code *</label>
                    <input
                      type="text"
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      placeholder="e.g. HDS101"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-mono uppercase"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-600 dark:text-emerald-300">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value as 'TAHFIZ' | 'ISLAMIC' | 'GENERAL')}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    >
                      <option value="TAHFIZ">TAHFIZ</option>
                      <option value="ISLAMIC">ISLAMIC</option>
                      <option value="GENERAL">GENERAL</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-slate-600 dark:text-emerald-300">
                      Programme {isHeadmaster && <span className="text-[10px] text-emerald-500 font-bold">(Locked to assigned section)</span>}
                    </label>
                    <select
                      disabled={isHeadmaster}
                      value={programmeId}
                      onChange={(e) => {
                        if (!isHeadmaster) {
                          setProgrammeId(e.target.value);
                          setClassId('');
                        }
                      }}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {!isHeadmaster && <option value="">-- Optional Programme --</option>}
                      {userProgrammes.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.programme_name_english || p.programme_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-slate-600 dark:text-emerald-300">Class</label>
                    <select
                      value={classId}
                      onChange={(e) => setClassId(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    >
                      <option value="">-- Optional Specific Class --</option>
                      {modalClasses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-emerald-300">Description</label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Curriculum summary and learning objectives..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Footer (Fixed) */}
              <div className="shrink-0 p-4 sm:p-5 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-emerald-500/20 bg-slate-50/50 dark:bg-[#021810]">
                <Button variant="ghost" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" type="submit">
                  {editingSubject ? 'Update Subject' : 'Create Subject'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </PortalTheme>
  );
}
