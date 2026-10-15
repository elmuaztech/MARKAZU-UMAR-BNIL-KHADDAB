'use client';

import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import {
  Printer,
  Download,
  Award,
  CheckCircle2,
  Calendar,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  BookOpen,
  ArrowLeft,
  Loader2,
  AlertCircle,
  FileText,
} from 'lucide-react';

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
  const certificateRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!certificateRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
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
      console.error('Failed to export certificate:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const { student, school } = certificate;

  return (
    <div className="space-y-6 font-poppins">
      {/* Action Navigation Bar (Hidden when printing) */}
      <div className="no-print flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md">
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

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isExporting ? 'Preparing Image...' : 'Save Image'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all hover:scale-102"
          >
            <Printer className="w-4 h-4" />
            <span>Print Certificate</span>
          </button>
        </div>
      </div>

      {/* Landscape Printable Certificate Outer Wrapper */}
      <div className="w-full overflow-x-auto pb-4">
        <div
          ref={certificateRef}
          id="markazu-official-certificate"
          className="print-certificate-page relative mx-auto bg-white text-slate-900 shadow-2xl overflow-hidden"
          style={{
            width: '1050px',
            minHeight: '740px',
            padding: '30px',
            backgroundColor: '#ffffff',
          }}
        >
          {/* Certificate Inner Luxury Double Border */}
          <div className="relative w-full h-full border-4 border-emerald-900/90 p-3 rounded-md">
            <div className="relative w-full h-full border-2 border-amber-500/80 p-6 rounded-xs flex flex-col justify-between">
              {/* Corner Ornamental Accents */}
              <div className="absolute top-1 left-1 w-6 h-6 border-t-2 border-l-2 border-amber-600 pointer-events-none" />
              <div className="absolute top-1 right-1 w-6 h-6 border-t-2 border-r-2 border-amber-600 pointer-events-none" />
              <div className="absolute bottom-1 left-1 w-6 h-6 border-b-2 border-l-2 border-amber-600 pointer-events-none" />
              <div className="absolute bottom-1 right-1 w-6 h-6 border-b-2 border-r-2 border-amber-600 pointer-events-none" />

              {/* Watermark Logo in Background */}
              <div
                className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]"
                style={{
                  backgroundImage: `url(${school.logoUrl})`,
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '400px',
                }}
              />

              {/* SECTION 1: HEADER & SCHOOL BRANDING */}
              <div className="relative z-10 text-center space-y-2">
                {/* Arabic Bismillah with RTL Direction & Proper Arabic Font */}
                <div
                  className="font-arabic text-xl sm:text-2xl text-emerald-900 font-bold tracking-wide select-none"
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
                      src={school.logoUrl}
                      alt="School Logo"
                      className="w-full h-full object-contain rounded-full"
                    />
                  </div>

                  {/* Center: Bilingual School Names */}
                  <div className="flex-1 px-4 text-center space-y-1">
                    <h1
                      className="font-arabic text-lg sm:text-xl font-bold text-emerald-950 tracking-normal"
                      dir="rtl"
                      lang="ar"
                    >
                      {school.nameArabic}
                    </h1>
                    <h2 className="font-poppins text-xs sm:text-sm font-black text-slate-900 tracking-tight uppercase">
                      {school.nameEnglish}
                    </h2>
                    <p className="text-[11px] font-semibold text-emerald-800">
                      {school.locationEnglish} • <span dir="rtl" className="font-arabic">{school.locationArabic}</span>
                    </p>
                  </div>

                  {/* Right: Official Seal Badge */}
                  <div className="w-20 h-20 rounded-full border-2 border-amber-600/50 p-1 flex flex-col items-center justify-center shrink-0 bg-amber-50/60 text-amber-900 text-center shadow-xs">
                    <Award className="w-7 h-7 text-amber-600" />
                    <span className="text-[8px] font-extrabold uppercase tracking-tighter leading-none mt-0.5">
                      SEAL OF EXCELLENCE
                    </span>
                  </div>
                </div>

                {/* Divider Line */}
                <div className="flex items-center justify-center gap-2 pt-1">
                  <div className="h-[1.5px] bg-gradient-to-r from-transparent via-amber-500 to-transparent flex-1" />
                  <div className="w-2 h-2 rotate-45 bg-emerald-800" />
                  <div className="h-[1.5px] bg-gradient-to-r from-transparent via-amber-500 to-transparent flex-1" />
                </div>
              </div>

              {/* SECTION 2: CERTIFICATE TITLE & STATEMENT */}
              <div className="relative z-10 text-center my-auto py-2 space-y-3">
                <div className="space-y-1">
                  <h3
                    className="font-arabic text-xl sm:text-2xl font-bold text-amber-800"
                    dir="rtl"
                    lang="ar"
                  >
                    {certificate.qualificationTitleArabic}
                  </h3>
                  <h4 className="font-poppins text-base sm:text-lg font-black tracking-widest text-emerald-950 uppercase">
                    {certificate.qualificationTitleEnglish}
                  </h4>
                </div>

                {/* Certification Lead */}
                <div className="text-xs sm:text-sm font-semibold text-slate-600 italic">
                  This is to certify that / <span dir="rtl" className="font-arabic not-italic text-emerald-900 font-bold">تشهد إدارة المركز بأن الطالب(ة):</span>
                </div>

                {/* Student Full Name Display (Highlighted) */}
                <div className="py-1">
                  <div className="inline-block border-b-2 border-emerald-900/60 px-8 pb-1">
                    <span className="font-poppins text-2xl sm:text-3xl font-black text-emerald-950 tracking-tight">
                      {student.fullName}
                    </span>
                    {student.fullNameArabic && (
                      <div dir="rtl" className="font-arabic text-lg font-bold text-amber-800 mt-0.5">
                        {student.fullNameArabic}
                      </div>
                    )}
                  </div>
                </div>

                {/* Student Academic Details & Citation */}
                <div className="max-w-3xl mx-auto space-y-2 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                  <p>
                    Admission No:{' '}
                    <strong className="font-mono text-emerald-950 font-bold">{student.admissionNo}</strong>{' '}
                    | Class: <strong className="text-emerald-950 font-bold">{student.className}</strong>{' '}
                    | Programme: <strong className="text-emerald-950 font-bold">{student.programmeName}</strong>
                  </p>

                  <p className="text-slate-700 font-normal px-6">
                    {certificate.qualificationReason}
                  </p>

                  {student.juzCompleted > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Holy Qur'an Memorization: <strong>{student.juzCompleted} Juz Completed</strong> with <strong>{student.akhlaqRating} Akhlaq</strong></span>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 3: SIGNATURES, DATE & OFFICIAL VERIFICATION */}
              <div className="relative z-10 pt-4 border-t border-slate-200 mt-2">
                <div className="grid grid-cols-3 items-end text-center gap-4">
                  {/* Left Signature: Principal / Director */}
                  <div className="space-y-1">
                    <div className="h-10 flex items-center justify-center font-serif text-emerald-900 text-lg italic">
                      {school.principalName}
                    </div>
                    <div className="w-40 mx-auto border-t border-slate-400" />
                    <p className="text-xs font-bold text-slate-900">{school.principalName}</p>
                    <p className="text-[10px] text-slate-500 font-semibold leading-tight">
                      {school.principalTitle}
                    </p>
                  </div>

                  {/* Center: Issue Date & Verification Reference */}
                  <div className="space-y-1">
                    <div className="w-14 h-14 mx-auto rounded-full border border-amber-600/40 p-1 flex items-center justify-center bg-amber-50/40">
                      <ShieldCheck className="w-8 h-8 text-emerald-800" />
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
                      Issue Date: {certificate.issueDate}
                    </p>
                    <p className="text-[10px] font-arabic font-bold text-emerald-900" dir="rtl">
                      الموافق: {certificate.issueDateArabic}
                    </p>
                    <p className="font-mono text-[9px] font-bold text-emerald-800">
                      Certificate ID: {certificate.certificateNo}
                    </p>
                  </div>

                  {/* Right Signature: Head of Tahfiz */}
                  <div className="space-y-1">
                    <div className="h-10 flex items-center justify-center font-serif text-emerald-900 text-lg italic">
                      {school.headOfTahfiz}
                    </div>
                    <div className="w-40 mx-auto border-t border-slate-400" />
                    <p className="text-xs font-bold text-slate-900">{school.headOfTahfiz}</p>
                    <p className="text-[10px] text-slate-500 font-semibold leading-tight">
                      {school.headOfTahfizTitle}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
