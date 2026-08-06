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
  const { schoolLogo, classes } = useApp();

  const currentClass = classes.find((c) => c.id === student.classId || c.name === student.className);

  const handlePrint = () => {
    window.print();
  };

  const totalPossible = grades.length * 100;
  const totalObtained = grades.reduce((acc, g) => acc + g.totalScore, 0);
  const averagePercentage = grades.length > 0 ? (totalObtained / grades.length).toFixed(1) : '0';

  return (
    <div className="space-y-4">
      {/* Action Bar (hidden on print) */}
      <div className="no-print flex items-center justify-between p-4 rounded-2xl glass-card border border-emerald-500/30">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Official Terminal Report Card Preview
          </h3>
          <p className="text-xs text-emerald-300/70">Ready for downloading or printing to official PDF format.</p>
        </div>
        <button
          onClick={handlePrint}
          className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all scale-105"
        >
          <Printer className="w-4 h-4" />
          <span>Print / Save as PDF</span>
        </button>
      </div>

      {/* Official Report Card Sheet */}
      <div className="print-container bg-white text-slate-900 p-8 rounded-2xl shadow-2xl border border-gray-200 max-w-4xl mx-auto font-sans">
        {/* Header Crest */}
        <div className="text-center border-b-2 border-emerald-800 pb-4 mb-4">
          <div className="flex flex-col items-center justify-center text-center gap-1.5 mb-2">
            {schoolLogo ? (
              <img src={schoolLogo} alt="School Crest Logo" className="w-16 h-16 rounded-full object-cover border-2 border-emerald-800 p-0.5 shadow-sm" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-emerald-800 flex items-center justify-center text-amber-300 border-2 border-emerald-900 shadow-sm">
                <Sparkles className="w-8 h-8" />
              </div>
            )}
            <div className="font-arabic font-bold text-base text-amber-800 leading-snug">
              مركز عمر بن الخطاب لتحفيظ القرآن والدراسات الإسلامية - دنيج
            </div>
            <h1 className="text-base md:text-lg font-black text-emerald-950 uppercase tracking-tight leading-snug max-w-2xl">
              Markazu Umar bn Al-Khattab Centre for Qur'an Memorization and Islamic Studies - Daneji
            </h1>
          </div>
          <p className="text-xs font-bold text-emerald-800 uppercase mt-0.5">
            OFFICIAL TERMINAL ACADEMIC & TAHFIZ PROGRESS REPORT
          </p>
          <div className="mt-2 inline-block bg-emerald-900 text-amber-300 font-bold text-xs px-3 py-1 rounded-md">
            SESSION: {session.sessionName} • {session.activeTerm.toUpperCase()}
          </div>
        </div>

        {/* Student Biodata Box */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 text-xs mb-5">
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Student Name</span>
            <span className="font-extrabold text-emerald-950">{student.fullName}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Admission Number</span>
            <span className="font-mono font-bold text-emerald-900">{student.admissionNo}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Class / Halqa</span>
            <BilingualText
              english={currentClass?.class_name_english || student.className}
              arabic={currentClass?.class_name_arabic || student.classNameArabic}
              englishClassName="font-bold text-emerald-900"
              arabicClassName="text-[11px] font-semibold text-amber-700 font-arabic"
            />
          </div>
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold block">Guardian Name</span>
            <span className="font-semibold text-gray-800">{student.guardianName}</span>
          </div>
        </div>

        {/* Specialized Tahfiz Performance Card */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-950 text-white p-4 rounded-xl mb-5 space-y-2 border border-emerald-700">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" /> Tahfiz & Qur'an Memorization Evaluation
            </h3>
            <span className="bg-amber-500 text-slate-950 font-black text-[10px] px-2.5 py-0.5 rounded uppercase">
              {student.hifzProgress.juzCompleted} / 30 Juz Completed
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs border-t border-emerald-800">
            <div>
              <span className="text-[10px] text-emerald-300 uppercase block">Current Surah</span>
              <span className="font-bold text-white">{student.hifzProgress.currentSurah}</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-300 uppercase block">Sabki (Revision)</span>
              <span className="font-bold text-amber-300">★ {student.hifzProgress.sabkiRating} / 5 Stars</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-300 uppercase block">Manzil (Retention)</span>
              <span className="font-bold text-amber-300">★ {student.hifzProgress.manzilRating} / 5 Stars</span>
            </div>
            <div>
              <span className="text-[10px] text-emerald-300 uppercase block">Tajweed Quality</span>
              <span className="font-bold text-emerald-200">★ {student.hifzProgress.tajweedRating} / 5 Stars</span>
            </div>
          </div>
        </div>

        {/* Academic Subject Scores Table */}
        <div className="mb-5">
          <h3 className="text-xs font-bold uppercase text-emerald-900 mb-2">Subject Performance Breakdown</h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-emerald-900 text-white uppercase text-[10px]">
                <th className="p-2 border border-emerald-800">Subject Name</th>
                <th className="p-2 border border-emerald-800 text-center">CA1 (20)</th>
                <th className="p-2 border border-emerald-800 text-center">CA2 (20)</th>
                <th className="p-2 border border-emerald-800 text-center">Exam (60)</th>
                <th className="p-2 border border-emerald-800 text-center">Total (100)</th>
                <th className="p-2 border border-emerald-800 text-center">Grade</th>
                <th className="p-2 border border-emerald-800">Remarks</th>
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
          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 space-y-2 text-xs">
            <h4 className="font-bold text-emerald-900 text-xs uppercase border-b pb-1">Academic Summary</h4>
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

          <div className="p-3.5 rounded-xl border border-gray-200 bg-gray-50 space-y-2 text-xs">
            <h4 className="font-bold text-emerald-900 text-xs uppercase border-b pb-1">Behavioral & Akhlaq Rating</h4>
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
        </div>

        {/* Signatures */}
        <div className="grid grid-cols-2 gap-8 pt-4 border-t-2 border-emerald-900 text-xs">
          <div className="text-center space-y-8">
            <p className="font-bold text-gray-800">Ustaz Abubakar Sadiq</p>
            <div className="border-b border-gray-400 w-48 mx-auto" />
            <p className="text-[10px] text-gray-500 uppercase font-semibold">Class Teacher Signature</p>
          </div>
          <div className="text-center space-y-8">
            <p className="font-bold text-gray-800">Malam Umar Faruq</p>
            <div className="border-b border-gray-400 w-48 mx-auto" />
            <p className="text-[10px] text-gray-500 uppercase font-semibold">School Principal & Stamp</p>
          </div>
        </div>
      </div>
    </div>
  );
}
