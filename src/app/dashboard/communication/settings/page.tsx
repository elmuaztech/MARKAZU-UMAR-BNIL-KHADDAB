'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import { Sparkles, Save, ArrowLeft, Mail, MessageSquare, Bell, CheckCircle2 } from 'lucide-react';

export default function CommunicationSettingsPage() {
  const { communicationSettings, updateCommunicationSettings } = useApp();

  const [schoolEmail, setSchoolEmail] = useState(communicationSettings.schoolEmail);
  const [replyToEmail, setReplyToEmail] = useState(communicationSettings.replyToEmail);
  const [schoolWhatsApp, setSchoolWhatsApp] = useState(communicationSettings.schoolWhatsApp);
  const [defaultSignature, setDefaultSignature] = useState(communicationSettings.defaultSignature);
  const [footerText, setFooterText] = useState(communicationSettings.footerText);

  const [savedToast, setSavedToast] = useState(false);

  const handleSave = () => {
    updateCommunicationSettings({
      schoolEmail,
      replyToEmail,
      schoolWhatsApp,
      defaultSignature,
      footerText,
    });
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-8 font-poppins">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/communication"
          className="p-2.5 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-slate-700 dark:text-emerald-300 hover:text-emerald-600 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Communication Settings</h1>
          <p className="text-xs text-slate-500 dark:text-emerald-300/70">Configure sender credentials, email branding, WhatsApp gateways, and signatures</p>
        </div>
      </div>

      <div className="rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 p-6 shadow-xl space-y-6">
        {savedToast && (
          <div className="p-4 rounded-2xl bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Communication settings updated successfully!</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-bold">
          <div>
            <label className="text-[10px] text-slate-500 uppercase">Sender School Email:</label>
            <input
              type="email"
              value={schoolEmail}
              onChange={(e) => setSchoolEmail(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase">Reply-To Email Address:</label>
            <input
              type="email"
              value={replyToEmail}
              onChange={(e) => setReplyToEmail(e.target.value)}
              className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white"
            />
          </div>
        </div>

        <div className="text-xs font-bold">
          <label className="text-[10px] text-slate-500 uppercase">School WhatsApp Phone Gateway:</label>
          <input
            type="text"
            value={schoolWhatsApp}
            onChange={(e) => setSchoolWhatsApp(e.target.value)}
            className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-mono"
          />
        </div>

        <div className="text-xs font-bold">
          <label className="text-[10px] text-slate-500 uppercase">Default Formal Signature:</label>
          <textarea
            rows={3}
            value={defaultSignature}
            onChange={(e) => setDefaultSignature(e.target.value)}
            className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-medium"
          />
        </div>

        <div className="text-xs font-bold">
          <label className="text-[10px] text-slate-500 uppercase">Email & WhatsApp Footer Disclaimer:</label>
          <textarea
            rows={2}
            value={footerText}
            onChange={(e) => setFooterText(e.target.value)}
            className="w-full mt-1 p-3 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-slate-900 dark:text-white font-medium"
          />
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleSave}
            className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg flex items-center gap-2 transition-all hover:scale-105"
          >
            <Save className="w-4 h-4" />
            <span>Save Communication Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}
