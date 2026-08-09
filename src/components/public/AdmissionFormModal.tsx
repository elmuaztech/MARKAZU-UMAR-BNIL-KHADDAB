'use client';

import React, { useState } from 'react';
import { useApp } from '../../lib/context';
import {
  X,
  FileText,
  CheckCircle2,
  Sparkles,
  User,
  HeartHandshake,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Upload,
  Calendar,
  Lock,
} from 'lucide-react';
import { AdmissionApplication } from '../../types';

interface AdmissionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdmissionFormModal({ isOpen, onClose }: AdmissionFormModalProps) {
  const { schoolLogo, admissionStatus, submitAdmissionApplication } = useApp();
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State: Student Information
  const [studentFullName, setStudentFullName] = useState('');
  const [studentGender, setStudentGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [studentDob, setStudentDob] = useState('2017-05-15');
  const [state, setState] = useState('Kano State');
  const [lga, setLga] = useState('Kano Municipal');
  const [studentAddress, setStudentAddress] = useState('');
  const [previousSchool, setPreviousSchool] = useState('');
  const [passportPhoto, setPassportPhoto] = useState<string | undefined>(undefined);

  // Form State: Parent Information
  const [parentName, setParentName] = useState('');
  const [parentRelationship, setParentRelationship] = useState<'Father' | 'Mother' | 'Guardian'>('Father');
  const [parentPhone, setParentPhone] = useState('');
  const [parentWhatsapp, setParentWhatsapp] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentOccupation, setParentOccupation] = useState('');
  const [parentAddress, setParentAddress] = useState('');

  // Form State: Emergency Contact & Optional Info
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('Mother');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [medicalInformation, setMedicalInformation] = useState('');
  const [remarks, setRemarks] = useState('');

  // Confirmation state
  const [submittedApp, setSubmittedApp] = useState<AdmissionApplication | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    const handlePopState = () => {
      resetForm();
      onClose();
    };

    try {
      window.history.pushState({ modalOpen: true }, '');
    } catch {}

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const resetForm = () => {
    setCurrentStep(1);
    setStudentFullName('');
    setStudentAddress('');
    setPreviousSchool('');
    setParentName('');
    setParentPhone('');
    setParentWhatsapp('');
    setParentEmail('');
    setParentOccupation('');
    setParentAddress('');
    setEmergencyName('');
    setEmergencyPhone('');
    setMedicalInformation('');
    setRemarks('');
    setSubmittedApp(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFullName || !parentName || !parentEmail || !parentPhone) return;

    const newApp = submitAdmissionApplication({
      studentFullName: studentFullName.trim(),
      studentGender,
      studentDob,
      passportPhoto,
      state: state.trim() || 'Kano State',
      lga: lga.trim() || 'Kano Municipal',
      studentAddress: studentAddress.trim() || 'Kano, Nigeria',
      previousSchool: previousSchool.trim() || 'N/A',
      parentName: parentName.trim(),
      parentRelationship,
      parentPhone: parentPhone.trim(),
      parentWhatsapp: parentWhatsapp.trim() || parentPhone.trim(),
      parentEmail: parentEmail.trim().toLowerCase(),
      parentOccupation: parentOccupation.trim() || 'Guardian',
      parentAddress: parentAddress.trim() || studentAddress.trim() || 'Kano, Nigeria',
      emergencyName: emergencyName.trim() || parentName.trim(),
      emergencyRelationship: emergencyRelationship.trim() || parentRelationship,
      emergencyPhone: emergencyPhone.trim() || parentPhone.trim(),
      medicalInformation: medicalInformation.trim() || 'No known allergies',
      remarks: remarks.trim() || 'Online application submitted.',
    });

    setSubmittedApp(newApp);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto font-poppins">
      <div className="relative w-full max-w-2xl max-h-[85vh] sm:max-h-[88vh] bg-white dark:bg-[#032417] border border-emerald-200 dark:border-emerald-500/40 rounded-2xl sm:rounded-3xl p-5 sm:p-8 flex flex-col justify-between shadow-2xl overflow-y-auto text-xs scrollbar-thin scrollbar-thumb-emerald-600 space-y-4">
        {/* Close Button */}
        <button
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute top-5 right-5 p-2 bg-slate-100 dark:bg-emerald-950 text-slate-500 dark:text-emerald-300 hover:text-slate-900 dark:hover:text-white rounded-2xl transition-all z-10 shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Fixed Modal Header */}
        <div className="shrink-0 text-center space-y-1.5 border-b border-slate-100 dark:border-emerald-800/40 pb-3">
          {schoolLogo ? (
            <div className="w-12 h-12 rounded-full bg-white border-2 border-emerald-500/50 p-0.5 mx-auto flex items-center justify-center shadow-md overflow-hidden">
              <img src={schoolLogo} alt="Markazu Umar Logo" className="w-full h-full rounded-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-sky-500 text-white mx-auto flex items-center justify-center border-2 border-emerald-400/40 shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
          )}

          <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight uppercase leading-snug">
            MARKAZU UMAR BN AL-KHATTAB CENTRE FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES - DANEJI
          </h3>

