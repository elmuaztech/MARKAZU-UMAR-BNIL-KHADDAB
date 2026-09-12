'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import {
  FileText,
  Users,
  Send,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Mail,
  MessageSquare,
  Bell,
  Eye,
  ShieldCheck,
  ExternalLink,
  Zap,
  UserCheck,
  School,
  BookOpen,
} from 'lucide-react';
import { NotificationService } from '@/services/notificationService';
import { WhatsAppBatchModal } from '@/components/communication/WhatsAppBatchModal';
import { buildReportSheetWhatsAppPayload, WhatsAppPayload } from '@/lib/whatsappUtils';

type DispatchScope = 'ALL_SCHOOL' | 'PROGRAMME' | 'CLASS' | 'SINGLE_STUDENT';

export default function ReportSheetDeliveryPage() {
  const { currentSession, programmes, classes, students, parents, publishReportSheetsBatch } = useApp();

  const [dispatchScope, setDispatchScope] = useState<DispatchScope>('ALL_SCHOOL');
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedChannels, setSelectedChannels] = useState<string[]>(['EMAIL', 'WHATSAPP', 'IN_APP']);

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishSuccessToast, setPublishSuccessToast] = useState<{ successCount: number; parentGroupsCount: number } | null>(null);

  // WhatsApp Batch Modal State
  const [whatsAppPayloads, setWhatsAppPayloads] = useState<WhatsAppPayload[] | null>(null);

  // Filter classes by programme
  const filteredClasses = selectedProgrammeId
    ? classes.filter((c) => c.programmeId === selectedProgrammeId)
    : classes;

  // Filter students by dispatch scope
  let targetedStudents = students;

  if (dispatchScope === 'PROGRAMME' && selectedProgrammeId) {
    targetedStudents = students.filter((s) => s.programmeId === selectedProgrammeId);
  } else if (dispatchScope === 'CLASS' && selectedClassId) {
    targetedStudents = students.filter((s) => s.classId === selectedClassId);
  } else if (dispatchScope === 'SINGLE_STUDENT' && selectedStudentId) {
    targetedStudents = students.filter((s) => s.id === selectedStudentId);
  } else if (dispatchScope === 'ALL_SCHOOL') {
    targetedStudents = students;
  }

  // Apply Smart Parent Grouping calculation for preview
  const parentGroups = NotificationService.groupParentsWithMultipleWards(targetedStudents, parents);

  const toggleChannel = (channel: string) => {
    if (selectedChannels.includes(channel)) {
      if (selectedChannels.length === 1) return;
      setSelectedChannels(selectedChannels.filter((c) => c !== channel));
    } else {
      setSelectedChannels([...selectedChannels, channel]);
    }
  };

  const handlePublishBatch = async () => {
    setIsPublishing(true);
    try {
      const res = await publishReportSheetsBatch(
        currentSession.sessionName,
        currentSession.activeTerm,
        selectedProgrammeId,
        selectedClassId,
        selectedChannels
      );
      setPublishSuccessToast(res);
      setTimeout(() => setPublishSuccessToast(null), 5000);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPublishing(false);
    }
  };

  const handleOpenWhatsAppModal = () => {
    const payloads = parentGroups.map((pg) =>
      buildReportSheetWhatsAppPayload(pg, currentSession.sessionName, currentSession.activeTerm, students)
    );
    setWhatsAppPayloads(payloads);
  };

  const handleMasterOneClickWhatsAppDispatch = () => {
    // Select all school parents across all programmes and classes
    const allSchoolParentGroups = NotificationService.groupParentsWithMultipleWards(students, parents);
    const payloads = allSchoolParentGroups.map((pg) =>
      buildReportSheetWhatsAppPayload(pg, currentSession.sessionName, currentSession.activeTerm, students)
    );
    setWhatsAppPayloads(payloads);
  };

  const handleOpenSingleParentWhatsApp = (pg: any) => {
    const singlePayload = buildReportSheetWhatsAppPayload(pg, currentSession.sessionName, currentSession.activeTerm, students);
    setWhatsAppPayloads([singlePayload]);
  };

  return (
    <div className="p-4 sm:p-8 max-w-6xl mx-auto space-y-8 font-poppins">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/communication"
            className="p-2.5 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-slate-700 dark:text-emerald-300 hover:text-emerald-600 transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">Report Sheet Delivery Engine</h1>
            <p className="text-xs text-slate-500 dark:text-emerald-300/70">
              Targeted Parent Dispatch: Entire School, By Programme, By Class, or By Individual Student
            </p>
          </div>
        </div>

        {/* Master One-Click Dispatch Button */}
        <button
          onClick={handleMasterOneClickWhatsAppDispatch}
          className="w-full sm:w-auto justify-center px-4 sm:px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-black text-xs shadow-xl shadow-amber-500/20 flex items-center gap-2 transition-all hover:scale-105 shrink-0"
        >
          <Zap className="w-4 h-4 fill-slate-950 shrink-0" />
          <span className="text-center">⚡ Send All School Report Sheets (WhatsApp)</span>
        </button>
      </div>

      {/* SMART PARENT GROUPING INFORMATION ALERT */}
      <div className="rounded-3xl bg-gradient-to-r from-amber-500/15 via-emerald-500/10 to-emerald-950/20 border border-amber-500/30 p-5 space-y-2">
        <div className="flex items-center gap-2 font-black text-sm text-amber-800 dark:text-amber-300">
          <Sparkles className="w-5 h-5" /> Smart Parent Isolation & Deduplication Engine Active
        </div>
        <p className="text-xs text-slate-700 dark:text-emerald-100/90 leading-relaxed">
          Each parent receives <strong>ONLY their own child's report sheet link or targeted notice</strong>. Parents with multiple children automatically receive <strong>ONE consolidated WhatsApp</strong> containing links for all their wards.
        </p>
      </div>

      {/* SCOPE SELECTION TABS */}
      <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-6 shadow-xl space-y-6">
        <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          1. Select Delivery Scope Target
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { id: 'ALL_SCHOOL', label: 'Entire School', desc: 'All Programmes & Classes', icon: School },
            { id: 'PROGRAMME', label: 'By Programme', desc: 'Target Specific Programme', icon: BookOpen },
            { id: 'CLASS', label: 'By Class', desc: 'Target Specific Class Roster', icon: Users },
            { id: 'SINGLE_STUDENT', label: 'By Student', desc: 'Target Individual Student', icon: UserCheck },
          ].map((scope) => {
            const isSelected = dispatchScope === scope.id;
            return (
              <div
                key={scope.id}
                onClick={() => {
                  setDispatchScope(scope.id as DispatchScope);
                  if (scope.id === 'ALL_SCHOOL') {
                    setSelectedProgrammeId('');
                    setSelectedClassId('');
                    setSelectedStudentId('');
                  }
                }}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-slate-50 dark:bg-[#021810] border-slate-200 dark:border-emerald-500/20 text-slate-600 dark:text-emerald-300/70 hover:border-emerald-500/40'
                }`}
              >
                <div className="flex items-center gap-2 font-black text-xs">
                  <scope.icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{scope.label}</span>
                </div>
                <p className="text-[10px] mt-1 font-bold text-slate-500 dark:text-emerald-400/60">{scope.desc}</p>
              </div>
            );
          })}
        </div>

        {/* CASCADING FILTER DROPDOWNS BASED ON SCOPE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-bold pt-4 border-t border-slate-200 dark:border-emerald-500/20">
          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-500">Active Session:</label>
            <div className="mt-1 p-3 rounded-xl bg-slate-100 dark:bg-emerald-950 border border-emerald-500/30 text-slate-900 dark:text-white">
              {currentSession.sessionName}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-extrabold uppercase text-slate-500">Active Term:</label>
            <div className="mt-1 p-3 rounded-xl bg-slate-100 dark:bg-emerald-950 border border-emerald-500/30 text-slate-900 dark:text-white">
              {currentSession.activeTerm}
            </div>
          </div>

          {dispatchScope !== 'ALL_SCHOOL' && (
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500">Select Programme:</label>
              <select
                value={selectedProgrammeId}
                onChange={(e) => {
                  setSelectedProgrammeId(e.target.value);
                  setSelectedClassId('');
                  setSelectedStudentId('');
                }}
                className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
              >
                <option value="">All Programmes</option>
                {programmes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.programme_name_english || p.programme_name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {(dispatchScope === 'CLASS' || dispatchScope === 'SINGLE_STUDENT' || (dispatchScope === 'PROGRAMME' && selectedProgrammeId)) && (
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500">Select Class:</label>
              <select
                value={selectedClassId}
                onChange={(e) => {
                  setSelectedClassId(e.target.value);
                  setSelectedStudentId('');
                }}
                className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
              >
                <option value="">All Classes in Scope</option>
                {filteredClasses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {dispatchScope === 'SINGLE_STUDENT' && (
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-500">Select Student:</label>
              <select
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
              >
                <option value="">Select Specific Student Profile</option>
                {students
                  .filter((s) => (!selectedClassId || s.classId === selectedClassId) && (!selectedProgrammeId || s.programmeId === selectedProgrammeId))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.admissionNo}) - {s.className}
                    </option>
                  ))}
              </select>
            </div>
          )}
        </div>

        {/* DELIVERY CHANNEL CHECKBOXES */}
        <div className="pt-4 border-t border-slate-200 dark:border-emerald-500/20 space-y-3">
          <label className="text-xs font-black uppercase text-slate-700 dark:text-emerald-300">Select Dispatch Channels:</label>
          <div className="flex flex-wrap gap-4 text-xs font-bold">
            {[
              { id: 'EMAIL', label: 'HTML Email', icon: Mail },
              { id: 'WHATSAPP', label: 'WhatsApp Direct', icon: MessageSquare },
              { id: 'IN_APP', label: 'In-App Portal Notification', icon: Bell },
            ].map((ch) => {
              const isChecked = selectedChannels.includes(ch.id);
              return (
                <div
                  key={ch.id}
                  onClick={() => toggleChannel(ch.id)}
                  className={`px-4 py-2.5 rounded-2xl border cursor-pointer flex items-center gap-2 transition-all ${
                    isChecked
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-[#021810] border-slate-200 dark:border-emerald-500/20 text-slate-400'
                  }`}
                >
                  <ch.icon className="w-4 h-4" />
                  <span>{ch.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* DISPATCH SUMMARY & BATCH ACTION BAR */}
      <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Selected Scope Summary</h3>
            <p className="text-xs text-slate-500 dark:text-emerald-300/70">
              Targeting {targetedStudents.length} Student Profiles | Merged into {parentGroups.length} Parent Account Dispatches
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">
            <button
              onClick={handleOpenWhatsAppModal}
              disabled={targetedStudents.length === 0}
              className="justify-center px-5 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-xl flex items-center gap-2 disabled:opacity-50 transition-all hover:scale-105"
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="truncate">📱 Open WhatsApp Gateway ({parentGroups.length} Parents)</span>
            </button>

            <button
              onClick={handlePublishBatch}
              disabled={isPublishing || targetedStudents.length === 0}
              className="justify-center px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs shadow-xl flex items-center gap-2 disabled:opacity-50 transition-all hover:scale-105"
            >
              <Send className="w-4 h-4 shrink-0" />
              <span>{isPublishing ? 'Publishing & Sending...' : 'Publish & Dispatch Selection'}</span>
            </button>
          </div>
        </div>

        {publishSuccessToast && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <div>
              Successfully published report cards for {publishSuccessToast.successCount} students across {publishSuccessToast.parentGroupsCount} parent contact accounts!
            </div>
          </div>
        )}
      </div>

      {/* SMART PARENT GROUPING PREVIEW TABLE */}
      <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <h3 className="text-base font-black text-slate-900 dark:text-white">Smart Parent Target Roster & WhatsApp Preview</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              {parentGroups.length} Target Parent Accounts
            </span>
            <span className="sm:hidden text-[10px] text-slate-400 dark:text-emerald-400/70 italic">
              (Swipe horizontally →)
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-emerald-500/20 text-slate-400 font-extrabold uppercase text-[10px]">
                <th className="py-3 px-4">Parent Name</th>
                <th className="py-3 px-4">Wards / Students</th>
                <th className="py-3 px-4">WhatsApp Phone</th>
                <th className="py-3 px-4">Attached PDF Cards</th>
                <th className="py-3 px-4 text-right">Direct WhatsApp Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-emerald-500/10">
              {parentGroups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-emerald-400/60 font-sans">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
                    <p className="font-semibold text-xs text-slate-700 dark:text-emerald-300">No parent recipient accounts found for the selected scope.</p>
                    <p className="text-[11px] text-slate-400 dark:text-emerald-500/70 mt-0.5">Enrolled students and linked parent accounts will automatically populate this roster.</p>
                  </td>
                </tr>
              ) : (
                parentGroups.map((pg) => (
                  <tr key={pg.parentId} className="hover:bg-slate-50 dark:hover:bg-emerald-900/20">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{pg.parentName}</td>
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-emerald-700 dark:text-emerald-300">{pg.wardNames.join(', ')}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-emerald-200 font-mono">📱 {pg.parentPhone}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-emerald-100">
                      📄 {pg.reportCardsCount} PDF Card{pg.reportCardsCount > 1 ? 's' : ''}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleOpenSingleParentWhatsApp(pg)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] shadow-sm flex items-center gap-1.5 ml-auto transition-all hover:scale-105"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send WhatsApp</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WHATSAPP BATCH DISPATCH MODAL */}
      {whatsAppPayloads && (
        <WhatsAppBatchModal
          title="Direct WhatsApp Parent Message Dispatcher"
          subtitle={`Report Sheet Delivery for ${currentSession.sessionName} (${currentSession.activeTerm})`}
          payloads={whatsAppPayloads}
          onClose={() => setWhatsAppPayloads(null)}
        />
      )}
    </div>
  );
}
