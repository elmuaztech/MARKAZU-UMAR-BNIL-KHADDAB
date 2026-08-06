'use client';

import React, { useState } from 'react';
import { useApp } from '../../../lib/context';
import { Calendar, Plus, CheckCircle2, Archive, AlertTriangle, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { SchoolSession } from '../../../types';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Modal } from '@/components/ui/Modal';
import { FormField, Input, Select } from '@/components/ui/FormField';

export default function SessionsPage() {
  const { currentSession, currentUser, addAuditLog } = useApp();

  const [sessionList, setSessionList] = useState<SchoolSession[]>([
    {
      id: 'sess-01',
      sessionName: '1447/1448 AH (2025/2026 AD)',
      activeTerm: 'Term 2',
      isCurrent: true,
    },
    {
      id: 'sess-02',
      sessionName: '1446/1447 AH (2024/2025 AD)',
      activeTerm: 'Term 3',
      isCurrent: false,
    },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [activeTerm, setActiveTerm] = useState<'Term 1' | 'Term 2' | 'Term 3'>('Term 1');
  const [notice, setNotice] = useState('');

  const isAdmin = currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN';

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSessionName) return;

    const newSess: SchoolSession = {
      id: `sess-${Date.now()}`,
      sessionName: newSessionName,
      activeTerm,
      isCurrent: false,
    };

    setSessionList([newSess, ...sessionList]);

    addAuditLog({
      action: 'ACADEMIC_SESSION_CREATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Created new academic session record: ${newSessionName} (${activeTerm})`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Session/${newSess.id}`,
      status: 'SUCCESS',
    });

    setNotice(`Academic Session ${newSessionName} created successfully!`);
    setNewSessionName('');
    setShowAddModal(false);
    setTimeout(() => setNotice(''), 4000);
  };

  const handleActivateSession = (id: string) => {
    setSessionList((prev) =>
      prev.map((s) => ({
        ...s,
        isCurrent: s.id === id,
      }))
    );

    const activated = sessionList.find((s) => s.id === id);

    addAuditLog({
      action: 'ACADEMIC_SESSION_ACTIVATED',
      performedBy: currentUser.name,
      userRole: currentUser.role,
      details: `Activated academic session: ${activated?.sessionName}`,
      ipAddress: '197.210.227.14',
      affectedRecord: `Session/${id}`,
      status: 'SUCCESS',
    });

    setNotice(`Academic session ${activated?.sessionName} is now active school-wide!`);
    setTimeout(() => setNotice(''), 4000);
  };

  return (
    <div className="space-y-6 text-slate-900 dark:text-gray-100 selection:bg-emerald-500 selection:text-white">
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#042f1e] via-[#064e3b] to-[#0284c7] text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-emerald-500/30">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300 uppercase tracking-widest mb-1">
            <Calendar className="w-4 h-4 text-emerald-400" /> Academic Session & Term Control Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">Academic Sessions & Terms</h1>
          <p className="text-xs sm:text-sm text-emerald-100/90 mt-1 max-w-2xl">
            Manage Gregorian & Hijri academic calendars, term activations, examination readiness, and session archiving for Markazu Umar.
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowAddModal(true)}
          >
            Create Academic Session
          </Button>
        )}
      </div>

      {notice && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Active Session Display Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-emerald-500/40 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white tracking-wider">
              Currently Active School Session
            </h3>
          </div>
          <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/30">
            Active School Calendar
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
            <span className="text-[10px] font-bold uppercase block text-emerald-600 dark:text-emerald-400">Academic Year</span>
            <p className="text-lg font-black mt-1">{currentSession.sessionName}</p>
          </div>

          <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-900 dark:text-sky-200">
            <span className="text-[10px] font-bold uppercase block text-sky-600 dark:text-sky-400">Active Term</span>
            <p className="text-lg font-black mt-1">{currentSession.activeTerm}</p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200">
            <span className="text-[10px] font-bold uppercase block text-purple-600 dark:text-purple-400">Examination Status</span>
            <p className="text-lg font-black mt-1">Mid-Term Ongoing</p>
          </div>
        </div>
      </div>

      {/* Academic Sessions Table */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
          All Academic Session Records
        </h3>

        <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-emerald-500/20">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-100 dark:bg-[#021810] border-b border-slate-200 dark:border-emerald-500/20 text-slate-700 dark:text-emerald-300 font-bold uppercase text-[10px]">
                <th className="py-3.5 px-4">Session Name</th>
                <th className="py-3.5 px-4">Active Term</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-emerald-500/10">
              {sessionList.map((s) => (
                <tr key={s.id} className="hover:bg-slate-50 dark:hover:bg-emerald-950/40 transition-all">
                  <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">{s.sessionName}</td>
                  <td className="py-3.5 px-4 text-emerald-600 dark:text-emerald-400 font-semibold">{s.activeTerm}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-0.5 rounded-md font-bold text-[10px] uppercase border ${
                        s.isCurrent
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {s.isCurrent ? 'Active' : 'Archived'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    {!s.isCurrent && isAdmin && (
                      <button
                        onClick={() => handleActivateSession(s.id)}
                        className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow-sm"
                      >
                        Activate Session
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION: ACADEMIC CALENDAR PUBLIC WEBSITE MANAGER */}
      <AcademicCalendarManager />

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Create Academic Session</h3>
                <p className="text-slate-500 dark:text-emerald-300/70">Define new Hijri/Gregorian academic calendar</p>
              </div>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Session Name</label>
                <input
                  type="text"
                  required
                  value={newSessionName}
                  onChange={(e) => setNewSessionName(e.target.value)}
                  placeholder="e.g. 1448/1449 AH (2026/2027 AD)"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Starting Active Term</label>
                <select
                  value={activeTerm}
                  onChange={(e: any) => setActiveTerm(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Term 1">Term 1</option>
                  <option value="Term 2">Term 2</option>
                  <option value="Term 3">Term 3</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all uppercase tracking-wider"
              >
                Create Academic Session
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Subcomponent: Academic Calendar Manager for Public Website
function AcademicCalendarManager() {
  const { academicEvents, addAcademicEvent, updateAcademicEvent, deleteAcademicEvent, currentUser } = useApp();
  const isAdmin = currentUser.role === 'ADMIN' || (currentUser.role as string) === 'SUPER_ADMIN';

  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [term, setTerm] = useState<'Term 1' | 'Term 2' | 'Term 3'>('Term 1');
  const [title, setTitle] = useState('');
  const [badge, setBadge] = useState('');
  const [badgeColor, setBadgeColor] = useState<'emerald' | 'amber' | 'sky' | 'purple'>('emerald');
  const [dates, setDates] = useState('');
  const [description, setDescription] = useState('');

  const openAddModal = () => {
    setEditingId(null);
    setTerm('Term 1');
    setTitle('');
    setBadge('Term 1 (Autumn)');
    setBadgeColor('emerald');
    setDates('Resumption: Sept 15 • Mid-Term: Oct 28 • Exams: Dec 10');
    setDescription('');
    setShowModal(true);
  };

  const openEditModal = (evt: any) => {
    setEditingId(evt.id);
    setTerm(evt.term);
    setTitle(evt.title);
    setBadge(evt.badge);
    setBadgeColor(evt.badgeColor || 'emerald');
    setDates(evt.dates);
    setDescription(evt.description || '');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !dates) return;

    if (editingId) {
      updateAcademicEvent(editingId, {
        term,
        title,
        badge,
        badgeColor,
        dates,
        description,
      });
    } else {
      addAcademicEvent({
        term,
        title,
        badge: badge || term,
        badgeColor,
        dates,
        description,
        isPublished: true,
      });
    }

    setShowModal(false);
  };

  return (
    <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-emerald-500/20 pb-4">
        <div>
          <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">
            Public Website CMS
          </span>
          <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            <span>Academic Calendar Events Manager</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-emerald-300/70 mt-0.5">
            Add, Edit, or Delete public academic calendar events. Changes sync automatically to the public homepage.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={openAddModal}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Event</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        {academicEvents.map((evt) => (
          <div
            key={evt.id}
            className="p-5 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 space-y-3 relative group"
          >
            <div className="flex items-center justify-between gap-2">
              <span
                className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                  evt.badgeColor === 'amber'
                    ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border-amber-500/30'
                    : evt.badgeColor === 'sky'
                    ? 'bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-500/30'
                    : evt.badgeColor === 'purple'
                    ? 'bg-purple-500/20 text-purple-600 dark:text-purple-300 border-purple-500/30'
                    : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                }`}
              >
                {evt.badge}
              </span>

              {isAdmin && (
                <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100">
                  <button
                    onClick={() => openEditModal(evt)}
                    className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 font-bold text-[10px] px-2"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteAcademicEvent(evt.id)}
                    className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-bold text-[10px] px-2"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>

            <h4 className="font-bold text-slate-900 dark:text-white text-sm">{evt.title}</h4>
            <p className="text-slate-600 dark:text-emerald-200/80 font-medium leading-relaxed">{evt.dates}</p>
            {evt.description && (
              <p className="text-[11px] text-slate-500 dark:text-emerald-400/60 border-t border-slate-200 dark:border-emerald-800/40 pt-2">
                {evt.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Add / Edit Event Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-4 shadow-2xl relative text-xs">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {editingId ? 'Edit Academic Event' : 'Add Academic Event'}
                </h3>
                <p className="text-slate-500 dark:text-emerald-300/70">
                  Update dates and info visible on the public website
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-gray-300">Term</label>
                  <select
                    value={term}
                    onChange={(e: any) => setTerm(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="Term 1">Term 1</option>
                    <option value="Term 2">Term 2</option>
                    <option value="Term 3">Term 3</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-gray-300">Badge Color</label>
                  <select
                    value={badgeColor}
                    onChange={(e: any) => setBadgeColor(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white font-semibold"
                  >
                    <option value="emerald">Emerald Green</option>
                    <option value="amber">Amber Gold</option>
                    <option value="sky">Sky Blue</option>
                    <option value="purple">Purple</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Event Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Second Term Session & Ramadan Hifz"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Badge Label</label>
                <input
                  type="text"
                  required
                  value={badge}
                  onChange={(e) => setBadge(e.target.value)}
                  placeholder="e.g. Term 2 (Current)"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Key Dates & Schedule</label>
                <textarea
                  required
                  rows={2}
                  value={dates}
                  onChange={(e) => setDates(e.target.value)}
                  placeholder="e.g. Resumption: Jan 10 • Ramadan Break: Mar 15 • Term Exams: April 20"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-gray-300">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional event highlights..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all uppercase tracking-wider"
              >
                {editingId ? 'Update Event' : 'Publish to Website'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
