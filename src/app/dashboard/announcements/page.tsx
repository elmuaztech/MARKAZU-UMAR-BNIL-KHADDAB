'use client';

import React, { useState } from 'react';
import { useApp } from '../../../lib/context';
import { Bell, PlusCircle, Pin, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';

export default function AnnouncementsPage() {
  const { announcements, programmes, addAnnouncement, currentUser } = useApp();
  const [showModal, setShowModal] = useState(false);

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'ACADEMIC' | 'TAHFIZ' | 'GENERAL' | 'URGENT'>('GENERAL');
  const [targetRole, setTargetRole] = useState<'ALL' | 'TEACHERS' | 'PARENTS' | 'STUDENTS'>('ALL');
  const [targetProgrammeId, setTargetProgrammeId] = useState('ALL');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetProg = programmes.find((p) => p.id === targetProgrammeId);

    addAnnouncement({
      title,
      content,
      date: new Date().toISOString().split('T')[0],
      category,
      targetRole,
      targetAudienceType: targetProgrammeId === 'ALL' ? 'ALL_SCHOOL' : 'PROGRAMME',
      programmeId: targetProgrammeId === 'ALL' ? undefined : targetProgrammeId,
      programmeName: targetProgrammeId === 'ALL' ? undefined : targetProg?.programme_name,
      author: currentUser.name,
      pinned: false,
    });
    setShowModal(false);
    setTitle('');
    setContent('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-[#064E3B] via-[#0F5132] to-[#0284C7] text-white border border-emerald-500/30 shadow-xl">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-300 uppercase tracking-widest">
            <Bell className="w-4 h-4" /> Upgraded Module
          </div>
          <h1 className="text-2xl font-black tracking-tight mt-1">Official Announcements & Communication Hub</h1>
          <p className="text-xs text-emerald-100 mt-1">
            Access the full Enterprise Communication Center for multi-channel dispatches, report sheet delivery, smart parent grouping, and delivery analytics.
          </p>
        </div>

        <a
          href="/dashboard/communication"
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-emerald-900/50 transition-all scale-105"
        >
          <Megaphone className="w-4 h-4" />
          <span>Open Communication Center</span>
        </a>
      </div>

      {/* Announcements List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {announcements.map((ann) => (
          <div key={ann.id} className="p-5 rounded-2xl glass-card border border-emerald-500/30 space-y-3 relative">
            {ann.pinned && (
              <div className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
                <Pin className="w-3 h-3" /> Pinned Notice
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded border border-emerald-500/30">
                {ann.category}
              </span>
              <span className="text-[10px] font-bold uppercase text-sky-300 bg-sky-500/20 px-2 py-0.5 rounded border border-sky-500/30">
                Audience: {ann.targetRole}
              </span>
            </div>

            <h3 className="text-sm font-bold text-white">{ann.title}</h3>
            <p className="text-xs text-emerald-200/90 leading-relaxed">{ann.content}</p>

            <div className="pt-3 border-t border-emerald-800/40 flex items-center justify-between text-[11px] text-emerald-400/80 font-mono">
              <span>By {ann.author}</span>
              <span>{ann.date}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Publish Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#032417] border border-emerald-500/40 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl text-white">
            <div className="flex items-center justify-between border-b border-emerald-800/60 pb-3">
              <h3 className="text-base font-bold flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-emerald-400" /> Publish New Notice
              </h3>
              <button onClick={() => setShowModal(false)} className="text-emerald-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-emerald-300 font-semibold mb-1">Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramadan School Hours Notice"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-emerald-950 border border-emerald-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-emerald-300 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-emerald-950 border border-emerald-700 rounded-xl p-2 text-white"
                  >
                    <option value="GENERAL">General</option>
                    <option value="TAHFIZ">Tahfiz</option>
                    <option value="ACADEMIC">Academic</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-emerald-300 font-semibold mb-1">Target Audience</label>
                  <select
                    value={targetRole}
                    onChange={(e) => setTargetRole(e.target.value as any)}
                    className="w-full bg-emerald-950 border border-emerald-700 rounded-xl p-2 text-white"
                  >
                    <option value="ALL">All Users</option>
                    <option value="PARENTS">Parents Only</option>
                    <option value="TEACHERS">Teachers Only</option>
                    <option value="STUDENTS">Students Only</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-emerald-300 font-semibold mb-1">Target Programme</label>
                <select
                  value={targetProgrammeId}
                  onChange={(e) => setTargetProgrammeId(e.target.value)}
                  className="w-full bg-emerald-950 border border-emerald-700 rounded-xl p-2 text-white font-bold"
                >
                  <option value="ALL">All Programmes (School-wide)</option>
                  {programmes.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.programme_name} ({p.programme_code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-emerald-300 font-semibold mb-1">Notice Body / Message</label>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-emerald-950 border border-emerald-700 rounded-xl p-2.5 text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-800/60">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl bg-emerald-900/60 text-emerald-300 hover:bg-emerald-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold"
                >
                  Publish Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
