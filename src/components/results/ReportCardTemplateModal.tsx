'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { ReportCardTemplate } from '@/types';
import {
  Palette,
  Layout,
  Type,
  FileSignature,
  Eraser,
  Upload,
  CheckCircle2,
  X,
  Eye,
  RotateCcw,
  Save,
  ShieldCheck,
  Check,
} from 'lucide-react';

interface ReportCardTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ReportCardTemplateModal({ isOpen, onClose }: ReportCardTemplateModalProps) {
  const { reportCardTemplate, updateReportCardTemplate, currentUser } = useApp();

  const [formData, setFormData] = useState<ReportCardTemplate>(reportCardTemplate);
  const [activeTab, setActiveTab] = useState<'content' | 'theme' | 'sections' | 'signature'>('content');

  // Canvas Signature Pad State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasCanvasSignature, setHasCanvasSignature] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when template changes or modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData(reportCardTemplate);
    }
  }, [isOpen, reportCardTemplate]);

  // Setup Canvas Drawing
  useEffect(() => {
    if (activeTab === 'signature' && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#042f1e';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      }
    }
  }, [activeTab]);

  if (!isOpen) return null;

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const rawX = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const rawY = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(rawX * scaleX, rawY * scaleY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / (rect.width || 1);
    const scaleY = canvas.height / (rect.height || 1);
    const rawX = ('touches' in e) ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const rawY = ('touches' in e) ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(rawX * scaleX, rawY * scaleY);
    ctx.stroke();
    setHasCanvasSignature(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasCanvasSignature(false);
  };

  const saveCanvasSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    setFormData((prev) => ({
      ...prev,
      defaultSignatureUrl: dataUrl,
      signatureType: 'CANVAS',
    }));
  };

  const handleImageSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setFormData((prev) => ({
          ...prev,
          defaultSignatureUrl: result,
          signatureType: 'IMAGE',
        }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFormSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateReportCardTemplate(formData);
    onClose();
  };

  const presetPalettes = [
    { name: 'Emerald & Gold (Default)', header: '#042f1e', text: '#ffffff', tableHeader: '#064e3b', accent: '#f59e0b' },
    { name: 'Classic Dark Green', header: '#064e3b', text: '#ffffff', tableHeader: '#042f1e', accent: '#10b981' },
    { name: 'Royal Gold Accent', header: '#1e293b', text: '#ffffff', tableHeader: '#0f172a', accent: '#d97706' },
    { name: 'Deep Forest', header: '#022c22', text: '#ffffff', tableHeader: '#065f46', accent: '#34d399' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-poppins">
      <div className="max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden bg-white dark:bg-[#032015] border border-emerald-500/30 rounded-3xl shadow-2xl">
        {/* Header Bar */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-[#042f1e] via-[#064E3B] to-[#0f5132] text-white flex items-center justify-between border-b border-emerald-500/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-amber-300 shadow-md shrink-0">
              <Palette className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-sm sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                Official Report Sheet Template Builder
              </h2>
              <p className="text-[11px] sm:text-xs text-emerald-200/90 font-medium">
                Admin Customization: Titles, Colors, Sections & Signatures
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
            onClick={() => setActiveTab('content')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'content'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
            }`}
          >
            <Type className="w-4 h-4" />
            <span>1. Header Titles & Content</span>
          </button>

          <button
            onClick={() => setActiveTab('theme')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'theme'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
            }`}
          >
            <Palette className="w-4 h-4" />
            <span>2. Colors & Aesthetics</span>
          </button>

          <button
            onClick={() => setActiveTab('sections')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'sections'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
            }`}
          >
            <Layout className="w-4 h-4" />
            <span>3. Toggled Report Sections</span>
          </button>

          <button
            onClick={() => setActiveTab('signature')}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === 'signature'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
            }`}
          >
            <FileSignature className="w-4 h-4" />
            <span>4. Default Signature & Remarks</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleFormSave} className="flex-1 flex flex-col min-h-0 overflow-hidden text-xs">
          <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-6">
            {/* TAB 1: HEADER TITLES & CONTENT */}
            {activeTab === 'content' && (
              <div className="space-y-5">
              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-emerald-200">
                  School Name in English (Header Title) *
                </label>
                <input
                  type="text"
                  required
                  value={formData.titleEnglish}
                  onChange={(e) => setFormData({ ...formData, titleEnglish: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-emerald-200">
                  School Name in Arabic (Header Title)
                </label>
                <input
                  type="text"
                  value={formData.titleArabic}
                  onChange={(e) => setFormData({ ...formData, titleArabic: e.target.value })}
                  dir="rtl"
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white font-arabic text-sm font-bold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-emerald-200">
                    Report Card Document Subtitle (English)
                  </label>
                  <input
                    type="text"
                    value={formData.subTitleEnglish}
                    onChange={(e) => setFormData({ ...formData, subTitleEnglish: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-emerald-200">
                    Report Card Document Subtitle (Arabic)
                  </label>
                  <input
                    type="text"
                    value={formData.subTitleArabic}
                    onChange={(e) => setFormData({ ...formData, subTitleArabic: e.target.value })}
                    dir="rtl"
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white font-arabic"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white">Display Official School Crest Logo</h4>
                  <p className="text-[11px] text-slate-500 dark:text-emerald-300/70">
                    Include the uploaded school logo at top of report card.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.showLogo}
                  onChange={(e) => setFormData({ ...formData, showLogo: e.target.checked })}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* TAB 2: COLORS & AESTHETICS */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white mb-2">Preset School Color Palettes</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {presetPalettes.map((preset) => (
                    <div
                      key={preset.name}
                      onClick={() =>
                        setFormData({
                          ...formData,
                          headerBgColor: preset.header,
                          headerTextColor: preset.text,
                          tableHeaderBgColor: preset.tableHeader,
                          accentColor: preset.accent,
                        })
                      }
                      className="p-3 rounded-2xl border border-slate-200 dark:border-emerald-800/40 bg-slate-50 dark:bg-[#021810] cursor-pointer hover:border-emerald-400 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-800 dark:text-white">
                        <span>{preset.name}</span>
                        {formData.headerBgColor === preset.header && <Check className="w-4 h-4 text-emerald-500" />}
                      </div>
                      <div className="flex items-center gap-1.5 h-6 rounded-lg overflow-hidden border border-slate-300 dark:border-emerald-800/60">
                        <div className="flex-1 h-full" style={{ backgroundColor: preset.header }} />
                        <div className="flex-1 h-full" style={{ backgroundColor: preset.tableHeader }} />
                        <div className="flex-1 h-full" style={{ backgroundColor: preset.accent }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-emerald-800/40">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-emerald-200">Header Crest Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.headerBgColor}
                      onChange={(e) => setFormData({ ...formData, headerBgColor: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={formData.headerBgColor}
                      onChange={(e) => setFormData({ ...formData, headerBgColor: e.target.value })}
                      className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-emerald-200">Table Header Background Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.tableHeaderBgColor}
                      onChange={(e) => setFormData({ ...formData, tableHeaderBgColor: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={formData.tableHeaderBgColor}
                      onChange={(e) => setFormData({ ...formData, tableHeaderBgColor: e.target.value })}
                      className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-emerald-200">Badge & Accent Highlight Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      className="w-10 h-10 rounded-xl cursor-pointer border border-slate-300"
                    />
                    <input
                      type="text"
                      value={formData.accentColor}
                      onChange={(e) => setFormData({ ...formData, accentColor: e.target.value })}
                      className="flex-1 p-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: TOGGLED REPORT SECTIONS */}
          {activeTab === 'sections' && (
            <div className="space-y-4">
              {[
                {
                  key: 'showTahfizSection',
                  title: 'Tahfiz & Qur’an Evaluation Card',
                  desc: 'Display Juz completion rate, current surah, Sabki & Manzil star ratings.',
                },
                {
                  key: 'showAkhlaqSection',
                  title: 'Behavioral & Akhlaq Rating Box',
                  desc: 'Display Islamic conduct (Adab), neatness, punctuality & respect scores.',
                },
                {
                  key: 'showSummarySection',
                  title: 'Academic Summary Statistics Box',
                  desc: 'Display Total Obtained, Average %, and Overall Terminal Grade calculation.',
                },
                {
                  key: 'showGradeLegend',
                  title: 'Grading Scale Legend & Key',
                  desc: 'Display grading scale breakdown (A: 75-100%, B: 60-74.99%, C: 50-59.99%, D: 40-49.99%, F: 0-39.99%).',
                },
              ].map((sec) => (
                <div
                  key={sec.key}
                  className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white">{sec.title}</h4>
                    <p className="text-[11px] text-slate-500 dark:text-emerald-300/70">{sec.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={(formData as any)[sec.key]}
                    onChange={(e) => setFormData({ ...formData, [sec.key]: e.target.checked })}
                    className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                  />
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: DEFAULT SIGNATURE & REMARKS */}
          {activeTab === 'signature' && (
            <div className="space-y-6">
              {/* Remarks Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-emerald-200">Principal / Director Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.principalName}
                    onChange={(e) => setFormData({ ...formData, principalName: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-800 dark:text-emerald-200">Principal Official Title</label>
                  <input
                    type="text"
                    value={formData.principalTitle}
                    onChange={(e) => setFormData({ ...formData, principalTitle: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-800 dark:text-emerald-200">Default Principal Terminal Remark</label>
                <textarea
                  rows={2}
                  value={formData.principalRemarkDefault}
                  onChange={(e) => setFormData({ ...formData, principalRemarkDefault: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                />
              </div>

              {/* INTERACTIVE SIGNATURE PAD & UPLOADER */}
              <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-[#021810] border border-emerald-200 dark:border-emerald-800/50 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-black text-slate-900 dark:text-white text-sm">
                    <FileSignature className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    <span>School Default Signature & Official Stamp</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                    Applies across ALL Student Report Sheets
                  </span>
                </div>

                {/* Signature Source Switcher */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  {/* Left: Draw Signature Canvas */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-800 dark:text-emerald-200 block">
                      Option A: Draw Official Signature on Screen
                    </label>
                    <div className="border-2 border-dashed border-emerald-500/40 rounded-2xl p-1 bg-white dark:bg-[#042419]">
                      <canvas
                        ref={canvasRef}
                        width={350}
                        height={120}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-28 bg-white cursor-crosshair rounded-xl"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 font-bold text-[11px] flex items-center gap-1 hover:bg-slate-300"
                      >
                        <Eraser className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                      <button
                        type="button"
                        onClick={saveCanvasSignature}
                        disabled={!hasCanvasSignature}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-[11px] flex items-center gap-1 shadow-md"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Use Drawn Signature</span>
                      </button>
                    </div>
                  </div>

                  {/* Right: Upload Signature File */}
                  <div className="space-y-2">
                    <label className="font-bold text-slate-800 dark:text-emerald-200 block">
                      Option B: Upload Signature Image File (PNG / JPG)
                    </label>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageSignatureUpload}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-emerald-800 hover:border-emerald-500 bg-white dark:bg-[#042419] flex flex-col items-center justify-center gap-1.5 text-slate-600 dark:text-emerald-300 font-bold hover:text-emerald-600 transition-all"
                    >
                      <Upload className="w-6 h-6 text-emerald-500" />
                      <span>Click to Upload Signature File</span>
                      <span className="text-[10px] text-slate-400 font-normal">Transparent PNG recommended</span>
                    </button>
                  </div>
                </div>

                {/* Active Signature Preview */}
                {formData.defaultSignatureUrl && (
                  <div className="p-3 rounded-xl bg-white dark:bg-[#042419] border border-emerald-300 dark:border-emerald-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                        Active Default Signature Preview:
                      </span>
                      <img
                        src={formData.defaultSignatureUrl}
                        alt="Default Signature Preview"
                        className="h-12 object-contain mt-1"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, defaultSignatureUrl: '' })}
                      className="text-rose-500 font-bold text-[11px] hover:underline"
                    >
                      Remove Signature
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          </div>

          {/* Action Bar Footer (Fixed) */}
          <div className="shrink-0 p-4 sm:p-5 border-t border-slate-200 dark:border-emerald-800/40 flex items-center justify-between bg-slate-50/50 dark:bg-[#021810]">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-2xl bg-slate-200 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300 font-bold text-xs hover:bg-slate-300 transition-all"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-black text-xs shadow-xl flex items-center gap-2 transition-all hover:scale-105"
            >
              <Save className="w-4 h-4" />
              <span>Save Default Report Card Template & Signature</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
