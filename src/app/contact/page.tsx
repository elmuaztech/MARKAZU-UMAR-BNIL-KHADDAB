'use client';

import React, { useState } from 'react';
import { PublicNavbar } from '../../components/navigation/PublicNavbar';
import { PublicFooter } from '../../components/navigation/PublicFooter';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, Sparkles, Building, ShieldCheck } from 'lucide-react';

export default function ContactPage() {
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'Admission Inquiry',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setFormData({ name: '', email: '', phone: '', subject: 'Admission Inquiry', message: '' });
    }, 4000);
  };

  return (
    <div className="min-h-screen bg-[#f4f8f5] dark:bg-[#031c13] text-slate-900 dark:text-white flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <PublicNavbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-12 md:py-16 space-y-16">
        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-500/40 text-emerald-900 dark:text-amber-300 font-semibold text-xs shadow-inner">
            <Mail className="w-4 h-4 text-emerald-600 dark:text-amber-400" /> Get In Touch With Us
          </div>

          <h1 className="font-arabic font-bold text-2xl md:text-3xl text-emerald-700 dark:text-amber-300">
            تواصل معنا — Contact Administration
          </h1>

          <h2 className="text-3xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white">
            We Are Here To Assist <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-600 dark:from-emerald-400 dark:via-emerald-200 dark:to-amber-300">
              Parents, Guardians & Visitors
            </span>
          </h2>

          <p className="text-sm text-slate-600 dark:text-emerald-100/80 max-w-xl mx-auto">
            Have questions about student admission, Tahfiz halqa placement, or campus visit? Reach out via phone, email, or visit our administration office.
          </p>
        </div>

        {/* Contact Grid: Details + Contact Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left 5 Cols: Official Contact Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-3xl glass-card border border-emerald-500/30 space-y-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white border-b border-emerald-200 dark:border-emerald-800/60 pb-3">
                Official School Contacts
              </h3>

              {/* Address */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/30 shrink-0">
                  <MapPin className="w-6 h-6" />
                </div>
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-slate-900 dark:text-amber-300 uppercase tracking-wider block">Campus Address</span>
                  <p className="text-slate-700 dark:text-emerald-100/90 leading-relaxed">
                    No. 32 Daneji Quarters, <br />
                    Behind Sahad Store, <br />
                    Kano, Nigeria.
                  </p>
                </div>
              </div>

              {/* Phone Numbers */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30 shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div className="space-y-1.5 text-xs">
                  <span className="font-bold text-slate-900 dark:text-amber-300 uppercase tracking-wider block">Official Phone Numbers</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-mono text-[11px] text-emerald-700 dark:text-emerald-300 font-bold">
                    <a href="tel:08167109421" className="p-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800/60 hover:text-amber-500">08167109421</a>
                    <a href="tel:09042786093" className="p-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800/60 hover:text-amber-500">09042786093</a>
                    <a href="tel:08037966581" className="p-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800/60 hover:text-amber-500">08037966581</a>
                    <a href="tel:07085206969" className="p-2 rounded-xl bg-emerald-100/70 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800/60 hover:text-amber-500">07085206969</a>
                  </div>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-sky-500/20 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/30 shrink-0">
                  <Mail className="w-6 h-6" />
                </div>
                <div className="space-y-1 text-xs">
                  <span className="font-bold text-slate-900 dark:text-amber-300 uppercase tracking-wider block">Official Email</span>
                  <a
                    href="mailto:markazuumarbnkhaddabdaneji@gmail.com"
                    className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline block break-all"
                  >
                    markazuumarbnkhaddabdaneji@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Right 7 Cols: Interactive Contact Form */}
          <div className="lg:col-span-7">
            <div className="p-8 rounded-3xl bg-white dark:bg-[#032417] border border-emerald-200 dark:border-emerald-500/30 shadow-2xl space-y-6">
              <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight border-b border-emerald-200 dark:border-emerald-800/60 pb-3">
                Send Us a Direct Message
              </h3>

              {formSubmitted && (
                <div className="p-4 rounded-2xl bg-emerald-100 dark:bg-emerald-900/60 border border-emerald-400 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>Thank you! Your message has been submitted to Markazu Umar Administration. We will respond promptly.</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-emerald-200 font-bold mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Alhaji Abubakar Usman"
                      className="w-full bg-emerald-50/60 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-emerald-200 font-bold mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="08012345678"
                      className="w-full bg-emerald-50/60 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-700 dark:text-emerald-200 font-bold mb-1">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="your.email@gmail.com"
                      className="w-full bg-emerald-50/60 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-emerald-200 font-bold mb-1">Inquiry Subject</label>
                    <select
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      className="w-full bg-emerald-50/60 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 rounded-xl px-4 py-3 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                    >
                      <option value="Admission Inquiry">Student Admission Inquiry</option>
                      <option value="Tahfiz Halqa Inquiry">30-Juz Tahfiz Halqa Placement</option>
                      <option value="Enrollment Inquiry">Enrollment & Registration Inquiry</option>
                      <option value="General Inquiry">General School Inquiry</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-emerald-200 font-bold mb-1">Your Message / Question *</label>
                  <textarea
                    rows={5}
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Write your message or inquiry here..."
                    className="w-full bg-emerald-50/60 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800/60 rounded-xl p-4 text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all scale-[1.01]"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Message to Administration</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Google Map Location Placeholder */}
        <div className="p-8 rounded-3xl glass-card border border-emerald-500/30 space-y-4">
          <div className="flex items-center gap-3">
            <Building className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-xl font-black text-slate-900 dark:text-white">
              Campus Location Map — Daneji Quarters, Kano
            </h3>
          </div>

          <div className="w-full h-64 rounded-2xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center relative overflow-hidden text-center p-6">
            <div className="space-y-2">
              <MapPin className="w-10 h-10 text-amber-400 mx-auto animate-bounce" />
              <h4 className="font-bold text-white text-sm">Markazu Umar bn Khattab Tahfiz School</h4>
              <p className="text-xs text-emerald-300">No. 32 Daneji Quarters, Behind Sahad Store, Kano, Nigeria</p>
              <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                Coordinates: 11.9964° N, 8.5167° E (Kano Central)
              </span>
            </div>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
