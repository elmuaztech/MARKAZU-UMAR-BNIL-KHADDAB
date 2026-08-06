'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ThemeToggle } from './ThemeToggle';
import { AdmissionFormModal } from '../public/AdmissionFormModal';
import { useApp } from '../../lib/context';
import {
  Sparkles,
  BookOpen,
  Phone,
  Mail,
  MapPin,
  Menu,
  X,
  ArrowRight,
  FileText,
  GraduationCap,
  ShieldCheck,
  Award,
} from 'lucide-react';

export function PublicNavbar() {
  const pathname = usePathname();
  const { schoolLogo, admissionStatus } = useApp();
  const [mounted, setMounted] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [admissionModalOpen, setAdmissionModalOpen] = useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'About', href: '/about' },
    { label: 'Academics', href: '/academics' },
    { label: "Qur'an Memorization", href: '/tahfiz-program' },
    { label: 'Rules & Guidelines', href: '/rules' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <>
      {/* Continuous Right-to-Left Announcement Ticker */}
      <div suppressHydrationWarning className="bg-gradient-to-r from-amber-600 via-amber-500 to-emerald-700 text-slate-950 font-bold text-xs py-1.5 px-4 overflow-hidden border-b border-amber-400/40 relative shadow-md">
        {mounted && admissionStatus === 'OPEN' ? (
          <div className="animate-marquee-smooth items-center gap-12">
            <span className="flex items-center gap-2 font-black tracking-wide shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-950 animate-pulse shrink-0" />
              <span>OFFICIAL ANNOUNCEMENT: Admissions for 2026/2027 Academic Session are OPEN! Click "Enroll Your Child" to submit your online application.</span>
            </span>
            <span className="flex items-center gap-2 font-black tracking-wide shrink-0">
              <Sparkles className="w-4 h-4 text-emerald-950 animate-pulse shrink-0" />
              <span>OFFICIAL ANNOUNCEMENT: Admissions for 2026/2027 Academic Session are OPEN! Click "Enroll Your Child" to submit your online application.</span>
            </span>
          </div>
        ) : (
          <div className="text-center font-bold text-slate-950 py-0.5">
            Notice: Online Admissions for the 2026/2027 Academic Session are currently CLOSED.
          </div>
        )}
      </div>

      {/* Top Notification Bar */}
      <div className="bg-[#064E3B] text-emerald-100 text-[11px] py-2 px-4 border-b border-emerald-700/50 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-6 text-center sm:text-left">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
            <span className="font-arabic font-bold text-amber-300 text-xs">
              العلم و التربية — Knowledge and Discipline
            </span>
            <span className="text-emerald-300/40 hidden sm:inline">|</span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>No. 32 Daneji Quarters, Kano, Nigeria</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-6">
            <a
              href="tel:08167109421"
              className="flex items-center gap-1.5 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>08167109421</span>
            </a>
            <span className="text-emerald-300/40 hidden sm:inline">|</span>
            <a
              href="mailto:markazuumarbnkhaddabdaneji@gmail.com"
              className="flex items-center gap-1.5 hover:text-white transition-colors font-mono"
            >
              <Mail className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>markazuumarbnkhaddabdaneji@gmail.com</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#032015]/95 backdrop-blur-md border-b border-emerald-200 dark:border-emerald-800/40 shadow-sm transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-4">
          {/* School Brand Logo Only (Names Removed For Maximum Navbar Width & Zero Scroll) */}
          <Link href="/" className="flex items-center gap-2 group shrink-0" title="Markazu Umar bn Al-Khattab Home">
            {mounted && schoolLogo ? (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white border-2 border-emerald-500/50 p-0.5 flex items-center justify-center shadow-md shadow-emerald-900/30 group-hover:scale-105 transition-transform overflow-hidden shrink-0">
                <img src={schoolLogo} alt="Markazu Umar Logo" className="w-full h-full rounded-full object-cover" />
              </div>
            ) : (
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-700 via-emerald-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-emerald-900/30 group-hover:scale-105 transition-transform shrink-0 border-2 border-emerald-400/50">
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
            )}
          </Link>

          {/* Desktop Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-100 dark:bg-emerald-800/40 text-emerald-950 dark:text-emerald-200 font-bold border border-emerald-300 dark:border-emerald-700/50'
                      : 'text-slate-700 dark:text-emerald-100/80 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 hover:text-emerald-900 dark:hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Action Controls */}
          <div className="hidden lg:flex items-center gap-3">
            <ThemeToggle variant="dropdown" />

            <button
              onClick={() => setAdmissionModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 transition-all scale-105"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Enroll Your Child</span>
            </button>

            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-900/30 transition-all"
            >
              <span>Portal Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Mobile Menu Trigger */}
          <div className="flex items-center gap-2 lg:hidden">
            <ThemeToggle variant="icon-only" />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-800/40 rounded-xl"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-emerald-200 dark:border-emerald-800/40 bg-white dark:bg-[#032015] px-4 py-4 space-y-3 shadow-xl">
            <div className="font-arabic font-bold text-xs text-amber-600 dark:text-amber-300 text-center pb-2 border-b border-emerald-100 dark:border-emerald-800/40">
              العلم و التربية — Knowledge and Discipline
            </div>

            <div className="space-y-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`block px-4 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'text-slate-700 dark:text-emerald-100/90 hover:bg-emerald-50 dark:hover:bg-emerald-900/40'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            <div className="pt-3 border-t border-emerald-100 dark:border-emerald-800/40 space-y-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setAdmissionModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-md"
              >
                <FileText className="w-4 h-4" />
                <span>Enroll Your Child</span>
              </button>

              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md"
              >
                <span>Enter Portal Login</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Admission Form Download Modal */}
      <AdmissionFormModal
        isOpen={admissionModalOpen}
        onClose={() => setAdmissionModalOpen(false)}
      />
    </>
  );
}