          <div className="font-arabic font-bold text-amber-600 dark:text-amber-300 text-xs">
            مركز عمر بن الخطاب لتحفيظ القرآن بالدراسات الإسلامية دنيج
          </div>

          <h2 className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300 tracking-tight uppercase">
            Enroll Your Child Online
          </h2>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            2026/2027 Academic Session Application
          </p>
        </div>

        {/* Admission Closed Banner if Status is Closed */}
        {admissionStatus === 'CLOSED' ? (
          <div className="p-6 rounded-3xl bg-rose-950/40 border border-rose-500/40 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-rose-300">Online Admissions Closed</h3>
            <p className="text-xs text-rose-200/80 leading-relaxed max-w-md mx-auto">
              Admissions for the 2026/2027 Academic Session are currently closed. Please contact the school administration office for inquiry.
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs"
            >
              Close Window
            </button>
          </div>
        ) : submittedApp ? (
          /* Application Confirmation Screen */
          <div className="p-6 rounded-3xl bg-emerald-950/50 border border-emerald-500/40 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center border-2 border-emerald-500/40 shadow-lg">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold uppercase tracking-widest border border-amber-500/30">
                Status: Pending Admin Review
              </span>
              <h3 className="text-2xl font-black text-white mt-2">Application Submitted!</h3>
              <p className="text-xs text-emerald-300/80 max-w-md mx-auto mt-1">
                Your child's admission application has been registered successfully.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-500/30 text-left space-y-2 font-mono text-[11px]">
              <div className="flex justify-between border-b border-emerald-800/40 pb-1.5">
                <span className="text-emerald-400 font-semibold">Application Number:</span>
                <span className="text-white font-bold">{submittedApp.applicationNo}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-800/40 pb-1.5">
                <span className="text-emerald-400 font-semibold">Student Candidate:</span>
                <span className="text-white font-bold">{submittedApp.studentFullName}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-800/40 pb-1.5">
                <span className="text-emerald-400 font-semibold">Parent / Guardian:</span>
                <span className="text-white font-bold">{submittedApp.parentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-400 font-semibold">Parent Email:</span>
                <span className="text-white font-bold">{submittedApp.parentEmail}</span>
              </div>
            </div>

            <p className="text-[11px] text-emerald-200/80">
              Upon approval by the Administrator, login credentials for the **Student Portal** & **Parent Portal** will be automatically emailed to <span className="font-bold text-white font-mono">{submittedApp.parentEmail}</span>.
            </p>

            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-lg transition-all"
            >
              Done & Return to Homepage
            </button>
          </div>
        ) : (
          /* Multi-Step Application Wizard */
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between overflow-hidden pt-2">
            {/* Step Indicator (Fixed Top) */}
            <div className="shrink-0 flex items-center justify-between border-b border-slate-200 dark:border-emerald-800/40 pb-2.5">
              {[
                { step: 1, label: 'Student Info' },
                { step: 2, label: 'Parent Info' },
                { step: 3, label: 'Emergency & Medical' },
                { step: 4, label: 'Review & Submit' },
              ].map((s) => (
                <button
                  type="button"
                  key={s.step}
                  onClick={() => setCurrentStep(s.step as any)}
                  className={`flex items-center gap-1.5 font-bold text-[11px] transition-all ${
                    currentStep === s.step
                      ? 'text-amber-500 font-black'
                      : currentStep > s.step
                      ? 'text-emerald-400'
                      : 'text-slate-400 dark:text-emerald-900/60'
                  }`}
                >
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                      currentStep === s.step
                        ? 'bg-amber-500 text-slate-950'
                        : currentStep > s.step
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

            {/* Scrollable Form Body Container */}
            <div className="flex-1 overflow-y-auto max-h-[50vh] pr-1.5 py-3 space-y-3">
              {/* Step 1: Student Information */}
              {currentStep === 1 && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="font-bold text-slate-900 dark:text-white text-xs border-b border-slate-100 dark:border-emerald-800/40 pb-1 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-500" />
                  <span>Step 1: Student Candidate Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-gray-300">
                      Full Name (Surname First) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Zayd Muhammad Daneji"
                      value={studentFullName}
                      onChange={(e) => setStudentFullName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-gray-300">
                      Gender <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={studentGender}
                      onChange={(e) => setStudentGender(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    >
                      <option value="MALE">Male (M)</option>
                      <option value="FEMALE">Female (F)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-gray-300">
                      Date of Birth <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={studentDob}
                      onChange={(e) => setStudentDob(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-gray-300">State of Origin</label>
                    <input
                      type="text"
                      placeholder="e.g. Kano State"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-gray-300">Local Govt Area (LGA)</label>
                    <input
                      type="text"
                      placeholder="e.g. Kano Municipal"
                      value={lga}
                      onChange={(e) => setLga(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-gray-300">Previous School / Madrasa</label>
                    <input
                      type="text"
                      placeholder="e.g. Al-Iman Academy Kano"
                      value={previousSchool}
                      onChange={(e) => setPreviousSchool(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-gray-300">Residential Address</label>
                  <input
                    type="text"
                    placeholder="e.g. No. 45 Daneji Quarters, Kano, Nigeria"
                    value={studentAddress}
                    onChange={(e) => setStudentAddress(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={!studentFullName}
                    onClick={() => setCurrentStep(2)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow"
                  >
                    <span>Next: Parent Info</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Parent / Guardian Information */}
            {currentStep === 2 && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="font-bold text-slate-900 dark:text-white text-xs border-b border-slate-100 dark:border-emerald-800/40 pb-1 flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-emerald-500" />
                  <span>Step 2: Parent / Guardian Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-gray-300">
                      Parent / Guardian Full Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Alhaji Muhammad Daneji"
                      value={parentName}
                      onChange={(e) => setParentName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-gray-300">Relationship to Child</label>
                    <select
                      value={parentRelationship}
                      onChange={(e) => setParentRelationship(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    >
                      <option value="Father">Father</option>
                      <option value="Mother">Mother</option>
                      <option value="Guardian">Guardian</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-gray-300">
                      Phone Number (Primary) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. +234 803 796 6581"
                      value={parentPhone}
                      onChange={(e) => setParentPhone(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-gray-300">WhatsApp Number</label>
                    <input
                      type="tel"
                      placeholder="e.g. +234 803 796 6581"
                      value={parentWhatsapp}
                      onChange={(e) => setParentWhatsapp(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-700 dark:text-gray-300">
                      Email Address (Used for Portal Login) <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. parent.email@gmail.com"
                      value={parentEmail}
                      onChange={(e) => setParentEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white font-mono"
                    />
                  </div>

                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-700 dark:text-gray-300">Occupation</label>
                    <input
                      type="text"
                      placeholder="e.g. Civil Servant / Merchant"
                      value={parentOccupation}
                      onChange={(e) => setParentOccupation(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-800 text-slate-700 dark:text-emerald-300 font-bold flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    disabled={!parentName || !parentPhone || !parentEmail}
                    onClick={() => setCurrentStep(3)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow"
                  >
                    <span>Next: Emergency & Medical</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Emergency Contact & Optional Info */}
            {currentStep === 3 && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="font-bold text-slate-900 dark:text-white text-xs border-b border-slate-100 dark:border-emerald-800/40 pb-1 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <span>Step 3: Emergency Contact & Optional Information</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="font-semibold text-slate-700 dark:text-gray-300">Emergency Contact Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Hajiya Fatima Daneji"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700 dark:text-gray-300">Emergency Relationship</label>
                    <input
                      type="text"
                      placeholder="e.g. Mother / Uncle"
                      value={emergencyRelationship}
                      onChange={(e) => setEmergencyRelationship(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-gray-300">Emergency Phone Number</label>
                  <input
                    type="tel"
                    placeholder="e.g. +234 816 710 9421"
                    value={emergencyPhone}
                    onChange={(e) => setEmergencyPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-gray-300">Medical Information / Allergies (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="List any known allergies, chronic conditions, or special health notes..."
                    value={medicalInformation}
                    onChange={(e) => setMedicalInformation(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-gray-300">Remarks / Special Requests (Optional)</label>
                  <textarea
                    rows={2}
                    placeholder="Mention previous Qur'an memorization status or special educational requests..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-800 text-slate-700 dark:text-emerald-300 font-bold flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentStep(4)}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow"
                  >
                    <span>Review Application</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 4: Review & Submit */}
            {currentStep === 4 && (
              <div className="space-y-3 animate-in fade-in duration-150">
                <div className="font-bold text-slate-900 dark:text-white text-xs border-b border-slate-100 dark:border-emerald-800/40 pb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Step 4: Review Application & Submit</span>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 space-y-3 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 dark:text-emerald-400 font-semibold block text-[10px]">Student Name</span>
                      <span className="font-bold text-slate-900 dark:text-white">{studentFullName} ({studentGender})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-emerald-400 font-semibold block text-[10px]">Date of Birth</span>
                      <span className="font-bold text-slate-900 dark:text-white">{studentDob}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-emerald-400 font-semibold block text-[10px]">Parent / Guardian</span>
                      <span className="font-bold text-slate-900 dark:text-white">{parentName} ({parentRelationship})</span>
                    </div>
                    <div>
                      <span className="text-slate-400 dark:text-emerald-400 font-semibold block text-[10px]">Parent Email & Phone</span>
                      <span className="font-bold text-slate-900 dark:text-white font-mono">{parentEmail} • {parentPhone}</span>
                    </div>
                  </div>
                  {medicalInformation && (
                    <div className="border-t border-slate-200 dark:border-emerald-800/40 pt-2">
                      <span className="text-slate-400 dark:text-emerald-400 font-semibold block text-[10px]">Medical Info:</span>
                      <span className="text-slate-800 dark:text-emerald-200">{medicalInformation}</span>
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300">
                  By submitting this application, you declare that all candidate information provided is authentic and correct.
                </div>

                <div className="flex justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(3)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-800 text-slate-700 dark:text-emerald-300 font-bold flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-all scale-105"
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>Submit Online Application</span>
                  </button>
                </div>
              </div>
            )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
