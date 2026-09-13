import React, { useRef, useState } from 'react';
import { Student, GradeRecord, SchoolSession } from '../../types';
import { useApp } from '../../lib/context';
import {
  Printer,
  Award,
  BookOpen,
  ShieldCheck,
  Download,
  Image as ImageIcon,
  FileText,
  Eye,
  Loader2,
  AlertCircle,
  User,
  Hash,
  GraduationCap,
  Users,
  Quote,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import html2canvas from 'html2canvas';

interface ReportCardProps {
  student: Student;
  grades: GradeRecord[];
  session: SchoolSession;
}

export function ReportCard({ student, grades, session }: ReportCardProps) {
  const { schoolLogo, classes, reportCardTemplate, notify } = useApp();

  const currentClass = classes.find((c) => c.id === student.classId || c.name === student.className);

  const reportRef = useRef<HTMLDivElement>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isDownloadingImage, setIsDownloadingImage] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  const handlePrint = () => {
    notify({
      type: 'info',
      title: 'Opening Print Dialog',
      message: 'Preparing print preview for official report card...',
      duration: 3000,
    });
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      setDownloadError(null);
      notify({
        type: 'info',
        title: 'Generating PDF',
        message: `Compiling official report card for ${student.fullName}...`,
        duration: 2500,
      });
      const url = `/api/reports/download?studentId=${student.id}&sessionId=${session.id || ''}&term=${encodeURIComponent(session.activeTerm || '')}&format=pdf`;
      const res = await fetch(url);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || data.error || 'Failed to download PDF report');
      }
      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      const safeName = student.fullName.replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `Report_Card_${safeName}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      notify({
        type: 'success',
        title: 'PDF Downloaded',
        message: `Official Report Card for ${student.fullName} downloaded successfully.`,
      });
    } catch (err: any) {
      const errMsg = err.message || 'Error downloading PDF';
      setDownloadError(errMsg);
      notify({
        type: 'error',
        title: 'Download Failed',
        message: errMsg,
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadImage = async () => {
    if (!reportRef.current) return;
    try {
      setIsDownloadingImage(true);
      setDownloadError(null);
      notify({
        type: 'info',
        title: 'Exporting Image',
        message: 'Rendering high-resolution report card image...',
        duration: 2500,
      });
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      const safeName = student.fullName.replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `Report_Card_${safeName}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      notify({
        type: 'success',
        title: 'Image Exported',
        message: `Report card image for ${student.fullName} exported successfully.`,
      });
    } catch (err: any) {
      const errMsg = err.message || 'Error downloading image';
      setDownloadError(errMsg);
      notify({
        type: 'error',
        title: 'Export Failed',
        message: errMsg,
      });
    } finally {
      setIsDownloadingImage(false);
    }
  };

  const handleViewReport = () => {
    if (reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      notify({
        type: 'info',
        title: 'Viewing Report Card',
        message: 'Scrolled to official terminal report card.',
        duration: 2000,
      });
    }
  };

  const totalPossible = grades.length * 100;
  const totalObtained = grades.reduce((acc, g) => acc + g.totalScore, 0);
  const averagePercentage = grades.length > 0 ? (totalObtained / grades.length).toFixed(1) : '0';
  const numAverage = parseFloat(averagePercentage);

  // Extract template customization properties with fallback defaults
  const {
    titleEnglish = "MARKAZU UMAR BN AL-KHATTAB CENTRE FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES - DANEJI",
    titleArabic = "مركز عمر بن الخطاب لتحفيظ القرآن والدراسات الإسلامية - دنيج",
    subTitleEnglish = "OFFICIAL TERMINAL ACADEMIC & TAHFIZ PROGRESS REPORT",
    headerBgColor = "#042f1e",
    headerTextColor = "#ffffff",
    accentColor = "#f59e0b",
    tableHeaderBgColor = "#064e3b",
    tableHeaderTextColor = "#ffffff",
    showLogo = true,
    showTahfizSection = false,
    showAkhlaqSection = true,
    showSummarySection = true,
    showGradeLegend = true,
    teacherRemarkDefault = "Very good academic progress and performance.",
    principalRemarkDefault = "Approved for promotion. Keep up the brilliant performance in Adab and Academic studies.",
    principalName = "Malam Umar Faruq",
    principalTitle = "School Principal & Director of Studies",
    defaultSignatureUrl = "",
  } = reportCardTemplate || {};

  return (
    <div className="space-y-4 font-sans">
      {/* Action Bar (hidden on print) */}
      <div className="no-print flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 shrink-0">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              Official Terminal Report Card
            </h3>
            <p className="text-xs text-slate-500 dark:text-emerald-300/80 font-medium">
              Certified Academic & Tahfiz Performance Record
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleViewReport}
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-emerald-950/60 dark:hover:bg-emerald-900/80 text-slate-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>View Card</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all hover:scale-102 disabled:opacity-50 cursor-pointer"
          >
            {isDownloadingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5" />
            )}
            <span>{isDownloadingPdf ? 'Generating...' : 'Download PDF'}</span>
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={isDownloadingImage}
            className="px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md transition-all hover:scale-102 disabled:opacity-50 cursor-pointer"
          >
            {isDownloadingImage ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ImageIcon className="w-3.5 h-3.5" />
            )}
            <span>{isDownloadingImage ? 'Processing...' : 'Download Image'}</span>
          </button>

          <button
            onClick={handlePrint}
            className="hidden sm:flex px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs items-center justify-center gap-1.5 shadow-md transition-all hover:scale-102 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {downloadError && (
        <div className="no-print p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
          <span>{downloadError}</span>
        </div>
      )}

      {/* Official Report Card Sheet Container */}
      <div ref={reportRef} className="print-container bg-white text-slate-900 p-4 sm:p-8 rounded-2xl shadow-xl border border-gray-200 max-w-4xl mx-auto font-sans space-y-5">
        {/* Header Crest Container */}
        <div
          className="text-center rounded-2xl p-5 shadow-sm text-white space-y-2.5"
          style={{ backgroundColor: headerBgColor, color: headerTextColor }}
        >
          <div className="flex flex-col items-center justify-center text-center gap-2">
            {showLogo && (
              schoolLogo ? (
                <img src={schoolLogo} alt="School Crest Logo" className="w-16 h-16 rounded-full object-cover border-2 border-white p-0.5 shadow-md bg-white" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-800 flex items-center justify-center text-amber-300 border-2 border-white shadow-md">
                  <BookOpen className="w-8 h-8" />
                </div>
              )
            )}

            {titleArabic && (
              <div className="font-arabic font-bold text-base sm:text-xl leading-snug" style={{ color: accentColor }}>
                {titleArabic}
              </div>
            )}

            <h1 className="text-sm sm:text-base md:text-lg font-black uppercase tracking-tight leading-snug max-w-2xl text-white">
              {titleEnglish}
            </h1>
          </div>

          <p className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-100/90 pt-1.5 border-t border-white/20">
            {subTitleEnglish}
          </p>

          <div className="pt-1">
            <div
              className="inline-flex items-center gap-2 font-black text-[11px] sm:text-xs px-3.5 py-1.5 rounded-lg shadow-sm"
              style={{ backgroundColor: accentColor, color: '#0f172a' }}
            >
              <span>SESSION: {session.sessionName}</span>
              <span>•</span>
              <span className="uppercase">{session.activeTerm}</span>
            </div>
          </div>
        </div>

        {/* Student Biodata: Neatly Fitted Into Structured Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider mb-1">
              <User className="w-3 h-3 text-emerald-600" />
              <span>Child Name</span>
            </div>
            <span className="text-xs sm:text-sm font-black text-emerald-950 break-words leading-tight">
              {student.fullName}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider mb-1">
              <Hash className="w-3 h-3 text-emerald-600" />
              <span>Admission Number</span>
            </div>
            <span className="text-xs sm:text-sm font-mono font-black text-emerald-900 break-words leading-tight">
              {student.admissionNo}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider mb-1">
              <GraduationCap className="w-3 h-3 text-emerald-600" />
              <span>Class Enrolled</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-emerald-950 break-words leading-tight">
              {currentClass?.class_name_english || student.className}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 flex flex-col justify-between shadow-2xs">
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 font-extrabold uppercase tracking-wider mb-1">
              <Users className="w-3 h-3 text-emerald-600" />
              <span>Guardian Name</span>
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-800 break-words leading-tight">
              {student.guardianName}
            </span>
          </div>
        </div>

        {/* Specialized Tahfiz Performance Card */}
        {showTahfizSection && (
          <div
            className="text-white p-4 rounded-xl space-y-3 shadow-md"
            style={{ backgroundColor: tableHeaderBgColor }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/15 pb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: accentColor }}>
                <BookOpen className="w-4 h-4" />
                <span>Tahfiz & Qur'an Memorization Evaluation</span>
              </h3>
              <span
                className="self-start sm:self-auto font-black text-[10px] px-2.5 py-1 rounded-md uppercase shadow-xs"
                style={{ backgroundColor: accentColor, color: '#0f172a' }}
              >
                {student.hifzProgress.juzCompleted} / 30 Juz Completed
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div className="p-2.5 rounded-lg bg-black/20 border border-white/15 backdrop-blur-xs flex flex-col justify-between">
                <span className="text-[10px] text-emerald-200/90 uppercase font-bold tracking-wider mb-0.5">Current Surah</span>
                <span className="font-bold text-white text-xs sm:text-sm truncate">{student.hifzProgress.currentSurah}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/20 border border-white/15 backdrop-blur-xs flex flex-col justify-between">
                <span className="text-[10px] text-emerald-200/90 uppercase font-bold tracking-wider mb-0.5">Sabki (Revision)</span>
                <span className="font-extrabold text-xs sm:text-sm" style={{ color: accentColor }}>{student.hifzProgress.sabkiRating} / 5</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/20 border border-white/15 backdrop-blur-xs flex flex-col justify-between">
                <span className="text-[10px] text-emerald-200/90 uppercase font-bold tracking-wider mb-0.5">Manzil (Retention)</span>
                <span className="font-extrabold text-xs sm:text-sm" style={{ color: accentColor }}>{student.hifzProgress.manzilRating} / 5</span>
              </div>
              <div className="p-2.5 rounded-lg bg-black/20 border border-white/15 backdrop-blur-xs flex flex-col justify-between">
                <span className="text-[10px] text-emerald-200/90 uppercase font-bold tracking-wider mb-0.5">Tajweed Quality</span>
                <span className="font-bold text-white text-xs sm:text-sm">{student.hifzProgress.tajweedRating} / 5</span>
              </div>
            </div>
          </div>
        )}

        {/* Academic Subject Scores Table */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              <span>Subject Performance Breakdown</span>
              <span className="text-[10px] font-bold text-gray-500 lowercase">({grades.length} assessed subjects)</span>
            </h3>
            <span className="text-[10px] text-emerald-700 font-semibold sm:hidden no-print">← Swipe horizontally →</span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-2xs mobile-table-wrapper">
            <table className="w-full min-w-[560px] text-left text-xs border-collapse">
              <thead>
                <tr className="uppercase text-[10px] text-white" style={{ backgroundColor: tableHeaderBgColor }}>
                  <th className="p-2.5 border border-emerald-900/30 font-bold">Subject Name</th>
                  <th className="p-2.5 border border-emerald-900/30 text-center font-bold">CA1 (20)</th>
                  <th className="p-2.5 border border-emerald-900/30 text-center font-bold">CA2 (20)</th>
                  <th className="p-2.5 border border-emerald-900/30 text-center font-bold">Exam (60)</th>
                  <th className="p-2.5 border border-emerald-900/30 text-center font-bold">Total (100)</th>
                  <th className="p-2.5 border border-emerald-900/30 text-center font-bold">Grade</th>
                  <th className="p-2.5 border border-emerald-900/30 font-bold">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {grades.map((g, idx) => (
                  <tr key={g.id} className={idx % 2 === 0 ? 'bg-gray-50/70 hover:bg-gray-100/60' : 'bg-white hover:bg-gray-50'}>
                    <td className="p-2.5 border border-gray-200 font-bold text-emerald-950">{g.subjectName}</td>
                    <td className="p-2.5 border border-gray-200 text-center font-mono font-medium">{g.ca1Score}</td>
                    <td className="p-2.5 border border-gray-200 text-center font-mono font-medium">{g.ca2Score}</td>
                    <td className="p-2.5 border border-gray-200 text-center font-mono font-medium">{g.examScore}</td>
                    <td className="p-2.5 border border-gray-200 text-center font-mono font-black text-emerald-900">{g.totalScore}%</td>
                    <td className="p-2.5 border border-gray-200 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black shadow-2xs ${
                        g.grade === 'A'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : g.grade === 'B'
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : g.grade === 'C'
                          ? 'bg-sky-100 text-sky-800 border border-sky-300'
                          : g.grade === 'D'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}>
                        {g.grade}
                      </span>
                    </td>
                    <td className="p-2.5 border border-gray-200 text-[11px] text-gray-700 italic">{g.remarks}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Summary Statistics & Akhlaq Assessment Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {showSummarySection && (
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/90 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <h4 className="font-extrabold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Academic Performance Summary</span>
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  Terminal Stats
                </span>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-white border border-gray-200 shadow-2xs flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600">Total Score Obtained:</span>
                  <span className="font-mono font-black text-slate-900 px-2.5 py-0.5 rounded bg-gray-100 border border-gray-200">
                    {totalObtained} / {totalPossible}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-gray-200 shadow-2xs flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600">Average Percentage:</span>
                  <span className="font-mono font-black text-emerald-800 px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    {averagePercentage}%
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-gray-200 shadow-2xs flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600">Overall Terminal Grade:</span>
                  <span className="font-black text-emerald-900 px-2.5 py-0.5 rounded bg-emerald-100 border border-emerald-300">
                    {numAverage >= 75 ? 'DISTINCTION (A)' : numAverage >= 60 ? 'VERY GOOD (B)' : numAverage >= 50 ? 'CREDIT (C)' : numAverage >= 40 ? 'PASS (D)' : 'NEEDS IMPROVEMENT (F)'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {showAkhlaqSection && (
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/90 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                <h4 className="font-extrabold text-emerald-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Behavioral & Akhlaq Rating</span>
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900">
                  Conduct Rating
                </span>
              </div>
              <div className="space-y-2">
                <div className="p-2.5 rounded-lg bg-white border border-gray-200 shadow-2xs flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600">Islamic Conduct (Adab):</span>
                  <span className="font-extrabold text-emerald-800 px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    {student.akhlaqRating}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-gray-200 shadow-2xs flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600">Punctuality & Attendance:</span>
                  <span className="font-extrabold text-emerald-800 px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    EXCELLENT (98%)
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-gray-200 shadow-2xs flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-600">Neatness & Respect:</span>
                  <span className="font-extrabold text-emerald-800 px-2.5 py-0.5 rounded bg-emerald-50 border border-emerald-200">
                    EXCELLENT
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Grading Scale Legend Cards */}
        {showGradeLegend && (
          <div className="p-3.5 rounded-xl border border-gray-200 bg-slate-50/90 shadow-2xs space-y-2.5">
            <div className="flex items-center justify-between border-b border-gray-200/80 pb-1.5">
              <span className="font-extrabold text-gray-700 uppercase text-[10px] tracking-wider">
                Grading Scale Legend & Key
              </span>
              <span className="text-[10px] text-gray-500 font-semibold">Standard 5-Tier System</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <div className="p-2 rounded-lg bg-white border border-emerald-200 shadow-2xs flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-emerald-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                  A
                </span>
                <div className="min-w-0">
                  <div className="font-black text-gray-900 text-[11px] leading-none">75 – 100%</div>
                  <div className="text-[10px] text-emerald-700 font-bold truncate">Distinction</div>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-white border border-blue-200 shadow-2xs flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-blue-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                  B
                </span>
                <div className="min-w-0">
                  <div className="font-black text-gray-900 text-[11px] leading-none">60 – 74.99%</div>
                  <div className="text-[10px] text-blue-700 font-bold truncate">Very Good</div>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-white border border-sky-200 shadow-2xs flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-sky-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                  C
                </span>
                <div className="min-w-0">
                  <div className="font-black text-gray-900 text-[11px] leading-none">50 – 59.99%</div>
                  <div className="text-[10px] text-sky-700 font-bold truncate">Good</div>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-white border border-amber-200 shadow-2xs flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-amber-500 text-slate-950 font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                  D
                </span>
                <div className="min-w-0">
                  <div className="font-black text-gray-900 text-[11px] leading-none">40 – 49.99%</div>
                  <div className="text-[10px] text-amber-700 font-bold truncate">Pass</div>
                </div>
              </div>

              <div className="p-2 rounded-lg bg-white border border-rose-200 shadow-2xs flex items-center gap-2">
                <span className="w-6 h-6 rounded-md bg-rose-600 text-white font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                  F
                </span>
                <div className="min-w-0">
                  <div className="font-black text-gray-900 text-[11px] leading-none">0 – 39.99%</div>
                  <div className="text-[10px] text-rose-700 font-bold truncate">Fail</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Official Remarks & Signatures: Structured Attestation Cards */}
        <div className="pt-2 border-t-2 border-emerald-900 text-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-[10px] uppercase tracking-wider">
                <Quote className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Class Teacher Remark</span>
              </div>
              <p className="text-[11px] text-gray-700 italic pl-5 border-l-2 border-emerald-300">
                "{teacherRemarkDefault}"
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 shadow-2xs space-y-1.5">
              <div className="flex items-center gap-1.5 text-emerald-900 font-extrabold text-[10px] uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Principal Official Remark</span>
              </div>
              <p className="text-[11px] text-gray-700 italic pl-5 border-l-2 border-emerald-300">
                "{principalRemarkDefault}"
              </p>
            </div>
          </div>

          <div className="flex justify-center sm:justify-end pt-2">
            <div className="p-4 rounded-xl bg-slate-50 border border-gray-200 shadow-2xs text-center space-y-2 flex flex-col items-center justify-end w-full sm:w-auto min-w-[240px]">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">
                Official School Endorsement
              </span>
              {defaultSignatureUrl ? (
                <div className="h-12 flex items-center justify-center">
                  <img
                    src={defaultSignatureUrl}
                    alt="School Principal Signature"
                    className="max-h-12 max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="border-b border-gray-400 w-44 mx-auto h-8" />
              )}
              <div className="space-y-0.5">
                <p className="font-black text-gray-900 text-xs">{principalName}</p>
                <div className="border-b border-gray-300 w-40 mx-auto" />
                <p className="text-[10px] text-gray-500 uppercase font-semibold">{principalTitle}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

