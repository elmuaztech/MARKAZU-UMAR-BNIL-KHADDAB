'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import {
  BookOpen,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Award,
  Users,
  Calendar,
  Layers,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  Shield,
  FileSpreadsheet,
  X,
  ExternalLink,
} from 'lucide-react';

interface CandidateItem {
  id: string;
  studentId: string;
  studentName: string;
  studentAdmissionNo: string;
  studentGender: string;
  eventId: string;
  eventName: string;
  durationDays: number;
  studentType: string;
  classId: string;
  className: string;
  teacherId?: string | null;
  teacherName?: string | null;
  examinerId?: string | null;
  examinerName?: string | null;
  ruleSetId: string;
  ruleSetName: string;
  ruleSetVersion: number;
  daysRecorded: number;
  totalMistakes: number;
  status: 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED';
  finalResult: 'PENDING' | 'QUALIFIED' | 'DISQUALIFIED';
  disqualificationReason?: string | null;
  disqualificationMistakes?: number | null;
  disqualificationThreshold?: number | null;
  disqualifiedOnDay?: number | null;
  disqualifiedDate?: string | null;
  createdAt: string;
}

interface EventItem {
  id: string;
  name: string;
  status: string;
  durationDays: number;
  academicSession?: { sessionName: string } | null;
  ruleSet?: { name: string; version: number } | null;
  candidatesCount: number;
}

