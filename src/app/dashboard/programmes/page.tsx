'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { Programme, SchoolClass, User } from '@/types';
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
  School,
  UserCheck,
  UserX,
  RefreshCw,
  X,
  FileSpreadsheet,
  Crown,
  Tag,
  ChevronRight,
  FolderPlus,
} from 'lucide-react';
import { ImportSchoolStructureModal } from '@/components/classes/ImportSchoolStructureModal';
import { motion, AnimatePresence } from 'framer-motion';
import { BilingualText } from '@/components/ui/BilingualText';
import { Button } from '@/components/ui/Button';

export default function ProgrammesPage() {
  const {
    currentUser,
    users,
    programmes,
    classes,
    students,
    teachers,
    addProgramme,
    updateProgramme,
    toggleProgrammeStatus,
    deleteProgramme,
    addSubcategory,
    updateSubcategory,
    deleteSubcategory,
    assignHeadmasterProgramme,
    addClass,
    updateClass,
    deleteClass,
  } = useApp();

  const isAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Inactive'>('ALL');

  // Modals state for Programme
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProgramme, setEditingProgramme] = useState<Programme | null>(null);
  const [viewingProgramme, setViewingProgramme] = useState<Programme | null>(null);
  const [deletingProgramme, setDeletingProgramme] = useState<Programme | null>(null);

  // Subcategory management state
  const [newSubcategoryName, setNewSubcategoryName] = useState('');
  const [editingSubcategory, setEditingSubcategory] = useState<{
    programmeId: string;
    oldName: string;
    newName: string;
  } | null>(null);
  const [deletingSubcategory, setDeletingSubcategory] = useState<{
    programmeId: string;
    subcategoryName: string;
  } | null>(null);

  // Headmaster Assignment Modal state
  const [assigningHeadmasterProgramme, setAssigningHeadmasterProgramme] = useState<Programme | null>(null);
  const [selectedHeadmasterUserId, setSelectedHeadmasterUserId] = useState<string>('');

  // Modals state for Class under Programme
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [targetSubcategoryForNewClass, setTargetSubcategoryForNewClass] = useState<string>('');
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
    hasSubcategories: false,
    initialSubcategories: [] as string[],
    status: 'Active' as 'Active' | 'Inactive',
  });
  const [subcatTagInput, setSubcatTagInput] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Class Form State
  const [classFormData, setClassFormData] = useState({
    class_name_english: '',
    class_name_arabic: '',
    programmeId: '',
    subcategory: '',
    section: 'Section A',
    capacity: 30,
    classTeacherId: '',
  });
  const [classFormError, setClassFormError] = useState<string | null>(null);

  const filteredProgrammes = programmes.filter((p) => {
    // If Headmaster, STRICTLY isolate to their assigned section only
    if (currentUser.role === 'HEADMASTER') {
      const assignedId = currentUser.assignedProgrammeId;
      const assignedName = currentUser.assignedProgrammeName?.toLowerCase() || '';
      const matchesProgramme =
        (assignedId && p.id === assignedId) ||
        (assignedName && (p.programme_name_english || p.programme_name || '').toLowerCase().includes(assignedName)) ||
        (assignedName && assignedName.includes((p.programme_name_english || p.programme_name || '').toLowerCase()));
      if (!matchesProgramme) return false;
    }

    const matchesSearch =
      (p.programme_name_english || p.programme_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.programme_name_arabic || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.programme_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
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

  const getHeadmastersForProgramme = (prog: Programme): User[] => {
    return users.filter(
      (u) =>
        u.role === 'HEADMASTER' &&
        (u.assignedProgrammeId === prog.id ||
          (u.assignedProgrammeName &&
            u.assignedProgrammeName.toLowerCase() === (prog.programme_name_english || prog.programme_name).toLowerCase()))
    );
  };

  // PROGRAMME HANDLERS
  const handleOpenAddModal = () => {
    setFormData({
      programme_name_english: '',
      programme_name_arabic: '',
      programme_code: '',
      description: '',
      hasSubcategories: false,
      initialSubcategories: [],
      status: 'Active',
    });
    setSubcatTagInput('');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleAddInitialSubcatTag = () => {
    const val = subcatTagInput.trim();
    if (!val) return;
    if (formData.initialSubcategories.some((s) => s.toLowerCase() === val.toLowerCase())) {
      setFormError(`Subcategory "${val}" is already added.`);
      return;
    }
    setFormData((prev) => ({
      ...prev,
      initialSubcategories: [...prev.initialSubcategories, val],
    }));
    setSubcatTagInput('');
    setFormError(null);
  };

  const handleRemoveInitialSubcatTag = (tag: string) => {
    setFormData((prev) => ({
      ...prev,
      initialSubcategories: prev.initialSubcategories.filter((s) => s !== tag),
    }));
  };

  const handleOpenEditModal = (prog: Programme) => {
    setEditingProgramme(prog);
    setFormData({
      programme_name_english: prog.programme_name_english || prog.programme_name,
      programme_name_arabic: prog.programme_name_arabic || '',
      programme_code: prog.programme_code,
      description: prog.description,
      hasSubcategories: !!prog.hasSubcategories,
      initialSubcategories: prog.subcategories || [],
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
        hasSubcategories: formData.hasSubcategories,
        subcategories: formData.hasSubcategories ? formData.initialSubcategories : [],
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
        hasSubcategories: formData.hasSubcategories,
        subcategories: formData.hasSubcategories ? formData.initialSubcategories : [],
        status: formData.status,
      });

      if (viewingProgramme?.id === editingProgramme.id) {
        setViewingProgramme({
          ...editingProgramme,
          programme_name_english: formData.programme_name_english.trim(),
          programme_name: formData.programme_name_english.trim(),
          programme_code: formData.programme_code.trim().toUpperCase(),
          hasSubcategories: formData.hasSubcategories,
          subcategories: formData.hasSubcategories ? formData.initialSubcategories : [],
        });
      }

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
    showToast(`Programme "${name}" deleted successfully!`);
  };

  // SUBCATEGORY HANDLERS
  const handleAddNewSubcategory = (progId: string) => {
    if (!newSubcategoryName.trim()) return;
    try {
      addSubcategory(progId, newSubcategoryName.trim());
      setNewSubcategoryName('');
      showToast(`Subcategory "${newSubcategoryName.trim()}" added successfully!`);

      // Refresh viewing state
      const updatedProg = programmes.find((p) => p.id === progId);
      if (updatedProg && viewingProgramme?.id === progId) {
        setViewingProgramme(updatedProg);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add subcategory.');
    }
  };

  const handleConfirmEditSubcategory = () => {
    if (!editingSubcategory) return;
    try {
      updateSubcategory(
        editingSubcategory.programmeId,
        editingSubcategory.oldName,
        editingSubcategory.newName.trim()
      );
      showToast(`Subcategory updated to "${editingSubcategory.newName.trim()}"!`);
      setEditingSubcategory(null);
    } catch (err: any) {
      alert(err.message || 'Failed to update subcategory.');
    }
  };

  const handleConfirmDeleteSubcategory = () => {
    if (!deletingSubcategory) return;
    try {
      deleteSubcategory(deletingSubcategory.programmeId, deletingSubcategory.subcategoryName);
      showToast(`Subcategory "${deletingSubcategory.subcategoryName}" deleted successfully!`);
      setDeletingSubcategory(null);
    } catch (err: any) {
      alert(err.message || 'Failed to delete subcategory.');
    }
  };

  // HEADMASTER ASSIGNMENT HANDLERS
  const handleSaveHeadmasterAssignment = () => {
    if (!assigningHeadmasterProgramme) return;
    if (!selectedHeadmasterUserId) {
      alert('Please select a Headmaster user account.');
      return;
    }

    const progName =
      assigningHeadmasterProgramme.programme_name_english || assigningHeadmasterProgramme.programme_name;
    assignHeadmasterProgramme(selectedHeadmasterUserId, assigningHeadmasterProgramme.id, progName);

    showToast(`Headmaster assigned to "${progName}" successfully!`);
    setAssigningHeadmasterProgramme(null);
    setSelectedHeadmasterUserId('');
  };

  // CLASS HANDLERS UNDER PROGRAMME
  const handleOpenAddClass = (progId?: string, targetSubcat?: string) => {
    const targetProg = progId ? programmes.find((p) => p.id === progId) : viewingProgramme || programmes[0];
    setClassFormData({
      class_name_english: '',
      class_name_arabic: '',
      programmeId: targetProg?.id || programmes[0]?.id || '',
      subcategory: targetSubcat || (targetProg?.subcategories && targetProg.subcategories[0]) || '',
      section: targetSubcat || 'Section A',
      capacity: 30,
      classTeacherId: '',
    });
    setTargetSubcategoryForNewClass(targetSubcat || '');
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
      setClassFormError(err.message || 'Failed to add class.');
    }
  };

  const handleOpenEditClass = (c: SchoolClass) => {
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
        section: classFormData.subcategory || classFormData.section,
        subcategory: classFormData.subcategory || undefined,
        capacity: Number(classFormData.capacity) || 30,
        programmeId: prog.id,
        programmeName: prog.programme_name_english || prog.programme_name,
        programmeNameArabic: prog.programme_name_arabic,
        ...teacherDetails,
      });

      setEditingClass(null);
      showToast('Class updated successfully.');
    } catch (err: any) {
      setClassFormError(err.message || 'Failed to update class.');
    }
  };

  const handleConfirmDeleteClass = () => {
    if (!deletingClass) return;
    const name = deletingClass.class_name_english || deletingClass.name;
    deleteClass(deletingClass.id);
    setDeletingClass(null);
    showToast(`Class "${name}" deleted successfully!`);
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

  const headmasterUsers = users.filter((u) => u.role === 'HEADMASTER');

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
              Dynamic Hierarchy System
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-poppins text-white flex items-center gap-2">
            <Layers className="w-7 h-7 text-emerald-400" /> Programmes & Subcategories Management
          </h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 font-medium">
            Create, manage, and scale programmes, subcategories, classes, teacher assignments, and headmaster assignments dynamically.
          </p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="md"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-2xl shadow-lg flex items-center gap-2"
              leftIcon={<FileSpreadsheet className="w-4 h-4" />}
              onClick={() => setIsImportModalOpen(true)}
            >
              Import Structure (Excel)
            </Button>
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
              className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-lg hover:shadow-2xl transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-poppins text-xs font-bold text-slate-700 dark:text-emerald-300 uppercase tracking-wider">
                  Total Programmes
                </span>
                <div className="p-3 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 shadow-inner">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black font-poppins mt-3 text-slate-900 dark:text-white">
                {programmes.length}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-emerald-300/70 mt-1 font-medium">
                Master Academic Programs
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-lg hover:shadow-2xl transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-poppins text-xs font-bold text-slate-700 dark:text-sky-300 uppercase tracking-wider">
                  Subcategories
                </span>
                <div className="p-3 rounded-2xl bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 shadow-inner">
                  <Tag className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black font-poppins mt-3 text-slate-900 dark:text-white">
                {programmes.reduce((acc, p) => acc + (p.subcategories?.length || 0), 0)}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-sky-300/70 mt-1 font-medium">
                Dynamic Subcategories
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-lg hover:shadow-2xl transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-poppins text-xs font-bold text-slate-700 dark:text-purple-300 uppercase tracking-wider">
                  Linked Classes
                </span>
                <div className="p-3 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 shadow-inner">
                  <School className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black font-poppins mt-3 text-slate-900 dark:text-white">
                {classes.length}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-purple-300/70 mt-1 font-medium">
                Active Class Streams
              </p>
            </motion.div>

            <motion.div
              whileHover={{ y: -6, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-lg hover:shadow-2xl transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="font-poppins text-xs font-bold text-slate-700 dark:text-amber-300 uppercase tracking-wider">
                  Headmasters Assigned
                </span>
                <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 shadow-inner">
                  <Crown className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black font-poppins mt-3 text-slate-900 dark:text-white">
                {headmasterUsers.filter((u) => u.assignedProgrammeId).length} / {headmasterUsers.length}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-amber-300/70 mt-1 font-medium">
                Headmaster Accounts Configured
              </p>
            </motion.div>
          </div>

          {/* Dynamic Programme Cards Grid */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black font-poppins text-slate-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-amber-500" /> Active Academic Programmes & Structure
                </h2>
                <p className="text-xs text-slate-500 dark:text-emerald-300/70">
                  Click any programme card to manage its subcategories, classes, teacher assignments, and headmasters.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
                {programmes.length} Programmes Active
              </span>
            </div>

            {programmes.length === 0 ? (
              <div className="text-center py-12 px-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-dashed border-slate-300 dark:border-emerald-500/30">
                <BookOpen className="w-12 h-12 text-slate-400 dark:text-emerald-500/40 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-slate-800 dark:text-emerald-200">No Programmes Configured Yet</h3>
                <p className="text-xs text-slate-500 dark:text-emerald-400/60 mt-1 max-w-sm mx-auto">
                  Click the "Add New Programme" button above to create your first academic programme.
                </p>
                <Button
                  variant="warning"
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  className="mt-4"
                  onClick={() => handleOpenAddModal()}
                >
                  Create Programme
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {programmes.map((prog) => {
                  const progClasses = classes.filter(
                    (c) => c.programmeId === prog.id || c.programmeName === prog.programme_name
                  );
                  const progStudents = students.filter(
                    (s) => s.programmeId === prog.id || s.programmeName === prog.programme_name
                  );
                  const hms = getHeadmastersForProgramme(prog);
                  const headmasterNames = hms.map((h) => h.name).join(', ');

                  return (
                    <motion.div
                      key={prog.id}
                      whileHover={{ y: -4, scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => setViewingProgramme(prog)}
                      className="p-5 rounded-3xl bg-gradient-to-b from-slate-50 to-slate-100 dark:from-[#021810] dark:to-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md hover:border-amber-500 hover:shadow-xl transition-all cursor-pointer flex flex-col justify-between group min-w-0"
                    >
                      <div className="space-y-3.5 flex-1">
                        {/* Top Row: Code and Status Badges */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-black px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30 shrink-0">
                            {prog.programme_code}
                          </span>
                          <div className="flex flex-wrap items-center gap-1.5 justify-end">
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${
                                prog.hasSubcategories
                                  ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-400/30'
                                  : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {prog.hasSubcategories ? 'Subcategories: YES' : 'Direct Classes'}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full whitespace-nowrap ${
                                prog.status === 'Active'
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20'
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border border-rose-500/20'
                              }`}
                            >
                              {prog.status}
                            </span>
                          </div>
                        </div>

                        {/* Bilingual Programme Title */}
                        <div className="min-h-[48px] flex flex-col justify-start">
                          <BilingualText
                            english={prog.programme_name_english || prog.programme_name}
                            arabic={prog.programme_name_arabic}
                            englishClassName="font-poppins font-black text-base text-slate-900 dark:text-white group-hover:text-amber-500 transition-colors leading-tight"
                            arabicClassName="font-arabic font-semibold text-xs text-amber-600 dark:text-amber-300"
                          />
                        </div>

                        {/* Subcategories Badges */}
                        {prog.hasSubcategories && prog.subcategories && prog.subcategories.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {prog.subcategories.map((sub, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-extrabold flex items-center gap-1 border border-emerald-500/20"
                              >
                                <Tag className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                                <span className="truncate max-w-[120px]">{sub}</span>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Headmaster Tag */}
                        <div className="p-2.5 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/20 text-xs">
                          <div className="text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <Crown className="w-3 h-3 text-amber-500 shrink-0" /> Headmaster:
                          </div>
                          <p
                            className="font-bold text-slate-800 dark:text-white text-xs mt-0.5 truncate"
                            title={headmasterNames || 'Unassigned'}
                          >
                            {headmasterNames ? (
                              headmasterNames
                            ) : (
                              <span className="text-slate-400 italic font-normal">Unassigned</span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Footer Stats Row */}
                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-emerald-800/40 flex items-center justify-between text-xs font-bold font-poppins">
                        <span className="text-purple-600 dark:text-purple-300 flex items-center gap-1">
                          <School className="w-3.5 h-3.5" />
                          {progClasses.length} {progClasses.length === 1 ? 'Class' : 'Classes'}
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          {progStudents.length} {progStudents.length === 1 ? 'Student' : 'Students'}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
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
                    <th className="py-3.5 px-4">Subcategories</th>
                    <th className="py-3.5 px-4">Headmaster</th>
                    <th className="py-3.5 px-4">Linked Classes</th>
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
                      const hms = getHeadmastersForProgramme(prog);

                      return (
                        <tr
                          key={prog.id}
                          className="hover:bg-slate-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                          onClick={() => setViewingProgramme(prog)}
                        >
                          <td className="py-3.5 px-4 font-mono font-bold text-amber-600 dark:text-amber-400">
                            {prog.programme_code}
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                            <BilingualText
                              english={prog.programme_name_english || prog.programme_name}
                              arabic={prog.programme_name_arabic}
                            />
                          </td>
                          <td className="py-3.5 px-4">
                            {prog.hasSubcategories && prog.subcategories && prog.subcategories.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {prog.subcategories.map((sub, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]"
                                  >
                                    {sub}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-slate-400 text-[11px] italic">No Subcategories</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-700 dark:text-emerald-200">
                            {hms.length > 0 ? hms.map((h) => h.name).join(', ') : <span className="text-slate-400 italic">Unassigned</span>}
                          </td>
                          <td className="py-3.5 px-4 font-poppins font-semibold text-purple-600 dark:text-purple-300">
                            {linkedClasses.length} Classes
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
                                title="Manage Programme & Structure"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>Manage</span>
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
                                title="Delete Programme"
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

      {/* ADD PROGRAMME ENHANCED MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 text-slate-900 dark:text-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 sm:p-6 pb-3 border-b border-slate-200 dark:border-emerald-500/20 shrink-0">
                <h2 className="text-lg font-black font-poppins text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" /> Create Dynamic Programme
                </h2>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold shrink-0">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveAdd} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs font-poppins">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                      Programme Name (English) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.programme_name_english}
                      onChange={(e) => setFormData({ ...formData, programme_name_english: e.target.value })}
                      placeholder="e.g. Programme 5, Tahfiz Stream, Asubah & Magrib"
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
                      placeholder="مثال: البرنامج الخامس"
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
                      placeholder="e.g. PR5, PR6, ASM, SPM"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 uppercase font-mono font-bold"
                    />
                  </div>

                  {/* Subcategory Toggle Question */}
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 space-y-2">
                    <label className="block font-extrabold text-slate-900 dark:text-emerald-300">
                      Does this programme have subcategories?
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, hasSubcategories: false })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                          !formData.hasSubcategories
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white dark:bg-[#021810] text-slate-700 dark:text-emerald-300 border border-slate-200 dark:border-emerald-500/20'
                        }`}
                      >
                        NO (Direct Classes)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, hasSubcategories: true })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                          formData.hasSubcategories
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white dark:bg-[#021810] text-slate-700 dark:text-emerald-300 border border-slate-200 dark:border-emerald-500/20'
                        }`}
                      >
                        YES (Subcategories)
                      </button>
                    </div>

                    {formData.hasSubcategories && (
                      <div className="pt-2 space-y-2">
                        <label className="block font-bold text-slate-700 dark:text-emerald-300 text-[11px]">
                          Add Initial Subcategories (e.g. Asuba, Maghrib, Tahfiz or Category A, B, C):
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={subcatTagInput}
                            onChange={(e) => setSubcatTagInput(e.target.value)}
                            placeholder="Type subcategory name & click Add"
                            className="flex-1 p-2 rounded-xl bg-white dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                          />
                          <button
                            type="button"
                            onClick={handleAddInitialSubcatTag}
                            className="px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold"
                          >
                            + Add Tag
                          </button>
                        </div>

                        {formData.initialSubcategories.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {formData.initialSubcategories.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-extrabold text-xs flex items-center gap-1.5"
                              >
                                {tag}
                                <button
                                  type="button"
                                  onClick={() => handleRemoveInitialSubcatTag(tag)}
                                  className="text-emerald-800 hover:text-rose-600 dark:text-emerald-300"
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                      Description & Objectives
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief overview of curriculum, target students, and schedule..."
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-4 sm:p-6 pt-3 border-t border-slate-200 dark:border-emerald-500/20 font-bold shrink-0 bg-slate-50/50 dark:bg-[#021810]">
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
                    Create Programme
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
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 text-slate-900 dark:text-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 sm:p-6 pb-3 border-b border-slate-200 dark:border-emerald-500/20 shrink-0">
                <h2 className="text-lg font-black font-poppins text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit className="w-5 h-5 text-amber-500" /> Edit Programme Details
                </h2>
                <button
                  onClick={() => setEditingProgramme(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              {formError && (
                <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold shrink-0">
                  {formError}
                </div>
              )}

              <form onSubmit={handleSaveEdit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs font-poppins">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                      Programme Name (English) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.programme_name_english}
                      onChange={(e) => setFormData({ ...formData, programme_name_english: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
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
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 uppercase font-mono font-bold"
                    />
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 space-y-2">
                    <label className="block font-extrabold text-slate-900 dark:text-emerald-300">
                      Has Subcategories?
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, hasSubcategories: false })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                          !formData.hasSubcategories
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white dark:bg-[#021810] text-slate-700 dark:text-emerald-300 border border-slate-200 dark:border-emerald-500/20'
                        }`}
                      >
                        NO (Direct Classes)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, hasSubcategories: true })}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                          formData.hasSubcategories
                            ? 'bg-emerald-600 text-white shadow-md'
                            : 'bg-white dark:bg-[#021810] text-slate-700 dark:text-emerald-300 border border-slate-200 dark:border-emerald-500/20'
                        }`}
                      >
                        YES (Subcategories)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                      Description
                    </label>
                    <textarea
                      rows={2}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-4 sm:p-6 pt-3 border-t border-slate-200 dark:border-emerald-500/20 font-bold shrink-0 bg-slate-50/50 dark:bg-[#021810]">
                  <button
                    type="button"
                    onClick={() => setEditingProgramme(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md font-extrabold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FULL INTERACTIVE PROGRAMME & SUBCATEGORY & CLASS DRILL-DOWN MANAGER MODAL */}
      <AnimatePresence>
        {viewingProgramme && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-5xl rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 p-6 sm:p-8 text-slate-900 dark:text-white shadow-2xl space-y-6 my-8 max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-600"
            >
              {/* Modal Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between pb-4 border-b border-slate-200 dark:border-emerald-500/20 gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-0.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-mono font-bold">
                      {viewingProgramme.programme_code}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">
                      Dynamic Programme Manager
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

                  {/* Assigned Headmasters Display */}
                  <div className="pt-2 flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Crown className="w-4 h-4 text-amber-500" /> Headmaster(s):
                    </span>
                    {getHeadmastersForProgramme(viewingProgramme).length > 0 ? (
                      getHeadmastersForProgramme(viewingProgramme).map((h) => (
                        <span
                          key={h.id}
                          className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-200 font-bold"
                        >
                          {h.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-400 italic">No Headmaster assigned</span>
                    )}

                    <button
                      onClick={() => {
                        setAssigningHeadmasterProgramme(viewingProgramme);
                        setSelectedHeadmasterUserId(
                          getHeadmastersForProgramme(viewingProgramme)[0]?.id || ''
                        );
                      }}
                      className="ml-2 px-2.5 py-0.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-[11px] shadow"
                    >
                      Assign / Change Headmaster
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenAddClass(viewingProgramme.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
                  >
                    <Plus className="w-4 h-4" /> Add Class
                  </button>
                  <button
                    onClick={() => setViewingProgramme(null)}
                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 text-xs font-bold"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* SUBCATEGORY MANAGEMENT BAR IF HAS SUBCATEGORIES */}
              {viewingProgramme.hasSubcategories && (
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-slate-900 dark:text-emerald-300 flex items-center gap-2">
                      <Tag className="w-4 h-4 text-emerald-500" /> Manage Subcategories for {viewingProgramme.programme_name}
                    </span>
                    <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      {viewingProgramme.subcategories?.length || 0} Subcategories Total
                    </span>
                  </div>

                  {/* Add Subcategory Form */}
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={newSubcategoryName}
                      onChange={(e) => setNewSubcategoryName(e.target.value)}
                      placeholder="Enter new subcategory name (e.g. Asuba, Maghrib, Tahfiz, Morning)..."
                      className="flex-1 p-2.5 rounded-xl bg-white dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                    />
                    <button
                      onClick={() => handleAddNewSubcategory(viewingProgramme.id)}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow"
                    >
                      + Add Subcategory
                    </button>
                  </div>
                </div>
              )}

              {/* STRUCTURE & CLASSES DISPLAY */}
              <div className="space-y-6 font-poppins">
                {/* CASE A: PROGRAMME WITH NO SUBCATEGORIES */}
                {!viewingProgramme.hasSubcategories && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                        <School className="w-5 h-5 text-emerald-500" />
                        Classes under {viewingProgramme.programme_name_english || viewingProgramme.programme_name}
                      </h3>
                      <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-500/30">
                        {classes.filter((c) => c.programmeId === viewingProgramme.id || c.programmeName === viewingProgramme.programme_name).length} Classes
                      </span>
                    </div>

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

                              <div className="p-3 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/20 space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-slate-500 dark:text-emerald-300/80 font-medium flex items-center gap-1">
                                    <UserCheck className="w-3.5 h-3.5 text-sky-500" /> Class Teacher(s):
                                  </span>
                                  <button
                                    onClick={() => setReassigningTeacherClass(c)}
                                    className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-1"
                                  >
                                    <RefreshCw className="w-3 h-3" /> Reassign
                                  </button>
                                </div>

                                <p className="font-bold text-xs text-slate-900 dark:text-emerald-200">
                                  {c.assignedTeacherNames && c.assignedTeacherNames.length > 0
                                    ? c.assignedTeacherNames.join(', ')
                                    : c.classTeacherName || 'Unassigned'}
                                </p>
                              </div>
                            </div>

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
                )}

                {/* CASE B: PROGRAMME WITH SUBCATEGORIES */}
                {viewingProgramme.hasSubcategories && (
                  <div className="space-y-6">
                    {(viewingProgramme.subcategories || []).map((subName) => {
                      const subClasses = classes.filter(
                        (c) =>
                          (c.programmeId === viewingProgramme.id || c.programmeName === viewingProgramme.programme_name) &&
                          (c.subcategory?.toLowerCase() === subName.toLowerCase() ||
                            c.section?.toLowerCase() === subName.toLowerCase())
                      );

                      return (
                        <div
                          key={subName}
                          className="p-5 rounded-3xl bg-slate-50/80 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 space-y-4"
                        >
                          <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-500/20 pb-3">
                            <div className="flex items-center gap-2">
                              <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-200 font-extrabold text-sm flex items-center gap-1.5">
                                <Tag className="w-4 h-4 text-emerald-500" />
                                Subcategory: {subName}
                              </span>
                              <span className="text-xs text-slate-500 dark:text-emerald-400 font-medium">
                                ({subClasses.length} Classes)
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenAddClass(viewingProgramme.id, subName)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add Class to {subName}
                              </button>
                              <button
                                onClick={() => {
                                  const newName = prompt(`Edit name for subcategory "${subName}":`, subName);
                                  if (newName && newName.trim() && newName.trim() !== subName) {
                                    setEditingSubcategory({
                                      programmeId: viewingProgramme.id,
                                      oldName: subName,
                                      newName: newName.trim(),
                                    });
                                  }
                                }}
                                className="p-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white dark:text-amber-300"
                                title="Rename Subcategory"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() =>
                                  setDeletingSubcategory({
                                    programmeId: viewingProgramme.id,
                                    subcategoryName: subName,
                                  })
                                }
                                className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400"
                                title="Delete Subcategory"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Subcategory Classes */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {subClasses.map((c) => (
                              <div
                                key={c.id}
                                className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 space-y-3 shadow flex flex-col justify-between"
                              >
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                                      {c.subcategory || c.section}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-emerald-300/80 font-medium">
                                      Enrolled: <strong className="text-slate-900 dark:text-white">{c.studentCount} / {c.capacity}</strong>
                                    </span>
                                  </div>

                                  <BilingualText
                                    english={c.class_name_english || c.name}
                                    arabic={c.class_name_arabic}
                                    englishClassName="font-bold text-sm text-slate-900 dark:text-white leading-snug"
                                    arabicClassName="font-arabic font-semibold text-xs text-amber-600 dark:text-amber-300"
                                  />

                                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 space-y-1">
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="text-slate-500 dark:text-emerald-300/80 font-medium flex items-center gap-1">
                                        <UserCheck className="w-3.5 h-3.5 text-sky-500" /> Teacher(s):
                                      </span>
                                      <button
                                        onClick={() => setReassigningTeacherClass(c)}
                                        className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                                      >
                                        Reassign
                                      </button>
                                    </div>

                                    <p className="font-bold text-xs text-slate-900 dark:text-emerald-200">
                                      {c.assignedTeacherNames && c.assignedTeacherNames.length > 0
                                        ? c.assignedTeacherNames.join(', ')
                                        : c.classTeacherName || 'Unassigned'}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-emerald-800/40 text-xs font-bold">
                                  <button
                                    onClick={() => setReassigningTeacherClass(c)}
                                    className="px-2.5 py-1 rounded-lg bg-sky-500/10 hover:bg-sky-500 text-sky-600 hover:text-white dark:text-sky-300 transition-colors text-[11px]"
                                  >
                                    Assign Teacher
                                  </button>

                                  <div className="flex items-center gap-1.5">
                                    <button
                                      onClick={() => handleOpenEditClass(c)}
                                      className="p-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-600 hover:text-white dark:text-amber-300"
                                      title="Edit Class"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => setDeletingClass(c)}
                                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 text-rose-600 hover:text-white dark:text-rose-400"
                                      title="Delete Class"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))}

                            {subClasses.length === 0 && (
                              <div className="col-span-2 p-6 rounded-2xl bg-white dark:bg-[#042419] text-center text-xs text-slate-500 dark:text-emerald-300/70 italic">
                                No classes added under subcategory "{subName}" yet.{' '}
                                <button
                                  onClick={() => handleOpenAddClass(viewingProgramme.id, subName)}
                                  className="text-emerald-600 dark:text-emerald-400 font-bold underline not-italic ml-1"
                                >
                                  Add First Class
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADMASTER ASSIGNMENT MODAL */}
      <AnimatePresence>
        {assigningHeadmasterProgramme && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#042419] border border-amber-500/40 p-6 text-slate-900 dark:text-white shadow-2xl space-y-4 font-poppins text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-emerald-500/20">
                <h3 className="text-base font-black flex items-center gap-2 text-slate-900 dark:text-white">
                  <Crown className="w-5 h-5 text-amber-500" /> Assign Headmaster
                </h3>
                <button onClick={() => setAssigningHeadmasterProgramme(null)} className="text-slate-400 font-bold">
                  ✕
                </button>
              </div>

              <p className="text-slate-600 dark:text-emerald-200">
                Select a Headmaster user account to assign to{' '}
                <strong>
                  "{assigningHeadmasterProgramme.programme_name_english || assigningHeadmasterProgramme.programme_name}"
                </strong>
                .
              </p>

              <div>
                <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                  Select Headmaster Account:
                </label>
                <select
                  value={selectedHeadmasterUserId}
                  onChange={(e) => setSelectedHeadmasterUserId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-bold"
                >
                  <option value="">-- Choose Headmaster --</option>
                  {headmasterUsers.map((hm) => (
                    <option key={hm.id} value={hm.id}>
                      {hm.name} ({hm.email})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-emerald-500/20 font-bold">
                <button
                  onClick={() => setAssigningHeadmasterProgramme(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveHeadmasterAssignment}
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black shadow"
                >
                  Save Headmaster Assignment
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT SUBCATEGORY MODAL */}
      <AnimatePresence>
        {editingSubcategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#042419] border border-amber-500/40 p-6 text-slate-900 dark:text-white shadow-2xl space-y-4 font-poppins text-xs"
            >
              <h3 className="text-base font-black">Edit Subcategory Name</h3>
              <div>
                <label className="block font-bold mb-1">Subcategory Name:</label>
                <input
                  type="text"
                  value={editingSubcategory.newName}
                  onChange={(e) =>
                    setEditingSubcategory({ ...editingSubcategory, newName: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 font-bold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 font-bold pt-2">
                <button
                  onClick={() => setEditingSubcategory(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmEditSubcategory}
                  className="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 shadow"
                >
                  Save Name
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE SUBCATEGORY CONFIRMATION MODAL */}
      <AnimatePresence>
        {deletingSubcategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#042419] border border-rose-500/40 p-6 text-slate-900 dark:text-white shadow-2xl space-y-5 text-center font-poppins"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black">Delete Subcategory?</h3>
              <p className="text-xs text-slate-600 dark:text-emerald-200">
                Are you sure you want to delete subcategory{' '}
                <strong className="text-rose-500">"{deletingSubcategory.subcategoryName}"</strong>? Classes
                belonging to this subcategory will remain in the programme as direct classes.
              </p>

              <div className="flex items-center justify-center gap-3 pt-2 font-bold text-xs">
                <button
                  onClick={() => setDeletingSubcategory(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDeleteSubcategory}
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white shadow"
                >
                  Confirm Delete Subcategory
                </button>
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
                  ? All linked classes under this programme will also be removed. This action cannot be undone.
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
                  Confirm Delete Programme
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
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 text-slate-900 dark:text-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 sm:p-6 pb-3 border-b border-slate-200 dark:border-emerald-500/20 shrink-0">
                <h3 className="text-lg font-black font-poppins text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-500" /> Add New Class
                </h3>
                <button onClick={() => setIsAddClassModalOpen(false)} className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600">
                  ✕
                </button>
              </div>

              {classFormError && (
                <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold shrink-0">
                  {classFormError}
                </div>
              )}

              <form onSubmit={handleSaveAddClass} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3.5 text-xs font-poppins">
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

                  {/* Subcategory Select if Programme Has Subcategories */}
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
                      placeholder="e.g. Halqa 1, Class A, Rawda"
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                      Class Teacher (Optional)
                    </label>
                    <select
                      value={classFormData.classTeacherId}
                      onChange={(e) => setClassFormData({ ...classFormData, classTeacherId: e.target.value })}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    >
                      <option value="">-- Unassigned --</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.fullName} ({t.staffNo})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 p-4 sm:p-6 pt-3 border-t border-slate-200 dark:border-emerald-500/20 font-bold shrink-0 bg-slate-50/50 dark:bg-[#021810]">
                  <button
                    type="button"
                    onClick={() => setIsAddClassModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow"
                  >
                    Create Class
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REASSIGN TEACHER MODAL */}
      <AnimatePresence>
        {reassigningTeacherClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 p-6 text-slate-900 dark:text-white shadow-2xl space-y-4 font-poppins text-xs"
            >
              <h3 className="text-base font-black">
                Assign Teacher to "{reassigningTeacherClass.name}"
              </h3>
              <p className="text-slate-500 dark:text-emerald-300/80">
                Select an existing teacher to assign as class teacher for this class stream.
              </p>

              <div>
                <select
                  defaultValue={reassigningTeacherClass.classTeacherId || ''}
                  id="reassign-teacher-select"
                  className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-bold"
                >
                  <option value="">-- Set to Unassigned --</option>
                  {teachers.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.staffNo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-emerald-500/20 font-bold">
                <button
                  onClick={() => setReassigningTeacherClass(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const sel = (document.getElementById('reassign-teacher-select') as HTMLSelectElement)?.value;
                    handleQuickTeacherReassign(reassigningTeacherClass.id, sel);
                  }}
                  className="px-5 py-2 rounded-xl bg-emerald-600 text-white shadow"
                >
                  Save Assignment
                </button>
              </div>
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
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/40 text-slate-900 dark:text-white shadow-2xl max-h-[90vh] flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between p-5 sm:p-6 pb-3 border-b border-slate-200 dark:border-emerald-500/20 shrink-0">
                <h3 className="text-lg font-black font-poppins text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit className="w-5 h-5 text-amber-500" /> Edit Class Details
                </h3>
                <button
                  onClick={() => setEditingClass(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold"
                >
                  ✕
                </button>
              </div>

              {classFormError && (
                <div className="mx-5 sm:mx-6 mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold shrink-0">
                  {classFormError}
                </div>
              )}

              <form onSubmit={handleSaveEditClass} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-3.5 text-xs font-poppins">
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

                  {/* Subcategory Select if Programme Has Subcategories */}
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
                      placeholder="e.g. Halqa 1, Class A, Rawda"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-medium"
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
                      placeholder="مثال: حلقة 1"
                      className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white dir-rtl text-right font-arabic"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                        Section / Room
                      </label>
                      <input
                        type="text"
                        value={classFormData.section}
                        onChange={(e) => setClassFormData({ ...classFormData, section: e.target.value })}
                        className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-emerald-300 mb-1">
                        Capacity
                      </label>
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
                      Assign Class Teacher (Optional)
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
                </div>

                <div className="flex items-center justify-end gap-3 p-4 sm:p-6 pt-3 border-t border-slate-200 dark:border-emerald-500/20 font-bold shrink-0 bg-slate-50/50 dark:bg-[#021810]">
                  <button
                    type="button"
                    onClick={() => setEditingClass(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md font-extrabold"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
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
                  Are you sure you want to delete{' '}
                  <span className="font-bold text-rose-600 dark:text-rose-400">
                    "{deletingClass.class_name_english || deletingClass.name}"
                  </span>
                  ? All teacher assignments linked to this class will also be unlinked.
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
