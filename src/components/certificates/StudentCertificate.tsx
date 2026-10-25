'use client';

import React, { useRef, useState, useEffect } from 'react';
import html2canvas from 'html2canvas';
import { downloadCanvasAsPdf } from '@/lib/certificatePdf';
import {
  Printer,
  Download,
  Award,
  Calendar,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  BookOpen,
  ArrowLeft,
  Loader2,
  FileText,
  Maximize2,
  Minimize2,
  CheckCircle2,
  FileSignature,
} from 'lucide-react';
import { useApp } from '@/lib/context';
import { CertificateTemplateModal } from './CertificateTemplateModal';

export interface CertificateData {
  certificateNo: string;
  issueDate: string;
  issueDateArabic: string;
  qualificationTitleEnglish: string;
  qualificationTitleArabic: string;
  qualificationReason: string;
  student: {
    id: string;
    admissionNo: string;
    fullName: string;
    fullNameArabic?: string | null;
    gender: string;
    className: string;
    programmeName: string;
    programmeNameArabic?: string;
    juzCompleted: number;
    completedSurahsCount: number;
    akhlaqRating: string;
  };
  school: {
    nameEnglish: string;
    nameArabic: string;
    locationEnglish: string;
    locationArabic: string;
    principalName: string;
    principalTitle: string;
    principalTitleArabic: string;
    headOfTahfiz: string;
    headOfTahfizTitle: string;
    logoUrl: string;
    sealText: string;
  };
}

interface StudentCertificateProps {
  certificate: CertificateData;
  onBack?: () => void;
}

