'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  CheckCircle2,
  Users,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { DirectMessage } from '@/types';
import { canTeacherMessageStudent } from '@/lib/rbac';

export function TeacherMessagingCenter() {
  const { students, classes, programmes, teachers, teacherAssignments, currentUser, sendTeacherDirectMessage } = useApp();
  const isTeacher = currentUser.role === 'TEACHER';

  // Resolve active teacher record
  const currentTeacher = useMemo(() => {
    return (
      teachers.find(
        (t) =>
          t.id === currentUser.id ||
          (t.userId && t.userId === currentUser.id) ||
          (t.email && currentUser.email && t.email.toLowerCase() === currentUser.email.toLowerCase()) ||
          (t.staffNo && currentUser.username && t.staffNo.toLowerCase() === currentUser.username.toLowerCase()) ||
          (t.fullName && currentUser.name && t.fullName.toLowerCase() === currentUser.name.toLowerCase())
      ) || null
    );
  }, [teachers, currentUser]);

  // Compute teacher-assigned classes
  const teacherClasses = useMemo(() => {
    if (currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN') {
      return classes;
    }
    const teacherId = currentTeacher?.id || currentUser.id;
    const directClassIds = currentTeacher?.classesAssigned || [];
    const assignmentClassIds = teacherAssignments
      .filter(
        (ta) =>
          ta.teacherId === teacherId ||
          ta.teacherId === currentUser.id ||
          (currentUser.email && ta.teacherId.toLowerCase() === currentUser.email.toLowerCase()) ||
          (currentUser.username && ta.teacherId.toLowerCase() === currentUser.username.toLowerCase())
      )
      .map((ta) => ta.classId);

    const allAssignedIds = new Set([...directClassIds, ...assignmentClassIds]);

    const matched = classes.filter(
      (c) =>
        allAssignedIds.has(c.id) ||
        allAssignedIds.has(c.name) ||
        c.classTeacherId === teacherId ||
        c.classTeacherId === currentUser.id
    );

    // If teacher has classes, return them; otherwise if teacher has none assigned, return empty array
    return matched;
  }, [currentUser, currentTeacher, teacherAssignments, classes]);

  // Filter available programmes: for teacher, only programmes they teach in
  const availableProgrammes = useMemo(() => {
    if (currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN') {
      return programmes;
    }
    if (isTeacher) {
      const progIds = new Set(teacherClasses.map((c) => c.programmeId).filter(Boolean));
      if (currentTeacher?.programmeIds) {
        currentTeacher.programmeIds.forEach((pid) => progIds.add(pid));
      }
      const matched = programmes.filter((p) => progIds.has(p.id));
      return matched.length > 0 ? matched : programmes.slice(0, 1);
    }
    return programmes;
  }, [currentUser, isTeacher, teacherClasses, currentTeacher, programmes]);

  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [messageType, setMessageType] = useState<
    'HOMEWORK' | 'ASSIGNMENT' | 'GENERAL_NOTICE' | 'REMINDER' | 'BEHAVIOUR' | 'EXAMINATION' | 'TAHFIZ_REMINDER' | 'CUSTOM'
  >('GENERAL_NOTICE');
  const [subject, setSubject] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);

  // Auto-select assigned programme and class on initial load or assignment change
  useEffect(() => {
    const activeClasses = teacherClasses.length > 0 ? teacherClasses : classes;
    if (activeClasses.length > 0) {
      if (!selectedClassId || !activeClasses.some((c) => c.id === selectedClassId)) {
        const first = activeClasses[0];
        setSelectedClassId(first.id);
        if (first.programmeId) {
          setSelectedProgrammeId(first.programmeId);
        }
      }
    }
    if (availableProgrammes.length > 0 && !selectedProgrammeId) {
      setSelectedProgrammeId(availableProgrammes[0].id);
    }
  }, [teacherClasses, classes, availableProgrammes, selectedClassId, selectedProgrammeId]);

  // Available classes under selected programme
  const availableClasses = useMemo(() => {
    const baseClasses = isTeacher ? teacherClasses : classes;
    if (!selectedProgrammeId) return baseClasses;
    return baseClasses.filter((c) => c.programmeId === selectedProgrammeId);
  }, [isTeacher, teacherClasses, classes, selectedProgrammeId]);

  // Students in selected class: categorize active portal vs no portal
  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  const portalStudents = useMemo(() => {
    return classStudents.filter((s) => Boolean(s.userId));
  }, [classStudents]);

  const noPortalStudents = useMemo(() => {
    return classStudents.filter((s) => !s.userId);
  }, [classStudents]);

  const handleSubmitMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      alert('Please complete the subject and message body content.');
      return;
    }

    // Determine target students: specific student or entire assigned class roster with active portals
    let targets = selectedStudentId
      ? classStudents.filter((s) => s.id === selectedStudentId)
      : portalStudents;

    // Filter out any student without active portal account
    targets = targets.filter((s) => Boolean(s.userId));

    if (targets.length === 0) {
      alert('No eligible recipients with active portal accounts found.');
      return;
    }

    try {
      for (const student of targets) {
        // Validate RBAC scope
        const isAllowed = canTeacherMessageStudent(currentUser, teacherAssignments, students, student.id, teachers, classes);
        if (!isAllowed) continue;

        await sendTeacherDirectMessage({
          senderId: currentUser.id,
          senderName: currentUser.name,
          senderRole: currentUser.role,
          recipientStudentId: student.id,
          studentName: student.fullName,
          programmeId: selectedProgrammeId,
          classId: selectedClassId,
          className: classes.find((c) => c.id === selectedClassId)?.name,
          messageType,
          subject,
          content,
          attachments: [],
        });
      }

      setIsSuccessModalOpen(true);
      setSubject('');
      setContent('');
    } catch (err: any) {
      alert(err.message || 'Error dispatching message');
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 font-poppins">
      <div className="p-4 sm:p-6 bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-2xl sm:rounded-3xl shadow-md space-y-3 sm:space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span className="truncate">Teacher Communication Gateway</span>
        </div>
        <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
          Teacher-to-Student Direct Messaging
        </h2>
        <p className="text-xs text-slate-500 dark:text-emerald-300/80">
          Send notices, homework, assignments, and reminders directly to your assigned students who have active portal accounts.
        </p>
      </div>

      <form onSubmit={handleSubmitMessage} className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-2xl sm:rounded-3xl p-3.5 sm:p-6 space-y-4 sm:space-y-5 shadow-xl">
        {/* Recipient Scope Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 bg-slate-50 dark:bg-[#021810] p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-emerald-500/20">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
              Select Programme {isTeacher && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">(Assigned)</span>}
            </label>
            <select
              disabled={isTeacher}
              value={selectedProgrammeId}
              onChange={(e) => {
                setSelectedProgrammeId(e.target.value);
                const matched = classes.find((c) => c.programmeId === e.target.value);
                if (matched) setSelectedClassId(matched.id);
              }}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {availableProgrammes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.programme_name_english || p.programme_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
              Select Assigned Class {isTeacher && availableClasses.length <= 1 && <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">(Assigned)</span>}
            </label>
            <select
              disabled={isTeacher && availableClasses.length <= 1}
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white disabled:opacity-80 disabled:cursor-not-allowed"
            >
              {availableClasses.length === 0 ? (
                <option value="">No assigned class</option>
              ) : (
                availableClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
              Recipient Target Scope
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
            >
              <option value="">All Portal Students ({portalStudents.length} Active)</option>
              {classStudents.map((s) => {
                const hasPortal = Boolean(s.userId);
                return (
                  <option key={s.id} value={s.id} disabled={!hasPortal}>
                    {hasPortal ? '✓ ' : '⚠️ '}{s.fullName} ({s.admissionNo}) {hasPortal ? '' : '- [No Portal Account]'}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {noPortalStudents.length > 0 && (
          <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs flex items-center gap-2">
            <span className="font-bold">Notice:</span> {noPortalStudents.length} students without portal accounts cannot receive messages. Only active portal students receive notifications.
          </div>
        )}

        {/* Message Type Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1.5">
            Message Type Category
          </label>
          <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1 sm:flex-wrap">
            {(
              [
                'GENERAL_NOTICE',
                'HOMEWORK',
                'ASSIGNMENT',
                'REMINDER',
                'BEHAVIOUR',
                'EXAMINATION',
                'TAHFIZ_REMINDER',
                'CUSTOM',
              ] as const
            ).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setMessageType(type)}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl font-bold text-[10px] sm:text-[11px] whitespace-nowrap shrink-0 transition-all ${
                  messageType === type
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30 ring-2 ring-emerald-400/40'
                    : 'bg-slate-100 dark:bg-emerald-950/60 text-slate-700 dark:text-emerald-300 hover:bg-emerald-500/20'
                }`}
              >
                {type.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
            Message Subject Line
          </label>
          <input
            type="text"
            placeholder="Enter concise subject title..."
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
            required
          />
        </div>

        {/* Content */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
            In-App Message Content Body
          </label>
          <textarea
            rows={5}
            placeholder="Write clear instructions, homework requirements, or reminder details..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
        >
          <Send className="w-4 h-4" />
          <span>Dispatch In-App Direct Message</span>
        </button>
      </form>

      {/* Success Modal */}
      {isSuccessModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#042419] border border-emerald-500/30 rounded-3xl w-full max-w-md shadow-2xl p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Direct Message Dispatched!
            </h3>
            <p className="text-xs text-slate-600 dark:text-emerald-200">
              The in-app message has been routed to the student notification center with unread status tracking.
            </p>
            <button
              onClick={() => setIsSuccessModalOpen(false)}
              className="w-full py-3 rounded-2xl bg-emerald-600 text-white font-black text-xs shadow-lg shadow-emerald-900/30"
            >
              Done / Compose Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
