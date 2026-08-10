'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../../lib/context';
import { SchoolClass } from '@/types';
import { filterClassesForUser } from '../../../lib/rbac';
import { School, Users, UserCheck, Plus, Edit, Trash2, UserX, RefreshCw, FileSpreadsheet } from 'lucide-react';
import { BilingualText } from '@/components/ui/BilingualText';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormField';
import { ImportSchoolStructureModal } from '@/components/classes/ImportSchoolStructureModal';

export default function ClassesPage() {
  const { currentUser, classes, programmes, teachers, students, addClass, updateClass, deleteClass } = useApp();
  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  const [selectedProgrammeFilter, setSelectedProgrammeFilter] = useState<string>('ALL');

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [viewingClass, setViewingClass] = useState<SchoolClass | null>(null);
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
    subcategory: '',
    section: 'Section A',
    capacity: 30,
    classTeacherId: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  const userClasses = filterClassesForUser(currentUser, classes);

  const filteredClasses = userClasses.filter((c) => {
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
    const defaultProgId = selectedProgrammeFilter !== 'ALL' ? selectedProgrammeFilter : programmes[0]?.id || '';
    const targetProg = programmes.find((p) => p.id === defaultProgId);
    setClassFormData({
      class_name_english: '',
      class_name_arabic: '',
      programmeId: defaultProgId,
      subcategory: (targetProg?.subcategories && targetProg.subcategories[0]) || '',
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
        section: classFormData.subcategory || classFormData.section,
        subcategory: classFormData.subcategory || undefined,
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
      subcategory: c.subcategory || '',
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
        section: classFormData.subcategory || classFormData.section,
        subcategory: classFormData.subcategory || undefined,
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
    <div className="space-y-6 font-poppins text-slate-900 dark:text-slate-100 selection:bg-emerald-500 selection:text-white">
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

      {/* Header (Exact match to Image 2: 🏫 Classes Management) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏫</span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Classes Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-emerald-300/80 mt-0.5 font-medium">
            Organize and manage school classes
          </p>
        </div>

        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="md"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl shadow-lg flex items-center gap-2"
              leftIcon={<FileSpreadsheet className="w-4 h-4" />}
              onClick={() => setIsImportModalOpen(true)}
            >
              Import Classes & Teachers (Excel)
            </Button>

            <Button
              variant="primary"
              size="md"
              className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/20"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleOpenAdd}
            >
              + Add New Class
            </Button>
          </div>
        )}
      </div>

      {/* Programme Filter Tabs */}
      <div className="p-3.5 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-800/40 shadow-xs flex items-center gap-2 overflow-x-auto">
        <button
          onClick={() => setSelectedProgrammeFilter('ALL')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            selectedProgrammeFilter === 'ALL'
              ? 'bg-emerald-700 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-emerald-950/60 text-slate-600 dark:text-emerald-300 hover:bg-slate-200'
          }`}
        >
          All Classes ({classes.length})
        </button>
        {programmes.map((prog) => {
          const count = classes.filter((c) => c.programmeId === prog.id || c.programmeName === prog.programme_name).length;
          return (
            <button
              key={prog.id}
              onClick={() => setSelectedProgrammeFilter(prog.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedProgrammeFilter === prog.id
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-emerald-950/60 text-slate-600 dark:text-emerald-300 hover:bg-slate-200'
              }`}
            >
              {prog.programme_name_english || prog.programme_name} ({count})
            </button>
          );
        })}
      </div>

      {/* Grid of Class Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredClasses.map((c) => {
          const teacherName = c.classTeacherName && c.classTeacherName !== 'Unassigned' ? c.classTeacherName : 'Not assigned';

          return (
            <div
              key={c.id}
              className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-800/40 shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition-all"
            >
              {/* Card Header with official Islamic Emerald Green gradient */}
              <div className="p-5 bg-gradient-to-r from-[#042f1e] via-[#064E3B] to-[#0f5132] text-white flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">
                    {c.class_name_english || c.name}
                  </h3>
                  <p className="text-xs text-emerald-100/90 font-semibold mt-0.5">
                    {c.section || 'Section A'}
                  </p>
                </div>

                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 font-extrabold text-[10px] flex items-center gap-1 shadow-xs">
                  ✓ Active
                </span>
              </div>

              {/* Card Body */}
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2.5">
                  {/* Box 1: Class Teacher */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-900/30 space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      CLASS TEACHER
                    </span>
                    <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                      {teacherName}
                    </p>
                  </div>

                  {/* Box 2: Students Enrolled */}
                  <div className="p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/30 space-y-0.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      STUDENTS ENROLLED
                    </span>
                    <p className="text-xs font-bold text-slate-800 dark:text-white">
                      <span className="text-sm font-black text-emerald-700 dark:text-emerald-300">{c.studentCount || 0}</span> / {c.capacity || 40}
                    </p>
                  </div>
                </div>

                {/* Bottom Action Buttons: [👁 View] [✏️ Edit] */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    onClick={() => setViewingClass(c)}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                  >
                    <span>👁 View</span>
                  </button>

                  {isAdmin && (
                    <button
                      onClick={() => handleOpenEdit(c)}
                      className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-emerald-950/60 hover:bg-slate-200 dark:hover:bg-emerald-900 text-slate-700 dark:text-emerald-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200 dark:border-emerald-800/40 transition-all"
                    >
                      <span className="text-amber-500">✏️</span>
                      <span>Edit</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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
                    onChange={(e) => {
                      const pId = e.target.value;
                      const prog = programmes.find((p) => p.id === pId);
                      setClassFormData({
                        ...classFormData,
                        programmeId: pId,
                        subcategory: (prog?.subcategories && prog.subcategories[0]) || '',
                      });
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-bold"
                  >
                    {programmes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.programme_name_english || p.programme_name} ({p.programme_code})
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const selProg = programmes.find((p) => p.id === classFormData.programmeId);
                  if (selProg && selProg.hasSubcategories && selProg.subcategories && selProg.subcategories.length > 0) {
                    return (
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                          Subcategory <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={classFormData.subcategory}
                          onChange={(e) => setClassFormData({ ...classFormData, subcategory: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-bold"
                        >
                          {selProg.subcategories.map((sub, idx) => (
                            <option key={idx} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  return null;
                })()}

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
                        {t.full_name_english || t.fullName} {t.full_name_arabic ? `(${t.full_name_arabic})` : ''} ({t.staffNo})
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
                    onChange={(e) => {
                      const pId = e.target.value;
                      const prog = programmes.find((p) => p.id === pId);
                      setClassFormData({
                        ...classFormData,
                        programmeId: pId,
                        subcategory: (prog?.subcategories && prog.subcategories[0]) || '',
                      });
                    }}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-bold"
                  >
                    {programmes.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.programme_name_english || p.programme_name} ({p.programme_code})
                      </option>
                    ))}
                  </select>
                </div>

                {(() => {
                  const selProg = programmes.find((p) => p.id === classFormData.programmeId);
                  if (selProg && selProg.hasSubcategories && selProg.subcategories && selProg.subcategories.length > 0) {
                    return (
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                          Subcategory <span className="text-rose-500">*</span>
                        </label>
                        <select
                          value={classFormData.subcategory}
                          onChange={(e) => setClassFormData({ ...classFormData, subcategory: e.target.value })}
                          className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-bold"
                        >
                          {selProg.subcategories.map((sub, idx) => (
                            <option key={idx} value={sub}>
                              {sub}
                            </option>
                          ))}
                        </select>
                      </div>
                    );
                  }
                  return null;
                })()}

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
                        {t.full_name_english || t.fullName} {t.full_name_arabic ? `(${t.full_name_arabic})` : ''} ({t.staffNo})
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
                        {t.full_name_english || t.fullName} {t.full_name_arabic ? `(${t.full_name_arabic})` : ''} ({t.staffNo})
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

      {/* VIEW CLASS DETAILS & STUDENT ROSTER MODAL */}
      <Modal
        isOpen={!!viewingClass}
        onClose={() => setViewingClass(null)}
        title={`Class Details & Roster: ${viewingClass?.class_name_english || viewingClass?.name || ''}`}
        titleArabic={viewingClass?.class_name_arabic}
        maxWidth="2xl"
      >
        {viewingClass && (() => {
          const classStudents = students.filter(
            (s) => s.classId === viewingClass.id || s.className === viewingClass.class_name_english || s.className === viewingClass.name
          );
          const teacherName = viewingClass.classTeacherName && viewingClass.classTeacherName !== 'Unassigned' ? viewingClass.classTeacherName : 'Not assigned';

          return (
            <div className="space-y-5 text-xs text-slate-900 dark:text-slate-100 font-poppins">
              {/* Header Badges */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-700 dark:text-emerald-400">Class Teacher</span>
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{teacherName}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-sky-700 dark:text-sky-400">Enrolled Enrollment</span>
                  <p className="font-bold text-sm text-slate-900 dark:text-white">{classStudents.length} / {viewingClass.capacity || 40} Students</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/40 space-y-1">
                  <span className="text-[10px] font-extrabold uppercase text-amber-700 dark:text-amber-400">Programme</span>
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{viewingClass.programmeName || 'General Islamiyya'}</p>
                </div>
              </div>

              {/* Students Roster List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-black uppercase text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-emerald-500" /> Enrolled Students ({classStudents.length})
                  </h4>
                  <Link
                    href={`/dashboard/students?classId=${viewingClass.id}`}
                    onClick={() => setViewingClass(null)}
                    className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    Manage All Students →
                  </Link>
                </div>

                {classStudents.length === 0 ? (
                  <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-dashed border-slate-300 dark:border-emerald-800/40 text-center text-slate-500 dark:text-emerald-300/70">
                    No students currently enrolled in this class.
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200 dark:border-emerald-800/40 divide-y divide-slate-100 dark:divide-emerald-900/30">
                    {classStudents.map((st) => (
                      <div key={st.id} className="p-3 bg-white dark:bg-[#042419] flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-emerald-950/50">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-xs shrink-0">
                            {st.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-slate-900 dark:text-white truncate">{st.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-mono">{st.admissionNo} • Guardian: {st.guardianName}</p>
                          </div>
                        </div>

                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 text-[10px] font-bold shrink-0">
                          Active
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-emerald-800/40">
                {isAdmin && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const cls = viewingClass;
                      setViewingClass(null);
                      handleOpenEdit(cls);
                    }}
                    leftIcon={<Edit className="w-4 h-4" />}
                  >
                    Edit Class Details
                  </Button>
                )}
                <Button variant="secondary" size="sm" onClick={() => setViewingClass(null)}>
                  Close
                </Button>
              </div>
            </div>
          );
        })()}
      </Modal>

      {/* School Structure Excel Import Modal */}
      <ImportSchoolStructureModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          showToast('School structure successfully imported from Excel file!');
        }}
      />
    </div>
  );
}
