'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '../../lib/context';
import {
  X,
  FileText,
  CheckCircle2,
  BookOpen,
  User,
  HeartHandshake,
  ShieldAlert,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Lock,
  CreditCard,
  Check,
  AlertCircle,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface ProgrammeOption {
  id: string;
  name: string;
  code: string;
  description?: string;
  feeConfig?: {
    requiresApplicationFee: boolean;
    applicationFee: number;
    schoolFee: number;
    currency: string;
  };
}

interface AdmissionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdmissionFormModal({ isOpen, onClose }: AdmissionFormModalProps) {
  const { schoolLogo, admissionStatus, submitAdmissionApplication } = useApp();

  // Step 0: Programme Selection & Fee Payment
  // Step 1: Student Information
  // Step 2: Parent / Guardian Information
  // Step 3: Emergency & Medical
  // Step 4: Review & Submit
  const [currentStep, setCurrentStep] = useState<0 | 1 | 2 | 3 | 4>(0);

  // Programmes state
  const [programmes, setProgrammes] = useState<ProgrammeOption[]>([]);
  const [isLoadingProgrammes, setIsLoadingProgrammes] = useState(true);
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string>('');

  // Payment states
  const [payerName, setPayerName] = useState('');
  const [payerEmail, setPayerEmail] = useState('');
  const [payerPhone, setPayerPhone] = useState('');
  const [isInitializingPayment, setIsInitializingPayment] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [verifiedTxId, setVerifiedTxId] = useState<string | null>(null);
  const [verifiedTxRef, setVerifiedTxRef] = useState<string | null>(null);
  const [isFormUnlocked, setIsFormUnlocked] = useState(false);

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

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedApp, setSubmittedApp] = useState<any | null>(null);

  // Load public programmes and fee configurations from DB
  useEffect(() => {
    if (!isOpen) return;
    setIsLoadingProgrammes(true);
    fetch('/api/programmes/public')
      .then((res) => res.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.programmes || [];
        if (Array.isArray(list) && list.length > 0) {
          setProgrammes(list);
          if (!selectedProgrammeId) {
            setSelectedProgrammeId(list[0].id);
          }
        }
      })
      .catch((err) => console.error('Failed to load programmes:', err))
      .finally(() => setIsLoadingProgrammes(false));
  }, [isOpen]);

  // Handle browser back button
  useEffect(() => {
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
    setCurrentStep(0);
    setSelectedProgrammeId(programmes.length > 0 ? programmes[0].id : '');
    setPayerName('');
    setPayerEmail('');
    setPayerPhone('');
    setIsInitializingPayment(false);
    setIsVerifyingPayment(false);
    setPaymentError(null);
    setVerifiedTxId(null);
    setVerifiedTxRef(null);
    setIsFormUnlocked(false);

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
    setIsSubmitting(false);
    setSubmitError(null);
    setSubmittedApp(null);
  };

  const selectedProgramme = programmes.find((p) => p.id === selectedProgrammeId);
  const feeConfig = selectedProgramme?.feeConfig;
  const requiresAppFee = Boolean(feeConfig?.requiresApplicationFee && (feeConfig.applicationFee || 0) > 0);
  const applicationFeeAmount = feeConfig?.applicationFee || 0;

  // Initiate Flutterwave Payment for Application Fee
  const handleInitiatePayment = async () => {
    if (!selectedProgramme) return;
    if (!payerEmail || !payerName || !payerPhone) {
      setPaymentError('Please enter applicant/parent contact details for payment receipt.');
      return;
    }

    setPaymentError(null);
    setIsInitializingPayment(true);

    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programmeId: selectedProgramme.id,
          paymentType: 'APPLICATION_FEE',
          payerEmail: payerEmail.trim(),
          payerName: payerName.trim(),
          payerPhone: payerPhone.trim(),
        }),
      });

      const json = await res.json();
      if (!res.ok || json.status !== 'success') {
        throw new Error(json.message || 'Failed to initialize payment.');
      }

      const { publicKey, txRef, amount, currency, transactionId } = json.data;

      // Check if Flutterwave Checkout script is loaded
      if (typeof window !== 'undefined' && (window as any).FlutterwaveCheckout) {
        (window as any).FlutterwaveCheckout({
          public_key: publicKey,
          tx_ref: txRef,
          amount: amount,
          currency: currency || 'NGN',
          payment_options: 'card,banktransfer,ussd',
          customer: {
            email: payerEmail.trim(),
            phone_number: payerPhone.trim(),
            name: payerName.trim(),
          },
          customizations: {
            title: "Markazu Umar bn Al-Khattab",
            description: `Application Form Fee - ${selectedProgramme.name}`,
            logo: 'https://markazuumar.edu.ng/logo-rounded.png',
          },
          callback: async function (flwResponse: any) {
            // STRICT SERVER-SIDE VERIFICATION
            setIsVerifyingPayment(true);
            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  transactionId,
                  txRef,
                  paymentType: 'APPLICATION_FEE',
                  flwTransactionId: flwResponse.transaction_id,
                }),
              });

              const verifyJson = await verifyRes.json();
              if (verifyRes.ok && verifyJson.status === 'success') {
                setVerifiedTxId(transactionId);
                setVerifiedTxRef(txRef);
                setIsFormUnlocked(true);
                // Pre-fill parent details from payer info
                setParentName(payerName);
                setParentEmail(payerEmail);
                setParentPhone(payerPhone);
                setCurrentStep(1);
              } else {
                setPaymentError(verifyJson.message || 'Payment verification failed on server.');
              }
            } catch (err: any) {
              setPaymentError('Network error while verifying payment on server.');
            } finally {
              setIsVerifyingPayment(false);
            }
          },
          onclose: function () {
            setIsInitializingPayment(false);
          },
        });
      } else {
        throw new Error('Flutterwave payment gateway is currently loading. Please check your network and try again.');
      }
    } catch (err: any) {
      setPaymentError(err.message || 'An error occurred initializing payment.');
    } finally {
      setIsInitializingPayment(false);
    }
  };

  const handleProceedFree = () => {
    setIsFormUnlocked(true);
    setCurrentStep(1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFullName || !parentName || !parentEmail || !parentPhone || !selectedProgramme) return;

    if (requiresAppFee && !verifiedTxId) {
      setSubmitError('This programme requires a verified application fee payment before submission.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const payload = {
        programmeId: selectedProgramme.id,
        paymentTransactionId: verifiedTxId || undefined,
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
      };

      const res = await fetch('/api/admissions/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || json.status !== 'success') {
        throw new Error(json.message || 'Failed to submit admission application.');
      }

      setSubmittedApp(json.application);

      // Also invoke context listener for in-memory sync if active
      try {
        submitAdmissionApplication({
          ...payload,
        } as any);
      } catch (e) {
        // In-memory fallback ignore
      }
    } catch (err: any) {
      setSubmitError(err.message || 'Submission error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-poppins">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white dark:bg-[#032417] border border-emerald-200 dark:border-emerald-500/40 rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden text-xs">
        {/* Close Button */}
        <button
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-emerald-950 text-slate-500 dark:text-emerald-300 hover:text-slate-900 dark:hover:text-white rounded-2xl transition-all z-10 shadow-sm"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="shrink-0 p-5 sm:p-6 text-center space-y-1.5 border-b border-slate-100 dark:border-emerald-800/40">
          {schoolLogo ? (
            <div className="w-12 h-12 rounded-full bg-white border-2 border-emerald-500/50 p-0.5 mx-auto flex items-center justify-center shadow-md overflow-hidden">
              <img src={schoolLogo} alt="Markazu Umar Logo" className="w-full h-full rounded-full object-cover" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-sky-500 text-white mx-auto flex items-center justify-center border-2 border-emerald-400/40 shadow-md">
              <BookOpen className="w-6 h-6" />
            </div>
          )}

          <h3 className="font-black text-xs sm:text-sm text-slate-900 dark:text-white tracking-tight uppercase leading-snug">
            MARKAZU UMAR BN AL-KHATTAB CENTRE FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES - DANEJI
          </h3>

          <div className="font-arabic font-bold text-amber-600 dark:text-amber-300 text-xs">
            مركز عمر بن الخطاب لتحفيظ القرآن بالدراسات الإسلامية دنيج
          </div>

          <h2 className="text-base sm:text-lg font-black text-emerald-700 dark:text-emerald-300 tracking-tight uppercase">
            Online Admission Application
          </h2>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
            2026/2027 Academic Session Application
          </p>
        </div>

        {/* Admission Closed Banner */}
        {admissionStatus === 'CLOSED' ? (
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto min-h-0 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-rose-300">Online Admissions Closed</h3>
            <p className="text-xs text-rose-200/80 leading-relaxed max-w-md mx-auto">
              Admissions for the 2026/2027 Academic Session are currently closed. Please contact the school administration office for inquiry.
            </p>
          </div>
        ) : submittedApp ? (
          /* Success Screen */
          <div className="p-6 sm:p-8 flex-1 overflow-y-auto min-h-0 text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 mx-auto rounded-3xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Application Received Successfully!
              </h3>
              <p className="text-xs text-slate-500 dark:text-emerald-300/80 mt-1">
                Your admission application has been registered with Markazu Umar.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#021810] border border-emerald-500/30 text-left space-y-2 font-mono text-[11px]">
              <div className="flex justify-between border-b border-emerald-800/40 pb-1.5">
                <span className="text-emerald-400 font-semibold">Application Number:</span>
                <span className="text-white font-bold">{submittedApp.applicationNo}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-800/40 pb-1.5">
                <span className="text-emerald-400 font-semibold">Programme:</span>
                <span className="text-white font-bold">{submittedApp.programme?.name || selectedProgramme?.name}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-800/40 pb-1.5">
                <span className="text-emerald-400 font-semibold">Candidate Name:</span>
                <span className="text-white font-bold">{submittedApp.studentFullName}</span>
              </div>
              <div className="flex justify-between border-b border-emerald-800/40 pb-1.5">
                <span className="text-emerald-400 font-semibold">Parent / Guardian:</span>
                <span className="text-white font-bold">{submittedApp.parentName}</span>
              </div>
              {verifiedTxRef && (
                <div className="flex justify-between border-b border-emerald-800/40 pb-1.5">
                  <span className="text-emerald-400 font-semibold">Payment Reference:</span>
                  <span className="text-amber-400 font-bold">{verifiedTxRef}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-emerald-400 font-semibold">Status:</span>
                <span className="text-amber-300 font-bold">SUBMITTED (Entrance Exam/Interview Pending)</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-[11px] text-emerald-200/90 text-left space-y-1">
              <p className="font-bold text-amber-300">Next Steps & Official Markazu Policy:</p>
              <ul className="list-disc list-inside space-y-0.5 text-[10px]">
                <li>Our Admissions Committee will review the application and contact you for the oral Qur'an screening / entrance examination.</li>
                <li><strong>Important:</strong> School fees are completely separate from form fees and are <strong>ONLY payable after official acceptance</strong>.</li>
                <li>Portal login credentials will be emailed upon admission confirmation.</li>
              </ul>
            </div>

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
          /* Application Wizard */
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {/* Step Navigation Bar */}
            <div className="shrink-0 px-4 sm:px-6 py-2.5 flex items-center justify-between border-b border-slate-200 dark:border-emerald-800/40 bg-slate-50 dark:bg-[#021810] overflow-x-auto gap-2">
              {[
                { step: 0, label: 'Programme & Fee' },
                { step: 1, label: 'Student Info' },
                { step: 2, label: 'Parent Info' },
                { step: 3, label: 'Emergency & Medical' },
                { step: 4, label: 'Review & Submit' },
              ].map((s) => {
                const isAccessible = s.step === 0 || isFormUnlocked;
                return (
                  <button
                    type="button"
                    key={s.step}
                    disabled={!isAccessible}
                    onClick={() => {
                      if (isAccessible) setCurrentStep(s.step as any);
                    }}
                    className={`flex items-center gap-1.5 font-bold text-[11px] transition-all whitespace-nowrap ${
                      currentStep === s.step
                        ? 'text-amber-500 font-black'
                        : currentStep > s.step
                        ? 'text-emerald-400'
                        : 'text-slate-400 dark:text-emerald-900/60'
                    } ${!isAccessible ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
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
                      {s.step === 0 ? 'P' : s.step}
                    </span>
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-4">
              {/* STEP 0: Programme Selection & Fee Payment Gating */}
              {currentStep === 0 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="border-b border-slate-100 dark:border-emerald-800/40 pb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-500" />
                      <span>Step 1: Select Programme of Study</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-emerald-300/80 mt-0.5">
                      Select your intended programme. Application fees vary depending on the chosen curriculum and are loaded directly from the school fee schedule.
                    </p>
                  </div>

                  {isLoadingProgrammes ? (
                    <div className="flex flex-col items-center justify-center py-10 space-y-2 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                      <p className="text-xs">Loading official programmes & fee schedules...</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {programmes.map((p) => {
                          const isSelected = p.id === selectedProgrammeId;
                          const pFeeReq = Boolean(p.feeConfig?.requiresApplicationFee && (p.feeConfig.applicationFee || 0) > 0);
                          const pAppFee = p.feeConfig?.applicationFee || 0;

                          return (
                            <div
                              key={p.id}
                              onClick={() => {
                                setSelectedProgrammeId(p.id);
                                setVerifiedTxId(null);
                                setVerifiedTxRef(null);
                                setIsFormUnlocked(false);
                                setPaymentError(null);
                              }}
                              className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-emerald-50/50 dark:bg-emerald-950/60 border-emerald-500 shadow-sm'
                                  : 'bg-white dark:bg-[#021810] border-slate-200 dark:border-emerald-900/60 hover:border-emerald-400'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="space-y-0.5">
                                  <div className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                                    <span>{p.name}</span>
                                    <span className="px-1.5 py-0.5 rounded text-[9px] bg-slate-100 dark:bg-emerald-900 text-emerald-600 dark:text-emerald-300 font-mono">
                                      {p.code}
                                    </span>
                                  </div>
                                  <p className="text-[10px] text-slate-500 dark:text-emerald-300/70 line-clamp-2">
                                    {p.description || "Qur'an memorization, Islamic studies, and character development."}
                                  </p>
                                </div>
                                <div className="shrink-0 ml-2">
                                  {isSelected ? (
                                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                                      <Check className="w-3.5 h-3.5" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border border-slate-300 dark:border-emerald-800" />
                                  )}
                                </div>
                              </div>

                              <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-emerald-900/40 flex items-center justify-between text-[10px]">
                                <span className="text-slate-500 dark:text-emerald-400 font-medium">Application Form:</span>
                                {pFeeReq ? (
                                  <span className="font-bold text-amber-600 dark:text-amber-400">
                                    ₦{pAppFee.toLocaleString()}
                                  </span>
                                ) : (
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    FREE (₦0)
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Payment Gating Box */}
                      {selectedProgramme && (
                        <div className="mt-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-emerald-500/30 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-emerald-400 tracking-wider">
                                Selected Programme
                              </span>
                              <h4 className="text-xs font-black text-slate-900 dark:text-white">
                                {selectedProgramme.name} ({selectedProgramme.code})
                              </h4>
                            </div>
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-emerald-400 tracking-wider">
                                Application Fee
                              </span>
                              <p className="text-sm font-black text-emerald-600 dark:text-amber-400">
                                {requiresAppFee ? `₦${applicationFeeAmount.toLocaleString()}` : 'FREE (₦0)'}
                              </p>
                            </div>
                          </div>

                          {/* Critical Business Notice: Application Fee != School Fee */}
                          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300 space-y-1">
                            <p className="font-bold flex items-center gap-1.5">
                              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                              <span>Important Markazu Fee Policy:</span>
                            </p>
                            <p className="text-[10px] leading-relaxed">
                              The <strong>Application/Form Fee</strong> is strictly for screening & entrance exam processing. 
                              <strong> School fees are completely separate</strong> and will <strong>only</strong> be payable after your child has successfully completed the entrance examination and received an official admission offer.
                            </p>
                          </div>

                          {paymentError && (
                            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] flex items-center gap-2">
                              <AlertCircle className="w-4 h-4 shrink-0" />
                              <span>{paymentError}</span>
                            </div>
                          )}

                          {isVerifyingPayment && (
                            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-600 dark:text-blue-400 text-[11px] flex items-center gap-2">
                              <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                              <span>Verifying Flutterwave transaction server-side with bank authorities... Please wait.</span>
                            </div>
                          )}

                          {isFormUnlocked ? (
                            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[11px] flex items-center justify-between">
                              <span className="flex items-center gap-1.5 font-bold">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Application Form Unlocked & Ready</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center gap-1.5 shadow"
                              >
                                <span>Fill Candidate Form</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : requiresAppFee ? (
                            <div className="space-y-3 pt-2">
                              <div className="font-semibold text-slate-700 dark:text-gray-300 text-[11px]">
                                Enter Payer Details to Pay Application Fee (₦{applicationFeeAmount.toLocaleString()}):
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <input
                                    type="text"
                                    required
                                    placeholder="Full Name (Payer)"
                                    value={payerName}
                                    onChange={(e) => setPayerName(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#031c13] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white text-xs"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="email"
                                    required
                                    placeholder="Email Address"
                                    value={payerEmail}
                                    onChange={(e) => setPayerEmail(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#031c13] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white text-xs font-mono"
                                  />
                                </div>
                                <div>
                                  <input
                                    type="tel"
                                    required
                                    placeholder="Phone Number"
                                    value={payerPhone}
                                    onChange={(e) => setPayerPhone(e.target.value)}
                                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#031c13] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white text-xs font-mono"
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={isInitializingPayment || isVerifyingPayment}
                                onClick={handleInitiatePayment}
                                className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                              >
                                {isInitializingPayment ? (
                                  <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    <span>Connecting to Flutterwave...</span>
                                  </>
                                ) : (
                                  <>
                                    <CreditCard className="w-4 h-4" />
                                    <span>Pay ₦{applicationFeeAmount.toLocaleString()} via Flutterwave to Unlock Form</span>
                                  </>
                                )}
                              </button>
                            </div>
                          ) : (
                            <div className="pt-2">
                              <button
                                type="button"
                                onClick={handleProceedFree}
                                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all"
                              >
                                <span>Proceed to Free Application Form</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Form Steps 1-4 Wrapped in standard Form */}
              {currentStep > 0 && (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Step 1: Student Information */}
                  {currentStep === 1 && (
                    <div className="space-y-3 animate-in fade-in duration-150">
                      <div className="font-bold text-slate-900 dark:text-white text-xs border-b border-slate-100 dark:border-emerald-800/40 pb-1 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <User className="w-4 h-4 text-emerald-500" />
                          <span>Step 1: Student Candidate Information</span>
                        </div>
                        <span className="text-[10px] text-amber-500 font-bold">
                          {selectedProgramme?.name}
                        </span>
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

                      <div className="flex justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => setCurrentStep(0)}
                          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-800 text-slate-700 dark:text-emerald-300 font-bold flex items-center gap-1.5"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Back to Programme</span>
                        </button>
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

                      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 [&>*]:w-full sm:[&>*]:w-auto">
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

                      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 [&>*]:w-full sm:[&>*]:w-auto">
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
                            <span className="text-slate-400 dark:text-emerald-400 font-semibold block text-[10px]">Programme</span>
                            <span className="font-bold text-slate-900 dark:text-white">{selectedProgramme?.name}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 dark:text-emerald-400 font-semibold block text-[10px]">Application Fee</span>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                              {requiresAppFee ? `₦${applicationFeeAmount.toLocaleString()} (Verified)` : 'FREE'}
                            </span>
                          </div>
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
                        {verifiedTxRef && (
                          <div className="border-t border-slate-200 dark:border-emerald-800/40 pt-2 font-mono text-[10px] text-amber-500">
                            Verified Payment Reference: {verifiedTxRef}
                          </div>
                        )}
                      </div>

                      {submitError && (
                        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-[11px] flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>{submitError}</span>
                        </div>
                      )}

                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-800 dark:text-amber-300">
                        By submitting this application, you declare that all candidate information provided is authentic and correct.
                      </div>

                      <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 pt-2 [&>*]:w-full sm:[&>*]:w-auto">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => setCurrentStep(3)}
                          className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-800 text-slate-700 dark:text-emerald-300 font-bold flex items-center gap-1.5"
                        >
                          <ArrowLeft className="w-4 h-4" />
                          <span>Back</span>
                        </button>

                        <button
                          type="submit"
                          disabled={isSubmitting}
                          className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all scale-105"
                        >
                          {isSubmitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Submitting Application to Registry...</span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Submit Online Application</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
