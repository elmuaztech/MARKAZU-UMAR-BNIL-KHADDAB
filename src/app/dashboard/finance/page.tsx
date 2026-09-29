'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/lib/context';
import {
  CreditCard,
  ShieldCheck,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  ArrowRight,
  Receipt,
  Download,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Lock,
  ChevronRight,
  Loader2,
  Sparkles,
  BookOpen,
  UserCheck,
  Check,
  Eye,
  Calendar,
  X,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FinanceDashboardPage() {
  const { currentUser, users, notify } = useApp();
  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';
  const isHeadmaster = currentUser.role === 'HEADMASTER';
  const isParent = currentUser.role === 'PARENT';

  // Tabs for Super Admin
  const [adminTab, setAdminTab] = useState<'overview' | 'config' | 'admissions'>('overview');

  // Loading & Data States
  const [isLoading, setIsLoading] = useState(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [parentData, setParentData] = useState<any>(null);
  const [programmesConfig, setProgrammesConfig] = useState<any[]>([]);
  const [admissionsList, setAdmissionsList] = useState<any[]>([]);

  // Search & Filter States
  const [txSearch, setTxSearch] = useState('');
  const [txTypeFilter, setTxTypeFilter] = useState('ALL');
  const [txStatusFilter, setTxStatusFilter] = useState('ALL');

  // Receipt Modal State
  const [selectedTx, setSelectedTx] = useState<any | null>(null);

  // Admission Action State
  const [updatingAppId, setUpdatingAppId] = useState<string | null>(null);

  // Parent Payment State
  const [payingWardId, setPayingWardId] = useState<string | null>(null);
  const [isVerifyingFlw, setIsVerifyingFlw] = useState(false);

  // Load Data on Mount
  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (isParent) {
        const res = await fetch('/api/parent/finance');
        const json = await res.json();
        if (json.status === 'success') {
          setParentData(json.data);
        }
      } else {
        // Super Admin, Admin, or Headmaster
        const overviewRes = await fetch('/api/finance/overview');
        const overviewJson = await overviewRes.json();
        if (overviewJson.status === 'success') {
          setOverviewData(overviewJson.data);
        }

        if (isSuperAdmin) {
          const [cfgRes, admRes] = await Promise.all([
            fetch('/api/finance/config'),
            fetch('/api/admissions'),
          ]);
          const cfgJson = await cfgRes.json();
          const admJson = await admRes.json();

          if (cfgJson.status === 'success') {
            setProgrammesConfig(cfgJson.data || cfgJson.programmes || []);
          }
          if (admJson.status === 'success') {
            setAdmissionsList(admJson.data || admJson.applications || []);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load finance data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Super Admin: Update Programme Fee & Headmaster Assignment
  const handleSaveConfig = async (prog: any) => {
    try {
      const isPaid = Boolean(
        prog.isPaidProgramme ??
        (prog.feeConfig?.schoolFee > 0 || prog.feeConfig?.requiresApplicationFee)
      );

      const appFee = isPaid && prog.feeConfig?.requiresApplicationFee
        ? Number(prog.feeConfig?.applicationFee || 0)
        : 0;

      const schFee = isPaid
        ? Number(prog.feeConfig?.schoolFee || 0)
        : 0;

      const res = await fetch('/api/finance/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programmeId: prog.id,
          requiresApplicationFee: isPaid && Boolean(prog.feeConfig?.requiresApplicationFee),
          applicationFee: appFee,
          applicationFeeAmount: appFee,
          schoolFee: schFee,
          schoolFeeAmount: schFee,
          currency: prog.feeConfig?.currency || 'NGN',
          headmasterId: prog.headmasterId || null,
          headmasterUserId: prog.headmasterId || null,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.status !== 'success') {
        throw new Error(json.error || json.message || 'Failed to update configuration.');
      }

      notify({
        type: 'success',
        title: 'Configuration Saved',
        message: `Financial settings for "${prog.name || prog.nameEnglish}" updated.`,
      });

      loadData();
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Error saving financial settings.',
      });
    }
  };

  // Super Admin / Headmaster: Update Admission Status
  const handleUpdateAdmissionStatus = async (appId: string, newStatus: string) => {
    setUpdatingAppId(appId);
    try {
      const res = await fetch(`/api/admissions/${appId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          reviewNotes: `Decision updated to ${newStatus} on ${new Date().toLocaleDateString()}`,
        }),
      });

      const json = await res.json();
      if (!res.ok || json.status !== 'success') {
        throw new Error(json.message || 'Failed to update application decision.');
      }

      notify({
        type: 'success',
        title: 'Decision Recorded',
        message: json.message || `Application status updated to ${newStatus}.`,
      });

      loadData();
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Update Error',
        message: err.message || 'Failed to update status.',
      });
    } finally {
      setUpdatingAppId(null);
    }
  };

  // Parent: Initiate School Fee Payment via Flutterwave
  const handlePaySchoolFee = async (ward: any) => {
    setPayingWardId(ward.studentId);
    try {
      const res = await fetch('/api/payments/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          programmeId: ward.programmeId,
          studentId: ward.studentId,
          paymentType: 'SCHOOL_FEE',
          payerEmail: currentUser.email || 'parent@markazuumar.edu.ng',
          payerName: currentUser.name || 'Parent',
          payerPhone: '08037966581',
        }),
      });

      const json = await res.json();
      if (!res.ok || json.status !== 'success') {
        throw new Error(json.message || 'Failed to initialize school fee payment.');
      }

      const { publicKey, txRef, amount, currency, transactionId } = json.data;

      if (typeof window !== 'undefined' && (window as any).FlutterwaveCheckout) {
        (window as any).FlutterwaveCheckout({
          public_key: publicKey,
          tx_ref: txRef,
          amount: amount,
          currency: currency || 'NGN',
          payment_options: 'card,banktransfer,ussd',
          customer: {
            email: currentUser.email || 'parent@markazuumar.edu.ng',
            name: currentUser.name || 'Parent',
          },
          customizations: {
            title: "Markazu Umar bn Al-Khattab",
            description: `School Tuition Fee - ${ward.studentName} (${ward.programmeName})`,
            logo: 'https://markazuumar.edu.ng/logo-rounded.png',
          },
          callback: async function (flwResponse: any) {
            setIsVerifyingFlw(true);
            try {
              const verifyRes = await fetch('/api/payments/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  transactionId,
                  txRef,
                  paymentType: 'SCHOOL_FEE',
                  flwTransactionId: flwResponse.transaction_id,
                }),
              });

              const verifyJson = await verifyRes.json();
              if (verifyRes.ok && verifyJson.status === 'success') {
                notify({
                  type: 'success',
                  title: 'School Fee Verified!',
                  message: `Payment of ₦${amount.toLocaleString()} for ${ward.studentName} has been verified and recorded.`,
                });
                loadData();
              } else {
                notify({
                  type: 'error',
                  title: 'Verification Failed',
                  message: verifyJson.message || 'Payment verification failed on server.',
                });
              }
            } catch (err: any) {
              notify({
                type: 'error',
                title: 'Verification Error',
                message: 'Network error verifying transaction with Flutterwave.',
              });
            } finally {
              setIsVerifyingFlw(false);
              setPayingWardId(null);
            }
          },
          onclose: function () {
            setPayingWardId(null);
          },
        });
      } else {
        throw new Error('Flutterwave payment script is still initializing. Please refresh and try again.');
      }
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Payment Error',
        message: err.message || 'Could not initiate payment.',
      });
      setPayingWardId(null);
    }
  };

  // Filter transactions
  const transactions = overviewData?.transactions || [];
  const filteredTransactions = transactions.filter((t: any) => {
    const matchesSearch =
      !txSearch ||
      t.txRef?.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.flwRef?.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.payerName?.toLowerCase().includes(txSearch.toLowerCase()) ||
      t.payerEmail?.toLowerCase().includes(txSearch.toLowerCase());

    const matchesType = txTypeFilter === 'ALL' || t.paymentType === txTypeFilter;
    const matchesStatus = txStatusFilter === 'ALL' || t.status === txStatusFilter;

    return matchesSearch && matchesType && matchesStatus;
  });

  const headmasterUsers = users.filter((u) => u.role === 'HEADMASTER');

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3 font-poppins">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <p className="text-sm font-semibold text-slate-500 dark:text-emerald-300">
          Loading Markazu Financial Ledger & Ledger Records...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-poppins selection:bg-emerald-500 selection:text-white">
      {/* Header Banner - Clean, Executive, No Developer Jargon */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#032015] via-[#064e3b] to-[#042f1e] p-5 sm:p-7 text-white border border-emerald-500/30 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-xl bg-amber-500/20 text-amber-300 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 border border-amber-400/30">
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                {isParent ? 'Parent Portal' : isHeadmaster ? 'Headmaster Finance' : 'School Finance Command'}
              </span>
              {isHeadmaster && overviewData?.programme && (
                <span className="px-3 py-1 rounded-xl bg-emerald-500/20 text-emerald-200 text-xs font-bold border border-emerald-400/30">
                  {overviewData.programme.code}
                </span>
              )}
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white">
              {isParent
                ? 'Wards Tuition & School Fees'
                : isHeadmaster
                ? `${overviewData?.programme?.name || 'Section'} Finance Dashboard`
                : 'School Financial Command & Tuition Management'}
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium max-w-xl">
              {isParent
                ? 'Review tuition schedules and pay school fees securely online.'
                : isHeadmaster
                ? 'Monitor section student enrollments, fee collections, and tuition records.'
                : 'Configure fee schedules, enable programme payments, and audit financial records.'}
            </p>
          </div>

          {/* Clean Status Badges */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            {isHeadmaster && overviewData?.programme && (
              <span
                className={`px-3.5 py-1.5 rounded-2xl text-xs font-bold border ${
                  overviewData.programme.feeConfig?.schoolFeeAmount > 0 || overviewData.programme.feeConfig?.requiresApplicationFee
                    ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                    : 'bg-emerald-500/20 border-emerald-400/40 text-emerald-300'
                }`}
              >
                {overviewData.programme.feeConfig?.schoolFeeAmount > 0 || overviewData.programme.feeConfig?.requiresApplicationFee
                  ? '💳 Payment-Enabled Section'
                  : '🌙 Community Waqf (Free Section)'}
              </span>
            )}
            {isSuperAdmin && (
              <span className="px-3.5 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Super Admin Global Access</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 1. PARENT PORTAL FINANCIAL VIEW (Ward-by-Ward Tuition) */}
      {/* ------------------------------------------------------------- */}
      {isParent && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              <span>Registered Wards Tuition Schedule ({parentData?.wards?.length || 0})</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-emerald-300">
              Only accepted students in paid programmes carry tuition obligations
            </span>
          </div>

          {parentData?.wards?.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-center space-y-2">
              <Users className="w-10 h-10 text-emerald-500/50 mx-auto" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">No Enrolled Wards Found</h3>
              <p className="text-xs text-slate-500 dark:text-emerald-300/80 max-w-md mx-auto">
                Once your child completes the admission screening and is officially accepted, their tuition schedule will appear here.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {parentData?.wards?.map((ward: any) => {
                const isPaid = ward.isPaidProgramme;
                const balance = ward.outstandingBalance || 0;
                const isDue = balance > 0;

                return (
                  <div
                    key={ward.studentId}
                    className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-4"
                  >
                    <div className="flex items-start justify-between border-b border-slate-100 dark:border-emerald-900/40 pb-3">
                      <div>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                          {ward.admissionNo}
                        </span>
                        <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                          {ward.studentName}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-emerald-300/80">
                          {ward.programmeName} ({ward.programmeCode})
                        </p>
                      </div>

                      <span
                        className={`px-3 py-1 rounded-xl text-xs font-bold ${
                          isPaid
                            ? isDue
                              ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 border border-amber-300'
                              : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300'
                            : 'bg-sky-100 dark:bg-sky-900/60 text-sky-800 dark:text-sky-300 border border-sky-300'
                        }`}
                      >
                        {isPaid ? (isDue ? 'School Fee Due' : 'Fully Paid') : 'Community Sponsored (Free)'}
                      </span>
                    </div>

                    {/* Breakdown */}
                    {isPaid ? (
                      <div className="grid grid-cols-3 gap-2 text-center p-3 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-100 dark:border-emerald-900/40">
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-emerald-400 font-semibold block">
                            School Fee
                          </span>
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            ₦{ward.schoolFee?.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-emerald-400 font-semibold block">
                            Amount Paid
                          </span>
                          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                            ₦{ward.amountPaid?.toLocaleString()}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-emerald-400 font-semibold block">
                            Balance Due
                          </span>
                          <span className={`text-xs font-black ${isDue ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            ₦{balance.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/40 text-[11px] text-sky-800 dark:text-sky-200 space-y-1">
                        <p className="font-bold flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                          <span>Waqf Free Academic Curriculum:</span>
                        </p>
                        <p className="text-[10px]">
                          This programme is community-sponsored and carries <strong>₦0 school fee liability</strong> for registered students.
                        </p>
                      </div>
                    )}

                    {/* Action or Payment History */}
                    {isPaid && isDue && (
                      <button
                        type="button"
                        disabled={payingWardId === ward.studentId || isVerifyingFlw}
                        onClick={() => handlePaySchoolFee(ward)}
                        className="w-full py-3 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-md transition-all"
                      >
                        {payingWardId === ward.studentId ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Connecting to Flutterwave...</span>
                          </>
                        ) : (
                          <>
                            <CreditCard className="w-4 h-4" />
                            <span>Pay School Fee (₦{balance.toLocaleString()})</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Recent Transactions for Ward */}
                    {ward.transactions && ward.transactions.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-emerald-900/40">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-emerald-400 uppercase tracking-wider block">
                          Verified Payment Receipts
                        </span>
                        <div className="space-y-1">
                          {ward.transactions.map((tx: any) => (
                            <div
                              key={tx.id}
                              onClick={() => setSelectedTx(tx)}
                              className="p-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-900/40 text-[10px] flex items-center justify-between cursor-pointer hover:border-emerald-400 transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Receipt className="w-3.5 h-3.5 text-emerald-500" />
                                <span className="font-mono text-slate-700 dark:text-white font-bold">{tx.txRef}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                  ₦{tx.amount?.toLocaleString()}
                                </span>
                                <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-500/20 text-emerald-400">
                                  {tx.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. HEADMASTER / SUPER ADMIN OVERVIEW METRICS */}
      {/* ------------------------------------------------------------- */}
      {(isSuperAdmin || isHeadmaster) && (
        <div className="space-y-6">
          {/* Sub Navigation Tabs for Super Admin - Always in a Single Straight Line */}
          {isSuperAdmin && (
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-emerald-800/40 pb-3 overflow-x-auto scrollbar-none flex-nowrap -mx-1 px-1">
              {[
                { id: 'overview', label: 'Financial Overview & Audit', icon: TrendingUp },
                { id: 'config', label: 'Programme Fee Schedules & Headmasters', icon: CreditCard },
                { id: 'admissions', label: 'Admissions & Decisions', icon: UserCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = adminTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setAdminTab(tab.id as any)}
                    className={`whitespace-nowrap px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                        : 'bg-white dark:bg-[#042419] text-slate-700 dark:text-emerald-200 border border-slate-200 dark:border-emerald-800/40 hover:bg-emerald-100/50'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-emerald-500'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* TAB 1: OVERVIEW & AUDIT (Default for Headmaster and Super Admin) */}
          {(adminTab === 'overview' || isHeadmaster) && (
            <div className="space-y-6">
              {/* Headmaster Section Payment Status Card */}
              {isHeadmaster && overviewData?.programme && (
                <div
                  className={`p-4 rounded-3xl border flex items-center justify-between flex-wrap gap-3 shadow-md ${
                    overviewData.programme.feeConfig?.schoolFeeAmount > 0 || overviewData.programme.feeConfig?.requiresApplicationFee
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                  }`}
                >
                  <div className="space-y-0.5">
                    <span className="text-xs font-black uppercase tracking-wider block">
                      {overviewData.programme.name} • Section Payment Governance
                    </span>
                    <p className="text-xs font-medium">
                      {overviewData.programme.feeConfig?.schoolFeeAmount > 0 || overviewData.programme.feeConfig?.requiresApplicationFee
                        ? `💳 Online Tuition Enabled — Termly School Fee: ₦${(overviewData.programme.feeConfig?.schoolFeeAmount || 0).toLocaleString()}${
                            overviewData.programme.feeConfig?.requiresApplicationFee
                              ? ` • Application Form Fee: ₦${(overviewData.programme.feeConfig?.applicationFeeAmount || 0).toLocaleString()}`
                              : ''
                          }`
                        : '🌙 Community Waqf Section — Fully sponsored with ₦0 tuition liability for all enrolled students.'}
                    </p>
                  </div>
                  <span
                    className={`px-3.5 py-1.5 rounded-2xl text-xs font-black shadow-sm ${
                      overviewData.programme.feeConfig?.schoolFeeAmount > 0 || overviewData.programme.feeConfig?.requiresApplicationFee
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    {overviewData.programme.feeConfig?.schoolFeeAmount > 0 || overviewData.programme.feeConfig?.requiresApplicationFee
                      ? 'Payment Supported'
                      : 'Waqf Sponsored (Free)'}
                  </span>
                </div>
              )}

              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-emerald-300 uppercase">
                      Accepted Students
                    </span>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <Users className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white">
                    {overviewData?.metrics?.acceptedStudents || 0}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-emerald-300/70 font-medium">
                    Eligible for School Fee Billing
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-amber-300 uppercase">
                      Expected School Fees
                    </span>
                    <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
                    ₦{(overviewData?.metrics?.expectedSchoolFees || 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-amber-300/70 font-medium">
                    Calculated from Active Rolls
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-emerald-300 uppercase">
                      Total Fees Collected
                    </span>
                    <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                    ₦{(overviewData?.metrics?.totalCollected || 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-emerald-300/70 font-medium">
                    Verified Online Collections
                  </p>
                </div>

                <div className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500 dark:text-rose-300 uppercase">
                      Outstanding Balance
                    </span>
                    <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
                    ₦{(overviewData?.metrics?.totalOutstanding || 0).toLocaleString()}
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-rose-300/70 font-medium">
                    Unpaid School Fee Balances
                  </p>
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div className="p-6 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                      <Receipt className="w-5 h-5 text-emerald-500" />
                      <span>Payment Audit Trail ({filteredTransactions.length})</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-emerald-300/80">
                      {isHeadmaster
                        ? `Strictly scoped to ${overviewData?.programme?.name || 'Assigned Programme'}`
                        : 'Institutional Master Transaction Registry'}
                    </p>
                  </div>

                  {/* Search and Filters */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search ref, payer, email..."
                        value={txSearch}
                        onChange={(e) => setTxSearch(e.target.value)}
                        className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white"
                      />
                    </div>

                    <select
                      value={txTypeFilter}
                      onChange={(e) => setTxTypeFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="ALL">All Types</option>
                      <option value="APPLICATION_FEE">Form Fee</option>
                      <option value="SCHOOL_FEE">School Fee</option>
                    </select>

                    <select
                      value={txStatusFilter}
                      onChange={(e) => setTxStatusFilter(e.target.value)}
                      className="px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-900/60 text-xs text-slate-900 dark:text-white"
                    >
                      <option value="ALL">All Status</option>
                      <option value="SUCCESS">Success</option>
                      <option value="PENDING">Pending</option>
                      <option value="FAILED">Failed</option>
                    </select>
                  </div>
                </div>

                {filteredTransactions.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-400 dark:text-emerald-300/70 italic">
                    No payment records matching the selected search criteria.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-[#021810] border-b border-slate-200 dark:border-emerald-900/40 text-[11px] font-bold text-slate-500 dark:text-emerald-400 uppercase">
                        <tr>
                          <th className="py-3 px-4">Transaction Ref</th>
                          <th className="py-3 px-4">Payer / Guardian</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Amount</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Date</th>
                          <th className="py-3 px-4 text-right">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-emerald-900/30">
                        {filteredTransactions.map((tx: any) => (
                          <tr key={tx.id} className="hover:bg-slate-50/50 dark:hover:bg-emerald-950/20">
                            <td className="py-3 px-4 font-mono font-bold text-slate-900 dark:text-white">
                              {tx.txRef}
                              {tx.flwRef && (
                                <span className="block text-[9px] text-slate-400 dark:text-emerald-400/70 font-normal">
                                  FLW: {tx.flwRef}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-semibold text-slate-800 dark:text-emerald-200 block">
                                {tx.payerName || 'N/A'}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-emerald-400/80 font-mono">
                                {tx.payerEmail}
                              </span>
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  tx.paymentType === 'APPLICATION_FEE'
                                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                                }`}
                              >
                                {tx.paymentType === 'APPLICATION_FEE' ? 'Application Fee' : 'School Tuition'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 dark:text-white font-mono">
                              ₦{tx.amount?.toLocaleString()}
                            </td>
                            <td className="py-3 px-4">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  tx.status === 'SUCCESS'
                                    ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300'
                                    : tx.status === 'PENDING'
                                    ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-300'
                                    : 'bg-rose-100 dark:bg-rose-900 text-rose-800 dark:text-rose-300'
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-slate-500 dark:text-emerald-400/80 text-[11px]">
                              {new Date(tx.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <button
                                type="button"
                                onClick={() => setSelectedTx(tx)}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-[11px] border border-emerald-300 dark:border-emerald-800 flex items-center gap-1 ml-auto"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>View</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PROGRAMME FEE CONFIGURATION & HEADMASTER ASSIGNMENT (Super Admin Only) */}
          {isSuperAdmin && adminTab === 'config' && (
            <div className="space-y-5">
              {/* Header Summary Bar */}
              <div className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-emerald-500" />
                    <span>Programme Tuition & Payment Governance</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-emerald-300/80">
                    Define which academic programmes require payment and assign the responsible section Headmaster. Free Waqf programmes carry ₦0 fees for students.
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1.5 rounded-2xl bg-slate-100 dark:bg-[#021810] border border-slate-200 dark:border-emerald-800/40 text-xs font-bold text-slate-700 dark:text-emerald-300">
                    {programmesConfig.length} Total Sections
                  </span>
                  <span className="px-3 py-1.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                    {
                      programmesConfig.filter(
                        (p) =>
                          p.isPaidProgramme ||
                          p.feeConfig?.schoolFee > 0 ||
                          p.feeConfig?.requiresApplicationFee
                      ).length
                    }{' '}
                    Payment-Enabled
                  </span>
                  <span className="px-3 py-1.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-xs font-bold text-cyan-700 dark:text-cyan-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
                    {
                      programmesConfig.filter(
                        (p) =>
                          !p.isPaidProgramme &&
                          !(p.feeConfig?.schoolFee > 0 || p.feeConfig?.requiresApplicationFee)
                      ).length
                    }{' '}
                    Community Waqf
                  </span>
                </div>
              </div>

              {/* Programme Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {programmesConfig.map((prog) => {
                  const isPaid = Boolean(
                    prog.isPaidProgramme ??
                    (prog.feeConfig?.schoolFee > 0 || prog.feeConfig?.requiresApplicationFee)
                  );

                  return (
                    <div
                      key={prog.id}
                      className={`p-5 rounded-3xl bg-white dark:bg-[#042419] border transition-all shadow-md space-y-4 ${
                        isPaid
                          ? 'border-emerald-500/40 dark:border-emerald-500/40 ring-1 ring-emerald-500/20'
                          : 'border-slate-200 dark:border-cyan-500/30'
                      }`}
                    >
                      {/* Programme Header */}
                      <div className="flex items-start justify-between border-b border-slate-100 dark:border-emerald-900/40 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold">
                              {prog.code}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                isPaid
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300/40'
                                  : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/60 dark:text-cyan-300 border border-cyan-300/40'
                              }`}
                            >
                              {isPaid ? 'Payment Enabled' : 'Community Waqf'}
                            </span>
                          </div>
                          <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">
                            {prog.name || prog.nameEnglish}
                          </h3>
                        </div>
                      </div>

                      {/* Payment Mode Selector Buttons */}
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-gray-300 block">
                          Programme Payment Status
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = programmesConfig.map((p) =>
                                p.id === prog.id
                                  ? {
                                      ...p,
                                      isPaidProgramme: false,
                                      feeConfig: {
                                        ...p.feeConfig,
                                        schoolFee: 0,
                                        requiresApplicationFee: false,
                                        applicationFee: 0,
                                      },
                                    }
                                  : p
                              );
                              setProgrammesConfig(updated);
                            }}
                            className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                              !isPaid
                                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-black shadow-sm'
                                : 'bg-slate-50 dark:bg-[#021810] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-emerald-900/50 hover:border-cyan-500/50'
                            }`}
                          >
                            <span>🌙 Free (Waqf)</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const updated = programmesConfig.map((p) =>
                                p.id === prog.id
                                  ? {
                                      ...p,
                                      isPaidProgramme: true,
                                      feeConfig: {
                                        ...p.feeConfig,
                                        schoolFee:
                                          (p.feeConfig?.schoolFee || 0) > 0
                                            ? p.feeConfig.schoolFee
                                            : 15000,
                                      },
                                    }
                                  : p
                              );
                              setProgrammesConfig(updated);
                            }}
                            className={`py-2 px-3 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                              isPaid
                                ? 'bg-emerald-600 text-white border-emerald-500 font-black shadow-sm'
                                : 'bg-slate-50 dark:bg-[#021810] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-emerald-900/50 hover:border-emerald-500/50'
                            }`}
                          >
                            <span>💳 Requires Payment</span>
                          </button>
                        </div>
                      </div>

                      {/* Fee Inputs (if Paid) or Waqf Notice (if Free) */}
                      {isPaid ? (
                        <div className="space-y-3 p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-[#021810] border border-emerald-500/20">
                          {/* Termly School Fee */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <label className="text-[11px] font-bold text-slate-800 dark:text-emerald-200">
                                Termly School Fee (₦)
                              </label>
                              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                Billed After Admission Acceptance
                              </span>
                            </div>
                            <input
                              type="number"
                              min="0"
                              value={prog.feeConfig?.schoolFee || 0}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value) || 0;
                                const updated = programmesConfig.map((p) =>
                                  p.id === prog.id
                                    ? {
                                        ...p,
                                        isPaidProgramme: true,
                                        feeConfig: { ...p.feeConfig, schoolFee: val },
                                      }
                                    : p
                                );
                                setProgrammesConfig(updated);
                              }}
                              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#031c13] border border-slate-300 dark:border-emerald-500/30 text-xs font-mono font-bold text-slate-900 dark:text-white"
                              placeholder="e.g. 15000"
                            />
                          </div>

                          {/* Application Fee Toggle and Input */}
                          <div className="space-y-2 pt-2 border-t border-emerald-500/10 dark:border-emerald-900/30">
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-xs font-bold text-slate-800 dark:text-emerald-200">
                                  Application / Form Fee Required
                                </span>
                                <p className="text-[10px] text-slate-400 dark:text-emerald-400/80">
                                  Applicant must pay before form access
                                </p>
                              </div>
                              <input
                                type="checkbox"
                                checked={prog.feeConfig?.requiresApplicationFee ?? false}
                                onChange={(e) => {
                                  const updated = programmesConfig.map((p) =>
                                    p.id === prog.id
                                      ? {
                                          ...p,
                                          isPaidProgramme: true,
                                          feeConfig: {
                                            ...p.feeConfig,
                                            requiresApplicationFee: e.target.checked,
                                            applicationFee: e.target.checked
                                              ? (p.feeConfig?.applicationFee || 2000)
                                              : 0,
                                          },
                                        }
                                      : p
                                  );
                                  setProgrammesConfig(updated);
                                }}
                                className="w-4 h-4 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
                              />
                            </div>

                            {prog.feeConfig?.requiresApplicationFee && (
                              <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-600 dark:text-emerald-400">
                                  Application Form Fee Amount (₦)
                                </label>
                                <input
                                  type="number"
                                  min="0"
                                  value={prog.feeConfig?.applicationFee || 0}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const updated = programmesConfig.map((p) =>
                                      p.id === prog.id
                                        ? {
                                            ...p,
                                            feeConfig: { ...p.feeConfig, applicationFee: val },
                                          }
                                        : p
                                    );
                                    setProgrammesConfig(updated);
                                  }}
                                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-[#031c13] border border-slate-300 dark:border-emerald-500/30 text-xs font-mono font-bold text-slate-900 dark:text-white"
                                  placeholder="e.g. 2000"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-800/30 text-xs text-cyan-800 dark:text-cyan-200 space-y-1">
                          <p className="font-bold flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                            <span>Community Waqf Programme</span>
                          </p>
                          <p className="text-[11px] text-cyan-700 dark:text-cyan-300">
                            Enrolled students in this section attend free of charge (₦0 tuition). No application form or termly fees are charged.
                          </p>
                        </div>
                      )}

                      {/* Headmaster Assignment Dropdown */}
                      <div className="space-y-1">
                        <label className="text-[11px] font-bold text-slate-700 dark:text-gray-300 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Assigned Section Headmaster</span>
                        </label>
                        <select
                          value={prog.headmasterId || ''}
                          onChange={(e) => {
                            const updated = programmesConfig.map((p) =>
                              p.id === prog.id ? { ...p, headmasterId: e.target.value } : p
                            );
                            setProgrammesConfig(updated);
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white"
                        >
                          <option value="">Unassigned</option>
                          {headmasterUsers.map((hm) => (
                            <option key={hm.id} value={hm.id}>
                              {hm.name} ({hm.email})
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Save Button */}
                      <button
                        type="button"
                        onClick={() => handleSaveConfig(prog)}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Save Programme Settings</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: ADMISSIONS & SCREENING WORKFLOW (Super Admin Only) */}
          {isSuperAdmin && adminTab === 'admissions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <UserCheck className="w-5 h-5 text-emerald-500" />
                    <span>Admissions Review & Decision Board ({admissionsList.length})</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-emerald-300/80">
                    Accepting an applicant enrolls them as an active student and unlocks school fee billing in their parent's portal.
                  </p>
                </div>
              </div>

              {admissionsList.length === 0 ? (
                <div className="p-8 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 text-center text-xs text-slate-400 italic">
                  No admission applications submitted yet.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {admissionsList.map((app) => (
                    <div
                      key={app.id}
                      className="p-5 rounded-3xl bg-white dark:bg-[#042419] border border-slate-200 dark:border-emerald-500/30 shadow-md space-y-3 text-xs"
                    >
                      <div className="flex items-start justify-between border-b border-slate-100 dark:border-emerald-900/40 pb-2">
                        <div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                            {app.applicationNo}
                          </span>
                          <h4 className="text-sm font-black text-slate-900 dark:text-white mt-1">
                            {app.studentFullName} ({app.studentGender})
                          </h4>
                          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            {app.programme?.name}
                          </p>
                        </div>

                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            app.status === 'ACCEPTED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300'
                              : app.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300'
                          }`}
                        >
                          {app.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-emerald-200/80">
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-emerald-400 font-semibold block">
                            Parent / Guardian:
                          </span>
                          <span className="font-bold">{app.parentName}</span> ({app.parentPhone})
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 dark:text-emerald-400 font-semibold block">
                            Date of Birth:
                          </span>
                          <span className="font-bold">{app.studentDob}</span>
                        </div>
                      </div>

                      {/* Decision Action Buttons */}
                      <div className="pt-2 border-t border-slate-100 dark:border-emerald-900/40 flex items-center gap-2 flex-wrap">
                        {app.status !== 'ACCEPTED' && (
                          <button
                            type="button"
                            disabled={updatingAppId === app.id}
                            onClick={() => handleUpdateAdmissionStatus(app.id, 'ACCEPTED')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] flex items-center gap-1 shadow"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Accept & Enroll</span>
                          </button>
                        )}

                        {app.status !== 'INTERVIEW_REQUIRED' && app.status !== 'ACCEPTED' && (
                          <button
                            type="button"
                            disabled={updatingAppId === app.id}
                            onClick={() => handleUpdateAdmissionStatus(app.id, 'INTERVIEW_REQUIRED')}
                            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] flex items-center gap-1 shadow"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Schedule Interview</span>
                          </button>
                        )}

                        {app.status !== 'REJECTED' && (
                          <button
                            type="button"
                            disabled={updatingAppId === app.id}
                            onClick={() => handleUpdateAdmissionStatus(app.id, 'REJECTED')}
                            className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 text-rose-700 dark:text-rose-300 font-bold text-[11px] border border-rose-300 dark:border-rose-800 flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. RECEIPT AUDIT MODAL */}
      {/* ------------------------------------------------------------- */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white dark:bg-[#032417] border border-emerald-200 dark:border-emerald-500/40 rounded-3xl shadow-2xl p-6 space-y-4 text-xs font-poppins">
            <button
              onClick={() => setSelectedTx(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-emerald-950 text-slate-500 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1 border-b border-slate-100 dark:border-emerald-900/40 pb-4">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase">
                Official Payment Receipt
              </h3>
              <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold font-arabic">
                مركز عمر بن الخطاب لتحفيظ القرآن بالدراسات الإسلامية دنيج
              </p>
            </div>

            <div className="space-y-2 p-3 rounded-2xl bg-slate-50 dark:bg-[#021810] border border-slate-200 dark:border-emerald-900/40 font-mono text-[11px]">
              <div className="flex justify-between border-b border-slate-200 dark:border-emerald-900/30 pb-1">
                <span className="text-slate-500 dark:text-emerald-400">Payment Reference:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedTx.txRef}</span>
              </div>
              {selectedTx.flwRef && (
                <div className="flex justify-between border-b border-slate-200 dark:border-emerald-900/30 pb-1">
                  <span className="text-slate-500 dark:text-emerald-400">Flutterwave Ref:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{selectedTx.flwRef}</span>
                </div>
              )}
              <div className="flex justify-between border-b border-slate-200 dark:border-emerald-900/30 pb-1">
                <span className="text-slate-500 dark:text-emerald-400">Payer Name:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedTx.payerName || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-emerald-900/30 pb-1">
                <span className="text-slate-500 dark:text-emerald-400">Payer Email:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedTx.payerEmail}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-emerald-900/30 pb-1">
                <span className="text-slate-500 dark:text-emerald-400">Category:</span>
                <span className="font-bold text-amber-500">{selectedTx.paymentType}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-emerald-900/30 pb-1">
                <span className="text-slate-500 dark:text-emerald-400">Amount Paid:</span>
                <span className="font-black text-emerald-500 text-sm">₦{selectedTx.amount?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-emerald-400">Status:</span>
                <span className="font-bold text-emerald-400">{selectedTx.status}</span>
              </div>
            </div>

            <button
              onClick={() => window.print()}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow"
            >
              <Download className="w-4 h-4" />
              <span>Print / Download Receipt</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
