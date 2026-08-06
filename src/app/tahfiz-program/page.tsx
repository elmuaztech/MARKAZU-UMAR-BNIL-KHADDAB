'use client';

import React from 'react';
import { PublicNavbar } from '../../components/navigation/PublicNavbar';
import { PublicFooter } from '../../components/navigation/PublicFooter';
import { BookOpen, Sparkles, Award, CheckCircle2, ShieldCheck, Star, Clock, HeartHandshake, UserCheck, Flame } from 'lucide-react';

export default function TahfizProgramPage() {
  return (
    <div className="min-h-screen bg-[#f4f8f5] dark:bg-[#031c13] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-16">
        {/* Hero Banner */}
        <div className="text-center space-y-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-amber-300 font-semibold text-xs shadow-inner">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-amber-400" /> Core Specialty Programme
          </div>

          <h1 className="font-arabic font-bold text-2xl md:text-4xl text-amber-600 dark:text-amber-300">
            برنامج تحفيظ القرآن الكريم 30 جزءا
          </h1>

          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            30-Juz Qur'an Memorization Track <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-600 dark:from-emerald-400 dark:via-emerald-200 dark:to-amber-300">
              Structured Hifz, Sabki & Manzil Methodology
            </span>
          </h2>

          <p className="text-sm md:text-base text-slate-600 dark:text-emerald-100/80 leading-relaxed max-w-2xl mx-auto">
            A proven, time-tested methodology combining daily memorization, systematic revision, and Tajweed mastery to build lifelong Huffaz.
          </p>
        </div>

        {/* 10 Highlight Modules Grid */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              10 Core Pillars of Our Tahfiz Curriculum
            </h3>
            <p className="text-xs text-slate-600 dark:text-emerald-300/80 mt-1">
              Every student in the Tahfiz track undergoes rigorous evaluation across these 10 areas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* 1. Daily Hifz */}
            <div className="p-6 rounded-2xl glass-card border border-emerald-500/30 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">1. Daily Hifz (New Memorization)</h4>
              <p className="text-xs text-slate-600 dark:text-emerald-200/80 leading-relaxed">
                Daily memorization of 1 to 2 pages assigned by Halqa teachers. Students recite new verses every morning with zero mistakes allowed in pronunciation.
              </p>
            </div>

            {/* 2. Sabki Revision */}
            <div className="p-6 rounded-2xl glass-card border border-emerald-500/30 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/30">
                <Clock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">2. Sabki Revision (Recent Memorization)</h4>
              <p className="text-xs text-slate-600 dark:text-emerald-200/80 leading-relaxed">
                Daily recitation of the last 5 to 10 pages memorized. Ensures newly acquired verses solidify firmly before advancing to new Surahs.
              </p>
            </div>

            {/* 3. Manzil Revision */}
            <div className="p-6 rounded-2xl glass-card border border-emerald-500/30 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Flame className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">3. Manzil Revision (Cumulative Long-Term)</h4>
              <p className="text-xs text-slate-600 dark:text-emerald-200/80 leading-relaxed">
                Systematic daily revision of previously completed Juz (1 to 2 Juz daily). Ensures old memorization is never lost or forgotten.
              </p>
            </div>

            {/* 4. Tajweed Rules */}
            <div className="p-6 rounded-2xl glass-card border border-emerald-500/30 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">4. Tajweed & Phonetics</h4>
              <p className="text-xs text-slate-600 dark:text-emerald-200/80 leading-relaxed">
                Precision in Makharij (articulation points), Ghunnah, Madd, Ikhfa, and Idgham rules to recite exactly as revealed.
              </p>
            </div>

            {/* 5. Arabic Language */}
            <div className="p-6 rounded-2xl glass-card border border-emerald-500/30 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <BookOpen className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">5. Arabic Language & Dictation</h4>
              <p className="text-xs text-slate-600 dark:text-emerald-200/80 leading-relaxed">
                Understanding vocabulary and syntax so students comprehend the divine meaning of the verses they memorize.
              </p>
            </div>

            {/* 6. Fiqh */}
            <div className="p-6 rounded-2xl glass-card border border-emerald-500/30 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">6. Fiqh (Islamic Jurisprudence)</h4>
              <p className="text-xs text-slate-600 dark:text-emerald-200/80 leading-relaxed">
                Practical instruction on Purification (Taharah), Prayer (Salah), Fasting (Sawm), and everyday Islamic rulings.
              </p>
            </div>

            {/* 7. Hadith */}
            <div className="p-6 rounded-2xl glass-card border border-emerald-500/30 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
                <Star className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">7. Hadith (Prophetic Traditions)</h4>
              <p className="text-xs text-slate-600 dark:text-emerald-200/80 leading-relaxed">
                Study of Forty Hadith (Nawawi) and key prophetic sayings emphasizing sincerity, truthfulness, and kindness.
              </p>
            </div>

            {/* 8. Tauhid */}
            <div className="p-6 rounded-2xl glass-card border border-emerald-500/30 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/30">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">8. Tauhid (Pure Creed)</h4>
              <p className="text-xs text-slate-600 dark:text-emerald-200/80 leading-relaxed">
                Establishing firm monotheism, understanding the Names and Attributes of Allah, and avoiding all forms of polytheism.
              </p>
            </div>

            {/* 9. Seerah */}
            <div className="p-6 rounded-2xl glass-card border border-emerald-500/30 space-y-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                <UserCheck className="w-6 h-6" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">9. Seerah (Prophetic Biography)</h4>
              <p className="text-xs text-slate-600 dark:text-emerald-200/80 leading-relaxed">
                Lessons from the life of Prophet Muhammad (ﷺ) and his noble companions, deriving ethical guidance for modern life.
              </p>
            </div>
          </div>

          {/* 10. Behaviour & Character Assessment */}
          <div className="p-8 rounded-3xl bg-white dark:bg-[#032417] border border-emerald-200 dark:border-emerald-500/30 shadow-xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-black text-slate-900 dark:text-white">
                  10. Behaviour & Moral Character Assessment (Tarbiyya)
                </h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                  Motto: العلم و التربية — Knowledge and Discipline
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-emerald-100/90 leading-relaxed">
              Memorizing the Qur'an without noble character is incomplete. Markazu Umar enforces strict behavioral metrics including respect for elders, humility, truthfulness, punctuality in congregational prayers, and environmental cleanliness.
            </p>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
