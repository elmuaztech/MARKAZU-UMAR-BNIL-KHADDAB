'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/lib/context';
import { filterProgrammesForUser, filterClassesForUser, getHeadmasterAssignedProgramme } from '@/lib/rbac';
import {
  X,
  BookOpen,
  Check,
  CheckCircle2,
  Calendar,
  Layers,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TeacherAssignmentModalProps {
  teacher: {
    id: string;
    name: string;
    staffNo?: string;
    email?: string;
  };
  onClose: () => void;
  onSaved?: () => void;
}

interface ClassAssignmentState {
  assigned: boolean;
  subjectIds: string[];
  canMarkAttendance: boolean;
  isClassTeacher: boolean;
}

export function TeacherAssignmentModal({
  teacher,
  onClose,
  onSaved,
}: TeacherAssignmentModalProps) {
  const { programmes, classes, subjects, selectedSessionId, currentSession, sessions, notify, currentUser } = useApp();

  const isHeadmaster = currentUser.role === 'HEADMASTER';
  const headmasterProg = useMemo(() => getHeadmasterAssignedProgramme(currentUser, programmes), [currentUser, programmes]);
  const userProgrammes = useMemo(() => filterProgrammesForUser(currentUser, programmes), [currentUser, programmes]);
  const userClasses = useMemo(() => filterClassesForUser(currentUser, classes), [currentUser, classes]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Selected session (defaults to selectedSessionId or current active session)
  const [activeSessionId, setActiveSessionId] = useState<string>(
    selectedSessionId || currentSession?.id || ''
  );

  // Step 1: Selected Programmes
  const [selectedProgrammeIds, setSelectedProgrammeIds] = useState<string[]>(
    isHeadmaster && headmasterProg ? [headmasterProg.id] : []
  );

  // Step 2: Category filter (optional)
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Step 3 & 4: Per-class assignment state
  const [assignments, setAssignments] = useState<Record<string, ClassAssignmentState>>({});

  // Bulk subject state
  const [bulkSubjectId, setBulkSubjectId] = useState<string>('');

  // Load existing assignments for this teacher from the database
  useEffect(() => {
    let isMounted = true;
    async function loadCurrentAssignments() {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/teachers/assignments?teacherId=${teacher.id}&sessionId=${activeSessionId}`
        );
        if (!res.ok) throw new Error('Could not load existing assignments');
        const data = await res.json();

        if (isMounted) {
          const initialMap: Record<string, ClassAssignmentState> = {};
          const loadedProgIds = new Set<string>();

          if (Array.isArray(data.assignments)) {
            data.assignments.forEach((asg: any) => {
              if (asg.programmeId) loadedProgIds.add(asg.programmeId);
              initialMap[asg.classId] = {
                assigned: true,
                subjectIds: asg.assignedSubjects?.map((s: any) => s.subjectId) || asg.subjectIds || [],
                canMarkAttendance: !!asg.canMarkAttendance,
                isClassTeacher: false, // will update from classes below
              };
            });
          }

          // Check if teacher is official classTeacher in any class
          classes.forEach((cls) => {
            const isOfficial = cls.classTeacherId === teacher.id;
            if (initialMap[cls.id]) {
              initialMap[cls.id].isClassTeacher = isOfficial;
              if (isOfficial) {
                initialMap[cls.id].canMarkAttendance = true;
              }
            } else if (isOfficial) {
              initialMap[cls.id] = {
                assigned: true,
                subjectIds: [],
                canMarkAttendance: true,
                isClassTeacher: true,
              };
              if (cls.programmeId) loadedProgIds.add(cls.programmeId);
            }
          });

          setAssignments(initialMap);

          // If assignments exist, select those programmes; otherwise select first programme by default
          if (isHeadmaster && headmasterProg) {
            setSelectedProgrammeIds([headmasterProg.id]);
          } else if (loadedProgIds.size > 0) {
            setSelectedProgrammeIds(Array.from(loadedProgIds));
          } else if (userProgrammes.length > 0) {
            setSelectedProgrammeIds([userProgrammes[0].id]);
          }
        }
      } catch (err: any) {
        console.error('Error loading assignments:', err);
        notify({
          type: 'warning',
          title: 'Assignments Notice',
          message: 'Could not fetch existing assignments. Starting with a blank configuration.',
        });
        if (isHeadmaster && headmasterProg) {
          setSelectedProgrammeIds([headmasterProg.id]);
        } else if (userProgrammes.length > 0) {
          setSelectedProgrammeIds([userProgrammes[0].id]);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadCurrentAssignments();
    return () => {
      isMounted = false;
    };
  }, [teacher.id, activeSessionId, classes, programmes, isHeadmaster, headmasterProg, userProgrammes]);

  // Compute available categories from selected programmes
  const availableSubcategories = useMemo(() => {
    const subcats = new Set<string>();
    userProgrammes
      .filter((p) => selectedProgrammeIds.includes(p.id))
      .forEach((p) => {
        if (p.subcategories && Array.isArray(p.subcategories)) {
          p.subcategories.forEach((sc: any) => subcats.add(sc));
        }
      });
    return Array.from(subcats);
  }, [userProgrammes, selectedProgrammeIds]);

  // Filter classes belonging to selected programmes and category filter
  const visibleClasses = useMemo(() => {
    return userClasses.filter((cls) => {
      if (!selectedProgrammeIds.includes(cls.programmeId)) return false;
      if (categoryFilter !== 'ALL' && cls.subcategory !== categoryFilter) return false;
      return true;
    });
  }, [userClasses, selectedProgrammeIds, categoryFilter]);

  // Toggle programme selection
  const handleToggleProgramme = (progId: string) => {
    if (isHeadmaster) return; // Headmaster is locked to their section
    setSelectedProgrammeIds((prev) =>
      prev.includes(progId) ? prev.filter((id) => id !== progId) : [...prev, progId]
    );
  };

  // Toggle class assigned state
  const handleToggleClassAssigned = (classId: string) => {
    setAssignments((prev) => {
      const current = prev[classId] || {
        assigned: false,
        subjectIds: [],
        canMarkAttendance: false,
        isClassTeacher: false,
      };
      return {
        ...prev,
        [classId]: {
          ...current,
          assigned: !current.assigned,
        },
      };
    });
  };

  // Toggle a subject in a specific class
  const handleToggleSubject = (classId: string, subjectId: string) => {
    setAssignments((prev) => {
      const current = prev[classId] || {
        assigned: true,
        subjectIds: [],
        canMarkAttendance: false,
        isClassTeacher: false,
      };
      const exists = current.subjectIds.includes(subjectId);
      return {
        ...prev,
        [classId]: {
          ...current,
          assigned: true,
          subjectIds: exists
            ? current.subjectIds.filter((id) => id !== subjectId)
            : [...current.subjectIds, subjectId],
        },
      };
    });
  };

  // Toggle attendance permission
  const handleToggleAttendance = (classId: string) => {
    setAssignments((prev) => {
      const current = prev[classId] || {
        assigned: true,
        subjectIds: [],
        canMarkAttendance: false,
        isClassTeacher: false,
      };
      return {
        ...prev,
        [classId]: {
          ...current,
          assigned: true,
          canMarkAttendance: !current.canMarkAttendance,
        },
      };
    });
  };

  // Toggle official class teacher
  const handleToggleClassTeacher = (classId: string) => {
    setAssignments((prev) => {
      const current = prev[classId] || {
        assigned: true,
        subjectIds: [],
        canMarkAttendance: false,
        isClassTeacher: false,
      };
      const nextIsClassTeacher = !current.isClassTeacher;
      return {
        ...prev,
        [classId]: {
          ...current,
          assigned: true,
          isClassTeacher: nextIsClassTeacher,
          // If becoming official class teacher, automatically grant attendance
          canMarkAttendance: nextIsClassTeacher ? true : current.canMarkAttendance,
        },
      };
    });
  };

  // Bulk: Apply subject to all selected classes
  const handleApplySubjectToAll = () => {
    if (!bulkSubjectId) {
      notify({
        type: 'warning',
        title: 'Select Subject',
        message: 'Please choose a subject to apply across all selected classes.',
      });
      return;
    }

    const assignedCount = Object.values(assignments).filter((a) => a.assigned).length;
    if (assignedCount === 0) {
      notify({
        type: 'warning',
        title: 'No Classes Selected',
        message: 'Please enable at least one class first.',
      });
      return;
    }

    setAssignments((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((classId) => {
        if (updated[classId]?.assigned) {
          const currentSubjects = updated[classId].subjectIds;
          if (!currentSubjects.includes(bulkSubjectId)) {
            updated[classId] = {
              ...updated[classId],
              subjectIds: [...currentSubjects, bulkSubjectId],
            };
          }
        }
      });
      return updated;
    });

    const subjectObj = subjects.find((s) => s.id === bulkSubjectId);
    notify({
      type: 'success',
      title: 'Bulk Subject Applied',
      message: `"${subjectObj?.name || 'Subject'}" assigned to all active classes.`,
    });
  };

  // Clear All Subjects
  const handleClearAllSubjects = () => {
    setAssignments((prev) => {
      const updated = { ...prev };
      Object.keys(updated).forEach((classId) => {
        if (updated[classId]) {
          updated[classId] = {
            ...updated[classId],
            subjectIds: [],
          };
        }
      });
      return updated;
    });
    notify({
      type: 'info',
      title: 'Subjects Cleared',
      message: 'All assigned subjects have been cleared.',
    });
  };

  // Select all visible classes
  const handleSelectAllVisibleClasses = () => {
    setAssignments((prev) => {
      const updated = { ...prev };
      visibleClasses.forEach((cls) => {
        const current = updated[cls.id] || {
          assigned: false,
          subjectIds: [],
          canMarkAttendance: false,
          isClassTeacher: false,
        };
        updated[cls.id] = {
          ...current,
          assigned: true,
        };
      });
      return updated;
    });
  };

  // Deselect all visible classes
  const handleDeselectAllVisibleClasses = () => {
    setAssignments((prev) => {
      const updated = { ...prev };
      visibleClasses.forEach((cls) => {
        if (updated[cls.id]) {
          updated[cls.id] = {
            ...updated[cls.id],
            assigned: false,
            subjectIds: [],
            canMarkAttendance: false,
            isClassTeacher: false,
          };
        }
      });
      return updated;
    });
  };

  // Summary counts
  const summary = useMemo(() => {
    const assignedClassIds = Object.keys(assignments).filter(
      (cid) => assignments[cid]?.assigned
    );
    const assignedProgs = new Set<string>();
    const totalSubjectsAssigned = new Set<string>();

    assignedClassIds.forEach((cid) => {
      const cls = classes.find((c) => c.id === cid);
      if (cls) assignedProgs.add(cls.programmeId);
      assignments[cid]?.subjectIds.forEach((sid) => totalSubjectsAssigned.add(`${cid}_${sid}`));
    });

    return {
      programmesCount: assignedProgs.size,
      classesCount: assignedClassIds.length,
      subjectsCount: totalSubjectsAssigned.size,
    };
  }, [assignments, classes]);

  // Submit to backend
  const handleSaveAssignments = async () => {
    setIsSaving(true);
    try {
      // Build assignment payload
      const payloadAssignments: {
        classId: string;
        programmeId: string;
        subjectIds: string[];
        canMarkAttendance: boolean;
        isClassTeacher: boolean;
      }[] = [];

      Object.entries(assignments).forEach(([classId, state]) => {
        if (state.assigned) {
          const cls = classes.find((c) => c.id === classId);
          if (cls) {
            payloadAssignments.push({
              classId,
              programmeId: cls.programmeId,
              subjectIds: state.subjectIds,
              canMarkAttendance: state.canMarkAttendance,
              isClassTeacher: state.isClassTeacher,
            });
          }
        }
      });

      const res = await fetch('/api/teachers/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacherId: teacher.id,
          sessionId: activeSessionId,
          assignments: payloadAssignments,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save teacher assignments');
      }

      notify({
        type: 'success',
        title: 'Teaching Assignments Saved',
        message: `Updated assignments for ${teacher.name}: ${summary.programmesCount} Programmes · ${summary.classesCount} Classes.`,
      });

      if (onSaved) onSaved();
      onClose();
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Could not save teaching assignments.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 font-poppins">
      <div className="max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden bg-white dark:bg-[#031e13] border border-emerald-500/30 rounded-3xl shadow-2xl text-xs">
        {/* Header */}
        <div className="shrink-0 p-4 sm:p-5 bg-gradient-to-r from-emerald-950 via-[#03291b] to-emerald-900 text-white border-b border-emerald-500/30 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-400 shrink-0" />
              <h2 className="font-extrabold text-sm sm:text-base truncate max-w-[280px] sm:max-w-md">
                Assign Teaching & Attendance: {teacher.name}
              </h2>
            </div>
            <div className="flex items-center flex-wrap gap-2 text-[11px] text-emerald-200/90">
              {teacher.staffNo && (
                <span className="font-mono bg-emerald-800/60 px-2 py-0.5 rounded-md">
                  {teacher.staffNo}
                </span>
              )}
              <span>•</span>
              <span className="flex items-center gap-1 font-semibold">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                Session: {sessions.find((s) => s.id === activeSessionId)?.sessionName || currentSession.sessionName}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-emerald-300 hover:text-white transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        {isLoading ? (
          <div className="flex-1 p-12 text-center text-slate-500 dark:text-emerald-300/70 space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="font-semibold text-xs">Loading teacher assignments...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto min-h-0 p-4 sm:p-6 space-y-6">
            {/* STEP 1: SELECT PROGRAMMES */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-extrabold">
                    1
                  </span>
                  Select Programmes
                </label>
                <span className="text-[10px] text-slate-500 dark:text-emerald-400">
                  Select one or multiple programmes
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {userProgrammes.map((prog) => {
                  const isSelected = selectedProgrammeIds.includes(prog.id);
                  return (
                    <button
                      key={prog.id}
                      type="button"
                      onClick={() => handleToggleProgramme(prog.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500 dark:border-emerald-400 text-emerald-950 dark:text-white font-bold shadow-xs'
                          : 'bg-slate-50 dark:bg-[#021810] border-slate-200 dark:border-emerald-800/40 text-slate-700 dark:text-gray-300 hover:border-emerald-400'
                      }`}
                    >
                      <div className="truncate">
                        <p className="text-xs truncate font-semibold">
                          {prog.programme_name_english || prog.programme_name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-emerald-400/70 font-mono">
                          {prog.programme_code}
                        </p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 dark:border-emerald-700'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: CATEGORY / SUBCATEGORY FILTER (IF APPLICABLE) */}
            {availableSubcategories.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-emerald-500/10">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-extrabold">
                      2
                    </span>
                    Filter by Category / Section
                  </label>
                  <span className="text-[10px] text-slate-500 dark:text-emerald-400">
                    Category grouping
                  </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setCategoryFilter('ALL')}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                      categoryFilter === 'ALL'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-[#021810] border border-slate-300 dark:border-emerald-800/40 text-slate-700 dark:text-gray-300'
                    }`}
                  >
                    All Categories
                  </button>
                  {availableSubcategories.map((subcat) => (
                    <button
                      key={subcat}
                      type="button"
                      onClick={() => setCategoryFilter(subcat)}
                      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                        categoryFilter === subcat
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-[#021810] border border-slate-300 dark:border-emerald-800/40 text-slate-700 dark:text-gray-300'
                      }`}
                    >
                      {subcat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* STEP 3 & 4: CLASSES, SUBJECTS & ATTENDANCE */}
            <div className="space-y-3 pt-2 border-t border-emerald-500/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-extrabold">
                    3
                  </span>
                  Classes, Teaching Subjects & Attendance Access
                </label>
                <div className="flex items-center gap-2 text-[10px]">
                  <button
                    type="button"
                    onClick={handleSelectAllVisibleClasses}
                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                  >
                    Select All Classes
                  </button>
                  <span>•</span>
                  <button
                    type="button"
                    onClick={handleDeselectAllVisibleClasses}
                    className="text-slate-500 dark:text-gray-400 hover:underline"
                  >
                    Deselect All
                  </button>
                </div>
              </div>

              {/* Bulk Subject Toolbar */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-[#021810] border border-emerald-500/20 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <span className="font-bold text-slate-700 dark:text-emerald-300 text-[11px] whitespace-nowrap">
                    Bulk Tool:
                  </span>
                  <select
                    value={bulkSubjectId}
                    onChange={(e) => setBulkSubjectId(e.target.value)}
                    className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#042419] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="">-- Choose Subject --</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.nameEnglish || sub.name} ({sub.code})
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleApplySubjectToAll}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all shadow-xs"
                  >
                    Apply Subject to All Selected Classes
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleClearAllSubjects}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-200 dark:bg-emerald-950/60 hover:bg-slate-300 dark:hover:bg-emerald-900 text-slate-700 dark:text-emerald-300 font-bold text-[10px] transition-all"
                >
                  Clear All Subjects
                </button>
              </div>

              {/* Classes List */}
              {visibleClasses.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-slate-300 dark:border-emerald-800/40 text-center text-slate-500 dark:text-emerald-400/80">
                  <p className="font-bold text-xs">No classes found for the selected criteria.</p>
                  <p className="text-[10px] mt-1">Please select a programme above to view its classes.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {visibleClasses.map((cls) => {
                    const state = assignments[cls.id] || {
                      assigned: false,
                      subjectIds: [],
                      canMarkAttendance: false,
                      isClassTeacher: false,
                    };
                    const prog = programmes.find((p) => p.id === cls.programmeId);

                    return (
                      <div
                        key={cls.id}
                        className={`rounded-2xl border transition-all overflow-hidden ${
                          state.assigned
                            ? 'bg-white dark:bg-[#042419] border-emerald-500/50 shadow-md'
                            : 'bg-slate-50/80 dark:bg-[#021810]/60 border-slate-200 dark:border-emerald-800/30 opacity-80'
                        }`}
                      >
                        {/* Class Header Bar */}
                        <div className="p-3.5 flex flex-wrap items-center justify-between gap-2 border-b border-emerald-500/10">
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              id={`class-toggle-${cls.id}`}
                              checked={state.assigned}
                              onChange={() => handleToggleClassAssigned(cls.id)}
                              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 dark:bg-[#021810] border-slate-300 dark:border-emerald-500/30 cursor-pointer"
                            />
                            <div>
                              <label
                                htmlFor={`class-toggle-${cls.id}`}
                                className="font-bold text-slate-900 dark:text-white text-xs cursor-pointer hover:text-emerald-500 transition-colors"
                              >
                                {cls.class_name_english || cls.name}
                              </label>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-emerald-400">
                                <span>{prog?.programme_name_english || prog?.programme_name}</span>
                                {cls.subcategory && (
                                  <>
                                    <span>•</span>
                                    <span className="font-semibold">{cls.subcategory}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Attendance & Class Teacher Badges */}
                          <div className="flex items-center flex-wrap gap-2">
                            {state.isClassTeacher && (
                              <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 font-extrabold text-[10px] border border-purple-500/30 uppercase">
                                Official Class Teacher
                              </span>
                            )}
                            {state.canMarkAttendance && (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px] border border-emerald-500/30 uppercase flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3" /> Attendance Permitted
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Class Body: Subjects & Permissions */}
                        {state.assigned && (
                          <div className="p-3.5 space-y-3 bg-white/50 dark:bg-transparent">
                            {/* Subject Selection */}
                            <div>
                              <p className="font-bold text-slate-700 dark:text-emerald-300 text-[11px] mb-1.5">
                                Assigned Teaching Subjects:
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {subjects.map((sub) => {
                                  const isSelected = state.subjectIds.includes(sub.id);
                                  return (
                                    <button
                                      key={sub.id}
                                      type="button"
                                      onClick={() => handleToggleSubject(cls.id, sub.id)}
                                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition-all flex items-center gap-1.5 ${
                                        isSelected
                                          ? 'bg-emerald-600 text-white shadow-xs'
                                          : 'bg-slate-100 dark:bg-[#021810] border border-slate-300 dark:border-emerald-800/40 text-slate-700 dark:text-gray-300 hover:border-emerald-500'
                                      }`}
                                    >
                                      {isSelected && <Check className="w-3 h-3" />}
                                      <span>{sub.nameEnglish || sub.name}</span>
                                    </button>
                                  );
                                })}
                              </div>
                              {state.subjectIds.length === 0 && (
                                <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-1 font-medium">
                                  No subjects assigned yet. Select subjects or configure attendance permission below.
                                </p>
                              )}
                            </div>

                            {/* Permissions Checkboxes */}
                            <div className="pt-2 border-t border-emerald-500/10 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {/* Can Mark Attendance */}
                              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20">
                                <input
                                  type="checkbox"
                                  id={`attendance-${cls.id}`}
                                  checked={state.canMarkAttendance}
                                  onChange={() => handleToggleAttendance(cls.id)}
                                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 dark:bg-[#021810] border-slate-300 dark:border-emerald-500/30 cursor-pointer"
                                />
                                <label
                                  htmlFor={`attendance-${cls.id}`}
                                  className="font-bold text-slate-800 dark:text-gray-200 text-[11px] cursor-pointer"
                                >
                                  Grant Attendance Permission
                                </label>
                              </div>

                              {/* Official Class Teacher */}
                              <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20">
                                <input
                                  type="checkbox"
                                  id={`classteacher-${cls.id}`}
                                  checked={state.isClassTeacher}
                                  onChange={() => handleToggleClassTeacher(cls.id)}
                                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 dark:bg-[#021810] border-slate-300 dark:border-emerald-500/30 cursor-pointer"
                                />
                                <label
                                  htmlFor={`classteacher-${cls.id}`}
                                  className="font-bold text-slate-800 dark:text-gray-200 text-[11px] cursor-pointer"
                                >
                                  Designate as Official Class Teacher
                                </label>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer with Summary & Actions */}
        <div className="shrink-0 p-4 sm:p-5 bg-slate-50 dark:bg-[#021810] border-t border-emerald-500/20 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[11px] text-slate-600 dark:text-emerald-300 font-semibold">
            Assignment Summary:{' '}
            <strong className="text-slate-900 dark:text-white">
              {summary.programmesCount} Programmes · {summary.classesCount} Classes · {summary.subjectsCount} Subject Assignments
            </strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-300 dark:border-emerald-500/30 text-slate-700 dark:text-gray-300 font-bold hover:bg-slate-100 dark:hover:bg-emerald-950/40 transition-all text-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSaveAssignments}
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-900/30 disabled:opacity-50 text-xs flex items-center gap-1.5"
            >
              {isSaving ? (
                <span>Saving...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Teaching Assignments</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
