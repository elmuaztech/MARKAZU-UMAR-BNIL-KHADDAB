'use client';

import React from 'react';
import { PublicNavbar } from '../../components/navigation/PublicNavbar';
import { PublicFooter } from '../../components/navigation/PublicFooter';
import { BookOpen, GraduationCap, School, BookMarked, Award, CheckCircle2, Sparkles, Clock, FileCheck } from 'lucide-react';

export default function AcademicsPage() {
  return (
    <div className="min-h-screen bg-[#f4f8f5] dark:bg-[#031c13] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-16">
        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-amber-300 font-semibold text-xs shadow-inner">
            <GraduationCap className="w-4 h-4 text-emerald-600 dark:text-amber-400" /> Academic Structure & Curriculum
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Comprehensive Islamic & <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-600 dark:from-emerald-400 dark:via-emerald-200 dark:to-amber-300">
              Tahfiz Academic Programmes
            </span>
          </h1>

          <p className="text-sm md:text-base text-slate-600 dark:text-emerald-100/80 leading-relaxed max-w-2xl mx-auto">
            Combining rigorous 30-Juz Qur'an memorization with structured Islamiyya streams, classical Arabic grammar, and authentic Islamic jurisprudence.
          </p>
        </div>

        {/* 4 Primary Programmes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* 1. Tahfiz Programme */}
          <div className="p-8 rounded-3xl glass-card border border-emerald-500/30 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <BookOpen className="w-7 h-7" />
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                1. 30-Juz Tahfiz Programme
              </h2>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-xs font-bold">
                Core Program
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-emerald-100/80 leading-relaxed">
              Full 30-Juz memorization track structured across small-group Halqas under verified Huffaz masters. Includes daily Hifz new verses, Sabki previous juz revision, and Manzil long-term retention.
            </p>

            <ul className="space-y-2 text-xs text-slate-700 dark:text-emerald-200/90 pt-2 border-t border-emerald-200 dark:border-emerald-800/40">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Daily 1 to 2 Pages New Hifz Assignment</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Daily Sabki (1/4 to 1/2 Juz Recent Memorization)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Daily Manzil (1 to 2 Juz Cumulative Retention)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Tajweed Rules & Verse Pronunciation Testing</span>
              </li>
            </ul>
          </div>

          {/* 2. Islamiyya Programme */}
          <div className="p-8 rounded-3xl glass-card border border-emerald-500/30 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/30">
              <School className="w-7 h-7" />
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                2. Islamiyya Programme
              </h2>
              <span className="px-2.5 py-1 rounded-full bg-sky-500/20 text-sky-600 dark:text-sky-300 border border-sky-500/30 text-xs font-bold">
                Level 1 to 6
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-emerald-100/80 leading-relaxed">
              Systematic Islamic school curriculum structured across progressive levels for young learners and adolescents, instilling authentic Islamic knowledge and moral discipline.
            </p>

            <ul className="space-y-2 text-xs text-slate-700 dark:text-emerald-200/90 pt-2 border-t border-emerald-200 dark:border-emerald-800/40">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Primary & Secondary Islamiyya Classes</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Structured Termly Examinations & Continuous Assessment</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Character & Ethics Evaluation</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                <span>Graduation Certification upon Completion</span>
              </li>
            </ul>
          </div>

          {/* 3. Arabic Language Studies */}
          <div className="p-8 rounded-3xl glass-card border border-emerald-500/30 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/30">
              <BookMarked className="w-7 h-7" />
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                3. Arabic Language Studies
              </h2>
              <span className="px-2.5 py-1 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-300 border border-purple-500/30 text-xs font-bold">
                Language Mastery
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-emerald-100/80 leading-relaxed">
              Comprehensive instruction in classical Quranic Arabic to enable students to understand, speak, read, and write Arabic with grammatical precision.
            </p>

            <ul className="space-y-2 text-xs text-slate-700 dark:text-emerald-200/90 pt-2 border-t border-emerald-200 dark:border-emerald-800/40">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Al-Nahu (Arabic Syntax & Grammar)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Al-Sarf (Morphology & Word Derivatives)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Al-Muhadatha (Arabic Conversation & Dictation)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Quranic Vocabulary Expansion</span>
              </li>
            </ul>
          </div>

          {/* 4. Classical Islamic Sciences */}
          <div className="p-8 rounded-3xl glass-card border border-emerald-500/30 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Award className="w-7 h-7" />
            </div>

            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">
                4. Classical Islamic Sciences
              </h2>
              <span className="px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 text-xs font-bold">
                Sciences
              </span>
            </div>

            <p className="text-xs text-slate-600 dark:text-emerald-100/80 leading-relaxed">
              In-depth teaching of the fundamental pillars of Islamic knowledge based on authentic textual references and classical scholarly texts.
            </p>

            <ul className="space-y-2 text-xs text-slate-700 dark:text-emerald-200/90 pt-2 border-t border-emerald-200 dark:border-emerald-800/40">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Fiqh (Islamic Jurisprudence & Worship)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Hadith (Prophetic Traditions & Explanation)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Tauhid (Pure Monotheism & Creed)</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Seerah (Prophetic Biography & Ethics)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Assessment & Grading Policy */}
        <div className="p-8 rounded-3xl bg-white dark:bg-[#032417] border border-emerald-200 dark:border-emerald-500/30 shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-emerald-200 dark:border-emerald-800/60 pb-3">
            <FileCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Assessment & Terminal Report Card System
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <span className="font-bold text-emerald-900 dark:text-emerald-300">Continuous Assessment (40%)</span>
              <p className="text-slate-600 dark:text-emerald-200/80">
                Evaluated through weekly class quizzes, oral Tajweed recitations, attendance consistency, and Sabki revision performance.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <span className="font-bold text-emerald-900 dark:text-emerald-300">Terminal Examination (60%)</span>
              <p className="text-slate-600 dark:text-emerald-200/80">
                End of term written and oral examinations covering Tajweed, Fiqh, Hadith, Arabic, Tauhid, and Seerah.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 space-y-2">
              <span className="font-bold text-amber-700 dark:text-amber-300">Hifz Retention Rating</span>
              <p className="text-slate-600 dark:text-emerald-200/80">
                Special 5-Star rating metric evaluating student Sabki (recent) and Manzil (long-term) Qur'anic memory accuracy.
              </p>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
