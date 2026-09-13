'use client';

import React, { useState } from 'react';
import { useApp } from '../../../lib/context';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  User,
  HeartHandshake,
  Phone,
  Mail,
  MapPin,
  Search,
  Filter,
  Eye,
  Check,
  X,
  ArrowRight,
  ArrowLeft,
  Lock,
  Unlock,
  ShieldCheck,
  BookOpen,
  School,
  UserCheck,
} from 'lucide-react';
import { AdmissionApplication, Programme, SchoolClass } from '../../../types';
import { filterAdmissionsForUser } from '../../../lib/rbac';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export default function AdmissionsPage() {
  const {
    admissionApplications,
    admissionStatus,
    toggleAdmissionStatus,
    approveAdmissionApplication,
    rejectAdmissionApplication,
    programmes,
    classes,
    currentUser,
    showConfirm,
    notify,
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null);

  // Wizard Review State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedProgrammeIds, setSelectedProgrammeIds] = useState<string[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [rejectionReason, setRejectionReason] = useState('');

  const isAdmin = currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN';

  const userAdmissions = filterAdmissionsForUser(currentUser, admissionApplications);

  const filteredApps = userAdmissions.filter((app) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      app.studentFullName.toLowerCase().includes(query) ||
      app.applicationNo.toLowerCase().includes(query) ||
      app.parentName.toLowerCase().includes(query) ||
      app.parentEmail.toLowerCase().includes(query);

    const matchesStatus = statusFilter === 'ALL' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const pendingCount = admissionApplications.filter((a) => a.status === 'PENDING_REVIEW').length;
  const approvedCount = admissionApplications.filter((a) => a.status === 'APPROVED').length;
  const rejectedCount = admissionApplications.filter((a) => a.status === 'REJECTED').length;

  const toggleArrayItem = (item: string, array: string[], setArray: (arr: string[]) => void) => {
    if (array.includes(item)) {
      setArray(array.filter((i) => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const [isProcessing, setIsProcessing] = useState(false);

  const handleOpenWizard = (app: AdmissionApplication) => {
    setSelectedApp(app);
    setWizardStep(1);
    setSelectedProgrammeIds(app.assignedProgrammeIds || ['prog-02']);
    setSelectedClassIds(app.assignedClassIds || ['cls-tahfiz-1']);
  };

  const handleExecuteApproval = () => {
    if (!selectedApp || isProcessing) return;
    setIsProcessing(true);
    setTimeout(() => {
      approveAdmissionApplication(selectedApp.id, selectedProgrammeIds, selectedClassIds);
      setIsProcessing(false);
      setSelectedApp(null);
    }, 600);
  };

  const handleExecuteRejectionPrompt = () => {
    if (!selectedApp || isProcessing) return;
    showConfirm({
      title: 'Reject Admission Application',
      description: `Are you sure you want to reject the admission application for candidate ${selectedApp.studentFullName}? This action will record the rejection in the audit log.`,
      confirmLabel: 'Reject Application',
      cancelLabel: 'Cancel',
      isDanger: true,
      onConfirm: () => {
        setIsProcessing(true);
        setTimeout(() => {
          rejectAdmissionApplication(selectedApp.id, rejectionReason || 'Application did not meet admission criteria.');
          setIsProcessing(false);
          setSelectedApp(null);
        }, 500);
      },
    });
  };

  return (
    <div className="space-y-6 text-xs selection:bg-emerald-500 selection:text-white">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-900 via-emerald-800 to-sky-900 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-emerald-700/50">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-amber-300 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> Admission Control & Review Centre
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Online Student Admission System
          </h1>
          <p className="text-xs text-emerald-100/90 leading-relaxed">
            Review submitted online admission applications, assign programmes & classes, and automatically generate Student & Parent portal accounts with email login credential dispatches.
          </p>
        </div>

        {/* Admission OPEN / CLOSED Toggle Switch */}
        {isAdmin && (
          <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 space-y-2 shrink-0 text-center w-full md:w-auto">
            <div className="flex items-center justify-between gap-4">
              <span className="font-bold text-xs text-white">Public Admission Status</span>
              <Badge variant={admissionStatus === 'OPEN' ? 'emerald' : 'rose'} className="text-[10px] font-mono">
                {admissionStatus}
              </Badge>
            </div>
            <button
              onClick={() => toggleAdmissionStatus(admissionStatus === 'OPEN' ? 'CLOSED' : 'OPEN')}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow transition-all ${
                admissionStatus === 'OPEN'
                  ? 'bg-rose-500 hover:bg-rose-400 text-white'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
              }`}
            >
              {admissionStatus === 'OPEN' ? (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Close Online Admissions</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Open Online Admissions</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-emerald-500/30 space-y-1">
          <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Total Applications</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-mono">{admissionApplications.length}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-amber-500/30 space-y-1">
          <div className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 uppercase">Pending Review</div>
          <div className="text-2xl font-black text-amber-500 font-mono">{pendingCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-emerald-500/30 space-y-1">
          <div className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Approved & Portals Created</div>
          <div className="text-2xl font-black text-emerald-400 font-mono">{approvedCount}</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#042419] border border-rose-500/30 space-y-1">
          <div className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 uppercase">Rejected Applications</div>
          <div className="text-2xl font-black text-rose-400 font-mono">{rejectedCount}</div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search candidate name, app no, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['ALL', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition-all ${
                statusFilter === st
                  ? 'bg-emerald-600 text-white shadow'
                  : 'bg-slate-100 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300'
              }`}
            >
              {st === 'ALL' ? 'All Applications' : st.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="rounded-3xl border border-slate-200 dark:border-emerald-500/30 bg-white dark:bg-[#042419] shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#021c13] text-slate-700 dark:text-emerald-300 border-b border-slate-200 dark:border-emerald-500/20 font-bold uppercase tracking-wider text-[10px]">
                <th className="p-4">App No / Date</th>
                <th className="p-4">Student Candidate</th>
                <th className="p-4">Parent / Guardian</th>
                <th className="p-4">Previous School</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-emerald-500/20">
              {filteredApps.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 dark:text-emerald-400/60 italic">
                    No admission applications match your current filters.
                  </td>
                </tr>
              ) : (
                filteredApps.map((app) => (
                  <tr key={app.id} className="hover:bg-emerald-50/50 dark:hover:bg-emerald-950/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900 dark:text-white">
                      <div>{app.applicationNo}</div>
                      <div className="text-[10px] text-slate-400 font-normal">
                        {new Date(app.submittedAt).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-white">{app.studentFullName}</div>
                      <div className="text-[10px] text-slate-500 dark:text-emerald-300/80">
                        {app.studentGender} • DOB: {app.studentDob}
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {app.parentName} ({app.parentRelationship})
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-emerald-300/80 font-mono">
                        {app.parentEmail} • {app.parentPhone}
                      </div>
                    </td>

                    <td className="p-4 text-slate-700 dark:text-emerald-200">
                      {app.previousSchool || 'N/A'}
                    </td>

                    <td className="p-4">
                      <Badge
                        variant={
                          app.status === 'APPROVED'
                            ? 'emerald'
                            : app.status === 'PENDING_REVIEW'
                            ? 'amber'
                            : 'rose'
                        }
                        className="text-[10px]"
                      >
                        {app.status.replace('_', ' ')}
                      </Badge>
                    </td>

                    <td className="p-4 text-right">
                      <Button
                        variant={app.status === 'PENDING_REVIEW' ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => handleOpenWizard(app)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        {app.status === 'PENDING_REVIEW' ? 'Review & Assign' : 'View Application'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5-Step Admission Review Wizard Modal */}
      {selectedApp && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden bg-white dark:bg-[#042419] border border-emerald-500/40 rounded-3xl shadow-2xl text-xs">
            {/* Modal Fixed Header */}
            <div className="shrink-0 p-5 sm:p-6 space-y-3 border-b border-slate-200 dark:border-emerald-800/40 bg-slate-50/50 dark:bg-[#021810]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      Admission Review Wizard
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-emerald-300/80">
                      Application: <span className="font-mono font-bold text-amber-400">{selectedApp.applicationNo}</span> • Candidate: <span className="font-bold text-slate-900 dark:text-white">{selectedApp.studentFullName}</span>
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedApp(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Step Wizard Nav */}
              <div className="flex items-center justify-between pt-1">
                {[
                  { step: 1, label: 'Review App' },
                  { step: 2, label: 'Assign Programme' },
                  { step: 3, label: 'Assign Class' },
                  { step: 4, label: 'Preview Accounts' },
                  { step: 5, label: 'Approve / Reject' },
                ].map((s) => (
                  <button
                    key={s.step}
                    onClick={() => setWizardStep(s.step as any)}
                    className={`flex items-center gap-1 font-bold text-[10px] ${
                      wizardStep === s.step
                        ? 'text-amber-400 font-black'
                        : wizardStep > s.step
                        ? 'text-emerald-400'
                        : 'text-slate-500'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
                        wizardStep === s.step
                          ? 'bg-amber-500 text-slate-950'
                          : wizardStep > s.step
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-emerald-950 text-slate-500'
                      }`}
                    >
                      {s.step}
                    </span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-4">
              {/* Step 1: Review Application Details */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs border-b border-emerald-800/40 pb-1">
                      Student Candidate Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 dark:text-emerald-400 text-[10px] block font-semibold">Full Name</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedApp.studentFullName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-emerald-400 text-[10px] block font-semibold">Gender & DOB</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedApp.studentGender} • {selectedApp.studentDob}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-emerald-400 text-[10px] block font-semibold">State & LGA</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedApp.state} • {selectedApp.lga}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-emerald-400 text-[10px] block font-semibold">Previous School</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedApp.previousSchool}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs border-b border-emerald-800/40 pb-1">
                      Parent / Guardian Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 dark:text-emerald-400 text-[10px] block font-semibold">Parent Name & Relationship</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedApp.parentName} ({selectedApp.parentRelationship})</span>
                      </div>
                      <div>
                        <span className="text-slate-400 dark:text-emerald-400 text-[10px] block font-semibold">Phone & WhatsApp</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">{selectedApp.parentPhone} • {selectedApp.parentWhatsapp}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 dark:text-emerald-400 text-[10px] block font-semibold">Parent Email (Portal Login)</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">{selectedApp.parentEmail}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Assign Programme(s) */}
              {wizardStep === 2 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      Step 2: Assign Programme(s) to Candidate
                    </h4>
                    <p className="text-slate-500 dark:text-emerald-300/80 text-[11px]">
                      Select one or multiple academic tracks for <span className="font-bold text-white">{selectedApp.studentFullName}</span>.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-2 pt-1">
                    {programmes.map((p) => {
                      const isSelected = selectedProgrammeIds.includes(p.id);
                      return (
                        <button
                          type="button"
                          key={p.id}
                          onClick={() => toggleArrayItem(p.id, selectedProgrammeIds, setSelectedProgrammeIds)}
                          className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-emerald-950/80 border-emerald-500 text-white shadow-md'
                              : 'bg-slate-50 dark:bg-[#021810] border-slate-200 dark:border-emerald-800/40 text-slate-700 dark:text-emerald-300'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-xs flex items-center gap-2">
                              <span>{p.programme_name_english}</span>
                              <span className="font-arabic text-amber-300 text-[11px]">({p.programme_name_arabic})</span>
                            </div>
                            <div className="text-[10px] opacity-75">{p.description}</div>
                          </div>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 3: Assign Class(es) */}
              {wizardStep === 3 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-900 dark:text-white">
                      Step 3: Assign Class Placement(s)
                    </h4>
                    <p className="text-slate-500 dark:text-emerald-300/80 text-[11px]">
                      Assign the specific Halqa / Class for the candidate across selected programmes.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    {classes.map((c) => {
                      const isSelected = selectedClassIds.includes(c.id) || selectedClassIds.includes(c.name);
                      return (
                        <button
                          type="button"
                          key={c.id}
                          onClick={() => toggleArrayItem(c.id, selectedClassIds, setSelectedClassIds)}
                          className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                            isSelected
                              ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold'
                              : 'bg-slate-50 dark:bg-[#021810] border-slate-200 dark:border-emerald-800/40 text-slate-700 dark:text-emerald-300'
                          }`}
                        >
                          <div>
                            <div className="font-bold text-xs">{c.name}</div>
                            <div className="text-[10px] opacity-75 font-mono">{c.programmeName || 'General'}</div>
                          </div>
                          {isSelected && <Check className="w-4 h-4 text-amber-400" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Step 4: Live Preview Generated Accounts */}
              {wizardStep === 4 && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-500/30 space-y-3 font-mono text-[11px]">
                    <h4 className="font-bold text-emerald-400 text-xs flex items-center gap-1.5 font-sans">
                      <ShieldCheck className="w-4 h-4" /> Auto-Generated Credentials Preview
                    </h4>

                    <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/20 space-y-1">
                      <div className="text-amber-300 font-bold font-sans">1. Student Portal Account</div>
                      <div>Student ID (Username): <span className="text-white font-bold">MU-2026-STUD-***</span></div>
                      <div>Temporary Password: <span className="text-white font-bold">Auto-generated secure temp pass</span></div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/20 space-y-1">
                      <div className="text-amber-300 font-bold font-sans">2. Parent Portal Account</div>
                      <div>Parent Username: <span className="text-white font-bold">{selectedApp.parentEmail}</span></div>
                      <div>Temporary Password: <span className="text-white font-bold">Auto-generated secure temp pass</span></div>
                      <div>Linked Child: <span className="text-white font-bold">{selectedApp.studentFullName}</span></div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Approve or Reject Trigger */}
              {wizardStep === 5 && (
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 space-y-3">
                    <h4 className="font-bold text-slate-900 dark:text-white text-xs">
                      Final Admission Decision & Portal Activation
                    </h4>
                    <p className="text-slate-500 dark:text-emerald-300/80 text-[11px]">
                      Approving will immediately create the Student and Parent portal accounts, set up relationships, and dispatch welcome credentials via email.
                    </p>

                    <div className="space-y-1 pt-1">
                      <label className="font-semibold text-slate-700 dark:text-gray-300">Rejection Reason (If rejecting):</label>
                      <input
                        type="text"
                        placeholder="Reason for rejection (e.g. Age requirement not met)..."
                        value={rejectionReason}
                        onChange={(e) => setRejectionReason(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#01120b] border border-slate-300 dark:border-emerald-500/30 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Fixed Footer Action Buttons */}
            <div className="shrink-0 p-4 sm:p-5 border-t border-slate-200 dark:border-emerald-800/40 flex items-center justify-between bg-slate-50/50 dark:bg-[#021810]">
              {wizardStep > 1 ? (
                <Button variant="secondary" size="md" disabled={isProcessing} onClick={() => setWizardStep((wizardStep - 1) as any)} leftIcon={<ArrowLeft className="w-4 h-4" />}>
                  Back
                </Button>
              ) : (
                <Button variant="secondary" size="md" onClick={() => setSelectedApp(null)}>
                  Cancel
                </Button>
              )}

              {wizardStep === 1 && (
                <Button variant="primary" size="md" onClick={() => setWizardStep(2)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Next: Assign Programme
                </Button>
              )}
              {wizardStep === 2 && (
                <Button variant="primary" size="md" disabled={selectedProgrammeIds.length === 0} onClick={() => setWizardStep(3)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Next: Assign Class
                </Button>
              )}
              {wizardStep === 3 && (
                <Button variant="primary" size="md" disabled={selectedClassIds.length === 0} onClick={() => setWizardStep(4)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Next: Preview Portals
                </Button>
              )}
              {wizardStep === 4 && (
                <Button variant="primary" size="md" onClick={() => setWizardStep(5)} rightIcon={<ArrowRight className="w-4 h-4" />}>
                  Next: Decision Trigger
                </Button>
              )}
              {wizardStep === 5 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleExecuteRejectionPrompt}
                    className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>{isProcessing ? 'Processing...' : 'Reject Application'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleExecuteApproval}
                    className="py-2.5 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-lg transition-all disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isProcessing ? 'Approving Admission...' : 'Approve & Create Portals'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
