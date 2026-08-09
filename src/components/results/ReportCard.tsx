'use client';

import React from 'react';
import { Student, GradeRecord, SchoolSession } from '../../types';
import { useApp } from '../../lib/context';
import { Printer, Sparkles, Award, BookOpen, ShieldCheck } from 'lucide-react';
import { BilingualText } from '../ui/BilingualText';

interface ReportCardProps {
  student: Student;
  grades: GradeRecord[];
  session: SchoolSession;
}

export function ReportCard({ student, grades, session }: ReportCardProps) {
  const { schoolLogo, classes, reportCardTemplate } = useApp();

  const currentClass = classes.find((c) => c.id === student.classId || c.name === student.className);

  const handlePrint = () => {
    window.print();
  };

  const totalPossible = grades.length * 100;
  const totalObtained = grades.reduce((acc, g) => acc + g.totalScore, 0);
  const averagePercentage = grades.length > 0 ? (totalObtained / grades.length).toFixed(1) : '0';

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
    <div className="space-y-4">
      {/* Action Bar (hidden on print) */}
      <div className="no-print flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl glass-card border border-emerald-500/30">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Official Terminal Report Card Preview
          </h3>
          <p className="text-xs text-emerald-300/70">
            Rendered with Admin Default Report Sheet Template & Signature.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all scale-105"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Official Report Card Sheet */}
      <div className="print-container bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-2xl border border-gray-200 max-w-4xl mx-auto font-sans">
        {/* Header Crest Container */}
        <div
          className="text-center rounded-2xl p-5 mb-5 shadow-sm text-white space-y-2"
          style={{ backgroundColor: headerBgColor, color: headerTextColor }}
        >
          <div className="flex flex-col items-center justify-center text-center gap-2">
            {showLogo && (
              schoolLogo ? (
                <img src={schoolLogo} alt="School Crest Logo" className="w-16 h-16 rounded-full object-cover border-2 border-white p-0.5 shadow-md bg-white" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-emerald-800 flex items-center justify-center text-amber-300 border-2 border-white shadow-md">
                  <Sparkles className="w-8 h-8" />
                </div>
              )
            )}

            {titleArabic && (
              <div className="font-arabic font-bold text-base sm:text-lg leading-snug" style={{ color: accentColor }}>
                {titleArabic}
              </div>
            )}

            <h1 className="text-sm sm:text-base md:text-lg font-black uppercase tracking-tight leading-snug max-w-2xl text-white">
              {titleEnglish}
            </h1>
          </div>

          <p className="text-[11px] sm:text-xs font-bold uppercase tracking-wider text-emerald-100/90 pt-1 border-t border-white/20">
            {subTitleEnglish}
          </p>

          <div
            className="mt-2 inline-block font-black text-xs px-3.5 py-1 rounded-md shadow-sm"
            style={{ backgroundColor: accentColor, color: '#0f172a' }}
          >
            SESSION: {session.sessionName} • {session.activeTerm.toUpperCase()}
          </div>
        </div>

        {/* Student Biodata Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-emerald-50/80 p-3.5 rounded-xl border border-emerald-200 text-xs mb-5">
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Student Name</span>
            <span className="font-extrabold text-emerald-950 block truncate">{student.fullName}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Admission Number</span>
            <span className="font-mono font-bold text-emerald-900 block">{student.admissionNo}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Class Enrolled</span>
            <span className="font-bold text-emerald-950 block truncate">{currentClass?.class_name_english || student.className}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Guardian Name</span>
            <span className="font-semibold text-gray-800 block truncate">{student.guardianName}</span>
          </div>
        </div>

        {/* Specialized Tahfiz Performance Card */}
        {showTahfizSection && (
          <div
            className="text-white p-4 rounded-xl mb-5 space-y-2 shadow-md"
            style={{ backgroundColor: tableHeaderBgColor }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: accentColor }}>
                <BookOpen className="w-4 h-4" /> Tahfiz & Qur'an Memorization Evaluation
              </h3>
              <span
                className="font-black text-[10px] px-2.5 py-0.5 rounded uppercase"
                style={{ backgroundColor: accentColor, color: '#0f172a' }}
              >
                {student.hifzProgress.juzCompleted} / 30 Juz Completed
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-white/20">
              <div>
                <span className="text-[10px] text-emerald-200 uppercase block">Current Surah</span>
                <span className="font-bold text-white">{student.hifzProgress.currentSurah}</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 uppercase block">Sabki (Revision)</span>
                <span className="font-bold" style={{ color: accentColor }}>★ {student.hifzProgress.sabkiRating} / 5 Stars</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 uppercase block">Manzil (Retention)</span>
                <span className="font-bold" style={{ color: accentColor }}>★ {student.hifzProgress.manzilRating} / 5 Stars</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-200 uppercase block">Tajweed Quality</span>
                <span className="font-bold text-white">★ {student.hifzProgress.tajweedRating} / 5 Stars</span>
              </div>
            </div>
          </div>
        )}

        {/* Academic Subject Scores Table */}
        <div className="mb-5 overflow-x-auto">
          <h3 className="text-xs font-bold uppercase text-emerald-950 mb-2">Subject Performance Breakdown</h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="uppercase text-[10px] text-white" style={{ backgroundColor: tableHeaderBgColor }}>
                <th className="p-2.5 border border-emerald-900/30">Subject Name</th>
                <th className="p-2.5 border border-emerald-900/30 text-center">CA1 (20)</th>
                <th className="p-2.5 border border-emerald-900/30 text-center">CA2 (20)</th>
                <th className="p-2.5 border border-emerald-900/30 text-center">Exam (60)</th>
                <th className="p-2.5 border border-emerald-900/30 text-center">Total (100)</th>
                <th className="p-2.5 border border-emerald-900/30 text-center">Grade</th>
                <th className="p-2.5 border border-emerald-900/30">Remarks</th>
              </tr>
            </thead>
            <tbody>
              {grades.map((g, idx) => (
                <tr key={g.id} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="p-2 border border-gray-300 font-bold text-emerald-950">{g.subjectName}</td>
                  <td className="p-2 border border-gray-300 text-center font-mono">{g.ca1Score}</td>
                  <td className="p-2 border border-gray-300 text-center font-mono">{g.ca2Score}</td>
                  <td className="p-2 border border-gray-300 text-center font-mono">{g.examScore}</td>
                  <td className="p-2 border border-gray-300 text-center font-black text-emerald-900">{g.totalScore}%</td>
                  <td className="p-2 border border-gray-300 text-center font-black">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${g.grade === 'A' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                      {g.grade}
                    </span>
                  </td>
                  <td className="p-2 border border-gray-300 text-[11px] text-gray-700 italic">{g.remarks}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Statistics & Akhlaq Assessment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {showSummarySection && (
            <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 space-y-2 text-xs">
              <h4 className="font-bold text-emerald-950 text-xs uppercase border-b pb-1">Academic Summary</h4>
              <div className="flex justify-between">
                <span>Total Score Obtained:</span>
                <span className="font-black">{totalObtained} / {totalPossible}</span>
              </div>
              <div className="flex justify-between">
                <span>Average Percentage:</span>
                <span className="font-black text-emerald-900">{averagePercentage}%</span>
              </div>
              <div className="flex justify-between">
                <span>Overall Terminal Grade:</span>
                <span className="font-black text-emerald-800">DISTINCTION (A)</span>
              </div>
            </div>
          )}

          {showAkhlaqSection && (
            <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 space-y-2 text-xs">
              <h4 className="font-bold text-emerald-950 text-xs uppercase border-b pb-1">Behavioral & Akhlaq Rating</h4>
              <div className="flex justify-between">
                <span>Islamic Conduct (Adab):</span>
                <span className="font-bold text-emerald-800">{student.akhlaqRating}</span>
              </div>
              <div className="flex justify-between">
                <span>Punctuality & Attendance:</span>
                <span className="font-bold text-emerald-800">EXCELLENT (98%)</span>
              </div>
              <div className="flex justify-between">
                <span>Neatness & Respect:</span>
                <span className="font-bold text-emerald-800">EXCELLENT</span>
              </div>
            </div>
          )}
        </div>

        {/* Grading Scale Legend Key */}
        {showGradeLegend && (
          <div className="p-2.5 rounded-xl border border-gray-200 bg-slate-50 mb-6 text-[10px]">
            <span className="font-bold text-gray-700 uppercase block mb-1">Grading Scale Legend & Key:</span>
            <div className="flex flex-wrap gap-3 font-semibold text-gray-600">
              <span><strong>A:</strong> 75 - 100% (Distinction)</span>
              <span><strong>B:</strong> 60 - 74.99% (Very Good)</span>
              <span><strong>C:</strong> 50 - 59.99% (Good)</span>
              <span><strong>D:</strong> 40 - 49.99% (Pass)</span>
              <span><strong>F:</strong> 0 - 39.99% (Fail)</span>
            </div>
          </div>
        )}

        {/* Official Remarks & Signatures */}
        <div className="pt-4 border-t-2 border-emerald-900 text-xs space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
              <span className="text-[10px] font-bold text-emerald-900 uppercase block">Class Teacher Remark:</span>
              <p className="text-[11px] text-gray-700 italic">{teacherRemarkDefault}</p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 space-y-1">
              <span className="text-[10px] font-bold text-emerald-900 uppercase block">Principal Official Remark:</span>
              <p className="text-[11px] text-gray-700 italic">{principalRemarkDefault}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-4 border-t border-gray-300">
            <div className="text-center space-y-2">
              <p className="font-bold text-gray-800">Ustaz Abubakar Sadiq</p>
              <div className="border-b border-gray-400 w-40 mx-auto" />
              <p className="text-[10px] text-gray-500 uppercase font-semibold">Class Teacher Signature</p>
            </div>

            <div className="text-center space-y-2 flex flex-col items-center justify-end">
              {defaultSignatureUrl ? (
                <div className="h-12 flex items-center justify-center">
                  <img
                    src={defaultSignatureUrl}
                    alt="School Principal Default Signature"
                    className="max-h-12 max-w-full object-contain"
                  />
                </div>
              ) : (
                <div className="border-b border-gray-400 w-40 mx-auto h-8" />
              )}
              <p className="font-bold text-gray-800">{principalName}</p>
              <div className="border-b border-gray-400 w-44 mx-auto" />
              <p className="text-[10px] text-gray-500 uppercase font-semibold">{principalTitle}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