export default function QuranAssessmentDashboardPage() {
  const { currentUser, students, classes, notify } = useApp();

  const [candidates, setCandidates] = useState<CandidateItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [metrics, setMetrics] = useState({
    totalCandidates: 0,
    inProgress: 0,
    completed: 0,
    qualified: 0,
    disqualified: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedStudentType, setSelectedStudentType] = useState<string>('ALL');
  const [selectedResult, setSelectedResult] = useState<string>('ALL');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showCreateEventModal, setShowCreateEventModal] = useState(false);
  const [submittingAction, setSubmittingAction] = useState(false);

  // Register Form State
  const [regStudentId, setRegStudentId] = useState('');
  const [regEventId, setRegEventId] = useState('');
  const [regStudentType, setRegStudentType] = useState('Masu Biye');
  const [regExaminerName, setRegExaminerName] = useState('');
  const [regNotes, setRegNotes] = useState('');

  // New Event Form State
  const [newEventName, setNewEventName] = useState('');
  const [newEventDays, setNewEventDays] = useState(30);

  const fetchEvents = async () => {
    try {
      const res = await fetch('/api/quran-assessment/events');
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
        if (data.events && data.events.length > 0 && !selectedEventId) {
          // Default to first active or latest event
          const activeEvent = data.events.find((e: EventItem) => e.status === 'ACTIVE') || data.events[0];
          setSelectedEventId(activeEvent.id);
          setRegEventId(activeEvent.id);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCandidates = async () => {
    try {
      setRefreshing(true);
      const params = new URLSearchParams();
      if (selectedEventId) params.append('eventId', selectedEventId);
      if (selectedStudentType !== 'ALL') params.append('studentType', selectedStudentType);
      if (selectedResult !== 'ALL') params.append('result', selectedResult);
      if (selectedClassId !== 'ALL') params.append('classId', selectedClassId);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());

      const res = await fetch(`/api/quran-assessment/candidates?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
        setMetrics(data.metrics || {
          totalCandidates: 0,
          inProgress: 0,
          completed: 0,
          qualified: 0,
          disqualified: 0,
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    fetchCandidates();
  }, [selectedEventId, selectedStudentType, selectedResult, selectedClassId]);

  // Handle register candidate
  const handleRegisterCandidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regStudentId || !regEventId) {
      notify({ type: 'error', title: 'Validation Error', message: 'Please select a student and assessment event.' });
      return;
    }

    try {
      setSubmittingAction(true);
      const res = await fetch('/api/quran-assessment/candidates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: regStudentId,
          eventId: regEventId,
          studentType: regStudentType,
          examinerName: regExaminerName.trim() || currentUser.name,
          notes: regNotes.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enroll candidate');

      notify({ type: 'success', title: 'Candidate Enrolled', message: data.message });
      setShowRegisterModal(false);
      setRegStudentId('');
      setRegNotes('');
      await fetchCandidates();
      await fetchEvents();
    } catch (err: any) {
      notify({ type: 'error', title: 'Registration Failed', message: err.message });
    } finally {
      setSubmittingAction(false);
    }
  };

  // Handle create event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventName.trim()) {
      notify({ type: 'error', title: 'Validation Error', message: 'Event name is required.' });
      return;
    }

    try {
      setSubmittingAction(true);
      const res = await fetch('/api/quran-assessment/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newEventName.trim(),
          durationDays: newEventDays,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create assessment event');

      notify({ type: 'success', title: 'Event Created', message: data.message });
      setShowCreateEventModal(false);
      setNewEventName('');
      await fetchEvents();
      if (data.event?.id) {
        setSelectedEventId(data.event.id);
      }
    } catch (err: any) {
      notify({ type: 'error', title: 'Creation Failed', message: err.message });
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCandidates();
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Banner */}
      <div className="bg-emerald-900 dark:bg-emerald-950 text-white p-5 sm:p-6 rounded-2xl shadow-sm border border-emerald-800 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs sm:text-sm font-medium mb-1">
            <span>Markazu Umar bn Al-Khattab</span>
            <span>•</span>
            <span>Qur’an Memorization Assessment</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 font-poppins">
            <BookOpen className="w-6 h-6 text-emerald-400" />
            Qur’an Assessment Portal
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 max-w-2xl">
            Physical Hausa assessment forms digitised directly into authoritative PostgreSQL records. Disqualification and qualification are automatically calculated by the rule engine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
            <Link
              href="/dashboard/settings/quran-rules"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 transition"
            >
              <Shield className="w-4 h-4 text-emerald-300" /> Assessment Rules
            </Link>
          )}

          {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN' || currentUser.role === 'HEADMASTER') && (
            <button
              onClick={() => setShowRegisterModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-sm transition"
            >
              <Plus className="w-4 h-4" /> Enroll Candidate
            </button>
          )}

          {(currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN') && (
            <button
              onClick={() => setShowCreateEventModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 transition"
            >
              <Calendar className="w-4 h-4" /> New Event
            </button>
          )}

          <button
            onClick={fetchCandidates}
            disabled={refreshing}
            className="p-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Total Candidates</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-poppins">
            {metrics.totalCandidates}
          </div>
          <span className="text-[11px] text-slate-400">Enrolled for assessment</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">In Progress</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-poppins">
            {metrics.inProgress}
          </div>
          <span className="text-[11px] text-slate-400">Recording daily scores</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 font-poppins">
            {metrics.completed}
          </div>
          <span className="text-[11px] text-slate-400">Officially verified & sealed</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Qualified</span>
            <Award className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-poppins">
            {metrics.qualified}
          </div>
          <span className="text-[11px] text-slate-400">Within error thresholds</span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Disqualified</span>
            <XCircle className="w-4 h-4 text-red-600" />
          </div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 font-poppins">
            {metrics.disqualified}
          </div>
          <span className="text-[11px] text-slate-400">Threshold exceeded</span>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Event Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" /> Event:
            </span>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name} ({ev.durationDays} Days)
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate name or admission number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition"
            >
              Search
            </button>
          </form>
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <span className="text-slate-400 font-medium">Quick Filters:</span>

          {/* Student Type */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 px-1 font-semibold">Type:</span>
            {['ALL', 'Masu Biye', 'Masu Haddah'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedStudentType(type)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  selectedStudentType === type
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Result Filter */}
          <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/60 p-1 rounded-lg border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 px-1 font-semibold">Result:</span>
            {['ALL', 'QUALIFIED', 'DISQUALIFIED', 'PENDING'].map((res) => (
              <button
                key={res}
                onClick={() => setSelectedResult(res)}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold transition ${
                  selectedResult === res
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {res}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Candidate List / Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Enrolled Candidates ({candidates.length})
          </h2>
          <span className="text-xs text-slate-400">Click any candidate to open the 30-day physical form entry</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-slate-500">Loading candidate assessments...</div>
        ) : candidates.length === 0 ? (
          <div className="py-12 text-center text-sm text-slate-500 space-y-2">
            <BookOpen className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="font-medium text-slate-600 dark:text-slate-400">No candidates match your current filter.</p>
            <button
              onClick={() => setShowRegisterModal(true)}
              className="mt-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition"
            >
              Enroll a Student
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 sm:px-4 font-bold">Candidate</th>
                  <th className="py-3 px-3 sm:px-4 font-bold">Class</th>
                  <th className="py-3 px-3 sm:px-4 font-bold">Type</th>
                  <th className="py-3 px-3 sm:px-4 font-bold">Progress</th>
                  <th className="py-3 px-3 sm:px-4 font-bold">Mistakes</th>
                  <th className="py-3 px-3 sm:px-4 font-bold">Result</th>
                  <th className="py-3 px-3 sm:px-4 font-bold">Status</th>
                  <th className="py-3 px-3 sm:px-4 font-bold">Examiner</th>
                  <th className="py-3 px-3 sm:px-4 font-bold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {candidates.map((c) => {
                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition group cursor-pointer"
                      onClick={() => (window.location.href = `/dashboard/quran-assessment/${c.id}`)}
                    >
                      <td className="py-3 px-3 sm:px-4">
                        <div className="font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition">
                          {c.studentName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">{c.studentAdmissionNo}</div>
                      </td>

                      <td className="py-3 px-3 sm:px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {c.className}
                      </td>

                      <td className="py-3 px-3 sm:px-4">
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {c.studentType}
                        </span>
                      </td>

                      <td className="py-3 px-3 sm:px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-700 dark:text-slate-200">
                            {c.daysRecorded} / {c.durationDays}
                          </span>
                          <span className="text-[10px] text-slate-400">days</span>
                        </div>
                      </td>

                      <td className="py-3 px-3 sm:px-4">
                        <span className="font-bold text-slate-900 dark:text-white">{c.totalMistakes}</span>
                      </td>

                      <td className="py-3 px-3 sm:px-4">
                        {c.finalResult === 'QUALIFIED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                            <CheckCircle2 className="w-3 h-3" /> QUALIFIED
                          </span>
                        ) : c.finalResult === 'DISQUALIFIED' ? (
                          <div className="inline-flex flex-col">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300 border border-red-300 dark:border-red-700">
                              <XCircle className="w-3 h-3" /> DISQUALIFIED
                            </span>
                            {c.disqualificationReason && (
                              <span className="text-[10px] text-red-600 dark:text-red-400 mt-0.5 font-medium">
                                {c.disqualificationReason} ({c.disqualificationMistakes}/{c.disqualificationThreshold} Day {c.disqualifiedOnDay})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3" /> PENDING
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 sm:px-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {c.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 sm:px-4 text-slate-600 dark:text-slate-400 text-xs">
                        {c.examinerName || c.teacherName || '—'}
                      </td>

                      <td className="py-3 px-3 sm:px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <Link
                          href={`/dashboard/quran-assessment/${c.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
                        >
                          Enter Data <ChevronRight className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Register Candidate */}
      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" /> Enroll Existing Markazu Student
              </h3>
              <button onClick={() => setShowRegisterModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRegisterCandidate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Select Student (From Markazu Database) *
                </label>
                <select
                  required
                  value={regStudentId}
                  onChange={(e) => setRegStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.fullName} ({s.admissionNo}) — Class: {s.className || 'Class'}
                    </option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Students are selected strictly from the existing student records to prevent duplicates.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Assessment Event *
                </label>
                <select
                  required
                  value={regEventId}
                  onChange={(e) => setRegEventId(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name} ({ev.durationDays} Days)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Student Assessment Type *
                </label>
                <select
                  required
                  value={regStudentType}
                  onChange={(e) => setRegStudentType(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Masu Biye">Masu Biye (Reading / Guided)</option>
                  <option value="Masu Haddah">Masu Haddah (Full Memorization)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Examiner Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ustaz Muhammad, Malama Aisha..."
                  value={regExaminerName}
                  onChange={(e) => setRegExaminerName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Notes / Observations
                </label>
                <textarea
                  rows={2}
                  placeholder="Optional notes or registration details..."
                  value={regNotes}
                  onChange={(e) => setRegNotes(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50"
                >
                  {submittingAction ? 'Enrolling...' : 'Enroll Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Create Event */}
      {showCreateEventModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-600" /> Create Assessment Event
              </h3>
              <button onClick={() => setShowCreateEventModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Markazu Qur'an Assessment 2026"
                  value={newEventName}
                  onChange={(e) => setNewEventName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Duration (Days) *
                </label>
                <input
                  type="number"
                  min="1"
                  max="365"
                  required
                  value={newEventDays}
                  onChange={(e) => setNewEventDays(parseInt(e.target.value, 10) || 30)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Configurable assessment duration (default 30 days based on the physical Hausa form).
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateEventModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAction}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50"
                >
                  {submittingAction ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
