'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '../../lib/context';
import { AdmissionFormModal } from '../public/AdmissionFormModal';
import {
  Sparkles,
  MapPin,
  Phone,
  Mail,
  FileText,
  Heart,
  ExternalLink,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';

export function PublicFooter() {
  const { schoolLogo } = useApp();
  const [admissionModalOpen, setAdmissionModalOpen] = useState(false);

  return (
    <>
      <footer className="bg-[#021810] text-emerald-100 border-t border-emerald-800/60 pt-12 pb-8 px-4 sm:px-6 transition-colors">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Column 1: School Brand Crest & Arabic Title */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {schoolLogo ? (
                <div className="w-12 h-12 rounded-full bg-white border-2 border-emerald-500/50 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-900/50 overflow-hidden shrink-0">
                  <img src={schoolLogo} alt="Markazu Umar Logo" className="w-full h-full rounded-full object-cover" />
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 to-sky-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/50 shrink-0 border-2 border-emerald-400/40">
                  <Sparkles className="w-6 h-6" />
                </div>
              )}
              <h3 className="font-extrabold text-sm sm:text-base text-white tracking-tight leading-snug">
                MARKAZU UMAR BN AL-KHATTAB
              </h3>
            </div>

            <div className="font-arabic font-bold text-sm text-amber-300">
              مركز عمر بن الخطاب لتحفيظ القرآن والدراسات الإسلامية - دنيج
            </div>

            <div className="inline-block px-3.5 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-600/40 text-amber-300 text-xs font-arabic font-bold">
              العلم و التربية — Knowledge and Discipline
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-emerald-800/60 pb-2">
              Quick Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-emerald-500">›</span> Home Page
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-emerald-500">›</span> About Institution
                </Link>
              </li>
              <li>
                <Link href="/academics" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-emerald-500">›</span> Academic Programmes
                </Link>
              </li>
              <li>
                <Link href="/tahfiz-program" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-emerald-500">›</span> Qur'an Memorization (30-Juz)
                </Link>
              </li>
              <li>
                <Link href="/rules" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-emerald-500">›</span> School Rules & Guidelines
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-amber-300 transition-colors flex items-center gap-1.5">
                  <span className="text-emerald-500">›</span> Contact Administration
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact & Address */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-emerald-800/60 pb-2">
              Official Contact & Address
            </h4>
            <div className="space-y-2.5 text-xs text-emerald-200/90">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>No. 32 Daneji Quarters, Behind Sahad Store, Kano, Nigeria</span>
              </div>

              <div className="space-y-1 pt-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="font-semibold text-white">Phone Numbers:</span>
                </div>
                <div className="pl-5 grid grid-cols-2 gap-1 font-mono text-[11px] text-emerald-300">
                  <a href="tel:08167109421" className="hover:text-amber-300">08167109421</a>
                  <a href="tel:09042786093" className="hover:text-amber-300">09042786093</a>
                  <a href="tel:08037966581" className="hover:text-amber-300">08037966581</a>
                  <a href="tel:07085206969" className="hover:text-amber-300">07085206969</a>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <a
                  href="mailto:markazuumarbndaneji@gmail.com"
                  className="hover:text-amber-300 truncate font-mono text-[11px] text-emerald-300"
                >
                  markazuumarbndaneji@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* Column 4: Online Admissions */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider border-b border-emerald-800/60 pb-2">
              Online Admissions
            </h4>

            <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 space-y-3">
              <p className="text-xs text-emerald-200">
                Enroll your child for 30-Juz Tahfiz and Islamiyya studies.
              </p>
              <button
                onClick={() => setAdmissionModalOpen(true)}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Enroll Your Child</span>
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Professional Copyright Bar with Clean Developer & Email Alignment */}
        <div className="max-w-7xl mx-auto pt-6 border-t border-emerald-900/60 flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left text-xs text-emerald-400/80">
          <p>
            © 2026 Markazu Umar bn Al-Khattab Centre for Qur'an Memorization, Kano, Nigeria.
          </p>
          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 text-xs">
            <span className="font-semibold text-emerald-200">
              Powered by <span className="text-amber-300 font-bold">Elmuaz Technologies Limited</span>
            </span>
            <span className="text-emerald-700">|</span>
            <a
              href="mailto:nmastechnologieslimited@gmail.com"
              className="font-mono text-amber-400 hover:underline flex items-center gap-1 font-semibold"
              title="Contact Developer"
            >
              <Mail className="w-3.5 h-3.5 text-amber-400" />
              <span>elmuaztechnologiesltd@gmail.com</span>
            </a>
          </div>
        </div>
      </footer>

      {/* Admission Form Download Modal */}
      <AdmissionFormModal
        isOpen={admissionModalOpen}
        onClose={() => setAdmissionModalOpen(false)}
      />
    </>
  );
}
