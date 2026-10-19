'use client';

import React from 'react';
import Link from 'next/link';
import { PublicNavbar } from '../../components/navigation/PublicNavbar';
import { PublicFooter } from '../../components/navigation/PublicFooter';
import {
  FileText,
  ShieldCheck,
  Scale,
  CreditCard,
  UserCheck,
  AlertCircle,
  HelpCircle,
  BookOpen,
} from 'lucide-react';

export default function TermsPage() {
  const lastUpdated = 'October 19, 2026';

  return (
    <div className="min-h-screen bg-[#f4f8f5] dark:bg-[#031c13] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <PublicNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-12">
        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-amber-300 font-semibold text-xs shadow-inner">
            <Scale className="w-4 h-4 text-emerald-600 dark:text-amber-400" />
            Official Institutional Regulations
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Terms of Service
          </h1>

          <p dir="rtl" lang="ar" className="font-arabic text-xl font-bold text-emerald-700 dark:text-amber-300">
            الشروط والأحكام العامة لاستخدام البوابة المدرسية
          </p>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-emerald-100/80 max-w-2xl mx-auto leading-relaxed">
            These Terms of Service govern access to and use of the Markazu Umar bn Al-Khattab School Management System and official mobile applications.
          </p>

          <div className="pt-2 text-xs text-slate-500 dark:text-emerald-400 font-mono">
            Effective Date: {lastUpdated}
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-8 text-slate-700 dark:text-emerald-100/90 text-sm leading-relaxed">
          {/* Section 1 */}
          <section className="space-y-3 p-6 sm:p-8 rounded-3xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/60 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">1</span>
              Acceptance of Terms
            </h2>
            <p>
              By accessing, browsing, registering on, or using the Markazu Umar School Management Portal, you agree to be legally bound by these Terms of Service and our <Link href="/privacy" className="text-emerald-600 dark:text-amber-400 underline font-semibold">Privacy Policy</Link>. If you do not agree to these terms, you must not use the application or portal services.
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3 p-6 sm:p-8 rounded-3xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/60 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">2</span>
              User Accounts & Security
            </h2>
            <p>
              Authorized access is granted to registered students, parents, teachers, and administrators. Users must:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-emerald-200/90">
              <li>Maintain the strict confidentiality of their login credentials and one-time verification passwords (OTPs).</li>
              <li>Notify school administration immediately if unauthorized use of an account is suspected.</li>
              <li>Never attempt to access or tamper with data belonging to other students or staff.</li>
            </ul>
          </section>

          {/* Section 3 */}
          <section className="space-y-3 p-6 sm:p-8 rounded-3xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/60 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">3</span>
              Academic Integrity & Islamic Code of Conduct
            </h2>
            <p>
              Markazu Umar operates under Islamic values and principles. Users agree to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-emerald-200/90">
              <li>Uphold the sacred reverence of the Holy Qur'an during all memorization sessions and evaluations.</li>
              <li>Ensure all submitted coursework, assessments, and attendance declarations are truthful and accurate.</li>
              <li>Comply with the full <Link href="/rules" className="text-emerald-600 dark:text-amber-400 underline font-semibold">School Rules & Guidelines</Link>.</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3 p-6 sm:p-8 rounded-3xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/60 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">4</span>
              Tuition Payments & Financial Transactions
            </h2>
            <p>
              Online tuition and admission application fees processed through the portal are handled via certified payment gateways.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-emerald-200/90">
              <li>Payment receipts generated by the portal serve as authoritative school financial proof.</li>
              <li>Any fraudulent payment attempts or disputed reversals will result in immediate suspension of portal privileges pending review.</li>
              <li>Application and admission fees are non-refundable once processed.</li>
            </ul>
          </section>

          {/* Section 5 */}
          <section className="space-y-3 p-6 sm:p-8 rounded-3xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/60 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">5</span>
              Governing Law & Jurisdiction
            </h2>
            <p>
              These Terms shall be interpreted and governed by the laws of the Federal Republic of Nigeria and the state regulations of Kano State. Any disputes arising hereunder shall be subject to amicable resolution under Islamic mediation or the competent courts of Kano State, Nigeria.
            </p>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
