'use client';

import React from 'react';
import { PublicNavbar } from '../../components/navigation/PublicNavbar';
import { PublicFooter } from '../../components/navigation/PublicFooter';
import { Sparkles, BookOpen, Award, ShieldCheck, Users, HeartHandshake, CheckCircle2, MapPin, Phone, Mail } from 'lucide-react';

import { FloatingWhatsApp } from '../../components/ui/FloatingWhatsApp';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#f4f8f5] dark:bg-[#031c13] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-16">
        {/* Header Hero Banner with Rich Emerald Background */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#032417] via-[#043322] to-[#021d14] border border-emerald-500/40 p-8 sm:p-12 text-center text-white space-y-4 max-w-5xl mx-auto">
          <div className="relative z-10 space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-amber-300 font-semibold text-xs shadow-lg backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-amber-400" /> About Our Institution
            </div>

            <h1 className="font-arabic font-bold text-2xl md:text-3xl text-amber-300">
              مركز عمر بن الخطاب لتحفيظ القرآن بالدراسات الإسلامية دنيج
            </h1>

            <h2 className="text-3xl md:text-5xl font-black tracking-tight text-white">
              Markazu Umar bn Khattab <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-amber-300 to-sky-300">
                Tahfizul Qur'an & Islamic Studies School
              </span>
            </h2>

            <div className="pt-2">
              <span className="inline-block px-5 py-2 rounded-2xl bg-amber-500 text-slate-950 font-arabic font-extrabold text-sm shadow-md">
                العلم و التربية — Knowledge and Discipline
              </span>
            </div>
          </div>
        </div>

        {/* Mission & Vision Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Mission Card */}
          <div className="p-8 rounded-3xl glass-card border border-emerald-500/30 space-y-4 relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <BookOpen className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Our Mission (Manufar Mu)
            </h3>

            <div className="space-y-3 text-sm text-slate-700 dark:text-emerald-100/90 leading-relaxed">
              <p className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 font-semibold text-emerald-950 dark:text-emerald-200">
                "Horar da ɗalibai karatun Al-Qur'ani da kuma ilimin addinin Musulunci. Sanar musu da lazimtar Littafin Allah mai girma da ruƙo da tafarkin magabata na kwarai."
              </p>
              <p>
                To provide comprehensive 30-Juz Qur'an memorization and authentic Islamic education. Educating students on steadfast adherence to the Glorious Book of Allah and adhering strictly to the path of the righteous predecessors (Salafus-Salih).
              </p>
            </div>
          </div>

          {/* Vision Card */}
          <div className="p-8 rounded-3xl glass-card border border-emerald-500/30 space-y-4 relative overflow-hidden">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Award className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-wider">
              Our Vision (Kyakykyawan Zato)
            </h3>

            <div className="space-y-3 text-sm text-slate-700 dark:text-emerald-100/90 leading-relaxed">
              <p className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/40 font-semibold text-emerald-950 dark:text-emerald-200">
                "Samar da ɗalibai masu ingantacciyar haddar Al-Qur'ani mai girma tare da ilimin addini da tarbiyya."
              </p>
              <p>
                To nurture outstanding students equipped with verified, flawless 30-Juz Qur'anic memorization alongside deep Islamic jurisprudence, Tajweed precision, and exemplary moral discipline.
              </p>
            </div>
          </div>
        </div>

        {/* Directorate & Leadership Spotlight */}
        <div className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold text-emerald-600 dark:text-amber-400 uppercase tracking-widest">
              Institutional Leadership
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Directorate & Headmasters
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Director Spotlight Card */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-[#032417] via-[#043322] to-[#021d14] border border-amber-400/50 shadow-2xl text-white flex flex-col sm:flex-row items-center gap-6">
              <div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-xl shrink-0">
                <img
                  src="/gallery/director.jpg"
                  alt="Alh. Salisu Abubakar Daneji (Director)"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Director
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Alh. Salisu Abubakar Daneji
                </h3>
                <p className="text-xs text-amber-300 font-semibold">
                  Director of Markazu Umar bn Al-Khattab
                </p>
                <p className="text-xs text-emerald-100/90 leading-relaxed pt-1">
                  Guiding institutional growth, 30-Juz Tahfiz excellence, and moral tarbiyya across Kano State.
                </p>
              </div>
            </div>

            {/* Deputy Director Spotlight Card */}
            <div className="p-8 rounded-3xl bg-gradient-to-br from-[#032417] via-[#043322] to-[#021d14] border border-emerald-500/40 shadow-2xl text-white flex flex-col sm:flex-row items-center gap-6">
              <div className="w-36 h-36 rounded-2xl overflow-hidden border-2 border-emerald-400/80 shadow-xl shrink-0">
                <img
                  src="/gallery/deputy-director.jpg"
                  alt="Ustaz Sani Abubakar Daneji (Deputy Director)"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-2 text-center sm:text-left flex-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Deputy Director
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Ustaz Sani Abubakar Daneji
                </h3>
                <p className="text-xs text-emerald-300 font-semibold">
                  Deputy Director of Markazu Umar bn Al-Khattab
                </p>
                <p className="text-xs text-emerald-100/90 leading-relaxed pt-1">
                  Managing Halqa administration, examination standards, and senior academic supervision.
                </p>
              </div>
            </div>
          </div>

          {/* Side-by-side Headmasters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-3xl bg-white dark:bg-[#032417] border border-emerald-200 dark:border-emerald-500/30 shadow-xl flex flex-col sm:flex-row items-center gap-5">
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-md shrink-0">
                <img
                  src="/gallery/headmaster-matan-aure.jpg"
                  alt="Mal. Ahmad Abba"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-amber-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800">
                  Matan Aure Section
                </span>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Mal. Ahmad Abba
                </h4>
                <p className="text-xs text-emerald-600 dark:text-amber-400 font-bold">
                  Headmaster, Matan Aure Section
                </p>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-white dark:bg-[#032417] border border-emerald-200 dark:border-emerald-500/30 shadow-xl flex flex-col sm:flex-row items-center gap-5">
              <div className="w-28 h-28 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-md shrink-0">
                <img
                  src="/gallery/headmaster-asuba-maghrib.jpg"
                  alt="Mal. Siraɗullahi Balarabe Lawan"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="space-y-1.5 text-center sm:text-left flex-1">
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-amber-300 text-[10px] font-bold border border-emerald-300 dark:border-emerald-800">
                  Asuba da Maghrib Section
                </span>
                <h4 className="text-lg font-black text-slate-900 dark:text-white">
                  Mal. Siraɗullahi Balarabe Lawan
                </h4>
                <p className="text-xs text-emerald-600 dark:text-amber-400 font-bold">
                  Headmaster, Asuba da Maghrib Section
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* School Profile & History */}
        <div className="p-8 rounded-3xl bg-white dark:bg-[#032417] border border-emerald-200 dark:border-emerald-500/30 shadow-xl space-y-6">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white border-b border-emerald-200 dark:border-emerald-800/60 pb-3">
            Institutional Legacy & Campus Structure
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4 text-sm text-slate-600 dark:text-emerald-100/90 leading-relaxed">
              <p>
                Located in the heart of Daneji Quarters, Kano, Nigeria (Behind Sahad Store), <strong>Markazu Umar bn Khattab Tahfizul Qur'an & Islamic Studies School</strong> stands as a premier beacon of Islamic scholarship and Qur'anic memorization under Director Alh. Salisu Abubakar Daneji.
              </p>
              <p>
                With over 1,000 enrolled students across various Tahfiz Halqas and Islamiyya streams, the institution combines traditional oral retention methods with modern structured assessment frameworks to ensure perfect retention of the 30 Juz of the Qur'an.
              </p>
              <p>
                Under the guidance of over 40 certified Huffaz and Islamic scholars, students undergo rigorous daily Hifz, Sabki revision, and Manzil retention testing, complemented by Tajweed rules, Hadith, Fiqh, Seerah, and Tauhid.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 space-y-4 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-amber-300 uppercase tracking-wider">
                Official Campus Quick Facts
              </h4>
              <div className="space-y-2.5 text-slate-700 dark:text-emerald-200/90">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span><strong>Director:</strong> Alh. Salisu Abubakar Daneji</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span><strong>Capacity:</strong> 1,000+ Enrolled Students</span>
                </div>
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span><strong>Faculty:</strong> 40+ Certified Huffaz & Scholars</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span><strong>Location:</strong> Daneji Quarters, Kano</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span><strong>Developer:</strong> Elmuaz Technologies LTD</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 8 Core Values */}
        <div className="space-y-6">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
              Our Core Educational Values
            </h3>
            <p className="text-xs text-slate-600 dark:text-emerald-300/80">
              Guiding principles that define our teaching methodology and student tarbiyya.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { title: 'Verified 30-Juz Hifz', desc: 'Flawless memorization with verified Sanad and Tajweed accuracy.' },
              { title: 'Authentic Sunnah', desc: 'Strict adherence to authentic Islamic sciences & Salafus-Salih path.' },
              { title: 'Tajweed Mastery', desc: 'Phonetics, Makharij articulation, and Tajweed rules.' },
              { title: 'Strict Discipline', desc: 'Fostering respect, punctuality, and exemplary moral character.' },
              { title: 'Parent Transparency', desc: 'Real-time ward progress tracking and regular parent report cards.' },
              { title: 'Safe Environment', desc: 'Secure, nurturing, and serene Islamic learning environment.' },
              { title: 'Daily Sabki & Manzil', desc: 'Systematic daily revision ensuring long-term Qur’an retention.' },
              { title: 'Comprehensive Fiqh', desc: 'Practical Islamic jurisprudence for daily worship and ethics.' },
            ].map((item, idx) => (
              <div key={idx} className="p-6 rounded-2xl glass-card border border-emerald-500/30 space-y-2">
                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{item.title}</h4>
                <p className="text-xs text-slate-600 dark:text-emerald-200/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>

      <PublicFooter />
      <FloatingWhatsApp />
    </div>
  );
}
