'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { PortalTheme } from '@/components/ui/PortalTheme';
import { PortalHeroBanner } from '@/components/ui/PortalHeroBanner';
import { EnterpriseTable, Column } from '@/components/ui/EnterpriseTable';
import { Button, IconButton } from '@/components/ui/ButtonSystem';
import { Subject } from '@/types';
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
  const { subjects, programmes, classes, addSubject, updateSubject, deleteSubject, currentUser } = useApp();

  const [selectedProgrammeFilter, setSelectedProgrammeFilter] = useState<string>('ALL');
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
  const [programmeId, setProgrammeId] = useState('');
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
    setProgrammeId('');
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
    setProgrammeId(subject.programmeId || '');
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
        s.id !== editingSubject?.id &&
        s.code.toLowerCase() === code.toLowerCase() &&
        s.classId === classId
    );

    if (isDuplicate) {
      setErrorMessage(`Subject with code "${code}" already exists in the selected Class.`);
      return;
    }

    const selectedProg = programmes.find((p) => p.id === programmeId);
    const selectedCls = classes.find((c) => c.id === classId);

    if (editingSubject) {
      updateSubject(editingSubject.id, {
        name: nameEnglish,
        nameEnglish,
        arabicName: nameArabic,
        code,
        category,
        description,
        programmeId,
        programmeName: selectedProg?.programme_name || '',
        classId,
        className: selectedCls?.name || '',
        displayOrder,
      });
    } else {
      addSubject({
        name: nameEnglish,
        nameEnglish,
        arabicName: nameArabic,
        code,
        category,
        description,
        programmeId,
        programmeName: selectedProg?.programme_name || '',
        classId,
        className: selectedCls?.name || '',
        status: 'ACTIVE',
        displayOrder,
      });
    }

    setIsModalOpen(false);
  };

  // Filtered Subject List for Table
  const filteredSubjects = subjects.filter((s) => {
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
            <span className="font-mono text-[10px] font-black px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              {item.code}
            </span>
            <span className="font-bold text-slate-900 dark:text-white">{item.name}</span>
          </div>
          {item.arabicName && (
            <p className="font-arabic text-amber-600 dark:text-amber-300 text-[11px] font-semibold">{item.arabicName}</p>
          )}
        </div>
      ),
    },
    {
      header: 'Category',
      cell: (item) => (
        <span
          className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
            item.category === 'TAHFIZ'
              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-300'
              : item.category === 'ISLAMIC'
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300'
              : 'bg-sky-500/15 text-sky-600 dark:text-sky-300'
          }`}
        >
          {item.category}
        </span>
      ),
    },
    {
      header: 'Programme & Class',
      cell: (item) => (
        <div className="text-xs">
          <p className="font-bold text-slate-800 dark:text-emerald-200">{item.programmeName || 'All Programmes'}</p>
          <p className="text-[10px] text-slate-500 dark:text-emerald-300/70">{item.className || 'General Subject'}</p>
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
        (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') ? (
          <div className="flex items-center justify-end gap-1">
            <IconButton icon={<Edit className="w-3.5 h-3.5" />} onClick={() => handleOpenEditModal(item)} />
            <IconButton icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />} onClick={() => deleteSubject(item.id)} />
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
        badgeText="Curriculum & Academic Subjects"
        title="Enterprise Subject Management"
        titleArabic="إدارة المواد الدراسية"
        description="Hierarchical subject catalog organized by Programme & Class streams. Prevents duplicates and maintains standardized curriculum ordering."
        actions={
          (currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
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
          <select
            value={selectedProgrammeFilter}
            onChange={(e) => {
              setSelectedProgrammeFilter(e.target.value);
              setSelectedClassFilter('ALL');
            }}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
          >
            <option value="ALL">All Programmes</option>
            {programmes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.programme_name_english || p.programme_name} ({p.programme_code})
              </option>
            ))}
          </select>

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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-poppins">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-2xl p-6 space-y-5"
          >
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-500/20 pb-3">
              <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-500" />
                {editingSubject ? 'Edit Subject' : 'Add New Subject'}
              </h3>
              <IconButton icon={<X className="w-4 h-4" />} onClick={() => setIsModalOpen(false)} />
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <form onSubmit={handleSaveSubject} className="space-y-4 text-xs font-bold">
              <div className="grid grid-cols-2 gap-3">
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
                  <label className="text-slate-600 dark:text-emerald-300">Arabic Name</label>
                  <input
                    type="text"
                    value={nameArabic}
                    onChange={(e) => setNameArabic(e.target.value)}
                    placeholder="دراسات الحديث"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-arabic"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-600 dark:text-emerald-300">Programme</label>
                  <select
                    value={programmeId}
                    onChange={(e) => {
                      setProgrammeId(e.target.value);
                      setClassId('');
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  >
                    <option value="">-- Optional Programme --</option>
                    {programmes.map((p) => (
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
                    <option value="">-- Optional Class --</option>
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
                  placeholder="Summary of syllabus topics..."
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-emerald-500/20">
                <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" icon={<CheckCircle2 className="w-4 h-4" />}>
                  {editingSubject ? 'Save Changes' : 'Create Subject'}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </PortalTheme>
  );
}
