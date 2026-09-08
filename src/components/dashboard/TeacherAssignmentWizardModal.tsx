'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { Button } from '@/components/ui/ButtonSystem';
import {
  UserCheck,
  BookOpen,
  School,
  Layers,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TeacherAssignmentWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TeacherAssignmentWizardModal({ isOpen, onClose }: TeacherAssignmentWizardModalProps) {
  const { teachers, programmes, classes, subjects, assignTeacher, currentUser } = useApp();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Wizard Selections
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [selectedProgrammeIds, setSelectedProgrammeIds] = useState<string[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  if (!isOpen) return null;

  const selectedTeacher = teachers.find((t) => t.id === selectedTeacherId);

  // Dynamically load Classes belonging to selected Programmes
  const availableClasses = classes.filter(
    (c) => selectedProgrammeIds.length === 0 || selectedProgrammeIds.includes(c.programmeId)
  );

  // Dynamically load Subjects belonging to selected Classes
  const availableSubjects = subjects.filter(
    (s) => selectedClassIds.length === 0 || (s.classId && selectedClassIds.includes(s.classId))
  );

  const toggleSelection = (list: string[], setList: (vals: string[]) => void, id: string) => {
    if (list.includes(id)) {
      setList(list.filter((item) => item !== id));
    } else {
      setList([...list, id]);
    }
  };

  const handleSelectAllSubjects = () => {
    if (selectedSubjectIds.length === availableSubjects.length) {
      setSelectedSubjectIds([]);
    } else {
      setSelectedSubjectIds(availableSubjects.map((s) => s.id));
    }
  };

  const handleSaveAssignment = () => {
    if (!selectedTeacherId || selectedProgrammeIds.length === 0 || selectedClassIds.length === 0) {
      return;
    }

    // Save assignments for each selected Programme & Class combination
    selectedProgrammeIds.forEach((progId) => {
      const progClasses = availableClasses.filter(
        (c) => c.programmeId === progId && selectedClassIds.includes(c.id)
      );

      progClasses.forEach((cls) => {
        const clsSubjectIds = availableSubjects
          .filter((s) => s.classId === cls.id && selectedSubjectIds.includes(s.id))
          .map((s) => s.id);

        assignTeacher({
          teacherId: selectedTeacherId,
          programmeId: progId,
          classId: cls.id,
          subjectIds: clsSubjectIds.length > 0 ? clsSubjectIds : selectedSubjectIds,
        });
      });
    });

    onClose();
    // Reset state
    setStep(1);
    setSelectedTeacherId('');
    setSelectedProgrammeIds([]);
    setSelectedClassIds([]);
    setSelectedSubjectIds([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md font-poppins">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-950 via-[#042f1e] to-emerald-900 text-white border-b border-emerald-500/30 flex items-center justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-black uppercase">
              <Sparkles className="w-3 h-3" /> Teacher Assignment Engine
            </div>
            <h2 className="text-xl font-black">Assign Academic & Tahfiz Load</h2>
            <p className="text-xs text-emerald-200/80">Step {step} of 4 • Multi-Programme & Multi-Subject Wizard</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-emerald-300 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Tracker */}
        <div className="grid grid-cols-4 bg-slate-50 dark:bg-[#021810] border-b border-slate-200 dark:border-emerald-500/20 text-center text-xs font-bold divide-x divide-slate-200 dark:divide-emerald-500/20">
          <div className={`p-3 ${step === 1 ? 'bg-emerald-600 text-white' : 'text-slate-500 dark:text-emerald-400/70'}`}>
            1. Teacher Info
          </div>
          <div className={`p-3 ${step === 2 ? 'bg-emerald-600 text-white' : 'text-slate-500 dark:text-emerald-400/70'}`}>
            2. Programme(s)
          </div>
          <div className={`p-3 ${step === 3 ? 'bg-emerald-600 text-white' : 'text-slate-500 dark:text-emerald-400/70'}`}>
            3. Class(es)
          </div>
          <div className={`p-3 ${step === 4 ? 'bg-emerald-600 text-white' : 'text-slate-500 dark:text-emerald-400/70'}`}>
            4. Subjects & Confirm
          </div>
        </div>

        {/* Modal Body / Steps */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* STEP 1: SELECT TEACHER */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-emerald-500" /> Step 1: Select Teacher
                </h3>
                <span className="text-[10px] text-slate-500 dark:text-emerald-400 font-bold">
                  {teachers.length} Active Staff Members
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                {teachers.map((t) => {
                  const isSelected = selectedTeacherId === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTeacherId(t.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30'
                          : 'bg-slate-50 dark:bg-[#021810] border-slate-200 dark:border-emerald-500/20 hover:border-emerald-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {t.staffNo}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white">{t.fullName}</p>
                      <p className="text-[10px] text-slate-500 dark:text-emerald-300/70 truncate">{t.email}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT PROGRAMME(S) */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-500" /> Step 2: Select Programme Stream(s)
                </h3>
                <span className="text-[10px] text-slate-500 dark:text-emerald-400 font-bold">
                  Teacher: {selectedTeacher?.fullName}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {programmes.map((p) => {
                  const isSelected = selectedProgrammeIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleSelection(selectedProgrammeIds, setSelectedProgrammeIds, p.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30'
                          : 'bg-slate-50 dark:bg-[#021810] border-slate-200 dark:border-emerald-500/20 hover:border-emerald-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          {p.programme_code}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white">{p.programme_name_english || p.programme_name}</p>
                      <p className="font-arabic text-amber-600 dark:text-amber-300 text-[11px]">{p.programme_name_arabic}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: SELECT CLASS(ES) */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <School className="w-4 h-4 text-emerald-500" /> Step 3: Select Class(es)
                </h3>
                <span className="text-[10px] text-slate-500 dark:text-emerald-400 font-bold">
                  {availableClasses.length} Available Classes under selected Programmes
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                {availableClasses.map((c) => {
                  const isSelected = selectedClassIds.includes(c.id);
                  return (
                    <div
                      key={c.id}
                      onClick={() => toggleSelection(selectedClassIds, setSelectedClassIds, c.id)}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30'
                          : 'bg-slate-50 dark:bg-[#021810] border-slate-200 dark:border-emerald-500/20 hover:border-emerald-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          {c.programmeName}
                        </span>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                      <p className="font-arabic text-amber-600 dark:text-amber-300 text-[11px]">{c.class_name_arabic}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: SELECT SUBJECTS & CONFIRM */}
          {step === 4 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-500" /> Step 4: Select Subjects & Review Assignment
                </h3>
                <Button variant="outline" size="sm" onClick={handleSelectAllSubjects}>
                  {selectedSubjectIds.length === availableSubjects.length ? 'Deselect All' : 'Select All Subjects'}
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                {availableSubjects.map((s) => {
                  const isSelected = selectedSubjectIds.includes(s.id);
                  return (
                    <div
                      key={s.id}
                      onClick={() => toggleSelection(selectedSubjectIds, setSelectedSubjectIds, s.id)}
                      className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500 ring-2 ring-emerald-500/30'
                          : 'bg-slate-50 dark:bg-[#021810] border-slate-200 dark:border-emerald-500/20 hover:border-emerald-500'
                      }`}
                    >
                      <div>
                        <span className="font-mono text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                          {s.code}
                        </span>
                        <p className="font-bold text-slate-900 dark:text-white">{s.name}</p>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                    </div>
                  );
                })}
              </div>

              {/* Assignment Summary Review Box */}
              <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 space-y-2">
                <h4 className="font-bold text-emerald-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Review Assignment Summary
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-200/80">
                  <p><strong>Teacher:</strong> {selectedTeacher?.fullName}</p>
                  <p><strong>Programmes:</strong> {selectedProgrammeIds.length} Selected</p>
                  <p><strong>Classes:</strong> {selectedClassIds.length} Selected</p>
                  <p><strong>Subjects:</strong> {selectedSubjectIds.length} Selected</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Controls Footer */}
        <div className="p-4 bg-slate-50 dark:bg-[#021810] border-t border-slate-200 dark:border-emerald-500/20 flex items-center justify-between">
          <Button
            variant="outline"
            disabled={step === 1}
            onClick={() => setStep((s) => Math.max(1, s - 1) as 1 | 2 | 3 | 4)}
            icon={<ChevronLeft className="w-4 h-4" />}
          >
            Back
          </Button>

          {step < 4 ? (
            <Button
              variant="primary"
              disabled={
                (step === 1 && !selectedTeacherId) ||
                (step === 2 && selectedProgrammeIds.length === 0) ||
                (step === 3 && selectedClassIds.length === 0)
              }
              onClick={() => setStep((s) => Math.min(4, s + 1) as 1 | 2 | 3 | 4)}
            >
              Continue <ChevronRight className="w-4 h-4 ml-1 inline" />
            </Button>
          ) : (
            <Button
              variant="primary"
              disabled={selectedSubjectIds.length === 0}
              onClick={handleSaveAssignment}
              icon={<CheckCircle2 className="w-4 h-4" />}
            >
              Confirm & Save Assignment
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