export function StudentCertificate({ certificate, onBack }: StudentCertificateProps) {
  const { currentUser, certificateTemplate } = useApp();
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);

  const certificateRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'image' | 'pdf' | null>(null);
  const [fitScreen, setFitScreen] = useState(false);
  const [scaleFactor, setScaleFactor] = useState(1);

  // Compute responsive fit scale for mobile viewports
  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.clientWidth;
      if (containerWidth < 1050) {
        // Leave 16px padding on sides
        const newScale = Math.min(1, Math.max(0.3, (containerWidth - 16) / 1050));
        setScaleFactor(newScale);
      } else {
        setScaleFactor(1);
      }
    }

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!certificateRef.current) return;
    try {
      setIsExporting(true);
      setExportType('image');
      if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
        await (document as any).fonts.ready;
      }

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('markazu-official-certificate');
          if (el) {
            el.style.transform = 'none';
            el.style.margin = '0 auto';
          }
        },
      });

      const image = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = image;
      const safeName = certificate.student.fullName.replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `Certificate_${safeName}_${certificate.certificateNo}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export certificate image:', err);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const handleDownloadPdf = async () => {
    if (!certificateRef.current) return;
    try {
      setIsExporting(true);
      setExportType('pdf');
      if (typeof document !== 'undefined' && (document as any).fonts?.ready) {
        await (document as any).fonts.ready;
      }

      const canvas = await html2canvas(certificateRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('markazu-official-certificate');
          if (el) {
            el.style.transform = 'none';
            el.style.margin = '0 auto';
          }
        },
      });

      const safeName = certificate.student.fullName.replace(/[^a-zA-Z0-9]/g, '_');
      downloadCanvasAsPdf(canvas, `Certificate_${safeName}_${certificate.certificateNo}.pdf`, {
        title: `Official Graduation Certificate - ${certificate.student.fullName}`,
        author: "Markazu Umar bn Al-Khattab Centre for Qur'an Memorization and Islamic Studies",
      });
    } catch (err) {
      console.error('Failed to export certificate PDF:', err);
    } finally {
      setIsExporting(false);
      setExportType(null);
    }
  };

  const { student, school } = certificate;

  // Dynamically resolve template overrides from Super Admin
  const tmpl = certificateTemplate;
  const schoolNameArabic = tmpl?.schoolNameArabic || school.nameArabic;
  const schoolNameEnglish = tmpl?.schoolNameEnglish || school.nameEnglish;
  const schoolLocationEnglish = tmpl?.schoolLocationEnglish || school.locationEnglish;
  const schoolLocationArabic = tmpl?.schoolLocationArabic || school.locationArabic;
  const qualificationTitleEnglish = tmpl?.qualificationTitleEnglish || certificate.qualificationTitleEnglish;
  const qualificationTitleArabic = tmpl?.qualificationTitleArabic || certificate.qualificationTitleArabic;
  const qualificationReason = tmpl?.qualificationReason || certificate.qualificationReason;
  const principalName = tmpl?.principalName || school.principalName;
  const principalTitle = tmpl?.principalTitle || school.principalTitle;
  const principalTitleArabic = tmpl?.principalTitleArabic || school.principalTitleArabic;
  const principalSignatureUrl = tmpl?.principalSignatureUrl;
  const headOfTahfiz = tmpl?.headOfTahfiz || school.headOfTahfiz;
  const headOfTahfizTitle = tmpl?.headOfTahfizTitle || school.headOfTahfizTitle;
  const headOfTahfizTitleArabic = tmpl?.headOfTahfizTitleArabic || "رئيس هيئة التحفيظ ولجنة الامتحانات";
  const headOfTahfizSignatureUrl = tmpl?.headOfTahfizSignatureUrl;
  const sealText = tmpl?.sealText || school.sealText;
  const logoUrl = tmpl?.logoUrl || school.logoUrl;

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

  return (
    <div className="space-y-6 font-poppins">
      {/* Action Navigation Bar (Hidden when printing) */}
      <div className="no-print flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/60 text-slate-700 dark:text-emerald-300 transition-colors"
              title="Go Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <span>Official Institutional Certificate</span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-emerald-300/70">
              Verified landscape graduation document • Ref: {certificate.certificateNo}
            </p>
          </div>
        </div>

        {/* Action Controls: PDF, Image, Print, Viewport Toggle, Super Admin Edit */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Super Admin Edit Option */}
          {isSuperAdmin && (
            <button
              onClick={() => setIsTemplateModalOpen(true)}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all hover:scale-102"
              title="Edit Certificate Template & Signatures"
            >
              <FileSignature className="w-3.5 h-3.5 text-amber-300" />
              <span>Edit Certificate</span>
            </button>
          )}

          {/* Mobile Zoom / Fit Toggle */}
          <button
            onClick={() => setFitScreen(!fitScreen)}
            className="hidden sm:inline-flex md:hidden px-3 py-2 rounded-xl bg-slate-100 dark:bg-emerald-950/60 text-slate-700 dark:text-emerald-300 font-bold text-xs items-center gap-1.5 border border-slate-200 dark:border-emerald-800/40"
            title={fitScreen ? 'Show 100% Size (Scrollable)' : 'Fit Certificate to Screen'}
          >
            {fitScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            <span>{fitScreen ? 'Actual Size' : 'Fit Screen'}</span>
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={isExporting}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50"
            title="Download Landscape A4 PDF Document"
          >
            {isExporting && exportType === 'pdf' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>{isExporting && exportType === 'pdf' ? 'Compiling PDF...' : 'Download PDF'}</span>
          </button>

          {/* Save High-Resolution Image Button */}
          <button
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50"
            title="Download High-Resolution PNG Image"
          >
            {isExporting && exportType === 'image' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>{isExporting && exportType === 'image' ? 'Exporting Image...' : 'Save Image'}</span>
          </button>

          {/* Print Button */}
          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all hover:scale-102"
            title="Open Landscape Print Dialog"
          >
            <Printer className="w-4 h-4" />
            <span>Print Certificate</span>
          </button>
        </div>
      </div>

      {/* Landscape Printable Certificate Outer Wrapper */}
      <div ref={containerRef} className="w-full overflow-x-auto pb-4">
        <div
          style={
            fitScreen && scaleFactor < 1
              ? {
                  width: `${1050 * scaleFactor}px`,
                  height: `${740 * scaleFactor}px`,
                  overflow: 'hidden',
                  margin: '0 auto',
                }
              : undefined
          }
        >
          <div
            ref={certificateRef}
            id="markazu-official-certificate"
            className="print-certificate-page relative mx-auto bg-white text-slate-900 shadow-2xl overflow-hidden"
            style={{
              width: '1050px',
              minHeight: '740px',
              padding: '28px',
              backgroundColor: '#ffffff',
              transform: fitScreen && scaleFactor < 1 ? `scale(${scaleFactor})` : undefined,
              transformOrigin: 'top left',
            }}
          >
            {/* Certificate Inner Luxury Double Border */}
            <div className="relative w-full h-full border-4 border-emerald-900/90 p-3 rounded-md">
              <div className="relative w-full h-full border-2 border-amber-500/80 p-5 rounded-xs flex flex-col justify-between">
                {/* Corner Ornamental Accents */}
                <div className="absolute top-1 left-1 w-6 h-6 border-t-2 border-l-2 border-amber-600 pointer-events-none" />
                <div className="absolute top-1 right-1 w-6 h-6 border-t-2 border-r-2 border-amber-600 pointer-events-none" />
                <div className="absolute bottom-1 left-1 w-6 h-6 border-b-2 border-l-2 border-amber-600 pointer-events-none" />
                <div className="absolute bottom-1 right-1 w-6 h-6 border-b-2 border-r-2 border-amber-600 pointer-events-none" />

                {/* Watermark Logo in Background */}
                <div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]"
                  style={{
                    backgroundImage: `url(${logoUrl})`,
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                    backgroundSize: '400px',
                  }}
                />

                {/* SECTION 1: HEADER & SCHOOL BRANDING */}
                <div className="relative z-10 text-center space-y-1.5">
                  {/* Arabic Bismillah with RTL Direction & Proper Arabic Font (No letter-spacing breaking ligatures) */}
                  <div
                    className="font-arabic text-xl sm:text-2xl text-emerald-900 font-bold select-none tracking-normal"
                    dir="rtl"
                    lang="ar"
                  >
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>

                  {/* Top Branding Row */}
                  <div className="flex items-center justify-between px-6 pt-1">
                    {/* Left: School Official Logo */}
                    <div className="w-20 h-20 rounded-full border-2 border-emerald-800/40 p-1 flex items-center justify-center shrink-0 bg-white shadow-xs">
                      <img
                        src={logoUrl}
                        alt="School Logo"
                        className="w-full h-full object-contain rounded-full"
                      />
                    </div>

                    {/* Center: Bilingual School Names */}
                    <div className="flex-1 px-4 text-center space-y-1">
                      <h1
                        className="font-arabic text-lg sm:text-2xl font-bold text-emerald-950 tracking-normal"
                        dir="rtl"
                        lang="ar"
                      >
                        {schoolNameArabic}
                      </h1>
                      <h2 className="font-poppins text-xs sm:text-sm font-black text-slate-900 tracking-tight uppercase">
                        {schoolNameEnglish}
                      </h2>
                      <p className="text-[11px] font-semibold text-emerald-800">
                        {schoolLocationEnglish} •{' '}
                        <span dir="rtl" lang="ar" className="font-arabic font-bold">
                          {schoolLocationArabic}
                        </span>
                      </p>
                    </div>

                    {/* Right: Official Seal Badge */}
                    <div className="w-20 h-20 rounded-full border-2 border-amber-600/50 p-1 flex flex-col items-center justify-center shrink-0 bg-amber-50/60 text-amber-900 text-center shadow-xs">
                      <Award className="w-7 h-7 text-amber-600" />
                      <span className="text-[8px] font-extrabold uppercase tracking-tighter leading-none mt-0.5">
                        {sealText.split('•')[0]?.trim() || 'SEAL OF EXCELLENCE'}
                      </span>
                      <span className="text-[7px] text-amber-800 font-bold leading-none mt-0.5">
                        {sealText.includes('•') ? sealText.split('•').slice(1).join('•').trim() : 'DANEJI • KANO'}
                      </span>
                    </div>
                  </div>

                  {/* Ornamental Gold Divider */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <div className="h-[1.5px] bg-gradient-to-r from-transparent via-amber-500 to-transparent flex-1" />
                    <div className="w-2 h-2 rotate-45 bg-emerald-800" />
                    <div className="h-[1.5px] bg-gradient-to-r from-transparent via-amber-500 to-transparent flex-1" />
                  </div>
                </div>

                {/* SECTION 2: CERTIFICATE TITLE & STATEMENT */}
                <div className="relative z-10 text-center my-auto py-2 space-y-2.5">
                  <div className="space-y-1">
                    <h3
                      className="font-arabic text-xl sm:text-2xl font-bold text-amber-800 tracking-normal"
                      dir="rtl"
                      lang="ar"
                    >
                      {qualificationTitleArabic}
                    </h3>
                    <h4 className="font-poppins text-base sm:text-lg font-black tracking-widest text-emerald-950 uppercase">
                      {qualificationTitleEnglish}
                    </h4>
                  </div>

                  {/* Certification Lead Statement */}
                  <div className="text-xs sm:text-sm font-semibold text-slate-600 italic">
                    This is to certify that /{' '}
                    <span dir="rtl" lang="ar" className="font-arabic not-italic text-emerald-900 font-bold text-base">
                      تشهد إدارة المركز بأن الطالب(ة):
                    </span>
                  </div>

                  {/* Student Full Name Display */}
                  <div className="py-1">
                    <div className="inline-block border-b-2 border-emerald-900/60 px-8 pb-1 max-w-2xl mx-auto">
                      <div className="font-poppins text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight leading-tight break-words">
                        {student.fullName}
                      </div>
                      {student.fullNameArabic && (
                        <div
                          dir="rtl"
                          lang="ar"
                          className="font-arabic text-xl font-bold text-amber-800 mt-1 break-words tracking-normal"
                        >
                          {student.fullNameArabic}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Student Academic Details & Citation */}
                  <div className="max-w-3xl mx-auto space-y-2 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                    <p className="break-words">
                      Admission No:{' '}
                      <strong className="font-mono text-emerald-950 font-bold">{student.admissionNo}</strong>{' '}
                      | Class: <strong className="text-emerald-950 font-bold">{student.className}</strong>{' '}
                      | Programme: <strong className="text-emerald-950 font-bold">{student.programmeName}</strong>
                    </p>

                    <p className="text-slate-700 font-normal px-6 break-words leading-relaxed">
                      {qualificationReason}
                    </p>

                    {student.juzCompleted > 0 && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>
                          Holy Qur'an Memorization: <strong>{student.juzCompleted} Juz Completed</strong> with{' '}
                          <strong>{student.akhlaqRating} Akhlaq</strong>
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 3: SIGNATURES, DATE & OFFICIAL VERIFICATION */}
                <div className="relative z-10 pt-3 border-t border-slate-200 mt-2">
                  <div className="grid grid-cols-3 items-end text-center gap-4">
                    {/* Left Signature: Principal / Director */}
                    <div className="space-y-1">
                      <div className="h-10 flex items-center justify-center font-serif text-emerald-900 text-lg italic">
                        {principalSignatureUrl ? (
                          <img
                            src={principalSignatureUrl}
                            alt="Principal Signature"
                            className="h-10 max-w-[140px] mx-auto object-contain"
                          />
                        ) : (
                          principalName
                        )}
                      </div>
                      <div className="w-40 mx-auto border-t border-slate-400" />
                      <p className="text-xs font-bold text-slate-900">{principalName}</p>
                      <p className="text-[10px] text-slate-500 font-semibold leading-tight">
                        {principalTitle}
                      </p>
                      <p className="text-[9px] font-arabic font-bold text-emerald-800 leading-none" dir="rtl" lang="ar">
                        {principalTitleArabic}
                      </p>
                    </div>

                    {/* Center: Issue Date & Verification Reference */}
                    <div className="space-y-1">
                      <div className="w-12 h-12 mx-auto rounded-full border border-amber-600/40 p-1 flex items-center justify-center bg-amber-50/40">
                        <ShieldCheck className="w-7 h-7 text-emerald-800" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                        Issue Date: {certificate.issueDate}
                      </p>
                      <p className="text-[10px] font-arabic font-bold text-emerald-900" dir="rtl" lang="ar">
                        الموافق: {certificate.issueDateArabic}
                      </p>
                      <p className="font-mono text-[9px] font-bold text-emerald-800">
                        Certificate ID: {certificate.certificateNo}
                      </p>
                    </div>

                    {/* Right Signature: Head of Tahfiz */}
                    <div className="space-y-1">
                      <div className="h-10 flex items-center justify-center font-serif text-emerald-900 text-lg italic">
                        {headOfTahfizSignatureUrl ? (
                          <img
                            src={headOfTahfizSignatureUrl}
                            alt="Head of Tahfiz Signature"
                            className="h-10 max-w-[140px] mx-auto object-contain"
                          />
                        ) : (
                          headOfTahfiz
                        )}
                      </div>
                      <div className="w-40 mx-auto border-t border-slate-400" />
                      <p className="text-xs font-bold text-slate-900">{headOfTahfiz}</p>
                      <p className="text-[10px] text-slate-500 font-semibold leading-tight">
                        {headOfTahfizTitle}
                      </p>
                      <p className="text-[9px] font-arabic font-bold text-emerald-800 leading-none" dir="rtl" lang="ar">
                        {headOfTahfizTitleArabic}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Super Admin Certificate Template Editor Modal */}
      <CertificateTemplateModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      />
    </div>
  );
}
