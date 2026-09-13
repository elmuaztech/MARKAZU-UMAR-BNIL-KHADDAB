'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../lib/context';
import { PublicNavbar } from '../components/navigation/PublicNavbar';
import { PublicFooter } from '../components/navigation/PublicFooter';
import { AdmissionFormModal } from '../components/public/AdmissionFormModal';
import { AnimatedCounter } from '../components/ui/AnimatedCounter';
import { GalleryLightbox } from '../components/public/GalleryLightbox';
import { FloatingWhatsApp } from '../components/ui/FloatingWhatsApp';
import {
  BookOpen,
  Users,
  Award,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  HeartHandshake,
  School,
  BookMarked,
  Calendar,
  ChevronDown,
  FileText,
  HelpCircle,
  Eye,
  UserCheck,
  GraduationCap,
} from 'lucide-react';

export default function HomePage() {
  const { academicEvents, galleryItems: cmsGalleryItems, newsArticles: cmsNewsArticles } = useApp();

  const [admissionModalOpen, setAdmissionModalOpen] = useState(false);
  const [activeGalleryTab, setActiveGalleryTab] = useState<string>('All');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Gallery Lightbox State
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Gallery Sample Data Categories
  const galleryCategories = [
    'All',
    'Classes',
    'School Officials',
    'Students',
    'Teachers',
    'Islamic Events',
  ];

  const filteredGallery =
    activeGalleryTab === 'All'
      ? cmsGalleryItems
      : cmsGalleryItems.filter((item) => item.category === activeGalleryTab);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  // FAQ Data
  const faqs = [
    {
      q: 'What is the admission procedure for Markazu Umar bn Al-Khattab?',
      a: 'Parents can fill the official online admission form on our website or visit the Administration Office at No. 32 Daneji Quarters, Behind Sahad Store, Kano. Candidates undergo a basic assessment for Halqa placement.',
    },
    {
      q: 'What academic & Qur’anic programs are available?',
      a: 'We offer structured 30-Juz Tahfizul Qur’an memorization, Islamiyya primary to secondary levels, Tajweed phonetics, and classical Quranic Arabic studies.',
    },
    {
      q: "How does the 30-Juz Qur'an Memorization track work?",
      a: 'Students are assigned to dedicated Halqas managed by certified Huffaz teachers. Each student follows a daily routine of Hifz (new memorization), Sabki (recent revision), and Manzil (long-term cumulative revision).',
    },
    {
      q: "Can parents monitor their ward's Tahfiz progress remotely?",
      a: 'Yes! Parents receive login credentials to our Parent Progress Portal to view daily Hifz surah/ayah logs, Sabki ratings, attendance records, and termly report cards.',
    },
    {
      q: 'How are Tahfiz and Islamiyya sessions structured?',
      a: 'Classes follow structured morning and evening shifts managed by dedicated Huffaz teachers and certified academic supervisors.',
    },
  ];

  // Faculty Preview Cards
  const staffMembers = [
    {
      name: 'Alh. Salisu Abubakar Daneji',
      title: 'Director',
      avatar: '/gallery/director.jpg',
    },
    {
      name: 'Ustaz Ahmad Muhammad',
      title: 'Head of Tahfiz & Hifz Master',
      avatar: '',
    },
    {
      name: 'Mallam Ibrahim Daneji',
      title: 'Director of Academic Studies',
      avatar: '',
    },
    {
      name: 'Ustaz Hafiz Sulaiman',
      title: 'Senior Sabki & Manzil Inspector',
      avatar: '',
    },
    {
      name: 'Malama Fatima Abubakar',
      title: 'Female Halqa & Tarbiyya Supervisor',
      avatar: '',
    },
  ];

  return (
    <div className="min-h-screen bg-[#f4f8f5] dark:bg-[#031c13] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      {/* Official Top Navbar */}
      <PublicNavbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-24">
        {/* HERO SECTION WITH SCHOOL BACKGROUND IMAGE */}
        <section className="relative rounded-3xl overflow-hidden shadow-2xl border border-emerald-500/40 p-8 sm:p-12 md:p-16 text-center text-white my-4 min-h-[460px] flex flex-col items-center justify-center">
          {/* Background Image Container with Soft Opacity and High Contrast */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-30 transition-transform duration-700 hover:scale-105"
            style={{ backgroundImage: "url('/school-bg.jpg')" }}
          />
          
          {/* Rich Dark Emerald Overlay with Backdrop Blur */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#031c13]/85 via-[#043322]/80 to-[#021810]/90 backdrop-blur-[1px]" />

          {/* Content Layer */}
          <div className="relative z-10 space-y-5 max-w-4xl mx-auto px-2">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/25 border border-emerald-400/40 text-amber-300 font-semibold text-xs shadow-lg backdrop-blur-md">
              <BookOpen className="w-4 h-4 text-amber-400" /> Welcome to
            </div>

            <h1 className="text-xl sm:text-3xl md:text-5xl font-black tracking-tight leading-snug sm:leading-tight text-white max-w-full sm:max-w-4xl mx-auto drop-shadow-md text-center px-1">
              Markazu Umar bn Al-Khattab <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-amber-300 to-sky-300">
                Centre for Qur'an Memorization and Islamic Studies - Daneji
              </span>
            </h1>

            <div className="font-arabic font-bold text-lg md:text-xl text-amber-300 drop-shadow">
              مركز عمر بن الخطاب لتحفيظ القرآن والدراسات الإسلامية - دنيج
            </div>

            <p className="text-sm md:text-base text-emerald-100/90 leading-relaxed max-w-2xl mx-auto font-medium">
              Fostering spiritual growth, 30-Juz Qur'an memorization, and classical Islamic education across 1,000+ students and 40+ Huffaz educators in Kano, Nigeria.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4 w-full sm:w-auto [&>*]:w-full sm:[&>*]:w-auto">
              <button
                onClick={() => setAdmissionModalOpen(true)}
                className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/30 transition-all hover:scale-105 text-center"
              >
                <FileText className="w-4 h-4 shrink-0" />
                <span>Enroll Your Child</span>
              </button>

              <Link
                href="/login"
                className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/40 transition-all hover:scale-105 border border-emerald-400/30 text-center"
              >
                <span>Portal Login</span>
                <ArrowRight className="w-4 h-4 shrink-0" />
              </Link>
            </div>
          </div>
        </section>

        {/* KEY STATISTICAL COUNTERS (ANIMATED) */}
        <section className="p-4 sm:p-8 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-[#032417] via-[#043322] to-[#022c1d] border border-emerald-500/40 shadow-2xl text-white">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center divide-y md:divide-y-0 md:divide-x divide-emerald-800/60">
            <div className="p-4 space-y-1">
              <Users className="w-7 h-7 text-emerald-400 mx-auto" />
              <div className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">
                <AnimatedCounter end={1000} suffix="+" />
              </div>
              <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Students Enrolled</p>
            </div>

            <div className="p-4 space-y-1 pt-6 md:pt-4">
              <Award className="w-7 h-7 text-amber-400 mx-auto" />
              <div className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">
                <AnimatedCounter end={40} suffix="+" />
              </div>
              <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Huffaz Educators</p>
            </div>

            <div className="p-4 space-y-1 pt-6 md:pt-4">
              <BookOpen className="w-7 h-7 text-sky-400 mx-auto" />
              <div className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">
                <AnimatedCounter end={30} suffix=" Juz" />
              </div>
              <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Tahfiz Memorization</p>
            </div>

            <div className="p-4 space-y-1 pt-6 md:pt-4">
              <ShieldCheck className="w-7 h-7 text-emerald-400 mx-auto" />
              <div className="text-3xl sm:text-4xl font-black text-amber-300 tracking-tight">
                <AnimatedCounter end={100} suffix="%" />
              </div>
              <p className="text-xs font-bold text-emerald-200 uppercase tracking-wider">Islamic Tarbiyya</p>
            </div>
          </div>
        </section>

        {/* 4 CORE FEATURE CARDS */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="group p-6 rounded-2xl glass-card border border-emerald-500/30 text-center space-y-3 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/20 hover:border-emerald-400/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <BookOpen className="w-6 h-6 group-hover:rotate-6 transition-transform duration-300" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-amber-300 transition-colors">
              30-Juz Tahfiz Program
            </h3>
            <p className="text-xs text-slate-600 dark:text-emerald-200/70">
              Daily Hifz, Sabki revision, and Manzil retention tracking.
            </p>
          </div>

          <div className="group p-6 rounded-2xl glass-card border border-emerald-500/30 text-center space-y-3 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/20 hover:border-emerald-400/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-600 dark:text-sky-400 mx-auto flex items-center justify-center border border-sky-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Users className="w-6 h-6 group-hover:rotate-6 transition-transform duration-300" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-amber-300 transition-colors">
              1,000+ Capacity
            </h3>
            <p className="text-xs text-slate-600 dark:text-emerald-200/70">
              Structured Tahfiz Halqas and Islamiyya streams.
            </p>
          </div>

          <div className="group p-6 rounded-2xl glass-card border border-emerald-500/30 text-center space-y-3 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/20 hover:border-emerald-400/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center border border-purple-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <Award className="w-6 h-6 group-hover:rotate-6 transition-transform duration-300" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-amber-300 transition-colors">
              Islamic Curriculum
            </h3>
            <p className="text-xs text-slate-600 dark:text-emerald-200/70">
              Fiqh, Hadith, Aqeedah, Seerah, Tajweed & Arabic Grammar.
            </p>
          </div>

          <div className="group p-6 rounded-2xl glass-card border border-emerald-500/30 text-center space-y-3 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/20 hover:border-emerald-400/50 transition-all duration-300">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 mx-auto flex items-center justify-center border border-amber-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
              <HeartHandshake className="w-6 h-6 group-hover:rotate-6 transition-transform duration-300" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-amber-300 transition-colors">
              Parent Progress Portal
            </h3>
            <p className="text-xs text-slate-600 dark:text-emerald-200/70">
              Real-time ward progress, attendance alerts & report cards.
            </p>
          </div>
        </section>

        {/* SECTION 1: ABOUT MARKAZU */}
        <section className="p-8 md:p-12 rounded-3xl bg-white dark:bg-[#032417] border border-emerald-200 dark:border-emerald-500/30 shadow-2xl space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-emerald-200 dark:border-emerald-800/60 pb-6">
            <div>
              <span className="text-xs font-bold text-emerald-600 dark:text-amber-400 uppercase tracking-widest">
                Official Institutional Profile
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-1">
                About Markazu Umar bn Khattab
              </h2>
            </div>
            <div className="font-arabic text-xl font-bold text-emerald-700 dark:text-amber-300">
              العلم و التربية
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Mission Statement */}
            <div className="p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-amber-300 font-bold text-sm uppercase">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-amber-400" />
                <span>Our Mission (Manufar Mu)</span>
              </div>
              <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200 italic leading-relaxed">
                "Horar da ɗalibai karatun Al-Qur'ani da kuma ilimin addinin Musulunci. Sanar musu da lazimtar Littafin Allah mai girma da ruƙo da tafarkin magabata na kwarai."
              </p>
              <p className="text-xs text-slate-600 dark:text-emerald-100/80 leading-relaxed pt-1">
                To educate and train students in the memorization of the Glorious Qur'an and authentic Islamic sciences, instilling steadfast adherence to the Book of Allah and the path of the righteous predecessors.
              </p>
            </div>

            {/* Vision Statement */}
            <div className="p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 dark:text-amber-300 font-bold text-sm uppercase">
                <Award className="w-5 h-5 text-amber-500" />
                <span>Our Vision (Kyakykyawan Zato)</span>
              </div>
              <p className="text-xs font-bold text-emerald-950 dark:text-emerald-200 italic leading-relaxed">
                "Samar da ɗalibai masu ingantacciyar haddar Al-Qur'ani mai girma tare da ilimin addini da tarbiyya."
              </p>
              <p className="text-xs text-slate-600 dark:text-emerald-100/80 leading-relaxed pt-1">
                To produce graduates possessing verified, flawless 30-Juz Qur'an memorization accompanied by deep Islamic jurisprudence, Arabic language mastery, and noble moral character.
              </p>
            </div>
          </div>
        </section>

        {/* SECTION 1.5: FILTERABLE MEDIA GALLERY WITH LIGHTBOX (PLACED IMMEDIATELY AFTER ABOUT SECTION) */}
        <section className="space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-600 dark:text-amber-400 uppercase tracking-widest">
                Campus Life & Events
              </span>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                Markazu Umar Media Gallery
              </h2>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {galleryCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveGalleryTab(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeGalleryTab === cat
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-white dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/60 text-slate-700 dark:text-emerald-200 hover:bg-emerald-50'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {filteredGallery.map((item, idx) => (
              <div
                key={idx}
                onClick={() => openLightbox(idx)}
                className="rounded-3xl overflow-hidden glass-card border border-emerald-500/30 group hover:shadow-2xl hover:border-emerald-400/60 transition-all duration-300 cursor-pointer bg-white dark:bg-[#021d14] flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-900">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="px-3 py-1.5 rounded-full bg-emerald-500/90 text-white font-bold text-xs shadow-lg flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> View Photo
                    </span>
                  </div>
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/70 text-amber-300 text-[10px] font-bold backdrop-blur-md border border-amber-400/30">
                    {item.category}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-amber-300 transition-colors line-clamp-2">
                    {item.title}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-emerald-300/70 pt-2 font-medium">
                    Click to expand high-res photo
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2: WHY CHOOSE US (8 Feature Cards with Hover Animations) */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-amber-400 uppercase tracking-widest">
              Excellence & Distinction
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
              Why Choose Markazu Umar bn Al-Khattab?
            </h2>
            <p className="text-xs text-slate-600 dark:text-emerald-200/80">
              Eight key features that make our institution the preferred choice for Islamic education in Kano.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Qualified Huffaz Teachers',
                desc: 'Over 40 certified teachers with Sanad in 30-Juz memorization.',
                icon: Award,
                color: 'text-emerald-500',
              },
              {
                title: 'Strong Islamic Character',
                desc: 'Emphasis on Tarbiyya, discipline, punctuality, and noble ethics.',
                icon: ShieldCheck,
                color: 'text-amber-500',
              },
              {
                title: "30-Juz Qur'an Track",
                desc: 'Systematic daily Hifz, Sabki revision, and Manzil retention.',
                icon: BookOpen,
                color: 'text-sky-500',
              },
              {
                title: 'Tajweed & Phonetics',
                desc: 'Phonetics, Makharij articulation, and Quranic recitation rules.',
                icon: BookMarked,
                color: 'text-purple-500',
              },
              {
                title: 'Islamic Sciences',
                desc: 'In-depth teaching of Fiqh, Hadith, Tauhid, and Seerah.',
                icon: School,
                color: 'text-emerald-400',
              },
              {
                title: 'Modern Learning Environment',
                desc: 'Structured classrooms, digitized student logs, and spacious campus.',
                icon: GraduationCap,
                color: 'text-amber-400',
              },
              {
                title: 'Excellent Discipline',
                desc: 'Strict code of conduct ensuring safety, respect, and focus.',
                icon: ShieldCheck,
                color: 'text-rose-500',
              },
              {
                title: 'Safe Learning Environment',
                desc: 'Nurturing, secure campus in Daneji Quarters, Kano.',
                icon: HeartHandshake,
                color: 'text-emerald-500',
              },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div
                  key={i}
                  className="group p-6 rounded-2xl glass-card border border-emerald-500/30 space-y-3 hover:-translate-y-2 hover:shadow-2xl hover:shadow-emerald-900/20 hover:border-emerald-400/50 transition-all duration-300 cursor-pointer"
                >
                  <div className="w-11 h-11 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 group-hover:bg-emerald-500/30 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                    <Icon className={`w-6 h-6 ${item.color} group-hover:rotate-6 transition-transform duration-300`} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-amber-300 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-emerald-200/70 leading-relaxed">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 3: ACADEMIC PROGRAMMES */}
        <section className="p-8 md:p-12 rounded-3xl bg-white dark:bg-[#032417] border border-emerald-200 dark:border-emerald-500/30 shadow-2xl space-y-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-emerald-200 dark:border-emerald-800/60 pb-6">
            <div>
              <span className="text-xs font-bold text-emerald-600 dark:text-amber-400 uppercase tracking-widest">
                Curriculum Structure
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white mt-1">
                Our Academic Programmes
              </h2>
            </div>
            <Link
              href="/academics"
              className="px-4 py-2 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 font-bold text-xs flex items-center gap-1 hover:bg-emerald-200"
            >
              <span>View Detailed Curriculum</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Asubah & Magrib Section</h3>
              <p className="text-xs text-slate-600 dark:text-emerald-200/80 leading-relaxed">
                Special morning and evening sessions offering three specialized tracks: Asubah Only, Magrib Only, and Tahfeez.
              </p>
              <div className="pt-2 flex flex-wrap gap-1">
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">Asubah Only</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">Magrib Only</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">Tahfeez</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Super Markaz Section</h3>
              <p className="text-xs text-slate-600 dark:text-emerald-200/80 leading-relaxed">
                Advanced intensive program covering classical Islamic jurisprudence, Arabic grammar (Nahu/Sarf), and scholarship.
              </p>
              <div className="pt-2 flex flex-wrap gap-1">
                <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-700 dark:text-sky-300 text-[10px] font-bold">Advanced Studies</span>
                <span className="px-2 py-0.5 rounded-md bg-sky-500/20 text-sky-700 dark:text-sky-300 text-[10px] font-bold">Tarbiyya</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Islamiyyah Section</h3>
              <p className="text-xs text-slate-600 dark:text-emerald-200/80 leading-relaxed">
                Progressive structured Islamiyyah curriculum from Level 1 through Level 6 covering Quranic studies, Tawhid, Fiqh, and Sirah.
              </p>
              <div className="pt-2 flex flex-wrap gap-1">
                <span className="px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-700 dark:text-purple-300 text-[10px] font-bold">Levels 1 - 6</span>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 space-y-3">
              <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                04
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Matan Aure Section</h3>
              <p className="text-xs text-slate-600 dark:text-emerald-200/80 leading-relaxed">
                Dedicated section providing comprehensive Islamic education, Quranic memorization, and Fiqh tailored for married women.
              </p>
              <div className="pt-2 flex flex-wrap gap-1">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold">Women's Education</span>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: QUR'AN MEMORIZATION HIGHLIGHT */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-amber-400 uppercase tracking-widest">
              Core Specialty
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
              Qur'an Memorization & Sciences Highlight
            </h2>
            <p className="text-xs text-slate-600 dark:text-emerald-200/80">
              10 core pillars forming our daily Tahfiz Halqa evaluation system.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            {[
              { name: 'Daily Hifz', desc: 'New Verses' },
              { name: 'Sabki Revision', desc: 'Recent Juz' },
              { name: 'Manzil Revision', desc: 'Cumulative' },
              { name: 'Tajweed Rules', desc: 'Phonetics' },
              { name: 'Arabic Grammar', desc: 'Nahu & Sarf' },
              { name: 'Fiqh', desc: 'Jurisprudence' },
              { name: 'Hadith', desc: 'Prophetic Traditions' },
              { name: 'Tauhid', desc: 'Islamic Creed' },
              { name: 'Seerah', desc: 'Prophetic Life' },
              { name: 'Behaviour', desc: 'Ethics & Conduct' },
            ].map((module, idx) => (
              <div key={idx} className="p-4 rounded-2xl glass-card border border-emerald-500/30 space-y-1">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{module.name}</h4>
                <p className="text-[10px] text-slate-500 dark:text-emerald-300/70">{module.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 5: LATEST NEWS & EVENTS */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-amber-400 uppercase tracking-widest">
              News & Announcements
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
              Latest Musabaqah & School News
            </h2>
            <p className="text-xs text-slate-600 dark:text-emerald-200/80">
              Stay updated with Quranic competitions, academic calendars, and institutional events.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cmsNewsArticles.map((art) => (
              <div
                key={art.id}
                className="p-6 rounded-3xl bg-white dark:bg-[#032417] border border-emerald-200 dark:border-emerald-500/30 shadow-xl space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  {art.image && (
                    <div className="w-full h-48 rounded-2xl overflow-hidden bg-slate-100 dark:bg-emerald-950 border border-emerald-500/20">
                      <img src={art.image} alt={art.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20 uppercase">
                      {art.category}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">{art.date}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-snug">{art.title}</h3>
                  <p className="text-xs text-slate-600 dark:text-emerald-200/80 leading-relaxed">{art.summary}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 6: SCHOOL PHOTO GALLERY */}
        <section className="space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-amber-400 uppercase tracking-widest">
              Visual Highlights
            </span>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">
              Markazu Umar School Photo Gallery
            </h2>
            <p className="text-xs text-slate-600 dark:text-emerald-200/80">
              Explore photo archives categorized by Teachers, Students, Classes, Officials, and Events.
            </p>

            {/* Gallery Category Filter Tabs */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-4">
              {galleryCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveGalleryTab(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    activeGalleryTab === cat
                      ? 'bg-emerald-600 text-white shadow-lg'
                      : 'bg-emerald-50 dark:bg-emerald-950/60 text-slate-700 dark:text-emerald-300 hover:bg-emerald-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredGallery.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => openLightbox(idx)}
                className="group cursor-pointer p-3 rounded-3xl bg-white dark:bg-[#032417] border border-emerald-200 dark:border-emerald-500/30 shadow-xl space-y-3"
              >
                <div className="relative w-full h-52 rounded-2xl overflow-hidden bg-slate-100 dark:bg-emerald-950">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 text-[10px] font-bold bg-black/60 text-white px-2 py-0.5 rounded-full backdrop-blur-md border border-white/20 uppercase">
                    {item.category}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">{item.title}</h4>
              </div>
            ))}
          </div>
        </section>

        {/* Lightbox Modal */}
        {lightboxOpen && filteredGallery[lightboxIndex] && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-6 right-6 text-white text-xl font-bold bg-white/10 p-3 rounded-full hover:bg-white/20"
            >
              ✕
            </button>
            <div className="max-w-4xl w-full text-center space-y-4">
              <img
                src={filteredGallery[lightboxIndex].image}
                alt={filteredGallery[lightboxIndex].title}
                className="max-h-[75vh] mx-auto rounded-2xl object-contain shadow-2xl"
              />
              <h3 className="text-white text-base font-bold">{filteredGallery[lightboxIndex].title}</h3>
              <p className="text-amber-400 text-xs font-semibold uppercase">{filteredGallery[lightboxIndex].category} Section</p>
            </div>
          </div>
        )}

        {/* SECTION 7: OFFICIAL INSTITUTIONAL LEADERSHIP */}
        <section className="space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-extrabold text-emerald-600 dark:text-amber-400 uppercase tracking-widest">
              Institutional Leadership
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              School Leadership & Directorate
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-emerald-200/80">
              Guiding Markazu Umar bn Al-Khattab with Islamic scholarship, tarbiyya, and administrative excellence.
            </p>
          </div>

          {/* Director & Deputy Director Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Director Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#032417] via-[#043322] to-[#021d14] border border-amber-400/50 shadow-2xl text-white flex flex-col sm:flex-row items-center gap-6 group hover:border-amber-400 transition-all">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-xl shrink-0">
                <img
                  src="/gallery/director.jpg"
                  alt="Alh. Salisu Abubakar Daneji (Director)"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="space-y-2 text-center sm:text-left flex-1">
                <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-400/40 text-amber-300 text-[11px] font-bold">
                  ⭐ Director
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Alh. Salisu Abubakar Daneji
                </h3>
                <p className="text-xs text-amber-300/90 font-semibold">
                  Director of Markazu Umar bn Al-Khattab
                </p>
                <p className="text-xs text-emerald-100/80 leading-relaxed pt-1">
                  Leading institutional growth, Qur'an memorization standards, and Islamic tarbiyya across Kano.
                </p>
              </div>
            </div>

            {/* Deputy Director Card */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-[#032417] via-[#043322] to-[#021d14] border border-emerald-500/40 shadow-2xl text-white flex flex-col sm:flex-row items-center gap-6 group hover:border-emerald-400 transition-all">
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden border-2 border-emerald-400/80 shadow-xl shrink-0">
                <img
                  src="/gallery/deputy-director.jpg"
                  alt="Ustaz Sani Abubakar Daneji (Deputy Director)"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="space-y-2 text-center sm:text-left flex-1">
                <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold">
                  🌙 Deputy Director
                </span>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Ustaz Sani Abubakar Daneji
                </h3>
                <p className="text-xs text-emerald-300/90 font-semibold">
                  Deputy Director of Markazu Umar bn Al-Khattab
                </p>
                <p className="text-xs text-emerald-100/80 leading-relaxed pt-1">
                  Overseeing academic affairs, Halqa discipline, and Tahfiz examination quality assurance.
                </p>
              </div>
            </div>
          </div>

          {/* Section Headmasters Side-by-Side Cards */}
          <div className="space-y-4 max-w-5xl mx-auto pt-4">
            <div className="text-center">
              <span className="text-xs font-extrabold text-emerald-600 dark:text-amber-400 uppercase tracking-widest">
                Section Headmasters
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                Academic Section Leadership
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Card: Mal. Ahmad Abba */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#032417] border border-emerald-200 dark:border-emerald-500/30 shadow-xl flex flex-col sm:flex-row items-center gap-5 group hover:shadow-2xl hover:border-emerald-400 transition-all">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-md shrink-0">
                  <img
                    src="/gallery/headmaster-matan-aure.jpg"
                    alt="Mal. Ahmad Abba (Headmaster, Matan Aure Section)"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                  <p className="text-[11px] text-slate-600 dark:text-emerald-200/70 leading-relaxed pt-1">
                    Supervising adult female Tahfiz Halqas, Tajweed instruction, and specialized Islamic tarbiyya curriculum.
                  </p>
                </div>
              </div>

              {/* Right Card: Mal. Siraɗullahi Balarabe Lawan */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#032417] border border-emerald-200 dark:border-emerald-500/30 shadow-xl flex flex-col sm:flex-row items-center gap-5 group hover:shadow-2xl hover:border-emerald-400 transition-all">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-md shrink-0">
                  <img
                    src="/gallery/headmaster-asuba-maghrib.jpg"
                    alt="Mal. Siraɗullahi Balarabe Lawan (Headmaster, Asuba da Maghrib Section)"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                  <p className="text-[11px] text-slate-600 dark:text-emerald-200/70 leading-relaxed pt-1">
                    Managing morning & evening Tahfiz streams, daily Hifz tracking, and student attendance discipline.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 8: FREQUENTLY ASKED QUESTIONS (FAQs) */}
        <section className="p-8 md:p-12 rounded-3xl bg-white dark:bg-[#032417] border border-emerald-200 dark:border-emerald-500/30 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-emerald-200 dark:border-emerald-800/60 pb-4">
            <HelpCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              Frequently Asked Questions (FAQs)
            </h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaqIndex === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-emerald-200 dark:border-emerald-800/60 overflow-hidden transition-colors"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                    className="w-full p-4 text-left font-bold text-xs sm:text-sm text-slate-900 dark:text-emerald-100 bg-emerald-50/50 dark:bg-emerald-950/40 hover:bg-emerald-100/60 flex items-center justify-between gap-4"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown
                      className={`w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  {isOpen && (
                    <div className="p-4 text-xs text-slate-600 dark:text-emerald-200/80 bg-white dark:bg-[#021c13] border-t border-emerald-200 dark:border-emerald-800/40 leading-relaxed">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* SECTION 9: ENROLL YOUR CHILD CTA */}
        <section className="p-8 md:p-12 rounded-3xl bg-gradient-to-r from-emerald-800 via-emerald-700 to-sky-700 text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="space-y-2">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-widest">
              2026/2027 Admissions Open
            </span>
            <h2 className="text-2xl md:text-4xl font-black tracking-tight">
              Enroll Your Child at Markazu Umar Today
            </h2>
            <p className="text-xs md:text-sm text-emerald-100 max-w-xl">
              Fill the online enrollment form or visit our Daneji Quarters campus in Kano, Nigeria.
            </p>
          </div>

          <button
            onClick={() => setAdmissionModalOpen(true)}
            className="px-8 py-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs md:text-sm flex items-center gap-2 shadow-2xl transition-all scale-105 shrink-0"
          >
            <FileText className="w-5 h-5" />
            <span>Enroll Your Child</span>
          </button>
        </section>
      </main>

      {/* Official Footer */}
      <PublicFooter />

      {/* Interactive Media Gallery Lightbox */}
      <GalleryLightbox
        isOpen={lightboxOpen}
        currentIndex={lightboxIndex}
        items={filteredGallery}
        onClose={() => setLightboxOpen(false)}
        onNavigate={(newIdx) => setLightboxIndex(newIdx)}
      />

      {/* Online Admission Application Modal */}
      <AdmissionFormModal
        isOpen={admissionModalOpen}
        onClose={() => setAdmissionModalOpen(false)}
      />
      {/* Floating WhatsApp Contact Widget */}
      <FloatingWhatsApp />
    </div>
  );
}
