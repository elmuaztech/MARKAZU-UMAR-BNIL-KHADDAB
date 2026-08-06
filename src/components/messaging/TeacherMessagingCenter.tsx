'use client';

import React, { useState, useMemo } from 'react';
import {
  MessageSquare,
  Send,
  Paperclip,
  CheckCircle2,
  Users,
  ShieldCheck,
  FileText,
  Image,
  File,
  X,
  Sparkles,
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { DirectMessage, DirectMessageAttachment } from '@/types';
import { canTeacherMessageStudent } from '@/lib/rbac';

export function TeacherMessagingCenter() {
  const { students, classes, programmes, teacherAssignments, currentUser, sendTeacherDirectMessage } = useApp();

  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>('prog-02');
  const [selectedClassId, setSelectedClassId] = useState<string>('cls-tahfiz-1');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');

  const [messageType, setMessageType] = useState<DirectMessage['messageType']>('GENERAL_NOTICE');
  const [subject, setSubject] = useState<string>('');
  const [content, setContent] = useState<string>('');
  const [attachments, setAttachments] = useState<DirectMessageAttachment[]>([]);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState<boolean>(false);

  // Filter available classes assigned to teacher
  const availableClasses = useMemo(() => {
    if (currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN') {
      return classes.filter((c) => !selectedProgrammeId || c.programmeId === selectedProgrammeId);
    }
    const assignedClassIds = new Set(
      teacherAssignments
        .filter((ta) => ta.teacherId === currentUser.id || currentUser.id.includes('teacher'))
        .filter((ta) => !selectedProgrammeId || ta.programmeId === selectedProgrammeId)
        .map((ta) => ta.classId)
    );
    return classes.filter((c) => assignedClassIds.has(c.id));
  }, [currentUser, teacherAssignments, classes, selectedProgrammeId]);

  // Students in selected class
  const classStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return students.filter((s) => s.classId === selectedClassId);
  }, [students, selectedClassId]);

  // Add dummy attachment handler
  const handleAddSampleAttachment = (type: 'PDF' | 'IMAGE' | 'DOC') => {
    const newAtt: DirectMessageAttachment = {
      id: `att-${Date.now()}`,
      name: type === 'PDF' ? 'Lesson_Material_Surah_Kahf.pdf' : type === 'IMAGE' ? 'Tajweed_Diagram.png' : 'Homework_Sheet.docx',
      size: '1.4 MB',
      type,
      url: '#',
    };
    setAttachments((prev) => [...prev, newAtt]);
  };

  const handleRemoveAttachment = (attId: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== attId));
  };

  const handleSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !content.trim()) {
      alert('Please complete the subject and message body content.');
      return;
    }

    // Determine target students: specific student or entire assigned class roster
    const targets = selectedStudentId
      ? classStudents.filter((s) => s.id === selectedStudentId)
      : classStudents;

    if (targets.length === 0) {
      alert('No recipient students selected.');
      return;
    }

    targets.forEach((student) => {
      // Validate RBAC scope
      const isAllowed = canTeacherMessageStudent(currentUser, teacherAssignments, students, student.id);
      if (!isAllowed) return;

      sendTeacherDirectMessage({
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
        attachments,
      });
    });

    setIsSuccessModalOpen(true);
    setSubject('');
    setContent('');
    setAttachments([]);
  };

  return (
    <div className="space-y-6 font-poppins">
      <div className="p-6 bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl shadow-md space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Scope-Restricted In-App Teacher Communication Gateway</span>
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">
          Teacher-to-Student Direct Messaging Engine
        </h2>
        <p className="text-xs text-slate-500 dark:text-emerald-300/80">
          Teachers may send in-app notices, homework, assignments, and reminders strictly to students enrolled in their assigned classes.
        </p>
      </div>

      <form onSubmit={handleSubmitMessage} className="bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 space-y-5 shadow-xl">
        {/* Recipient Scope Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-[#021810] p-4 rounded-2xl border border-slate-200 dark:border-emerald-500/20">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
              Select Programme
            </label>
            <select
              value={selectedProgrammeId}
              onChange={(e) => {
                setSelectedProgrammeId(e.target.value);
                const matched = classes.find((c) => c.programmeId === e.target.value);
                if (matched) setSelectedClassId(matched.id);
              }}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
            >
              {programmes.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.programme_name_english || p.programme_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
              Select Assigned Class
            </label>
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
            >
              {availableClasses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
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
              <option value="">Entire Class Roster ({classStudents.length} Students)</option>
              {classStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName} ({s.admissionNo})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Message Type Selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1.5">
            Message Type Category
          </label>
          <div className="flex flex-wrap gap-2">
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
                className={`px-3.5 py-2 rounded-xl font-extrabold text-[11px] transition-all ${
                  messageType === type
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                    : 'bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 hover:bg-emerald-500/20'
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
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
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
            className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none"
            required
          />
        </div>

        {/* Attachments Section */}
        <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-emerald-500/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-emerald-200 flex items-center gap-1.5">
              <Paperclip className="w-4 h-4 text-emerald-500" /> Attached Documents (PDF, Images)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleAddSampleAttachment('PDF')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-emerald-950 text-[10px] font-extrabold text-slate-700 dark:text-emerald-300 hover:bg-emerald-500/20"
              >
                + Add PDF
              </button>
              <button
                type="button"
                onClick={() => handleAddSampleAttachment('IMAGE')}
                className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-emerald-950 text-[10px] font-extrabold text-slate-700 dark:text-emerald-300 hover:bg-emerald-500/20"
              >
                + Add Image
              </button>
            </div>
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs flex items-center gap-2 font-medium"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-500" />
                  <span className="text-slate-900 dark:text-white font-bold">{att.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(att.id)}
                    className="text-slate-400 hover:text-rose-500"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
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
