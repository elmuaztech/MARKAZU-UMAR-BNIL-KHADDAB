'use client';

import React from 'react';
import Link from 'next/link';
import { PublicNavbar } from '../../components/navigation/PublicNavbar';
import { PublicFooter } from '../../components/navigation/PublicFooter';
import {
  ShieldCheck,
  Lock,
  Eye,
  FileText,
  UserCheck,
  Database,
  Trash2,
  Mail,
  Phone,
  MapPin,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function PrivacyPolicyPage() {
  const lastUpdated = 'October 19, 2026';

  return (
    <div className="min-h-screen bg-[#f4f8f5] dark:bg-[#031c13] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <PublicNavbar />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-12">
        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-amber-300 font-semibold text-xs shadow-inner">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-amber-400" />
            Official Privacy & Child Protection Policy
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Privacy Policy
          </h1>

          <p dir="rtl" lang="ar" className="font-arabic text-xl font-bold text-emerald-700 dark:text-amber-300">
            سياسة الخصوصية وحماية بيانات الطلاب
          </p>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-emerald-100/80 max-w-2xl mx-auto leading-relaxed">
            Markazu Umar bn Al-Khattab Islamic School is committed to safeguarding the privacy and personal data of our students, parents, guardians, and academic staff in accordance with the Nigeria Data Protection Act (NDPA 2023) and Google Play Families Policy.
          </p>

          <div className="pt-2 text-xs text-slate-500 dark:text-emerald-400 font-mono">
            Effective Date & Last Updated: {lastUpdated}
          </div>
        </div>

        {/* Highlight Banner: Zero Ads & Child Protection */}
        <div className="p-6 rounded-3xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-100 shadow-xl space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/40 shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm sm:text-base text-white">
                Our Non-Negotiable Child & Student Privacy Pledge
              </h3>
              <p className="text-xs text-emerald-200">
                Markazu Umar is an educational institution. We do not sell data, do not display third-party advertisements, and do not track minors across the web.
              </p>
            </div>
          </div>
        </div>

        {/* Content Sections */}
        <div className="space-y-10 text-slate-700 dark:text-emerald-100/90 text-sm leading-relaxed">
          {/* Section 1: Introduction & Scope */}
          <section className="space-y-3 p-6 sm:p-8 rounded-3xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/60 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">1</span>
              Introduction & Legal Scope
            </h2>
            <p>
              This Privacy Policy applies to the <strong>Markazu Umar bn Al-Khattab School Management System</strong> accessible via web browsers, Mobile Progressive Web Applications (PWA), and Android Trusted Web Activity (TWA) distributed via the Google Play Store.
            </p>
            <p>
              The platform is developed and maintained in partnership with <strong>Elmuaz Technologies Limited</strong> on behalf of <strong>Markazu Umar bn Al-Khattab Islamic Studies & Qur'anic Memorization School</strong>, Daneji, Kano, Nigeria.
            </p>
          </section>

          {/* Section 2: Information We Collect */}
          <section className="space-y-4 p-6 sm:p-8 rounded-3xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/60 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">2</span>
              Information We Collect & Purpose
            </h2>
            <p>
              We collect only the minimum personal information strictly necessary for the operation of the school and the delivery of religious and academic instruction:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-emerald-900/30 border border-slate-200 dark:border-emerald-800/40 space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-amber-400 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4" /> Student Data
                </h3>
                <ul className="text-xs space-y-1.5 list-disc pl-4 text-slate-600 dark:text-emerald-200/90">
                  <li>Full legal name, admission number, date of birth, and gender.</li>
                  <li>Assigned academic class and Tahfiz Halqa group.</li>
                  <li>Daily attendance logs, Hifz/Sabki/Manzil memorization records, and exam scores.</li>
                  <li>Passport photograph for ID verification and official report cards.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-emerald-900/30 border border-slate-200 dark:border-emerald-800/40 space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Eye className="w-4 h-4" /> Parent & Guardian Data
                </h3>
                <ul className="text-xs space-y-1.5 list-disc pl-4 text-slate-600 dark:text-emerald-200/90">
                  <li>Full name, relationship to student, phone number, and email address.</li>
                  <li>Residential address and emergency contact details.</li>
                  <li>School fee transaction references (processed via certified payment gateways).</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-emerald-900/30 border border-slate-200 dark:border-emerald-800/40 space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Database className="w-4 h-4" /> Staff & Teacher Data
                </h3>
                <ul className="text-xs space-y-1.5 list-disc pl-4 text-slate-600 dark:text-emerald-200/90">
                  <li>Teacher full name, staff ID, qualifications, subject assignments, and email.</li>
                  <li>System audit logs of grading and attendance inputs.</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-emerald-900/30 border border-slate-200 dark:border-emerald-800/40 space-y-2">
                <h3 className="font-bold text-xs uppercase tracking-wider text-emerald-700 dark:text-amber-400 flex items-center gap-1.5">
                  <Lock className="w-4 h-4" /> Technical & Security Data
                </h3>
                <ul className="text-xs space-y-1.5 list-disc pl-4 text-slate-600 dark:text-emerald-200/90">
                  <li>Hashed passwords (salted bcrypt/argon2; plain text is never stored).</li>
                  <li>IP addresses, device user-agent, and session tokens for session hijacking prevention.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3: Google Play Families & Children's Privacy */}
          <section className="space-y-3 p-6 sm:p-8 rounded-3xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/60 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">3</span>
              Google Play Families Policy & Children's Privacy
            </h2>
            <p>
              Because our school serves students of elementary, secondary, and Qur'anic memorization ages, we strictly comply with the <strong>Google Play Families Policy</strong> and international standards for minors:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm pl-2">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>No Commercial Advertising:</strong> The application is completely free of third-party advertisements, commercial SDKs, and behavioural tracking.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Parental Consent & Supervision:</strong> Accounts for minor students are provisioned exclusively by authorized school administration or enrolled with express parental/guardian consent.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Restricted Access:</strong> Student profiles and memorization marks are accessible only by the student's designated guardians, assigned teachers, and school leadership.</span>
              </li>
            </ul>
          </section>

          {/* Section 4: Data Processors & Third-Party Sharing */}
          <section className="space-y-3 p-6 sm:p-8 rounded-3xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/60 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">4</span>
              Third-Party Service Providers
            </h2>
            <p>
              We do not sell, rent, or trade personal data. We only share data with essential infrastructure partners under strict confidentiality and security agreements:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm pl-2">
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">›</span>
                <span><strong>Hosting & Cloud Infrastructure:</strong> Dedicated VPS hosting hosted on Hostinger Datacenters under enterprise-grade physical security, firewall protections, and automated encrypted backups.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">›</span>
                <span><strong>Payment Processing:</strong> Online tuition and admission payments are processed through PCI-DSS Level 1 certified gateways (e.g., Paystack/Flutterwave). Markazu Umar does not store credit card numbers or banking PINs.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold">›</span>
                <span><strong>Transactional Notifications:</strong> Secure SMTP relay for two-factor verification OTPs, admission status notifications, and academic report sheets.</span>
              </li>
            </ul>
          </section>

          {/* Section 5: Data Security Architecture */}
          <section className="space-y-3 p-6 sm:p-8 rounded-3xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/60 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">5</span>
              Data Security Architecture
            </h2>
            <p>
              We implement industry-standard technical and operational defenses to prevent unauthorized access, tampering, or loss of information:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-emerald-900/20 border border-slate-200 dark:border-emerald-800/30">
                <strong>Transport Layer Security (TLS 1.3):</strong> All network traffic between your device and our servers is encrypted in transit using modern HTTPS.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-emerald-900/20 border border-slate-200 dark:border-emerald-800/30">
                <strong>Role-Based Access Control (RBAC):</strong> Strict database-level isolation guarantees that parents cannot view unassociated students.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-emerald-900/20 border border-slate-200 dark:border-emerald-800/30">
                <strong>Session Protection:</strong> HttpOnly, SameSite, Secure cookies protect against Cross-Site Scripting (XSS) and CSRF attacks.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-emerald-900/20 border border-slate-200 dark:border-emerald-800/30">
                <strong>Brute Force & Rate Limiting:</strong> Automatic account lockout protects against automated credential stuffing.
              </div>
            </div>
          </section>

          {/* Section 6: Data Retention & User Rights */}
          <section className="space-y-4 p-6 sm:p-8 rounded-3xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/60 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">6</span>
              Your Rights & Account Deletion (Google Play Compliance)
            </h2>
            <p>
              In accordance with Google Play's Account Deletion Policy and NDPA 2023, every registered user has the right to access, rectify, or request the deletion of their personal account and associated data.
            </p>
            <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-600/40 space-y-2">
              <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-bold text-xs uppercase">
                <Trash2 className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                How to Request Account & Data Deletion
              </div>
              <p className="text-xs text-amber-950 dark:text-amber-200/90 leading-relaxed">
                You do not need to install the mobile app to request deletion. You can submit a deletion request directly via our web portal:
              </p>
              <div className="pt-2">
                <Link
                  href="/delete-account"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Visit Account & Data Deletion Portal
                </Link>
              </div>
              <p className="text-[11px] text-amber-800 dark:text-amber-300/80 pt-1">
                *Note: Under Nigerian educational regulations, certified academic transcripts and examination history may be archived in cold storage for statutory graduation verification.
              </p>
            </div>
          </section>

          {/* Section 7: Contact Us */}
          <section className="space-y-4 p-6 sm:p-8 rounded-3xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/60 shadow-sm">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">7</span>
              Data Protection Officer & Contact Channels
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your personal information, please reach out to our administration:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-emerald-900/30 border border-slate-200 dark:border-emerald-800/40 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <MapPin className="w-4 h-4 text-emerald-600 dark:text-amber-400" /> Physical Address
                </div>
                <p className="text-slate-600 dark:text-emerald-200">
                  No. 32 Daneji Quarters, Behind Sahad Store, Kano, Nigeria
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-emerald-900/30 border border-slate-200 dark:border-emerald-800/40 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Mail className="w-4 h-4 text-emerald-600 dark:text-amber-400" /> Official Email
                </div>
                <a
                  href="mailto:info@mubkdaneji.com"
                  className="font-mono text-emerald-600 dark:text-amber-300 hover:underline block break-all font-semibold"
                >
                  info@mubkdaneji.com
                </a>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-emerald-900/30 border border-slate-200 dark:border-emerald-800/40 space-y-1">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Phone className="w-4 h-4 text-emerald-600 dark:text-amber-400" /> Phone Contacts
                </div>
                <div className="font-mono text-slate-600 dark:text-emerald-200 space-y-0.5">
                  <p>08167109421 / 09042786093</p>
                  <p>08037966581 / 07085206969</p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
