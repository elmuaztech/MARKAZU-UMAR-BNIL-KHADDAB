'use client';

import React, { useState } from 'react';
import { useApp } from '../../lib/context';
import { Search, User, UserCheck, GraduationCap, BookOpen, Bell, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';

export function CommandCenterSearch() {
  const { students, teachers, parents, classes, announcements } = useApp();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const cleanQuery = query.trim().toLowerCase();

  const filteredStudents = cleanQuery
    ? students.filter((s) => s.fullName.toLowerCase().includes(cleanQuery) || s.admissionNo.toLowerCase().includes(cleanQuery) || s.className.toLowerCase().includes(cleanQuery)).slice(0, 4)
    : [];

  const filteredTeachers = cleanQuery
    ? teachers.filter((t) => t.fullName.toLowerCase().includes(cleanQuery) || t.staffNo.toLowerCase().includes(cleanQuery) || t.email.toLowerCase().includes(cleanQuery)).slice(0, 4)
    : [];

  const filteredParents = cleanQuery
    ? parents.filter((p) => p.fullName.toLowerCase().includes(cleanQuery) || p.email.toLowerCase().includes(cleanQuery) || p.phone.includes(cleanQuery)).slice(0, 3)
    : [];

  const filteredClasses = cleanQuery
    ? classes.filter((c) => c.name.toLowerCase().includes(cleanQuery) || c.category.toLowerCase().includes(cleanQuery)).slice(0, 3)
    : [];

  const filteredAnnouncements = cleanQuery
    ? announcements.filter((a) => a.title.toLowerCase().includes(cleanQuery) || a.content.toLowerCase().includes(cleanQuery)).slice(0, 3)
    : [];

  const totalResults =
    filteredStudents.length +
    filteredTeachers.length +
    filteredParents.length +
    filteredClasses.length +
    filteredAnnouncements.length;

  return (
    <div className="relative w-full max-w-xl">
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400 dark:text-emerald-400/80" />
        <input
          type="text"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder="Global Command Search (Search students, teachers, parents, classes, announcements...)"
          className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-emerald-400/50 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && query.trim().length > 0 && (
        <div className="absolute top-12 left-0 right-0 z-50 bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 rounded-2xl shadow-2xl p-4 max-h-[420px] overflow-y-auto space-y-4 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-emerald-500/20">
            <span className="font-bold text-slate-700 dark:text-emerald-300">Search Results ({totalResults})</span>
            <button onClick={() => setIsOpen(false)} className="text-[11px] text-slate-400 hover:underline">
              Close
            </button>
          </div>

          {totalResults === 0 ? (
            <div className="text-center py-6 text-slate-500 dark:text-emerald-400/70">
              No matching records found for "<span className="font-semibold">{query}</span>"
            </div>
          ) : (
            <>
              {/* Students */}
              {filteredStudents.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                    <GraduationCap className="w-3.5 h-3.5" /> Students ({filteredStudents.length})
                  </div>
                  <div className="space-y-1">
                    {filteredStudents.map((s) => (
                      <Link
                        key={s.id}
                        href="/dashboard/students"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-emerald-950/40 hover:bg-emerald-50 dark:hover:bg-emerald-900/40 transition-all border border-slate-200 dark:border-emerald-500/20"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{s.fullName}</p>
                          <p className="text-[10px] text-slate-500 dark:text-emerald-300/70">Admission: {s.admissionNo} • Class: {s.className}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-500" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Teachers */}
              {filteredTeachers.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                    <UserCheck className="w-3.5 h-3.5" /> Teachers ({filteredTeachers.length})
                  </div>
                  <div className="space-y-1">
                    {filteredTeachers.map((t) => (
                      <Link
                        key={t.id}
                        href="/dashboard/classes"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-sky-950/40 hover:bg-sky-50 dark:hover:bg-sky-900/40 transition-all border border-slate-200 dark:border-sky-500/20"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{t.fullName}</p>
                          <p className="text-[10px] text-slate-500 dark:text-sky-300/70">Staff: {t.staffNo} • Email: {t.email}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-sky-500" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Classes */}
              {filteredClasses.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider">
                    <BookOpen className="w-3.5 h-3.5" /> School Classes ({filteredClasses.length})
                  </div>
                  <div className="space-y-1">
                    {filteredClasses.map((c) => (
                      <Link
                        key={c.id}
                        href="/dashboard/classes"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-purple-950/40 hover:bg-purple-50 dark:hover:bg-purple-900/40 transition-all border border-slate-200 dark:border-purple-500/20"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                          <p className="text-[10px] text-slate-500 dark:text-purple-300/70">Category: {c.category} • Section: {c.section}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-purple-500" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Announcements */}
              {filteredAnnouncements.length > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    <Bell className="w-3.5 h-3.5" /> Announcements ({filteredAnnouncements.length})
                  </div>
                  <div className="space-y-1">
                    {filteredAnnouncements.map((a) => (
                      <Link
                        key={a.id}
                        href="/dashboard/announcements"
                        onClick={() => setIsOpen(false)}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-amber-950/40 hover:bg-amber-50 dark:hover:bg-amber-900/40 transition-all border border-slate-200 dark:border-amber-500/20"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{a.title}</p>
                          <p className="text-[10px] text-slate-500 dark:text-amber-300/70">{a.date} • Target: {a.targetRole}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-500" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
