'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { PublicNavbar } from '../../components/navigation/PublicNavbar';
import { PublicFooter } from '../../components/navigation/PublicFooter';
import {
  Trash2,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  ArrowRight,
  Send,
  Loader2,
} from 'lucide-react';

export default function DeleteAccountPage() {
  const [formData, setFormData] = useState({
    identifier: '',
    role: 'PARENT',
    reason: '',
    confirmed: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string; ticketId?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.identifier.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter your registered Email, Username, or Student ID.' });
      return;
    }
    if (!formData.confirmed) {
      setStatusMessage({ type: 'error', text: 'You must confirm that you understand the data deletion consequences.' });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/auth/delete-account-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit request.');
      }

      setStatusMessage({
        type: 'success',
        text: data.message || 'Your account and data erasure request has been formally recorded.',
        ticketId: data.ticketId,
      });
      setFormData({
        identifier: '',
        role: 'PARENT',
        reason: '',
        confirmed: false,
      });
    } catch (err: any) {
      setStatusMessage({ type: 'error', text: err.message || 'Network error occurred. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f8f5] dark:bg-[#031c13] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <PublicNavbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-12">
        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-600/40 text-rose-800 dark:text-rose-300 font-semibold text-xs shadow-inner">
            <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            Google Play Data Safety & NDPA Compliance
          </div>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            Account & Data Deletion
          </h1>

          <p dir="rtl" lang="ar" className="font-arabic text-xl font-bold text-emerald-700 dark:text-amber-300">
            طلب حذف الحساب والبيانات الشخصية
          </p>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-emerald-100/80 leading-relaxed">
            In accordance with Google Play's User Data policy and the Nigeria Data Protection Act (NDPA 2023), you may request the deletion of your account, login credentials, and associated personal information.
          </p>
        </div>

        {/* Informational Guidance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/60 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              What Data Will Be Deleted
            </h3>
            <ul className="text-xs space-y-2 list-disc pl-4 text-slate-600 dark:text-emerald-100/80">
              <li>Your user login credentials (username, email, salted password hash).</li>
              <li>Active sessions, device tokens, and push notification registrations.</li>
              <li>Personal phone numbers, avatar images, and emergency contact details.</li>
              <li>Direct messages and non-academic correspondence.</li>
            </ul>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-emerald-950/40 border border-slate-200 dark:border-emerald-800/60 shadow-sm space-y-3">
            <h3 className="font-bold text-sm text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              Statutory Educational Records Retained
            </h3>
            <p className="text-xs text-slate-600 dark:text-emerald-100/80 leading-relaxed">
              Under Nigerian educational guidelines and Ministry curriculum regulations, certain official academic records cannot be instantly purged:
            </p>
            <ul className="text-xs space-y-1 list-disc pl-4 text-slate-600 dark:text-emerald-100/80">
              <li>Certified examination marks and graduation registers.</li>
              <li>Past tuition transaction receipts for financial audit compliance.</li>
            </ul>
            <p className="text-[11px] text-slate-500 dark:text-emerald-300/70 pt-1">
              Such records are archived in secure, restricted cold-storage inaccessible to public portals.
            </p>
          </div>
        </div>

        {/* Deletion Request Form */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-emerald-950/60 border border-slate-200 dark:border-emerald-700/50 shadow-lg space-y-6">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-500" />
              Submit Account & Data Erasure Request
            </h2>
            <p className="text-xs text-slate-600 dark:text-emerald-200/80 mt-1">
              You do not need to install or log in to the mobile app to submit this form. Once submitted, our data administration team will verify and execute the request within 30 days.
            </p>
          </div>

          {statusMessage && (
            <div
              className={`p-4 rounded-2xl text-xs space-y-1 ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-600 text-emerald-900 dark:text-emerald-100'
                  : 'bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-600 text-rose-900 dark:text-rose-100'
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                )}
                {statusMessage.type === 'success' ? 'Request Registered' : 'Submission Error'}
              </div>
              <p>{statusMessage.text}</p>
              {statusMessage.ticketId && (
                <div className="pt-2 font-mono text-[11px] text-emerald-700 dark:text-amber-300">
                  Tracking Ticket ID: <strong>{statusMessage.ticketId}</strong>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-emerald-100">
                  Registered Identifier <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. parent@email.com, username, or Admission No."
                  value={formData.identifier}
                  onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-800 bg-slate-50 dark:bg-emerald-900/30 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-800 dark:text-emerald-100">
                  Your Relationship / Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-800 bg-slate-50 dark:bg-emerald-900/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="PARENT">Parent / Legal Guardian</option>
                  <option value="STUDENT">Student (Self / Adult)</option>
                  <option value="TEACHER">Former Teacher / Academic Staff</option>
                  <option value="APPLICANT">Admission Applicant</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-slate-800 dark:text-emerald-100">
                Reason for Deletion (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="Please let us know why you are requesting account closure (e.g. child transferred school, graduated, no longer using portal)..."
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 dark:border-emerald-800 bg-slate-50 dark:bg-emerald-900/30 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-emerald-900/20 border border-slate-200 dark:border-emerald-800/40">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  required
                  checked={formData.confirmed}
                  onChange={(e) => setFormData({ ...formData, confirmed: e.target.checked })}
                  className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-slate-700 dark:text-emerald-200 leading-snug">
                  I confirm that I am the authorized account holder or legal guardian. I understand that account deletion is permanent and will disable access to student reports and online services.
                </span>
              </label>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-all disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Submitting Request...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Deletion Request</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Timeline & Assistance */}
        <div className="p-6 rounded-3xl bg-slate-100 dark:bg-emerald-950/30 border border-slate-200 dark:border-emerald-800/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="font-bold text-slate-900 dark:text-white">
                Standard Deletion Processing Window: Up to 30 Days
              </p>
              <p className="text-slate-600 dark:text-emerald-300">
                You will receive email confirmation once your data removal has been verified.
              </p>
            </div>
          </div>

          <Link
            href="/privacy"
            className="text-emerald-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-semibold shrink-0"
          >
            <span>Review Full Privacy Policy</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
