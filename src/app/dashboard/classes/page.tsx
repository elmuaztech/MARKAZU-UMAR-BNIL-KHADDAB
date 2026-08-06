'use client';

import React, { useState } from 'react';
import { useApp } from '../../../lib/context';
import { SchoolClass } from '@/types';
import { School, Users, UserCheck, Plus, Edit, Trash2, UserX, RefreshCw } from 'lucide-react';
import { BilingualText } from '@/components/ui/BilingualText';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormField';

export default function ClassesPage() {
  const { currentUser, classes, programmes, teachers, addClass, updateClass, deleteClass } = useApp();
  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  const [selectedProgrammeFilter, setSelectedProgrammeFilter] = useState<string>('ALL');

  // Modals state
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [deletingClass, setDeletingClass] = useState<SchoolClass | null>(null);
  const [reassigningTeacherClass, setReassigningTeacherClass] = useState<SchoolClass | null>(null);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Form State
  const [classFormData, setClassFormData] = useState({
    class_name_english: '',
    class_name_arabic: '',
    programmeId: programmes[0]?.id || '',
    section: 'Section A',
    capacity: 30,
    classTeacherId: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const filteredClasses = classes.filter((c) => {
    if (selectedProgrammeFilter === 'ALL') return true;
    return c.programmeId === selectedProgrammeFilter || c.programmeName === selectedProgrammeFilter;
  });

  const getTeacherDetails = (teacherId: string) => {
    if (!teacherId || teacherId === 'NONE' || teacherId === 'UNASSIGNED') {
      return {
        classTeacherId: '',
        classTeacherName: 'Unassigned',
        classTeacherNameArabic: 'غير معين',
      };
    }
    const teacher = teachers.find((t) => t.id === teacherId);
    if (teacher) {
      return {
        classTeacherId: teacher.id,
        classTeacherName: teacher.full_name_english || teacher.fullName,
        classTeacherNameArabic: teacher.full_name_arabic || teacher.fullName,
      };
    }
    return {
      classTeacherId: '',
      classTeacherName: 'Unassigned',
      classTeacherNameArabic: 'غير معين',
    };
  };

  const handleOpenAdd = () => {
    setClassFormData({
      class_name_english: '',
      class_name_arabic: '',
      programmeId: selectedProgrammeFilter !== 'ALL' ? selectedProgrammeFilter : programmes[0]?.id || '',
      section: 'Section A',
      capacity: 30,
      classTeacherId: '',
    });
    setFormError(null);
    setIsAddClassModalOpen(true);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (!classFormData.class_name_english.trim()) throw new Error('Class English Name is required.');
      if (!classFormData.programmeId) throw new Error('Programme selection is required.');

      const prog = programmes.find((p) => p.id === classFormData.programmeId) || programmes[0];
      const teacherDetails = getTeacherDetails(classFormData.classTeacherId);

      addClass({
        class_name_english: classFormData.class_name_english.trim(),
        class_name_arabic: classFormData.class_name_arabic.trim(),
        name: classFormData.class_name_english.trim(),
        category: 'TAHFIZ',
        section: classFormData.section,
        capacity: Number(classFormData.capacity) || 30,
        studentCount: 0,
        programmeId: prog.id,
        programmeName: prog.programme_name_english || prog.programme_name,
        programmeNameArabic: prog.programme_name_arabic,
        ...teacherDetails,
      });

      setIsAddClassModalOpen(false);
      showToast(`Class "${classFormData.class_name_english.trim()}" created successfully!`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to add class.');
    }
  };

  const handleOpenEdit = (c: SchoolClass) => {
    setEditingClass(c);
    setClassFormData({
      class_name_english: c.class_name_english || c.name,
      class_name_arabic: c.class_name_arabic || '',
      programmeId: c.programmeId,
      section: c.section,
      capacity: c.capacity,
      classTeacherId: c.classTeacherId || '',
    });
    setFormError(null);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!editingClass) return;

    try {
      if (!classFormData.class_name_english.trim()) throw new Error('Class English Name is required.');
      const prog = programmes.find((p) => p.id === classFormData.programmeId) || programmes[0];
      const teacherDetails = getTeacherDetails(classFormData.classTeacherId);

      updateClass(editingClass.id, {
        class_name_english: classFormData.class_name_english.trim(),
        class_name_arabic: classFormData.class_name_arabic.trim(),
        name: classFormData.class_name_english.trim(),
        section: classFormData.section,
        capacity: Number(classFormData.capacity) || 30,
        programmeId: prog.id,
        programmeName: prog.programme_name_english || prog.programme_name,
        programmeNameArabic: prog.programme_name_arabic,
        ...teacherDetails,
      });

      setEditingClass(null);
      showToast(`Class "${classFormData.class_name_english.trim()}" updated successfully!`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update class.');
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingClass) return;
    const name = deletingClass.class_name_english || deletingClass.name;
    deleteClass(deletingClass.id);
    setDeletingClass(null);
    showToast(`Class "${name}" deleted completely!`);
  };

  const handleQuickTeacherReassign = (classId: string, teacherId: string) => {
    const teacherDetails = getTeacherDetails(teacherId);
    updateClass(classId, {
      ...teacherDetails,
    });
    showToast(
      teacherId
        ? `Teacher updated successfully for class!`
        : `Class teacher removed (Set to Unassigned).`
    );
    setReassigningTeacherClass(null);
  };

  return (
    <div className="space-y-6 font-sans relative">
      {/* Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl bg-emerald-600 text-white font-poppins font-bold text-xs shadow-2xl flex items-center gap-3 border border-emerald-400/50"
          >
            <div>{toastMessage}</div>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white font-bold text-sm">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#042f1e] via-[#064E3B] to-[#0f5132] text-white border border-emerald-500/40 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-widest font-poppins">
            <School className="w-4 h-4 text-amber-400" /> Academic Classes & Halqas
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-poppins tracking-tight mt-1">Classes Stream & Programme Linkage</h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 font-medium">
            Every class belongs to a specific Master Programme. Manage class streams, capacities, and assigned teachers.
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="warning"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleOpenAdd}
          >
            Add New Class
          </Button>
        )}
      </div>

      {/* Programme Selector Filter */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md flex items-center gap-3 overflow-x-auto">
        <span className="text-xs font-bold font-poppins text-slate-700 dark:text-emerald-300 whitespace-nowrap">
          Filter by Programme:
        </span>
        <button
          onClick={() => setSelectedProgrammeFilter('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold font-poppins transition-all whitespace-nowrap ${
            selectedProgrammeFilter === 'ALL'
              ? 'bg-emerald-600 text-white shadow'
              : 'bg-slate-100 dark:bg-emerald-950/60 text-slate-600 dark:text-emerald-300'
          }`}
        >
          All Programmes ({classes.length})
        </button>
        {programmes.map((prog) => {
          const count = classes.filter((c) => c.programmeId === prog.id || c.programmeName === prog.programme_name).length;
          return (
            <button
              key={prog.id}
              onClick={() => setSelectedProgrammeFilter(prog.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold font-poppins transition-all whitespace-nowrap flex items-center gap-2 ${
                selectedProgrammeFilter === prog.id
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-100 dark:bg-emerald-950/60 text-slate-600 dark:text-emerald-300'
              }`}
            >
              <BilingualText
                english={prog.programme_name_english || prog.programme_name}
                arabic={prog.programme_name_arabic}
                inline
                englishClassName={selectedProgrammeFilter === prog.id ? 'text-white' : ''}
              />
              <span>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClasses.map((c) => (
          <div
            key={c.id}
            className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 space-y-3 shadow-md hover:border-emerald-500 hover:shadow-xl transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold font-poppins uppercase px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                  <BilingualText
                    english={c.programmeName || 'General'}
                    arabic={c.programmeNameArabic}
                    inline
                    arabicClassName="text-[10px] text-amber-600 dark:text-amber-400 font-semibold"
                  />
                </span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{c.section}</span>
              </div>

              <BilingualText
                english={c.class_name_english || c.name}
                arabic={c.class_name_arabic}
                englishClassName="text-base font-bold font-poppins text-slate-900 dark:text-white leading-snug"
                arabicClassName="text-sm font-semibold font-arabic text-amber-600 dark:text-amber-300"
              />

              <div className="pt-3 border-t border-slate-200 dark:border-emerald-800/40 space-y-2 text-xs font-poppins">
                <div className="flex items-center justify-between text-slate-600 dark:text-emerald-200">
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <Users className="w-3.5 h-3.5" /> Enrolled Students:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {c.studentCount} / {c.capacity}
                  </span>
                </div>

                <div className="flex items-start justify-between text-slate-600 dark:text-emerald-200 pt-1">
                  <span className="flex items-center gap-1.5 text-sky-600 dark:text-sky-400 font-medium whitespace-nowrap">
                    <UserCheck className="w-3.5 h-3.5" /> Teacher:
                  </span>
                  <div className="text-right">
                    {c.classTeacherId ? (
                      <BilingualText
                        english={c.classTeacherName}
                        arabic={c.classTeacherNameArabic}
                        englishClassName="font-bold text-slate-800 dark:text-emerald-300 text-xs"
                        arabicClassName="text-[11px] font-semibold text-amber-600 dark:text-amber-400"
                      />
                    ) : (
                      <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                        Unassigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {isAdmin && (
              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-emerald-800/40 text-xs font-poppins font-bold">
                <button
                  onClick={() => setReassigningTeacherClass(c)}
                  className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500 text-sky-600 hover:text-white dark:text-sky-300 transition-colors text-[11px] flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Change Teacher
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(c)}
                    className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white dark:text-amber-300 transition-colors"
                    title="Edit Class Details"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingClass(c)}
                    className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 transition-colors"
                    title="Delete Class"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ADD CLASS MODAL */}
      <AnimatePresence>
        {isAddClassModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 p-6 sm:p-8 text-slate-900 dark:text-white shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-emerald-500/20">
                <h3 className="text-lg font-black font-poppins text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" /> Add New Class
                </h3>
                <button onClick={() => setIsAddClassModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveAdd} className="space-y-3 text-xs font-poppins">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                    Select Programme <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={classFormData.programmeId}
                    onChange={(e) => setClassFormData({ ...classFormData, programmeId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-bold"
                  >
                    {programmes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.programme_name_english || p.programme_name} ({p.programme_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                    Class Name (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dar Abu Bakr As-Siddiq"
                    value={classFormData.class_name_english}
                    onChange={(e) => setClassFormData({ ...classFormData, class_name_english: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                    Class Name (Arabic)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    placeholder="مثال: دار أبي بكر الصديق"
                    value={classFormData.class_name_arabic}
                    onChange={(e) => setClassFormData({ ...classFormData, class_name_arabic: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white dir-rtl text-right font-arabic"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">Section / Room</label>
                    <input
                      type="text"
                      value={classFormData.section}
                      onChange={(e) => setClassFormData({ ...classFormData, section: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">Capacity</label>
                    <input
                      type="number"
                      value={classFormData.capacity}
                      onChange={(e) => setClassFormData({ ...classFormData, capacity: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                    Assign Class Teacher
                  </label>
                  <select
                    value={classFormData.classTeacherId}
                    onChange={(e) => setClassFormData({ ...classFormData, classTeacherId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="">-- Leave Unassigned (No Teacher) --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name_english || t.fullName} {t.full_name_arabic ? `(${t.full_name_arabic})` : ''} - {t.specialization}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-emerald-500/20 font-bold">
                  <button
                    type="button"
                    onClick={() => setIsAddClassModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                  >
                    Save & Create Class
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT CLASS MODAL */}
      <AnimatePresence>
        {editingClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 p-6 sm:p-8 text-slate-900 dark:text-white shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-emerald-500/20">
                <h3 className="text-lg font-black font-poppins text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit className="w-5 h-5 text-amber-500" /> Edit Class Details
                </h3>
                <button onClick={() => setEditingClass(null)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-3 text-xs font-poppins">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                    Select Programme <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={classFormData.programmeId}
                    onChange={(e) => setClassFormData({ ...classFormData, programmeId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-bold"
                  >
                    {programmes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.programme_name_english || p.programme_name} ({p.programme_code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                    Class Name (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={classFormData.class_name_english}
                    onChange={(e) => setClassFormData({ ...classFormData, class_name_english: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                    Class Name (Arabic)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={classFormData.class_name_arabic}
                    onChange={(e) => setClassFormData({ ...classFormData, class_name_arabic: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white dir-rtl text-right font-arabic"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">Section / Room</label>
                    <input
                      type="text"
                      value={classFormData.section}
                      onChange={(e) => setClassFormData({ ...classFormData, section: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">Capacity</label>
                    <input
                      type="number"
                      value={classFormData.capacity}
                      onChange={(e) => setClassFormData({ ...classFormData, capacity: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                    Assign Class Teacher
                  </label>
                  <select
                    value={classFormData.classTeacherId}
                    onChange={(e) => setClassFormData({ ...classFormData, classTeacherId: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-medium"
                  >
                    <option value="">-- Leave Unassigned (No Teacher) --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name_english || t.fullName} {t.full_name_arabic ? `(${t.full_name_arabic})` : ''} - {t.specialization}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-emerald-500/20 font-bold">
                  <button
                    type="button"
                    onClick={() => setEditingClass(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* QUICK CHANGE TEACHER MODAL */}
      <AnimatePresence>
        {reassigningTeacherClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#042419] border border-sky-500/40 p-6 sm:p-8 text-slate-900 dark:text-white shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-emerald-500/20">
                <div className="space-y-0.5">
                  <h3 className="text-lg font-black font-poppins text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-sky-500" /> Change Class Teacher
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-emerald-300/70 font-poppins">
                    Class: <strong>{reassigningTeacherClass.class_name_english || reassigningTeacherClass.name}</strong>
                  </p>
                </div>
                <button onClick={() => setReassigningTeacherClass(null)} className="text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              <div className="space-y-4 text-xs font-poppins">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1.5">
                    Select New Assigned Teacher:
                  </label>
                  <select
                    defaultValue={reassigningTeacherClass.classTeacherId || ''}
                    onChange={(e) => handleQuickTeacherReassign(reassigningTeacherClass.id, e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-bold"
                  >
                    <option value="">-- Leave Unassigned (No Teacher) --</option>
                    {teachers.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.full_name_english || t.fullName} {t.full_name_arabic ? `(${t.full_name_arabic})` : ''} - {t.specialization}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-3 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-700 dark:text-sky-300 text-[11px] leading-relaxed">
                  💡 <strong>Note:</strong> Choosing "Leave Unassigned" will set this class to have no assigned teacher.
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    onClick={() => setReassigningTeacherClass(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE CLASS CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#042419] border border-rose-500/40 p-6 sm:p-8 text-slate-900 dark:text-white shadow-2xl space-y-6 text-center"
            >
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto border border-rose-500/30">
                <Trash2 className="w-7 h-7" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black font-poppins text-slate-900 dark:text-white">
                  Delete Class Permanently?
                </h3>
                <p className="text-xs text-slate-600 dark:text-emerald-200/80 font-poppins">
                  Are you sure you want to permanently delete{' '}
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    "{deletingClass.class_name_english || deletingClass.name}"
                  </span>
                  ?
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2 font-poppins font-bold text-xs">
                <button
                  onClick={() => setDeletingClass(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
                >
                  Confirm Delete Class
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
