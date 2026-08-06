'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { Programme, SchoolClass } from '@/types';
import {
  Layers,
  Plus,
  Search,
  Edit,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  BookOpen,
  GraduationCap,
  Users,
  ShieldAlert,
  Sparkles,
  ArrowUpRight,
  School,
  UserCheck,
  UserX,
  UserPlus,
  RefreshCw,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BilingualText } from '@/components/ui/BilingualText';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormField';

export default function ProgrammesPage() {
  const {
    currentUser,
    programmes,
    classes,
    students,
    teachers,
    addProgramme,
    updateProgramme,
    toggleProgrammeStatus,
    deleteProgramme,
    addClass,
    updateClass,
    deleteClass,
  } = useApp();

  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');

  // Modals state for Programme
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState<Programme | null>(null);
  const [viewingProgramme, setViewingProgramme] = useState<Programme | null>(null);
  const [deletingProgramme, setDeletingProgramme] = useState<Programme | null>(null);

  // Modals state for Class under Programme
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [deletingClass, setDeletingClass] = useState<SchoolClass | null>(null);
  const [reassigningTeacherClass, setReassigningTeacherClass] = useState<SchoolClass | null>(null);

  // Toast Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Programme Form State
  const [formData, setFormData] = useState({
    programme_name_english: '',
    programme_name_arabic: '',
    programme_code: '',
    description: '',
    status: 'Active' as 'Active' | 'Inactive',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Class Form State
  const [classFormData, setClassFormData] = useState({
    class_name_english: '',
    class_name_arabic: '',
    programmeId: '',
    section: 'Section A',
    capacity: 30,
    classTeacherId: '', // '' for unassigned
  });
  const [classFormError, setClassFormError] = useState<string | null>(null);

  const filteredProgrammes = programmes.filter((p) => {
    const matchesSearch =
      (p.programme_name_english || p.programme_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.programme_name_arabic || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.programme_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Helper for teacher mapping
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

  // PROGRAMME HANDLERS
  const handleOpenAddModal = () => {
    setFormData({
      programme_name_english: '',
      programme_name_arabic: '',
      programme_code: '',
      description: '',
      status: 'Active',
    });
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (prog: Programme) => {
    setEditingProgramme(prog);
    setFormData({
      programme_name_english: prog.programme_name_english || prog.programme_name,
      programme_name_arabic: prog.programme_name_arabic || '',
      programme_code: prog.programme_code,
      description: prog.description,
      status: prog.status,
    });
    setFormError(null);
  };

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (!formData.programme_name_english.trim()) throw new Error('Programme English Name is required.');
      if (!formData.programme_code.trim()) throw new Error('Programme Code is required.');

      addProgramme({
        programme_name_english: formData.programme_name_english.trim(),
        programme_name_arabic: formData.programme_name_arabic.trim(),
        programme_name: formData.programme_name_english.trim(),
        programme_code: formData.programme_code.trim().toUpperCase(),
        description: formData.description.trim(),
        status: formData.status,
      });

      setIsAddModalOpen(false);
      showToast(`Programme "${formData.programme_name_english.trim()}" added successfully!`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to add Programme.');
    }
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!editingProgramme) return;
    try {
      if (!formData.programme_name_english.trim()) throw new Error('Programme English Name is required.');
      if (!formData.programme_code.trim()) throw new Error('Programme Code is required.');

      updateProgramme(editingProgramme.id, {
        programme_name_english: formData.programme_name_english.trim(),
        programme_name_arabic: formData.programme_name_arabic.trim(),
        programme_name: formData.programme_name_english.trim(),
        programme_code: formData.programme_code.trim().toUpperCase(),
        description: formData.description.trim(),
        status: formData.status,
      });

      setEditingProgramme(null);
      showToast(`Programme "${formData.programme_name_english.trim()}" updated successfully!`);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update Programme.');
    }
  };

  const handleToggleStatus = (prog: Programme) => {
    toggleProgrammeStatus(prog.id);
    const newStatus = prog.status === 'Active' ? 'Inactive' : 'Active';
    showToast(`Programme status changed to "${newStatus}"!`);
  };

  const handleConfirmDelete = () => {
    if (!deletingProgramme) return;
    const name = deletingProgramme.programme_name_english || deletingProgramme.programme_name;
    deleteProgramme(deletingProgramme.id);
    setDeletingProgramme(null);
    if (viewingProgramme?.id === deletingProgramme.id) {
      setViewingProgramme(null);
    }
    showToast(`Programme "${name}" deleted completely!`);
  };

  // CLASS HANDLERS UNDER PROGRAMME
  const handleOpenAddClass = (progId?: string) => {
    const targetProg = progId ? programmes.find((p) => p.id === progId) : viewingProgramme || programmes[0];
    setClassFormData({
      class_name_english: '',
      class_name_arabic: '',
      programmeId: targetProg?.id || programmes[0]?.id || '',
      section: 'Section A',
      capacity: 30,
      classTeacherId: '',
    });
    setClassFormError(null);
    setIsAddClassModalOpen(true);
  };

  const handleSaveAddClass = (e: React.FormEvent) => {
    e.preventDefault();
    setClassFormError(null);
    try {
      if (!classFormData.class_name_english.trim()) throw new Error('Class English Name is required.');
      if (!classFormData.programmeId) throw new Error('Please select a Programme for this class.');

      const prog = programmes.find((p) => p.id === classFormData.programmeId) || viewingProgramme || programmes[0];
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
      setClassFormError(err.message || 'Failed to add class.');
    }
  };

  const handleOpenEditClass = (c: SchoolClass) => {
    setEditingClass(c);
    setClassFormData({
      class_name_english: c.class_name_english || c.name,
      class_name_arabic: c.class_name_arabic || '',
      programmeId: c.programmeId,
      section: c.section,
      capacity: c.capacity,
      classTeacherId: c.classTeacherId || '',
    });
    setClassFormError(null);
  };

  const handleSaveEditClass = (e: React.FormEvent) => {
    e.preventDefault();
    setClassFormError(null);
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
      setClassFormError(err.message || 'Failed to update class.');
    }
  };

  const handleConfirmDeleteClass = () => {
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
        : `Class teacher removed (Class is now Unassigned).`
    );
    setReassigningTeacherClass(null);
  };

  return (
    <div className="space-y-6 font-sans relative">
      {/* Interactive Top Banners & Alerts */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-5 right-5 z-50 px-5 py-3.5 rounded-2xl bg-emerald-600 text-white font-poppins font-bold text-xs shadow-2xl flex items-center gap-3 border border-emerald-400/50"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-spin" />
            <div className="flex-1">{toastMessage}</div>
            <button onClick={() => setToastMessage(null)} className="text-white/80 hover:text-white font-bold text-sm">
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-[#042f1e] via-[#064e3b] to-[#0f5132] p-6 rounded-3xl text-white shadow-2xl border border-emerald-500/40">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="bg-emerald-500/30 text-emerald-200 text-[10px] font-extrabold uppercase px-3 py-1 rounded-xl border border-emerald-400/40 font-poppins">
              Academic Structure & Governance
            </span>
            <span className="bg-amber-500/25 text-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-xl border border-amber-400/40 font-poppins">
              Master Entity
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-poppins text-white flex items-center gap-2">
            <Layers className="w-7 h-7 text-emerald-400" /> Programmes Management
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 font-medium">
            Click any programme to open its classes immediately, manage curriculum, assign teachers, or add new classes.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="success"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => handleOpenAddClass()}
            >
              Add New Class
            </Button>
            <Button
              variant="warning"
              size="md"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => handleOpenAddModal()}
            >
              Add New Programme
            </Button>
          </div>
        )}
      </div>

      {!isAdmin ? (
        <div className="p-8 rounded-3xl bg-white dark:bg-[#042419] border border-rose-500/30 text-center space-y-3">
          <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold font-poppins text-slate-900 dark:text-white">Access Restricted</h2>
          <p className="text-xs text-slate-500 dark:text-emerald-200/80 max-w-md mx-auto">
            Programmes Master configuration is restricted to Super Administrators and Administrators.
          </p>
        </div>
      ) : (
        <>
          {/* Animated Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-lg hover:shadow-2xl hover:shadow-emerald-500/20 dark:hover:shadow-emerald-400/20 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-poppins text-xs font-bold text-slate-700 dark:text-emerald-300 uppercase tracking-wider">Total Programmes</span>
                <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shadow-inner">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black font-poppins mt-3 text-slate-900 dark:text-white">{programmes.length}</p>
              <p className="text-[11px] text-slate-500 dark:text-emerald-300/70 mt-1 font-medium">Master Academic Programs</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-lg hover:shadow-2xl hover:shadow-sky-500/20 dark:hover:shadow-sky-400/20 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-poppins text-xs font-bold text-slate-700 dark:text-sky-300 uppercase tracking-wider">Active Programmes</span>
                <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 shadow-inner">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black font-poppins mt-3 text-slate-900 dark:text-white">
                {programmes.filter((p) => p.status === 'Active').length}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-sky-300/70 mt-1 font-medium">Currently Enrolling & Running</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-lg hover:shadow-2xl hover:shadow-purple-500/20 dark:hover:shadow-purple-400/20 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-poppins text-xs font-bold text-slate-700 dark:text-purple-300 uppercase tracking-wider">Linked Classes</span>
                <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 shadow-inner">
                  <School className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black font-poppins mt-3 text-slate-900 dark:text-white">{classes.length}</p>
              <p className="text-[11px] text-slate-500 dark:text-purple-300/70 mt-1 font-medium">Classes Assigned across Programs</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-lg hover:shadow-2xl hover:shadow-amber-500/20 dark:hover:shadow-amber-400/20 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-poppins text-xs font-bold text-slate-700 dark:text-amber-300 uppercase tracking-wider">Enrolled Students</span>
                <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shadow-inner">
                  <GraduationCap className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black font-poppins mt-3 text-slate-900 dark:text-white">{students.length}</p>
              <p className="text-[11px] text-slate-500 dark:text-amber-300/70 mt-1 font-medium">Total Student Enrolments</p>
            </motion.div>
          </div>

          {/* Quick Programme Interactive Grid for Direct Clicking */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black font-poppins text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-500" /> Click Any Programme to Open Classes
                </h2>
                <p className="text-xs text-slate-500 dark:text-emerald-300/70">
                  Select a programme card below to immediately view, edit, add, or reassign teachers to its classes.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                4 Default Programmes
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {programmes.map((prog) => {
                const progClasses = classes.filter((c) => c.programmeId === prog.id || c.programmeName === prog.programme_name);
                const progStudents = students.filter((s) => s.programmeId === prog.id || s.programmeName === prog.programme_name);

                return (
                  <motion.div
                    key={prog.id}
                    whileHover={{ y: -5, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setViewingProgramme(prog)}
                    className="p-5 rounded-3xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#021810] dark:to-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md hover:border-amber-500 hover:shadow-xl transition-all cursor-pointer space-y-3 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                        {prog.programme_code}
                      </span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-300">
                        {prog.status}
                      </span>
                    </div>

                    <BilingualText
                      english={prog.programme_name_english || prog.programme_name}
                      arabic={prog.programme_name_arabic}
                      englishClassName="font-poppins font-black text-base text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors"
                      arabicClassName="font-arabic font-semibold text-xs text-amber-600 dark:text-amber-300"
                    />

                    <div className="pt-2 border-t border-slate-200 dark:border-emerald-800/40 flex items-center justify-between text-xs font-bold font-poppins">
                      <span className="text-purple-600 dark:text-purple-300">{progClasses.length} Classes</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{progStudents.length} Students</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Programmes List Table */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search programmes by name, code, or description..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500 dark:text-emerald-300/80">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="py-1.5 px-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Active">Active Only</option>
                  <option value="Inactive">Inactive Only</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-poppins">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-emerald-500/20 text-slate-600 dark:text-emerald-300/80 font-bold uppercase text-[10px]">
                    <th className="py-3.5 px-4">Code</th>
                    <th className="py-3.5 px-4">Programme Name</th>
                    <th className="py-3.5 px-4">Description</th>
                    <th className="py-3.5 px-4">Linked Classes</th>
                    <th className="py-3.5 px-4">Enrolled Students</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-emerald-500/10">
                  {filteredProgrammes.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-emerald-300/60">
                        No programmes match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredProgrammes.map((prog) => {
                      const linkedClasses = classes.filter(
                        (c) => c.programmeId === prog.id || c.programmeName === prog.programme_name
                      );
                      const linkedStudents = students.filter(
                        (s) => s.programmeId === prog.id || s.programmeName === prog.programme_name
                      );

                      return (
                        <tr
                          key={prog.id}
                          className="hover:bg-slate-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                          onClick={() => setViewingProgramme(prog)}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                            {prog.programme_code}
                          </td>
                          <td className="py-3.5 px-4">
                            <BilingualText
                              english={prog.programme_name_english || prog.programme_name}
                              arabic={prog.programme_name_arabic}
                            />
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 dark:text-emerald-200/80 max-w-xs truncate">
                            {prog.description}
                          </td>
                          <td className="py-3.5 px-4 font-poppins font-semibold text-purple-600 dark:text-purple-300">
                            {linkedClasses.length} Classes
                          </td>
                          <td className="py-3.5 px-4 font-poppins font-semibold text-emerald-600 dark:text-emerald-300">
                            {linkedStudents.length} Students
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-poppins font-extrabold uppercase ${
                                prog.status === 'Active'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {prog.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5 font-poppins text-xs">
                              <button
                                onClick={() => setViewingProgramme(prog)}
                                className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500 text-sky-600 hover:text-white dark:text-sky-300 font-bold transition-colors flex items-center gap-1"
                                title="Open Programme & Manage Classes"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Open Classes</span>
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(prog)}
                                className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white dark:text-amber-300 transition-colors"
                                title="Edit Programme"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(prog)}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                                  prog.status === 'Active'
                                    ? 'bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white'
                                }`}
                              >
                                {prog.status === 'Active' ? 'Deactivate' : 'Activate'}
                              </button>
                              <button
                                onClick={() => setDeletingProgramme(prog)}
                                className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400 transition-colors"
                                title="Delete Programme Completely"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ADD PROGRAMME MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 p-6 sm:p-8 text-slate-900 dark:text-white shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-emerald-500/20">
                <h2 className="text-lg font-black font-poppins text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" /> Add New Programme
                </h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveAdd} className="space-y-4 text-xs font-poppins">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                    Programme Name (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.programme_name_english}
                    onChange={(e) => setFormData({ ...formData, programme_name_english: e.target.value })}
                    placeholder="e.g. Asubah & Magrib, Super Markaz, Matan Aure"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                    Programme Name (Arabic)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={formData.programme_name_arabic}
                    onChange={(e) => setFormData({ ...formData, programme_name_arabic: e.target.value })}
                    placeholder="مثال: الصباح والمغرب"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 dir-rtl text-right font-arabic"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                    Programme Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.programme_code}
                    onChange={(e) => setFormData({ ...formData, programme_code: e.target.value.toUpperCase() })}
                    placeholder="e.g. ASM, SPM, ISM, MTA"
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 uppercase font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                    Description & Objectives
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief overview of curriculum, target students, and schedule..."
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="Active">Active (Enrolling & Operational)</option>
                    <option value="Inactive">Inactive (Suspended / Closed)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-emerald-500/20 font-bold">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md"
                  >
                    Save Programme
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT PROGRAMME MODAL */}
      <AnimatePresence>
        {editingProgramme && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 p-6 sm:p-8 text-slate-900 dark:text-white shadow-2xl space-y-6"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-emerald-500/20">
                <h2 className="text-lg font-black font-poppins text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit className="w-5 h-5 text-amber-500" /> Edit Programme Details
                </h2>
                <button
                  onClick={() => setEditingProgramme(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="space-y-4 text-xs font-poppins">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                    Programme Name (English) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.programme_name_english}
                    onChange={(e) => setFormData({ ...formData, programme_name_english: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                    Programme Name (Arabic)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    value={formData.programme_name_arabic}
                    onChange={(e) => setFormData({ ...formData, programme_name_arabic: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white dir-rtl text-right font-arabic"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                    Programme Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.programme_code}
                    onChange={(e) => setFormData({ ...formData, programme_code: e.target.value.toUpperCase() })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white uppercase font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as 'Active' | 'Inactive' })}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-emerald-500/20 font-bold">
                  <button
                    type="button"
                    onClick={() => setEditingProgramme(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
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

      {/* FULL INTERACTIVE PROGRAMME & CLASS DRILL-DOWN MANAGER MODAL */}
      <AnimatePresence>
        {viewingProgramme && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 p-6 sm:p-8 text-slate-900 dark:text-white shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-emerald-500/20">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-0.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold">
                      {viewingProgramme.programme_code}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                      Active Programme & Class Manager
                    </span>
                  </div>
                  <h2 className="text-2xl font-black font-poppins text-slate-900 dark:text-white">
                    <BilingualText
                      english={viewingProgramme.programme_name_english || viewingProgramme.programme_name}
                      arabic={viewingProgramme.programme_name_arabic}
                      inline
                      englishClassName="text-2xl font-black text-slate-900 dark:text-white"
                      arabicClassName="text-xl text-amber-600 dark:text-amber-300 font-arabic font-bold ml-2"
                    />
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-emerald-200/80 font-medium">
                    {viewingProgramme.description}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAddClass(viewingProgramme.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <Plus className="w-4 h-4" /> Add Class to Programme
                  </button>
                  <button
                    onClick={() => setViewingProgramme(null)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Classes under this Programme Section */}
              <div className="space-y-4 font-poppins">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <School className="w-5 h-5 text-emerald-500" />
                      Available Classes under {viewingProgramme.programme_name_english || viewingProgramme.programme_name}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-emerald-300/70">
                      Manage class streams, student capacity, assign or change class teachers, or delete classes.
                    </p>
                  </div>
                  <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                    {classes.filter((c) => c.programmeId === viewingProgramme.id || c.programmeName === viewingProgramme.programme_name).length} Classes Registered
                  </span>
                </div>

                {/* Class List Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {classes
                    .filter((c) => c.programmeId === viewingProgramme.id || c.programmeName === viewingProgramme.programme_name)
                    .map((c) => (
                      <div
                        key={c.id}
                        className="p-5 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 space-y-3 shadow-md hover:border-emerald-500 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              {c.section}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-emerald-300/80 font-medium">
                              Enrolled: <strong className="text-slate-900 dark:text-white">{c.studentCount} / {c.capacity}</strong>
                            </span>
                          </div>

                          <BilingualText
                            english={c.class_name_english || c.name}
                            arabic={c.class_name_arabic}
                            englishClassName="font-bold text-base text-slate-900 dark:text-white leading-snug"
                            arabicClassName="font-arabic font-semibold text-xs text-amber-600 dark:text-amber-300"
                          />

                          {/* Teacher Box */}
                          <div className="p-3 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/20 space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-500 dark:text-emerald-300/80 font-medium flex items-center gap-1">
                                <UserCheck className="w-3.5 h-3.5 text-sky-500" /> Class Teacher:
                              </span>
                              <button
                                onClick={() => setReassigningTeacherClass(c)}
                                className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                              >
                                <RefreshCw className="w-3 h-3" /> Change / Reassign
                              </button>
                            </div>

                            {c.classTeacherId ? (
                              <BilingualText
                                english={c.classTeacherName}
                                arabic={c.classTeacherNameArabic}
                                englishClassName="font-bold text-xs text-slate-900 dark:text-emerald-200"
                                arabicClassName="text-[11px] font-semibold text-amber-600 dark:text-amber-400 font-arabic"
                              />
                            ) : (
                              <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold text-xs">
                                <UserX className="w-3.5 h-3.5" />
                                <span>No Teacher Assigned (Unassigned)</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Class Action Controls */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-emerald-800/40 text-xs font-bold">
                          <button
                            onClick={() => setReassigningTeacherClass(c)}
                            className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500 text-sky-600 hover:text-white dark:text-sky-300 transition-colors text-[11px]"
                          >
                            Assign Teacher
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEditClass(c)}
                              className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white dark:text-amber-300 transition-colors"
                              title="Edit Class"
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
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE PROGRAMME CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingProgramme && (
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
                  Delete Programme Completely?
                </h3>
                <p className="text-xs text-slate-600 dark:text-emerald-200/80 font-poppins">
                  Are you sure you want to permanently delete{' '}
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    "{deletingProgramme.programme_name}" ({deletingProgramme.programme_code})
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2 font-poppins font-bold text-xs">
                <button
                  onClick={() => setDeletingProgramme(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30"
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

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

              {classFormError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
                  {classFormError}
                </div>
              )}

              <form onSubmit={handleSaveAddClass} className="space-y-3 text-xs font-poppins">
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

              {classFormError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold">
                  {classFormError}
                </div>
              )}

              <form onSubmit={handleSaveEditClass} className="space-y-3 text-xs font-poppins">
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
                  💡 <strong>Note:</strong> Selecting "Leave Unassigned" will remove the current teacher from this class without affecting teacher records.
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
                  ? This will remove the class stream from its programme.
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
                  onClick={handleConfirmDeleteClass}
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
