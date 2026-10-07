'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/lib/context';
import {
  BookMarked,
  Plus,
  CheckCircle,
  Archive,
  History,
  AlertTriangle,
  RefreshCw,
  Edit2,
  Trash2,
  Shield,
  Layers,
  Sparkles,
  ArrowLeft,
  X,
  FileCheck,
  Check,
} from 'lucide-react';

interface Rule {
  id: string;
  ruleSetId: string;
  studentType: string;
  mistakeCategory: string;
  threshold: number;
  action: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface RuleSet {
  id: string;
  name: string;
  description?: string | null;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  effectiveFrom: string;
  effectiveTo?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  rules: Rule[];
  assessmentsCount: number;
  eventsCount: number;
}

interface AuditLogItem {
  id: string;
  action: string;
  performedBy: string;
  userRole?: string;
  details: string;
  status: string;
  createdAt: string;
}

export default function QuranAssessmentRulesPage() {
  const { currentUser, notify } = useApp();
  const isSuperAdminOrAdmin = currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'ADMIN';

  const [ruleSets, setRuleSets] = useState<RuleSet[]>([]);
  const [selectedRuleSetId, setSelectedRuleSetId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [showCreateRuleSetModal, setShowCreateRuleSetModal] = useState(false);
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [showEditRuleModal, setShowEditRuleModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Form states
  const [newRuleSetName, setNewRuleSetName] = useState('');
  const [newRuleSetDesc, setNewRuleSetDesc] = useState('');
  const [ruleStudentType, setRuleStudentType] = useState('Masu Biye');
  const [ruleMistakeCategory, setRuleMistakeCategory] = useState('');
  const [ruleThreshold, setRuleThreshold] = useState(3);
  const [ruleIsActive, setRuleIsActive] = useState(true);
  const [savingAction, setSavingAction] = useState(false);

  const fetchRuleSets = async () => {
    try {
      setRefreshing(true);
      setError(null);
      const res = await fetch('/api/quran-assessment/rulesets');
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to load Qur’an Assessment rules');
      }
      const data = await res.json();
      setRuleSets(data.ruleSets || []);
      if (data.ruleSets && data.ruleSets.length > 0) {
        if (!selectedRuleSetId || !data.ruleSets.some((r: RuleSet) => r.id === selectedRuleSetId)) {
          // Default to the ACTIVE one, or the first one
          const activeSet = data.ruleSets.find((r: RuleSet) => r.status === 'ACTIVE');
          setSelectedRuleSetId(activeSet ? activeSet.id : data.ruleSets[0].id);
        }
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error loading rules');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRuleSets();
  }, []);

  const activeRuleSet = ruleSets.find((rs) => rs.id === selectedRuleSetId);

  // Handle Create Rule Set
  const handleCreateRuleSet = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleSetName.trim()) {
      notify({ type: 'error', title: 'Validation Error', message: 'Rule Set name is required.' });
      return;
    }

    try {
      setSavingAction(true);
      const res = await fetch('/api/quran-assessment/rulesets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newRuleSetName.trim(),
          description: newRuleSetDesc.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create rule set');

      notify({ type: 'success', title: 'Rule Set Created', message: data.message });
      setShowCreateRuleSetModal(false);
      setNewRuleSetName('');
      setNewRuleSetDesc('');
      await fetchRuleSets();
      if (data.ruleSet?.id) {
        setSelectedRuleSetId(data.ruleSet.id);
      }
    } catch (err: any) {
      notify({ type: 'error', title: 'Creation Failed', message: err.message });
    } finally {
      setSavingAction(false);
    }
  };

  // Handle Add Rule
  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRuleSet) return;

    if (!ruleStudentType.trim() || !ruleMistakeCategory.trim()) {
      notify({ type: 'error', title: 'Validation Error', message: 'Student Type and Mistake Category are required.' });
      return;
    }
    if (ruleThreshold <= 0) {
      notify({ type: 'error', title: 'Validation Error', message: 'Threshold must be greater than 0.' });
      return;
    }

    try {
      setSavingAction(true);
      const res = await fetch('/api/quran-assessment/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleSetId: activeRuleSet.id,
          studentType: ruleStudentType.trim(),
          mistakeCategory: ruleMistakeCategory.trim(),
          threshold: ruleThreshold,
          active: ruleIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add rule');

      notify({ type: 'success', title: 'Rule Added', message: data.message });
      setShowAddRuleModal(false);
      setRuleMistakeCategory('');
      setRuleThreshold(3);
      await fetchRuleSets();
    } catch (err: any) {
      notify({ type: 'error', title: 'Error Adding Rule', message: err.message });
    } finally {
      setSavingAction(false);
    }
  };

  // Handle Edit Rule
  const handleEditRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    if (ruleThreshold <= 0) {
      notify({ type: 'error', title: 'Validation Error', message: 'Threshold must be greater than 0.' });
      return;
    }

    try {
      setSavingAction(true);
      const res = await fetch(`/api/quran-assessment/rules/${editingRule.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentType: ruleStudentType.trim(),
          mistakeCategory: ruleMistakeCategory.trim(),
          threshold: ruleThreshold,
          active: ruleIsActive,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update rule');

      notify({ type: 'success', title: 'Rule Updated', message: data.message });
      setShowEditRuleModal(false);
      setEditingRule(null);
      await fetchRuleSets();
    } catch (err: any) {
      notify({ type: 'error', title: 'Error Updating Rule', message: err.message });
    } finally {
      setSavingAction(false);
    }
  };

  // Handle Activate Rule Set
  const handleActivateRuleSet = async (ruleSetId: string) => {
    if (!confirm('Are you sure you want to ACTIVATE this Rule Set? It will become the authoritative rule set for all upcoming Qur’an assessment events.')) {
      return;
    }

    try {
      setSavingAction(true);
      const res = await fetch(`/api/quran-assessment/rulesets/${ruleSetId}/activate`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to activate rule set');

      notify({ type: 'success', title: 'Rule Set Activated', message: data.message });
      await fetchRuleSets();
    } catch (err: any) {
      notify({ type: 'error', title: 'Activation Failed', message: err.message });
    } finally {
      setSavingAction(false);
    }
  };

  // Handle Archive Rule Set
  const handleArchiveRuleSet = async (ruleSetId: string) => {
    if (!confirm('Are you sure you want to ARCHIVE this Rule Set? Archived rule sets cannot be linked to new assessment events.')) {
      return;
    }

    try {
      setSavingAction(true);
      const res = await fetch(`/api/quran-assessment/rulesets/${ruleSetId}/archive`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to archive rule set');

      notify({ type: 'info', title: 'Rule Set Archived', message: data.message });
      await fetchRuleSets();
    } catch (err: any) {
      notify({ type: 'error', title: 'Archiving Failed', message: err.message });
    } finally {
      setSavingAction(false);
    }
  };

  // Open Edit Rule Modal
  const openEditModal = (rule: Rule) => {
    setEditingRule(rule);
    setRuleStudentType(rule.studentType);
    setRuleMistakeCategory(rule.mistakeCategory);
    setRuleThreshold(rule.threshold);
    setRuleIsActive(rule.active);
    setShowEditRuleModal(true);
  };

  // Open History / Audit Modal
  const openHistoryModal = async () => {
    setShowHistoryModal(true);
    setLoadingAudit(true);
    try {
      const res = await fetch('/api/audit?limit=100');
      if (res.ok) {
        const data = await res.json();
        const quranLogs = (data.auditLogs || []).filter((l: any) =>
          l.action.startsWith('QURAN_')
        );
        setAuditLogs(quranLogs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAudit(false);
    }
  };

  if (!isSuperAdminOrAdmin) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 rounded-xl p-6 text-center">
          <Shield className="w-12 h-12 text-red-600 dark:text-red-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold text-red-900 dark:text-red-200">Access Restricted</h2>
          <p className="text-sm text-red-700 dark:text-red-300 mt-2 max-w-md mx-auto">
            Only Super Administrators and Administrators have permission to view and configure Qur’an Assessment Rules.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-emerald-900 dark:bg-emerald-950 text-white p-5 sm:p-6 rounded-2xl shadow-sm border border-emerald-800">
        <div>
          <div className="flex items-center gap-2 text-emerald-300 text-xs sm:text-sm font-medium mb-1">
            <Link href="/dashboard/settings" className="hover:underline flex items-center gap-1">
              Settings
            </Link>
            <span>/</span>
            <span>Qur’an Assessment Rules</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 font-poppins">
            <BookMarked className="w-6 h-6 text-emerald-400" />
            Qur’an Assessment Rules Engine
          </h1>
          <p className="text-xs sm:text-sm text-emerald-200/90 mt-1 max-w-2xl">
            Authoritative, configuration-driven disqualification rules for Markazu Umar. Rules are versioned to preserve historical assessment records permanently.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:self-center">
          <button
            onClick={openHistoryModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 transition"
          >
            <History className="w-4 h-4" /> Rule Audit Log
          </button>
          <button
            onClick={() => setShowCreateRuleSetModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-emerald-950 shadow-sm transition"
          >
            <Plus className="w-4 h-4" /> New Rule Set
          </button>
          <button
            onClick={fetchRuleSets}
            disabled={refreshing}
            className="p-2 rounded-lg bg-emerald-800/80 hover:bg-emerald-800 text-emerald-100 border border-emerald-700 transition disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 text-sm p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={fetchRuleSets} className="underline text-xs font-medium hover:text-red-900">Retry</button>
        </div>
      )}

      {/* Rule Sets Selector Tabs */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Configured Rule Sets ({ruleSets.length})
          </h2>
          <span className="text-xs text-slate-400">Select version to view or manage</span>
        </div>

        {loading ? (
          <div className="py-6 text-center text-sm text-slate-500">Loading assessment rules...</div>
        ) : ruleSets.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-500">
            No rule sets found. Click &quot;New Rule Set&quot; to initialize rules.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {ruleSets.map((rs) => {
              const isSelected = rs.id === selectedRuleSetId;
              const statusColors = {
                ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700',
                DRAFT: 'bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300 dark:border-amber-700',
                ARCHIVED: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-300 dark:border-slate-700',
              };

              return (
                <button
                  key={rs.id}
                  onClick={() => setSelectedRuleSetId(rs.id)}
                  className={`text-left p-3.5 rounded-xl border transition-all relative ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Version {rs.version}</span>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">{rs.name}</h3>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${statusColors[rs.status]}`}>
                      {rs.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>{rs.rules.length} configured rules</span>
                    <span>{rs.assessmentsCount} historical assessments</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Rule Set Detail & Rules Table */}
      {activeRuleSet && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          {/* Rule Set Header & Action Toolbar */}
          <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {activeRuleSet.name}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                  v{activeRuleSet.version}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {activeRuleSet.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {activeRuleSet.description || 'No description provided.'} • Effective from{' '}
                {new Date(activeRuleSet.effectiveFrom).toLocaleDateString()}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {activeRuleSet.status === 'DRAFT' && (
                <button
                  onClick={() => handleActivateRuleSet(activeRuleSet.id)}
                  disabled={savingAction}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Activate Rule Set
                </button>
              )}

              {activeRuleSet.status === 'ACTIVE' && (
                <button
                  onClick={() => handleArchiveRuleSet(activeRuleSet.id)}
                  disabled={savingAction}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-slate-600 hover:bg-slate-700 text-white transition disabled:opacity-50"
                >
                  <Archive className="w-3.5 h-3.5" /> Archive Rule Set
                </button>
              )}

              <button
                onClick={() => {
                  setRuleStudentType('Masu Biye');
                  setRuleMistakeCategory('');
                  setRuleThreshold(3);
                  setRuleIsActive(true);
                  setShowAddRuleModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 transition"
              >
                <Plus className="w-3.5 h-3.5" /> Add Rule
              </button>
            </div>
          </div>

          {/* Rules Breakdown by Student Type */}
          <div className="p-4 sm:p-6 space-y-6">
            {activeRuleSet.rules.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <BookMarked className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  No rules configured in this rule set yet.
                </p>
                <button
                  onClick={() => setShowAddRuleModal(true)}
                  className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition"
                >
                  Add First Rule
                </button>
              </div>
            ) : (
              // Group rules by Student Type
              Object.entries(
                activeRuleSet.rules.reduce((acc, rule) => {
                  const type = rule.studentType || 'General';
                  if (!acc[type]) acc[type] = [];
                  acc[type].push(rule);
                  return acc;
                }, {} as Record<string, Rule[]>)
              ).map(([studentType, typeRules]) => (
                <div key={studentType} className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="bg-emerald-50/70 dark:bg-emerald-950/40 px-4 py-2.5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-900 dark:text-emerald-200">
                      Student Type: {studentType}
                    </span>
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">
                      {typeRules.length} Categories Configured
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[11px] uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3 sm:px-4 font-bold">Mistake Category</th>
                          <th className="py-2.5 px-3 sm:px-4 font-bold">Disqualification Threshold</th>
                          <th className="py-2.5 px-3 sm:px-4 font-bold">Action</th>
                          <th className="py-2.5 px-3 sm:px-4 font-bold">Status</th>
                          <th className="py-2.5 px-3 sm:px-4 font-bold text-right">Manage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {typeRules.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                            <td className="py-3 px-3 sm:px-4 font-medium text-slate-900 dark:text-slate-100">
                              <span className="font-bold text-slate-950 dark:text-white">{r.mistakeCategory}</span>
                            </td>
                            <td className="py-3 px-3 sm:px-4 font-semibold text-slate-700 dark:text-slate-300">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800 font-bold">
                                {r.threshold} Mistakes
                              </span>
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-slate-600 dark:text-slate-400">
                              <span className="text-xs font-black text-red-600 dark:text-red-400 tracking-wide">
                                {r.action}
                              </span>
                            </td>
                            <td className="py-3 px-3 sm:px-4">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  r.active
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                    : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                                }`}
                              >
                                {r.active ? 'ACTIVE' : 'INACTIVE'}
                              </span>
                            </td>
                            <td className="py-3 px-3 sm:px-4 text-right">
                              <button
                                onClick={() => openEditModal(r)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              >
                                <Edit2 className="w-3.5 h-3.5" /> Edit
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Rule Set */}
      {showCreateRuleSetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" /> Create New Assessment Rule Set
              </h3>
              <button onClick={() => setShowCreateRuleSetModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRuleSet} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Rule Set Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Markazu Standard Qur'an Assessment Rules v2"
                  value={newRuleSetName}
                  onChange={(e) => setNewRuleSetName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Brief explanation of policy changes or effective context..."
                  value={newRuleSetDesc}
                  onChange={(e) => setNewRuleSetDesc(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateRuleSetModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAction}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50"
                >
                  {savingAction ? 'Creating...' : 'Create Draft Rule Set'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Rule */}
      {showAddRuleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" /> Add Assessment Rule
              </h3>
              <button onClick={() => setShowAddRuleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddRule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Student Type *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masu Biye or Masu Haddah"
                  value={ruleStudentType}
                  onChange={(e) => setRuleStudentType(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <div className="flex gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setRuleStudentType('Masu Biye')}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Masu Biye
                  </button>
                  <button
                    type="button"
                    onClick={() => setRuleStudentType('Masu Haddah')}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
                  >
                    Masu Haddah
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Mistake Category *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lahanin Kalma, Tajweed, Wasali..."
                  value={ruleMistakeCategory}
                  onChange={(e) => setRuleMistakeCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Disqualification Threshold (Mistakes) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={ruleThreshold}
                  onChange={(e) => setRuleThreshold(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  Once candidate reaches this number of mistakes in this category, they are disqualified.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ruleActiveCheck"
                  checked={ruleIsActive}
                  onChange={(e) => setRuleIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="ruleActiveCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Rule is Active
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddRuleModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAction}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50"
                >
                  {savingAction ? 'Saving...' : 'Add Rule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Rule */}
      {showEditRuleModal && editingRule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-600" /> Edit Assessment Rule
              </h3>
              <button onClick={() => setShowEditRuleModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditRule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Student Type
                </label>
                <input
                  type="text"
                  required
                  value={ruleStudentType}
                  onChange={(e) => setRuleStudentType(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Mistake Category
                </label>
                <input
                  type="text"
                  required
                  value={ruleMistakeCategory}
                  onChange={(e) => setRuleMistakeCategory(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Disqualification Threshold (Mistakes) *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={ruleThreshold}
                  onChange={(e) => setRuleThreshold(parseInt(e.target.value, 10) || 1)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="ruleActiveEditCheck"
                  checked={ruleIsActive}
                  onChange={(e) => setRuleIsActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="ruleActiveEditCheck" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Rule is Active
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditRuleModal(false)}
                  className="px-4 py-2 text-xs font-bold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAction}
                  className="px-4 py-2 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50"
                >
                  {savingAction ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Rule History & Audit Trail */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col border border-slate-200 dark:border-slate-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <History className="w-5 h-5 text-emerald-600" /> Qur’an Assessment Rule Audit Log
              </h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-3">
              {loadingAudit ? (
                <div className="text-center py-8 text-sm text-slate-500">Loading audit history...</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-8 text-sm text-slate-500">No rule audit events found.</div>
              ) : (
                auditLogs.map((log) => (
                  <div key={log.id} className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
                    <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold">{log.action}</span>
                      <span className="text-slate-400 text-[11px]">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-slate-600 dark:text-slate-300 mt-1">
                      Performed by <span className="font-semibold">{log.performedBy}</span> ({log.userRole || 'USER'})
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded mt-1.5 font-mono text-[11px] text-slate-700 dark:text-slate-300 break-words">
                      {log.details}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
