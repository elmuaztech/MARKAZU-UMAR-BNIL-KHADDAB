'use client';

import React from 'react';
import { PublicNavbar } from '../../components/navigation/PublicNavbar';
import { PublicFooter } from '../../components/navigation/PublicFooter';
import { ShieldCheck, BookOpen, Clock, AlertTriangle, CheckCircle2, Scale, Heart } from 'lucide-react';

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-[#f4f8f5] dark:bg-[#031c13] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-16">
        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-amber-300 font-semibold text-xs shadow-inner">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-amber-400" /> Student Guidelines & Conduct
          </div>

          <h1 className="font-arabic font-bold text-2xl md:text-3xl text-emerald-700 dark:text-amber-300">
            قواعد و logistics المدرسة — School Regulations
          </h1>

          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            School Rules & Code of Conduct <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-600 dark:from-emerald-400 dark:via-emerald-200 dark:to-amber-300">
              العلم و التربية — Knowledge and Discipline
            </span>
          </h2>

          <p className="text-sm text-slate-600 dark:text-emerald-100/80 max-w-2xl mx-auto leading-relaxed">
            To maintain the sacred sanctity of Qur'anic study and ensure an exemplary Islamic environment, all students and parents are bound by these school regulations.
          </p>
        </div>

        {/* 4 Major Rules Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 1. Qur'anic Reverence & Halqa Rules */}
          <div className="p-8 rounded-3xl glass-card border border-emerald-500/30 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <BookOpen className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
              1. Qur'anic Reverence & Halqa Conduct
            </h3>

            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-emerald-200/90">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Students must maintain ritual purity (Wudu) at all times when handling the Mushaf.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Absolute silence and respect must be observed inside the Tahfiz Halqa halls.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Daily assigned Hifz, Sabki, and Manzil recitations must be completed punctually.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span>Mushafs must be kept clean, elevated, and treated with utmost sanctity.</span>
              </li>
            </ul>
          </div>

          {/* 2. Attendance & Punctuality */}
          <div className="p-8 rounded-3xl glass-card border border-emerald-500/30 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Clock className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
              2. Attendance & Punctuality
            </h3>

            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-emerald-200/90">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <span>Punctual arrival before morning Halqa session is mandatory.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <span>Unexcused absences exceeding 3 consecutive days will require parent interview.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
                <span>Leave of absence permissions must be submitted in writing by parents beforehand.</span>
              </li>
            </ul>
          </div>

          {/* 3. Dress Code & Islamic Attire */}
          <div className="p-8 rounded-3xl glass-card border border-emerald-500/30 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
              3. Islamic Dress Code & Neatness
            </h3>

            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-emerald-200/90">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <span><strong>Boys:</strong> Official School Yard Uniform, neat cap, and clean footwear.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <span><strong>Girls:</strong> Modest long Hijab covering requirements according to Islamic guidelines.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <span>Personal hygiene, trimmed nails, and neat hair grooming are strictly checked.</span>
              </li>
            </ul>
          </div>

          {/* 4. Discipline & Prohibited Items */}
          <div className="p-8 rounded-3xl glass-card border border-emerald-500/30 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/30">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
              4. Discipline & Prohibited Conduct
            </h3>

            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-emerald-200/90">
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>Mobile phones, unauthorized electronics, and unapproved materials are strictly prohibited.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>Fighting, vulgar language, bullying, or dishonesty will result in immediate suspension.</span>
              </li>
              <li className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>Destruction of school property or defacing Mushafs will attract strict restitution fines.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Discipline Framework Card */}
        <div className="p-8 rounded-3xl bg-white dark:bg-[#032417] border border-emerald-200 dark:border-emerald-500/30 shadow-xl space-y-4">
          <div className="flex items-center gap-3">
            <Scale className="w-6 h-6 text-amber-500" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Progressive Disciplinary Procedure
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 space-y-1">
              <span className="font-bold text-emerald-900 dark:text-emerald-300">Step 1: Verbal Warning</span>
              <p className="text-slate-600 dark:text-emerald-200/80">Counseling by Halqa teacher & recorded in daily log.</p>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/40 space-y-1">
              <span className="font-bold text-amber-900 dark:text-amber-300">Step 2: Parent Notification</span>
              <p className="text-slate-600 dark:text-emerald-200/80">Official notice sent to parent & Admin Disciplinary Hearing.</p>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/40 space-y-1">
              <span className="font-bold text-rose-900 dark:text-rose-300">Step 3: Suspension / Review</span>
              <p className="text-slate-600 dark:text-emerald-200/80">Temporary suspension pending board review.</p>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
