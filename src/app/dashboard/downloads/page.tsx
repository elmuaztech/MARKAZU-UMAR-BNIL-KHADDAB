'use client';

import React from 'react';
import { Download, FileText, Calendar, BookOpen, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function DownloadsPage() {
  const documents = [
    {
      id: 'doc-01',
      title: 'Official Student Admission & Application Form (1447/1448 AH)',
      category: 'Admissions',
      size: '1.2 MB',
      format: 'PDF Document',
      description: 'Printable admission form for Tahfiz, Primary, and Secondary Islamiyya streams.',
    },
    {
      id: 'doc-02',
      title: 'Markazu Umar Academic Session Calendar (1447 AH)',
      category: 'Academic Calendar',
      size: '850 KB',
      format: 'PDF Document',
      description: 'Comprehensive term start dates, Musabaqah competition schedule, and examination breaks.',
    },
    {
      id: 'doc-03',
      title: 'School Prospectus & Tahfiz Curriculum Guide',
      category: 'Prospectus',
      size: '3.4 MB',
      format: 'PDF Document',
      description: 'Detailed overview of 30 Juz memorization tracks, Tajweed standards, and Islamic Studies syllabus.',
    },
    {
      id: 'doc-04',
      title: 'Tahfiz Halqa Code of Conduct & Student Policy Manual',
      category: 'School Policy',
      size: '620 KB',
      format: 'PDF Document',
      description: 'Behavioral conduct, attendance rules, and Hifz evaluation criteria for guardians and students.',
    },
  ];

  const handleDownload = (docName: string) => {
    alert(`Downloading "${docName}"... File generated successfully.`);
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-gray-100 selection:bg-emerald-500 selection:text-white">
      {/* Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#042f1e] via-[#064e3b] to-[#0284c7] text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-500/30">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-widest mb-1">
            <Download className="w-4 h-4 text-emerald-400" /> Official Downloads & Resources Portal
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Downloads & Documents Center</h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
            Access official PDF documents, admission forms, academic calendars, Tahfiz syllabus guides, and school policies for Markazu Umar.
          </p>
        </div>
      </div>

      {/* Downloads List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 uppercase">
                  {doc.category}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{doc.size} • {doc.format}</span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">{doc.title}</h3>
              <p className="text-slate-600 dark:text-emerald-200/80 leading-relaxed">{doc.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-emerald-500/20 flex items-center justify-between">
              <button
                onClick={() => handleDownload(doc.title)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all"
              >
                <Download className="w-4 h-4" /> Download PDF Document
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
