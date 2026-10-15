'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/context';
import { PortalTheme } from '@/components/ui/PortalTheme';
import { PortalHeroBanner } from '@/components/ui/PortalHeroBanner';
import { StudentCertificate, CertificateData } from '@/components/certificates/StudentCertificate';
import {
  Award,
  GraduationCap,
  Users,
  Search,
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Loader2,
  FileText,
  User,
} from 'lucide-react';

export default function CertificatesPage() {
  const { currentUser, students } = useApp();

  const isStudent = currentUser.role === 'STUDENT';
  const isParent = currentUser.role === 'PARENT';
  const isStaff =
    currentUser.role === 'SUPER_ADMIN' ||
    currentUser.role === 'ADMIN' ||
    currentUser.role === 'HEADMASTER' ||
    currentUser.role === 'TEACHER';

  // Parent wards
  const parentWards = React.useMemo(() => {
    if (!isParent) return [];
    return students.filter(
      (s) => s.guardianId === currentUser.id || s.parentEmail === currentUser.email
    );
  }, [isParent, students, currentUser]);

  // Selected student state
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [certificateData, setCertificateData] = useState<CertificateData | null>(null);
  const [ineligibleData, setIneligibleData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Staff search state
  const [staffSearchQuery, setStaffSearchQuery] = useState('');

  // Initial student selection
  useEffect(() => {
    if (isStudent) {
      // Find current student
      const student = students.find(
        (s) =>
          s.userId === currentUser.id ||
          s.id === currentUser.id ||
          (s.admissionNo && currentUser.username && s.admissionNo.toLowerCase() === currentUser.username.toLowerCase())
      );
      if (student) {
        setSelectedStudentId(student.id);
      }
    } else if (isParent && parentWards.length > 0) {
      if (!selectedStudentId) {
        setSelectedStudentId(parentWards[0].id);
      }
    }
  }, [isStudent, isParent, students, currentUser, parentWards, selectedStudentId]);

  // Fetch Certificate from API
  const fetchCertificate = async (studentId: string) => {
    if (!studentId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage(null);
      setCertificateData(null);
      setIneligibleData(null);

      const url = `/api/certificates?studentId=${encodeURIComponent(studentId)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.success && data.certificate) {
        setCertificateData(data.certificate);
      } else if (res.status === 403 && data.eligible === false) {
        // Student is not eligible yet according to academic rules
        setIneligibleData(data);
      } else {
        setErrorMessage(data.error || 'Failed to retrieve certificate details.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while loading the certificate.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStudentId) {
      fetchCertificate(selectedStudentId);
    } else if (!isStaff) {
      setIsLoading(false);
    }
  }, [selectedStudentId]);

  // Filtered students for staff selector
  const staffFilteredStudents = React.useMemo(() => {
    if (!staffSearchQuery.trim()) return students.slice(0, 8);
    const q = staffSearchQuery.toLowerCase();
    return students
      .filter((s) => s.fullName.toLowerCase().includes(q) || s.admissionNo.toLowerCase().includes(q))
      .slice(0, 10);
  }, [students, staffSearchQuery]);

  return (
    <PortalTheme>
      <div className="space-y-6 font-poppins">
        {/* Hero Banner */}
        <div className="no-print">
          <PortalHeroBanner
            title="Institutional Student Certificates"
            titleArabic="شهادات التخرج وإتمام حفظ القرآن الكريم"
            description="Official, verifiable graduation documents and certificates of Holy Qur'an memorization for Markazu Umar students."
            badgeText="Certification Center"
            badgeIcon={Award}
          />
        </div>

        {/* Parent Ward Selector */}
        {isParent && parentWards.length > 1 && (
          <div className="no-print p-4 rounded-2xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/20 shadow-xs space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-emerald-400 block">
              Select Child ({parentWards.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {parentWards.map((w) => (
                <button
                  key={w.id}
                  onClick={() => setSelectedStudentId(w.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    selectedStudentId === w.id
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                      : 'bg-slate-50 dark:bg-emerald-950/60 text-slate-700 dark:text-emerald-200 border-slate-200 dark:border-emerald-800/40 hover:bg-emerald-100/50'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>{w.fullName}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Staff Student Finder Bar */}
        {isStaff && (
          <div className="no-print p-4 sm:p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Search className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Find Student Certificate</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-emerald-300/70">
                  Search by student name or admission number to generate their verified certificate
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student or admission no..."
                  value={staffSearchQuery}
                  onChange={(e) => setStaffSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/30 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Candidate Pills */}
            <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100 dark:border-emerald-500/10">
              {staffFilteredStudents.map((st) => (
                <button
                  key={st.id}
                  onClick={() => setSelectedStudentId(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                    selectedStudentId === st.id
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-emerald-950/40 text-slate-700 dark:text-emerald-200 border-slate-200 dark:border-emerald-800/40 hover:bg-emerald-100/50'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>
                    {st.fullName} ({st.admissionNo})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* LOADING STATE */}
        {isLoading && (
          <div className="p-16 text-center rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-3 font-poppins">
            <Loader2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400 animate-spin mx-auto" />
            <h4 className="font-extrabold text-slate-900 dark:text-white text-base">Verifying Academic Records...</h4>
            <p className="text-xs text-slate-500 dark:text-emerald-300/70">
              Checking Tahfiz memorization milestones, approved examination scores, and qualification criteria.
            </p>
          </div>
        )}

        {/* ERROR STATE */}
        {!isLoading && errorMessage && (
          <div className="p-8 text-center rounded-3xl bg-white dark:bg-[#042419] border border-rose-300/60 dark:border-rose-500/30 shadow-md space-y-3 max-w-xl mx-auto">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-white">Unable to Load Certificate</h3>
            <p className="text-xs text-slate-600 dark:text-rose-200/90 leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {/* INELIGIBLE STATE (Requirement Criteria Feedback) */}
        {!isLoading && ineligibleData && (
          <div className="p-8 sm:p-10 rounded-3xl bg-white dark:bg-[#042419] border border-amber-300 dark:border-amber-600/40 shadow-xl space-y-5 max-w-2xl mx-auto">
            <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/60 border-2 border-amber-400 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
              <Clock className="w-8 h-8" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900 dark:text-white">
                Certificate Requirements Pending
              </h3>
              <p className="text-xs text-slate-600 dark:text-emerald-200/80 max-w-md mx-auto">
                {isStudent
                  ? 'Your certificate is not currently available. A student must satisfy the applicable academic and Tahfiz completion requirements to receive an official certificate.'
                  : `Certificate for ${ineligibleData.student?.fullName || 'the student'} is not available yet as academic and Tahfiz requirements have not been completed.`}
              </p>
            </div>

            {/* Criteria Checklist */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20 space-y-3 text-xs">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-emerald-400 block">
                Official Qualification Criteria
              </span>

              <div className="space-y-2">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-emerald-950/40 border border-slate-200/80 dark:border-emerald-800/30">
                  <span className="font-medium text-slate-800 dark:text-white">
                    1. 30-Juz Holy Qur'an Memorization (Tahfiz)
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[11px] text-amber-600 dark:text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{ineligibleData.criteria?.juzCompleted || 0} / 30 Juz</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-emerald-950/40 border border-slate-200/80 dark:border-emerald-800/30">
                  <span className="font-medium text-slate-800 dark:text-white">
                    2. Official Qur'an Assessment Qualification
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[11px] text-amber-600 dark:text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Pending Event</span>
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-emerald-950/40 border border-slate-200/80 dark:border-emerald-800/30">
                  <span className="font-medium text-slate-800 dark:text-white">
                    3. Academic Programme Curriculum Completion
                  </span>
                  <span className="inline-flex items-center gap-1 font-bold text-[11px] text-amber-600 dark:text-amber-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>In Progress</span>
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 dark:text-emerald-300/70 pt-1 leading-relaxed">
                Certificates are automatically authorized and issued immediately upon fulfilling any of the above institutional academic milestones.
              </p>
            </div>
          </div>
        )}

        {/* ELIGIBLE CERTIFICATE DISPLAY */}
        {!isLoading && certificateData && (
          <StudentCertificate certificate={certificateData} />
        )}
      </div>
    </PortalTheme>
  );
}
