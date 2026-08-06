'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/context';
import { AssessmentConfig, GradeScaleItem } from '@/types';
import { Button } from '@/components/ui/ButtonSystem';
import {
  Sliders,
  Save,
  CheckSquare,
  Square,
  Award,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
} from 'lucide-react';

export function AdminAssessmentConfig() {
  const { currentUser, assessmentConfig, updateAssessmentConfig } = useApp();

  const isAdmin = currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN';

  const [formData, setFormData] = useState<AssessmentConfig>(assessmentConfig);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isAdmin) {
    return (
      <div className="p-8 rounded-3xl bg-red-500/10 border border-red-500/30 text-red-800 dark:text-red-300 font-poppins space-y-3 shadow-lg">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-red-500" />
          <h3 className="text-base font-black uppercase tracking-wider">Access Restricted: Administrator Permission Required</h3>
        </div>
        <p className="text-xs font-semibold leading-relaxed">
          Teachers and non-administrative staff are prohibited from modifying assessment structures, adding/deleting Continuous Assessment components, altering exam weights, or setting maximum scores. Only School Administrators can manage assessment configurations.
        </p>
      </div>
    );
  }

  const handleToggle = (field: keyof AssessmentConfig) => {
    setFormData((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleNumChange = (field: keyof AssessmentConfig, val: number) => {
    setFormData((prev) => ({ ...prev, [field]: Math.max(0, val) }));
  };

  const handleGradeScaleChange = (index: number, field: keyof GradeScaleItem, val: any) => {
    setFormData((prev) => {
      const scaleCopy = [...prev.gradingScale];
      scaleCopy[index] = { ...scaleCopy[index], [field]: val };
      return { ...prev, gradingScale: scaleCopy };
    });
  };

  const totalMaxMarks =
    (formData.enableAssignment ? formData.maxAssignment : 0) +
    (formData.enableCa1 ? formData.maxCa1 : 0) +
    (formData.enableCa2 ? formData.maxCa2 : 0) +
    (formData.enableTest ? formData.maxTest : 0) +
    (formData.enableProject ? formData.maxProject : 0) +
    (formData.enablePractical ? formData.maxPractical : 0) +
    (formData.enableExam ? formData.maxExam : 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateAssessmentConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 font-poppins">
      {/* Save Success Banner */}
      {saveSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <span>Assessment components and grading parameters updated successfully!</span>
        </div>
      )}

      {/* Component Configurations Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-emerald-800/40 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              Continuous Assessment & Exam Component Allocation
            </h3>
            <p className="text-xs text-slate-500 dark:text-emerald-300">
              Configure maximum marks and enable or disable individual assessment components
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Total Max Marks</span>
            <span className={`text-lg font-black ${totalMaxMarks === 100 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
              {totalMaxMarks} / 100 Marks
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
          {/* Assignment Component */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 space-y-3">
            <button
              type="button"
              onClick={() => handleToggle('enableAssignment')}
              className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white"
            >
              {formData.enableAssignment ? (
                <CheckSquare className="w-4 h-4 text-emerald-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Homework & Assignment</span>
            </button>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-emerald-300 font-semibold block mb-1">Max Score Limit</label>
              <input
                type="number"
                disabled={!formData.enableAssignment}
                value={formData.maxAssignment}
                onChange={(e) => handleNumChange('maxAssignment', Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-800/40 font-bold text-slate-900 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>

          {/* CA1 Component */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 space-y-3">
            <button
              type="button"
              onClick={() => handleToggle('enableCa1')}
              className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white"
            >
              {formData.enableCa1 ? (
                <CheckSquare className="w-4 h-4 text-emerald-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Continuous Assessment 1 (CA1)</span>
            </button>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-emerald-300 font-semibold block mb-1">Max Score Limit</label>
              <input
                type="number"
                disabled={!formData.enableCa1}
                value={formData.maxCa1}
                onChange={(e) => handleNumChange('maxCa1', Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-800/40 font-bold text-slate-900 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>

          {/* CA2 Component */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 space-y-3">
            <button
              type="button"
              onClick={() => handleToggle('enableCa2')}
              className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white"
            >
              {formData.enableCa2 ? (
                <CheckSquare className="w-4 h-4 text-emerald-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Continuous Assessment 2 (CA2)</span>
            </button>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-emerald-300 font-semibold block mb-1">Max Score Limit</label>
              <input
                type="number"
                disabled={!formData.enableCa2}
                value={formData.maxCa2}
                onChange={(e) => handleNumChange('maxCa2', Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-800/40 font-bold text-slate-900 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>

          {/* Test Component */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 space-y-3">
            <button
              type="button"
              onClick={() => handleToggle('enableTest')}
              className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white"
            >
              {formData.enableTest ? (
                <CheckSquare className="w-4 h-4 text-emerald-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Mid-Term Test</span>
            </button>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-emerald-300 font-semibold block mb-1">Max Score Limit</label>
              <input
                type="number"
                disabled={!formData.enableTest}
                value={formData.maxTest}
                onChange={(e) => handleNumChange('maxTest', Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-800/40 font-bold text-slate-900 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>

          {/* Project Component */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 space-y-3">
            <button
              type="button"
              onClick={() => handleToggle('enableProject')}
              className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white"
            >
              {formData.enableProject ? (
                <CheckSquare className="w-4 h-4 text-emerald-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Academic Project</span>
            </button>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-emerald-300 font-semibold block mb-1">Max Score Limit</label>
              <input
                type="number"
                disabled={!formData.enableProject}
                value={formData.maxProject}
                onChange={(e) => handleNumChange('maxProject', Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-800/40 font-bold text-slate-900 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>

          {/* Practical Component */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 space-y-3">
            <button
              type="button"
              onClick={() => handleToggle('enablePractical')}
              className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white"
            >
              {formData.enablePractical ? (
                <CheckSquare className="w-4 h-4 text-emerald-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Practical Assessment</span>
            </button>
            <div>
              <label className="text-[10px] text-slate-500 dark:text-emerald-300 font-semibold block mb-1">Max Score Limit</label>
              <input
                type="number"
                disabled={!formData.enablePractical}
                value={formData.maxPractical}
                onChange={(e) => handleNumChange('maxPractical', Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-800/40 font-bold text-slate-900 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>

          {/* Examination Component */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 space-y-3 sm:col-span-2 md:col-span-3">
            <button
              type="button"
              onClick={() => handleToggle('enableExam')}
              className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white"
            >
              {formData.enableExam ? (
                <CheckSquare className="w-4 h-4 text-emerald-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Terminal Examination Score</span>
            </button>
            <div className="max-w-xs">
              <label className="text-[10px] text-slate-500 dark:text-emerald-300 font-semibold block mb-1">Max Score Limit</label>
              <input
                type="number"
                disabled={!formData.enableExam}
                value={formData.maxExam}
                onChange={(e) => handleNumChange('maxExam', Number(e.target.value))}
                className="w-full p-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-800/40 font-bold text-slate-900 dark:text-white disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grading Scale & Thresholds */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-4">
        <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-200 dark:border-emerald-800/40 pb-3">
          <Award className="w-5 h-5 text-amber-500" />
          Grading Scale Thresholds & Performance Remarks
        </h3>

        <div className="rounded-2xl border border-slate-200 dark:border-emerald-800/40 overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#021810] font-bold text-slate-700 dark:text-emerald-300">
                <th className="p-3">Grade</th>
                <th className="p-3">Min Score (%)</th>
                <th className="p-3">Max Score (%)</th>
                <th className="p-3">Default Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-emerald-950/60 font-medium">
              {formData.gradingScale.map((item, idx) => (
                <tr key={item.grade}>
                  <td className="p-3 font-black text-emerald-600 dark:text-emerald-400">{item.grade}</td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.minScore}
                      onChange={(e) => handleGradeScaleChange(idx, 'minScore', Number(e.target.value))}
                      className="w-20 p-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 font-bold text-slate-900 dark:text-white"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="number"
                      value={item.maxScore}
                      onChange={(e) => handleGradeScaleChange(idx, 'maxScore', Number(e.target.value))}
                      className="w-20 p-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 font-bold text-slate-900 dark:text-white"
                    />
                  </td>
                  <td className="p-2">
                    <input
                      type="text"
                      value={item.remark}
                      onChange={(e) => handleGradeScaleChange(idx, 'remark', e.target.value)}
                      className="w-full p-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 font-semibold text-slate-900 dark:text-white"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Additional Settings & Position Calculation */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Class Position Calculation</h4>
            <p className="text-xs text-slate-500 dark:text-emerald-300">
              Automatically calculate and rank student positions on terminal report sheets
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleToggle('calcPosition')}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all border ${
              formData.calcPosition
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-slate-100 dark:bg-emerald-950/60 text-slate-600 border-slate-300'
            }`}
          >
            {formData.calcPosition ? 'Position Ranking Enabled' : 'Position Ranking Disabled'}
          </button>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-emerald-800/40 flex justify-end">
          <Button type="submit" variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
            Save Administrator Assessment Configurations
          </Button>
        </div>
      </div>
    </form>
  );
}
