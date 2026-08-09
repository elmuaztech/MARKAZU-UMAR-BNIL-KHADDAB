'use client';

import React, { useState } from 'react';
import { useApp } from '../../../lib/context';
import { INITIAL_AUDIT_LOGS, AuditEntry } from '../../../lib/audit';
import { ThemeToggle } from '../../../components/navigation/ThemeToggle';
import { Settings, School, Calendar, ShieldCheck, RotateCcw, Upload, Trash2, Image as ImageIcon, Sparkles, CheckCircle2, User, Camera } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { FormField, Input, Select } from '@/components/ui/FormField';

export default function SettingsPage() {
  const { currentSession, schoolLogo, setSchoolLogo, schoolName, setSchoolName, currentUser, setCurrentUser, updateUserAccount, updateUserAvatar, addAuditLog } = useApp();

  const [activeTerm, setActiveTerm] = useState<'Term 1' | 'Term 2' | 'Term 3'>(currentSession.activeTerm);
  const [auditLogs] = useState<AuditEntry[]>(INITIAL_AUDIT_LOGS);
  const [sessionSuccess, setSessionSuccess] = useState(false);
  const [logoNotice, setLogoNotice] = useState('');
  const [profileNotice, setProfileNotice] = useState('');
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [editableSchoolName, setEditableSchoolName] = useState(schoolName);

  // Super Admin Personal Profile Form State
  const [adminName, setAdminName] = useState(currentUser.name || '');
  const [adminEmail, setAdminEmail] = useState(currentUser.email || '');
  const [adminPhone, setAdminPhone] = useState(currentUser.phone || '');
  const [adminAvatar, setAdminAvatar] = useState(currentUser.avatar || '');

  const handleSavePersonalProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminName.trim()) return;

    const updatedName = adminName.trim();
    const updatedEmail = adminEmail.trim();
    const updatedPhone = adminPhone.trim();

    updateUserAccount(currentUser.id, {
      name: updatedName,
      email: updatedEmail,
      phone: updatedPhone,
      avatar: adminAvatar || currentUser.avatar,
    });

    setCurrentUser({
      ...currentUser,
      name: updatedName,
      email: updatedEmail,
      phone: updatedPhone,
      avatar: adminAvatar || currentUser.avatar,
    });

    if (adminAvatar) {
      updateUserAvatar(adminAvatar);
    }

    addAuditLog({
      action: 'ADMIN_PROFILE_UPDATED',
      performedBy: updatedName,
      userRole: currentUser.role,
      details: `Updated personal account profile details (Name: ${updatedName}, Email: ${updatedEmail})`,
      ipAddress: '197.210.227.14',
      affectedRecord: `User/${currentUser.id}`,
      status: 'SUCCESS',
    });

    setProfileNotice('Your personal profile & display name updated successfully! Your updated name will now appear on your welcome banners, sidebar, and dashboards.');
    setTimeout(() => setProfileNotice(''), 4000);
  };

  const handleSaveSchoolName = (e: React.FormEvent) => {
    e.preventDefault();
    setSchoolName(editableSchoolName);
    addAuditLog({
      action: 'SCHOOL_NAME_UPDATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Updated school official name to: ${editableSchoolName}`,
      ipAddress: '197.210.227.14',
      affectedRecord: 'SystemSettings/Name',
      status: 'SUCCESS',
    });
    setLogoNotice('Official School Name updated successfully! It now reflects across all portals, headers, and documents.');
    setTimeout(() => setLogoNotice(''), 4000);
  };

  const handleTermTransition = () => {
    setSessionSuccess(true);
    setTimeout(() => setSessionSuccess(false), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        if (result) {
          setSchoolLogo(result);
          addAuditLog({
            action: 'SCHOOL_LOGO_UPDATED',
            performedBy: currentUser.name,
            userRole: currentUser.role,
            details: 'Updated official school logo image asset',
            ipAddress: '197.210.227.14',
            affectedRecord: 'SystemSettings/Logo',
            status: 'SUCCESS',
          });
          setLogoNotice('Official school logo updated successfully! It will now reflect across all navigation bars, headers, and report cards.');
          setTimeout(() => setLogoNotice(''), 4000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLogoUrl) return;
    setSchoolLogo(customLogoUrl);
    addAuditLog({
      action: 'SCHOOL_LOGO_UPDATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Updated school logo from URL: ${customLogoUrl}`,
      ipAddress: '197.210.227.14',
      affectedRecord: 'SystemSettings/Logo',
      status: 'SUCCESS',
    });
    setLogoNotice('School logo updated from URL successfully!');
    setCustomLogoUrl('');
    setTimeout(() => setLogoNotice(''), 4000);
  };

  const handleRemoveLogo = () => {
    setSchoolLogo(null);
    addAuditLog({
      action: 'SCHOOL_LOGO_REMOVED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: 'Removed official school logo asset (reset to default icon)',
      ipAddress: '197.210.227.14',
      affectedRecord: 'SystemSettings/Logo',
      status: 'SUCCESS',
    });
    setLogoNotice('School logo removed. System reverted to default emblem.');
    setTimeout(() => setLogoNotice(''), 4000);
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-gray-100 selection:bg-emerald-500 selection:text-white">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-3xl bg-gradient-to-r from-[#064E3B] via-[#0F5132] to-[#0284C7] text-white border border-emerald-500/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300 uppercase tracking-widest">
            <Settings className="w-4 h-4" /> Administrative Settings & Controls
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-1">School Profile & Logo Settings</h1>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1">
            Manage official school identity, logo assets, academic sessions, term transitions, and security audit logs.
          </p>
        </div>
      </div>

      {sessionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>Academic session settings updated successfully!</span>
        </div>
      )}

      {profileNotice && (
        <div className="p-4 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
          <span>{profileNotice}</span>
        </div>
      )}

      {/* Super Admin & Administrator Personal Profile Settings */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-emerald-800/40 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
              <User className="w-5 h-5 text-emerald-500" />
              Administrator Personal Profile & Display Name
            </h3>
            <p className="text-xs text-slate-500 dark:text-emerald-300/70 mt-0.5">
              Edit your personal display name, account email, phone number, and avatar photo as it appears on your dashboard welcome banner.
            </p>
          </div>
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase">
            {currentUser.role.replace('_', ' ')}
          </span>
        </div>

        <form onSubmit={handleSavePersonalProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-emerald-300 mb-1">
                Your Full Name (Display Name)
              </label>
              <input
                type="text"
                value={adminName}
                onChange={(e) => setAdminName(e.target.value)}
                placeholder="e.g. Abdullahi Abubakar Sulaiman"
                className="w-full bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-700/60 rounded-xl p-3 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-emerald-300 mb-1">
                Account Email Address
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="e.g. admin@markazuumar.edu.ng"
                className="w-full bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-700/60 rounded-xl p-3 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 text-xs"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-extrabold uppercase text-slate-700 dark:text-emerald-300 mb-1">
                Phone Contact Number
              </label>
              <input
                type="text"
                value={adminPhone}
                onChange={(e) => setAdminPhone(e.target.value)}
                placeholder="e.g. +234 803 123 4567"
                className="w-full bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-700/60 rounded-xl p-3 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>
          </div>

          {/* Avatar Photo Upload & Preview */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-sky-500 p-0.5 flex items-center justify-center shadow-md overflow-hidden shrink-0 border border-emerald-400">
                {currentUser.avatar || adminAvatar ? (
                  <img src={adminAvatar || currentUser.avatar} alt={adminName} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <User className="w-7 h-7 text-white" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Profile Photo Avatar</p>
                <p className="text-[11px] text-slate-500 dark:text-emerald-300/70">Upload a custom profile image from your phone or laptop.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <label className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer flex items-center gap-1.5 shadow-sm transition-all">
                <Camera className="w-4 h-4" />
                <span>Upload Avatar Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (evt) => {
                        const res = evt.target?.result as string;
                        if (res) {
                          setAdminAvatar(res);
                          updateUserAvatar(res);
                        }
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" variant="primary" size="md" className="font-extrabold shadow-lg">
              Save Personal Profile & Name
            </Button>
          </div>
        </form>
      </div>

      {/* Grid: School Identity & Logo Manager */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* School Identity */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-emerald-800/40 pb-2 uppercase tracking-tight">
            <School className="w-4 h-4 text-emerald-500" />
            Official School Profile Info
          </h3>

          <div className="space-y-3 text-xs">
            <form onSubmit={handleSaveSchoolName} className="space-y-2">
              <label className="block text-slate-700 dark:text-emerald-300 font-bold">Official School Name (Editable by Admin)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editableSchoolName}
                  onChange={(e) => setEditableSchoolName(e.target.value)}
                  className="flex-1 bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-700/60 rounded-xl p-2.5 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-emerald-500 text-xs"
                  placeholder="Enter official school name"
                />
                <Button type="submit" variant="primary" size="sm" className="whitespace-nowrap font-bold">
                  Save Name
                </Button>
              </div>
            </form>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 dark:text-emerald-300 font-bold mb-1">Location</label>
                <input
                  type="text"
                  readOnly
                  value="Kano, Nigeria"
                  className="w-full bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-700/60 rounded-xl p-2 text-slate-900 dark:text-white font-semibold"
                />
              </div>
              <div>
                <label className="block text-slate-700 dark:text-emerald-300 font-bold mb-1">Development Partner</label>
                <input
                  type="text"
                  readOnly
                  value="Elmuaz Technologies LTD"
                  className="w-full bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-700/60 rounded-xl p-2 text-emerald-600 dark:text-amber-300 font-bold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Academic Session Controls */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-emerald-800/40 pb-2 uppercase tracking-tight">
            <Calendar className="w-4 h-4 text-emerald-500" />
            Academic Session & Term Controls
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-700 dark:text-emerald-300 font-bold mb-1">Current Academic Session</label>
              <input
                type="text"
                readOnly
                value={currentSession.sessionName}
                className="w-full bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-700/60 rounded-xl p-2 text-slate-900 dark:text-white font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-emerald-300 font-bold mb-1">Active Term Selection</label>
              <select
                value={activeTerm}
                onChange={(e) => setActiveTerm(e.target.value as any)}
                className="w-full bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-700 rounded-xl p-2.5 text-emerald-600 dark:text-amber-300 font-bold focus:outline-none"
              >
                <option value="Term 1">Term 1 (Autumn)</option>
                <option value="Term 2">Term 2 (Spring - Active)</option>
                <option value="Term 3">Term 3 (Summer)</option>
              </select>
            </div>

            <button
              onClick={handleTermTransition}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Advance Academic Term</span>
            </button>
          </div>
        </div>

        {/* School Logo Asset Manager */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-5 md:col-span-2">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-emerald-800/40 pb-2 uppercase tracking-tight">
            <ImageIcon className="w-4 h-4 text-emerald-500" />
            School Logo & Crest Customizer
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            {/* Logo Preview Box */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 flex flex-col items-center justify-center text-center space-y-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Current Logo Preview</span>
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-tr from-emerald-600 to-sky-500 p-1 flex items-center justify-center shadow-xl">
                {schoolLogo ? (
                  <img
                    src={schoolLogo}
                    alt="School Official Logo"
                    className="w-full h-full object-contain rounded-xl bg-white p-1"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-white">
                    <Sparkles className="w-10 h-10" />
                  </div>
                )}
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-emerald-300">
                {schoolLogo ? 'Custom School Logo Active' : 'Default Crest Icon Active'}
              </span>
            </div>

            {/* Logo Controls */}
            <div className="md:col-span-2 space-y-4 text-xs">
              <div className="space-y-2">
                <label className="font-bold text-slate-700 dark:text-gray-200 block">Upload Logo File (PNG, JPG, SVG)</label>
                <div className="flex items-center gap-3">
                  <label className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold cursor-pointer flex items-center gap-2 shadow-md transition-all">
                    <Upload className="w-4 h-4" /> Choose Logo Image
                    <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                  </label>

                  {schoolLogo && (
                    <button
                      onClick={handleRemoveLogo}
                      className="px-4 py-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold border border-rose-500/30 flex items-center gap-2 transition-all"
                    >
                      <Trash2 className="w-4 h-4" /> Remove Logo
                    </button>
                  )}
                </div>
              </div>

              {/* URL Import */}
              <form onSubmit={handleUrlSubmit} className="space-y-2 pt-2 border-t border-slate-100 dark:border-emerald-500/20">
                <label className="font-bold text-slate-700 dark:text-gray-200 block">Or Provide Direct Logo Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customLogoUrl}
                    onChange={(e) => setCustomLogoUrl(e.target.value)}
                    placeholder="https://example.com/logo.png"
                    className="flex-1 px-4 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold shadow-md transition-all"
                  >
                    Save URL
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Display & Light/Dark Theme Switcher */}
        <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4 md:col-span-2">
          <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 border-b border-slate-100 dark:border-emerald-800/40 pb-2 uppercase tracking-tight">
            <Settings className="w-4 h-4 text-emerald-500" />
            System Display & Theme Selection
          </h3>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30">
            <div>
              <p className="text-xs font-bold text-slate-900 dark:text-emerald-100">Light / Dark Theme Mode</p>
              <p className="text-[11px] text-slate-500 dark:text-emerald-300/80">Toggle between Light mode, Dark mode, or System preferences.</p>
            </div>
            <ThemeToggle variant="pill" />
          </div>
        </div>
      </div>

      {/* System Audit Logs Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-3">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-tight">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          System Security & Audit Trail
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-emerald-500/20">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#021810] border-b border-slate-200 dark:border-emerald-500/20 text-slate-700 dark:text-emerald-300 font-bold uppercase text-[10px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Action Event</th>
                <th className="py-3 px-4">Performed By</th>
                <th className="py-3 px-4">Details</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-emerald-500/10">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-emerald-950/40 transition-colors">
                  <td className="py-3 px-4 font-mono text-emerald-600 dark:text-emerald-400 text-[11px]">{log.timestamp}</td>
                  <td className="py-3 px-4">
                    <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded text-[10px] uppercase">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">{log.performedBy}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-emerald-200/90">{log.details}</td>
                  <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
