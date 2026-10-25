'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { CertificateTemplate } from '@/types';
import {
  Award,
  Type,
  FileSignature,
  Eraser,
  Upload,
  CheckCircle2,
  X,
  Save,
  ShieldCheck,
  Building,
  Scroll,
} from 'lucide-react';

interface CertificateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CertificateTemplateModal({ isOpen, onClose }: CertificateTemplateModalProps) {
  const { certificateTemplate, updateCertificateTemplate, currentUser } = useApp();

  const [formData, setFormData] = useState<CertificateTemplate>(certificateTemplate);
  const [activeTab, setActiveTab] = useState<'institution' | 'titles' | 'signatures'>('institution');

  // Canvas Refs for Principal & Head of Tahfiz signatures
  const principalCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tahfizCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawingPrincipal, setIsDrawingPrincipal] = useState(false);
  const [isDrawingTahfiz, setIsDrawingTahfiz] = useState(false);
  const principalFileInputRef = useRef<HTMLInputElement | null>(null);
  const tahfizFileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData(certificateTemplate);
    }
  }, [isOpen, certificateTemplate]);

  // Setup Canvas styles
  useEffect(() => {
    if (activeTab === 'signatures') {
      [principalCanvasRef.current, tahfizCanvasRef.current].forEach((canvas) => {
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.strokeStyle = '#042f1e';
          ctx.lineWidth = 2.5;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
        }
      });
    }
  }, [activeTab]);

  if (!isOpen) return null;

  // Drawing helpers for canvas
  const handleCanvasStart = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement | null,
    setIsDrawing: (val: boolean) => void
  ) => {
    if (!canvas) return;
    setIsDrawing(true);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const rawX = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const rawY = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath();
    ctx.moveTo(rawX * scaleX, rawY * scaleY);
  };

  const handleCanvasDraw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>,
    canvas: HTMLCanvasElement | null,
    isDrawing: boolean
  ) => {
    if (!isDrawing || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const rawX = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const rawY = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineTo(rawX * scaleX, rawY * scaleY);
    ctx.stroke();
  };

  const clearCanvas = (canvas: HTMLCanvasElement | null, field: 'principalSignatureUrl' | 'headOfTahfizSignatureUrl') => {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setFormData((prev) => ({ ...prev, [field]: '' }));
  };

  const saveCanvasSignature = (canvas: HTMLCanvasElement | null, field: 'principalSignatureUrl' | 'headOfTahfizSignatureUrl') => {
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setFormData((prev) => ({
      ...prev,
      [field]: dataUrl,
      signatureType: 'CANVAS',
    }));
  };

  const handleFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    field: 'principalSignatureUrl' | 'headOfTahfizSignatureUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormData((prev) => ({
          ...prev,
          [field]: result,
          signatureType: 'IMAGE',
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateCertificateTemplate(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-poppins">
      <div className="max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden bg-white dark:bg-[#032015] border border-emerald-500/30 rounded-3xl shadow-2xl">
        {/* Header Bar */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-[#042f1e] via-[#064E3B] to-[#0f5132] text-white flex items-center justify-between border-b border-emerald-500/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shadow-md shrink-0">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Official Qur'an Assessment & Graduation Certificate Builder
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-200/90 font-medium">
                Super Admin Configuration: Institution Names, Titles, Citations & Signatures
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 hover:text-white transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-3 sm:px-6 py-2.5 sm:py-3 bg-slate-100 dark:bg-[#021810] border-b border-slate-200 dark:border-emerald-800/40 overflow-x-auto text-xs font-bold shrink-0">
          <button
            onClick={() => setActiveTab('institution')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'institution'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
            }`}
          >
            <Building className="w-4 h-4" />
            <span>1. Institutional Branding</span>
          </button>

          <button
            onClick={() => setActiveTab('titles')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'titles'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
            }`}
          >
            <Scroll className="w-4 h-4" />
            <span>2. Qualification Titles & Citation</span>
          </button>

          <button
            onClick={() => setActiveTab('signatures')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'signatures'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
            }`}
          >
            <FileSignature className="w-4 h-4" />
            <span>3. Authorized Signatures & Seals</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleFormSave} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: INSTITUTIONAL BRANDING */}
          {activeTab === 'institution' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 space-y-3">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
                  School Name & Location
                </span>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
                      School Name (English)
                    </label>
                    <input
                      type="text"
                      value={formData.schoolNameEnglish}
                      onChange={(e) => setFormData({ ...formData, schoolNameEnglish: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-semibold text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
                      School Name (Arabic)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      lang="ar"
                      value={formData.schoolNameArabic}
                      onChange={(e) => setFormData({ ...formData, schoolNameArabic: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold font-arabic text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
                      Location (English)
                    </label>
                    <input
                      type="text"
                      value={formData.schoolLocationEnglish}
                      onChange={(e) => setFormData({ ...formData, schoolLocationEnglish: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-semibold text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
                      Location (Arabic)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      lang="ar"
                      value={formData.schoolLocationArabic}
                      onChange={(e) => setFormData({ ...formData, schoolLocationArabic: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold font-arabic text-slate-900 dark:text-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
                      Official Seal Text
                    </label>
                    <input
                      type="text"
                      value={formData.sealText}
                      onChange={(e) => setFormData({ ...formData, sealText: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
                      Logo URL
                    </label>
                    <input
                      type="text"
                      value={formData.logoUrl}
                      onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: QUALIFICATION TITLES & CITATION */}
          {activeTab === 'titles' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 space-y-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
                  Certificate Header & Qualification Titles
                </span>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
                    Certificate Main Title (English)
                  </label>
                  <input
                    type="text"
                    value={formData.qualificationTitleEnglish}
                    onChange={(e) => setFormData({ ...formData, qualificationTitleEnglish: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold uppercase text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
                    Certificate Main Title (Arabic)
                  </label>
                  <input
                    type="text"
                    dir="rtl"
                    lang="ar"
                    value={formData.qualificationTitleArabic}
                    onChange={(e) => setFormData({ ...formData, qualificationTitleArabic: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold font-arabic text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
                    Official Qualification Reason & Citation
                  </label>
                  <textarea
                    rows={3}
                    value={formData.qualificationReason}
                    onChange={(e) => setFormData({ ...formData, qualificationReason: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-medium text-slate-900 dark:text-white"
                    placeholder="Enter the official text that appears under the student's name..."
                    required
                  />
                  <p className="text-[11px] text-slate-500 dark:text-emerald-300/70 mt-1">
                    This text describes the achievement (e.g. successful completion of 30-Juz Qur'an memorization, exemplary Islamic character, and examination board certification).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SIGNATURES & AUTHORITY */}
          {activeTab === 'signatures' && (
            <div className="space-y-6">
              {/* Principal Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 space-y-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
                  Authority 1: School Principal / Director
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
                      Principal Name
                    </label>
                    <input
                      type="text"
                      value={formData.principalName}
                      onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
                      Title (English)
                    </label>
                    <input
                      type="text"
                      value={formData.principalTitle}
                      onChange={(e) => setFormData({ ...formData, principalTitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
                      Title (Arabic)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      lang="ar"
                      value={formData.principalTitleArabic}
                      onChange={(e) => setFormData({ ...formData, principalTitleArabic: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold font-arabic text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Principal Signature Pad */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-emerald-200 block">
                    Principal Signature (Canvas Drawing or PNG Upload)
                  </span>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <canvas
                      ref={principalCanvasRef}
                      width={320}
                      height={90}
                      onMouseDown={(e) => handleCanvasStart(e, principalCanvasRef.current, setIsDrawingPrincipal)}
                      onMouseMove={(e) => handleCanvasDraw(e, principalCanvasRef.current, isDrawingPrincipal)}
                      onMouseUp={() => {
                        setIsDrawingPrincipal(false);
                        saveCanvasSignature(principalCanvasRef.current, 'principalSignatureUrl');
                      }}
                      onTouchStart={(e) => handleCanvasStart(e, principalCanvasRef.current, setIsDrawingPrincipal)}
                      onTouchMove={(e) => handleCanvasDraw(e, principalCanvasRef.current, isDrawingPrincipal)}
                      onTouchEnd={() => {
                        setIsDrawingPrincipal(false);
                        saveCanvasSignature(principalCanvasRef.current, 'principalSignatureUrl');
                      }}
                      className="w-full sm:w-80 h-24 bg-white border border-slate-300 rounded-xl cursor-crosshair touch-none shadow-inner"
                    />

                    <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => clearCanvas(principalCanvasRef.current, 'principalSignatureUrl')}
                        className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-emerald-950/60 text-slate-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-300"
                      >
                        <Eraser className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => principalFileInputRef.current?.click()}
                        className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-500"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                      </button>
                      <input
                        ref={principalFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => handleFileUpload(e, 'principalSignatureUrl')}
                        className="hidden"
                      />
                    </div>

                    {formData.principalSignatureUrl && (
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/40 rounded-xl">
                        <img
                          src={formData.principalSignatureUrl}
                          alt="Principal Signature"
                          className="h-14 max-w-[140px] object-contain"
                        />
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block text-center mt-1">
                          Active Signature
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Head of Tahfiz Section */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 space-y-4">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 dark:text-emerald-400 block">
                  Authority 2: Head of Tahfiz & Examination Board
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
                      Head of Tahfiz Name
                    </label>
                    <input
                      type="text"
                      value={formData.headOfTahfiz}
                      onChange={(e) => setFormData({ ...formData, headOfTahfiz: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
                      Title (English)
                    </label>
                    <input
                      type="text"
                      value={formData.headOfTahfizTitle}
                      onChange={(e) => setFormData({ ...formData, headOfTahfizTitle: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-semibold text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-emerald-200 mb-1">
                      Title (Arabic)
                    </label>
                    <input
                      type="text"
                      dir="rtl"
                      lang="ar"
                      value={formData.headOfTahfizTitleArabic}
                      onChange={(e) => setFormData({ ...formData, headOfTahfizTitleArabic: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-xs font-bold font-arabic text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Head of Tahfiz Signature Pad */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 dark:text-emerald-200 block">
                    Head of Tahfiz Signature (Canvas Drawing or PNG Upload)
                  </span>

                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    <canvas
                      ref={tahfizCanvasRef}
                      width={320}
                      height={90}
                      onMouseDown={(e) => handleCanvasStart(e, tahfizCanvasRef.current, setIsDrawingTahfiz)}
                      onMouseMove={(e) => handleCanvasDraw(e, tahfizCanvasRef.current, isDrawingTahfiz)}
                      onMouseUp={() => {
                        setIsDrawingTahfiz(false);
                        saveCanvasSignature(tahfizCanvasRef.current, 'headOfTahfizSignatureUrl');
                      }}
                      onTouchStart={(e) => handleCanvasStart(e, tahfizCanvasRef.current, setIsDrawingTahfiz)}
                      onTouchMove={(e) => handleCanvasDraw(e, tahfizCanvasRef.current, isDrawingTahfiz)}
                      onTouchEnd={() => {
                        setIsDrawingTahfiz(false);
                        saveCanvasSignature(tahfizCanvasRef.current, 'headOfTahfizSignatureUrl');
                      }}
                      className="w-full sm:w-80 h-24 bg-white border border-slate-300 rounded-xl cursor-crosshair touch-none shadow-inner"
                    />

                    <div className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => clearCanvas(tahfizCanvasRef.current, 'headOfTahfizSignatureUrl')}
                        className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-emerald-950/60 text-slate-700 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-slate-300"
                      >
                        <Eraser className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => tahfizFileInputRef.current?.click()}
                        className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-emerald-500"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload File</span>
                      </button>
                      <input
                        ref={tahfizFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        onChange={(e) => handleFileUpload(e, 'headOfTahfizSignatureUrl')}
                        className="hidden"
                      />
                    </div>

                    {formData.headOfTahfizSignatureUrl && (
                      <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/40 rounded-xl">
                        <img
                          src={formData.headOfTahfizSignatureUrl}
                          alt="Tahfiz Signature"
                          className="h-14 max-w-[140px] object-contain"
                        />
                        <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold block text-center mt-1">
                          Active Signature
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer Controls */}
          <div className="pt-4 border-t border-slate-200 dark:border-emerald-800/40 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-slate-700 dark:text-emerald-300 text-xs font-bold transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-lg shadow-emerald-900/20 flex items-center gap-2 transition-all hover:scale-102"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>Save & Update Certificate</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
