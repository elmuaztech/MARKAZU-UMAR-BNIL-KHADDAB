'use client';

import React, { useState } from 'react';
import { PublicNavbar } from '../../components/navigation/PublicNavbar';
import { PublicFooter } from '../../components/navigation/PublicFooter';
import { AdmissionFormModal } from '../../components/public/AdmissionFormModal';
import { CheckCircle2, ShieldCheck, BookOpen, GraduationCap, ArrowRight } from 'lucide-react';

export default function EnrollPage() {
  const [modalOpen, setModalOpen] = useState(true);

  return (
    <div className="min-h-screen bg-[#f4f8f5] dark:bg-[#031c13] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-12">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-300 font-bold text-xs shadow-inner">
            <GraduationCap className="w-4 h-4" /> Official Online Student Enrollment
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Enroll Your Child at <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-600 dark:from-emerald-400 dark:via-emerald-200 dark:to-amber-300">
              Markazu Umar bn Al-Khattab
            </span>
          </h1>

          <p className="text-sm md:text-base text-slate-600 dark:text-emerald-100/80 leading-relaxed max-w-2xl mx-auto">
            Submit your child's application for 30-Juz Tahfiz and Islamiyya studies. Upon approval, login credentials for both Student & Parent portals are automatically generated and emailed.
          </p>

          <button
            onClick={() => setModalOpen(true)}
            className="px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm flex items-center gap-2 shadow-2xl transition-all scale-105 mx-auto"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Open Online Admission Application Form</span>
          </button>
        </div>

        {/* 3 Core Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl glass-card border border-emerald-500/30 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">1. Instant Online Review</h3>
            <p className="text-xs text-slate-600 dark:text-emerald-200/70">
              Applications are reviewed directly by the School Administrator through the Admission Centre.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-card border border-emerald-500/30 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">2. Automatic Student ID & Portal</h3>
            <p className="text-xs text-slate-600 dark:text-emerald-200/70">
              Upon approval, a unique Student ID (e.g. MU-2026-STUD-001) and Student Portal account are generated.
            </p>
          </div>

          <div className="p-6 rounded-3xl glass-card border border-emerald-500/30 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center border border-sky-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">3. Parent Credentials Emailed</h3>
            <p className="text-xs text-slate-600 dark:text-emerald-200/70">
              Login credentials for both Student & Parent portals are automatically emailed to the parent.
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />

      <AdmissionFormModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
