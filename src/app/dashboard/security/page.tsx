'use client';

import React, { useState } from 'react';
import { useApp } from '../../../lib/context';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  KeyRound,
  Search,
  Filter,
  Monitor,
  Smartphone,
  Globe,
  Trash2,
  UserX,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Activity,
} from 'lucide-react';
import { StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { EnterpriseTable } from '@/components/ui/EnterpriseTable';

export default function SecurityDashboardPage() {
  const { currentUser, users, auditLogs, activeSessions, unlockAccount, resetUserPassword, terminateSession, terminateAllSessions } = useApp();

  const [activeTab, setActiveTab] = useState<'audit' | 'sessions' | 'accounts'>('audit');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILURE' | 'WARNING'>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const [selectedUserForReset, setSelectedUserForReset] = useState<string | null>(null);
  const [newTempPassInput, setNewTempPassInput] = useState('Markazu@2026!');
  const [resetNotice, setResetNotice] = useState('');

  // Check RBAC
  if (currentUser.role !== 'ADMIN' && currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-[#042419] border border-rose-500/30 text-center space-y-4 font-sans">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold uppercase text-slate-900 dark:text-white">Access Denied</h2>
        <p className="text-xs text-rose-600 dark:text-rose-300 max-w-md mx-auto">
          You do not have permission to view the Security & Audit Dashboard. This feature is restricted to Administrators.
        </p>
      </div>
    );
  }

  // Audit Filtered Data
  const filteredAuditLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.performedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.ipAddress.includes(searchQuery);

    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter;
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;

    return matchesSearch && matchesStatus && matchesAction;
  });

  const lockedAccounts = users.filter((u) => u.isLocked || u.status === 'LOCKED');

  const handleAdminPasswordResetSubmit = (userId: string) => {
    resetUserPassword(userId, newTempPassInput);
    setResetNotice(`Password reset successfully for user ID ${userId}. Temporary password set to: ${newTempPassInput}`);
    setTimeout(() => setResetNotice(''), 4000);
    setSelectedUserForReset(null);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Security KPI Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Sessions"
          value={activeSessions.length}
          subtitle="Connected devices & browsers"
          icon={<Activity className="w-4 h-4" />}
          variant="emerald"
        />

        <StatCard
          title="Locked Accounts"
          value={lockedAccounts.length}
          subtitle="Failed login lockouts"
          icon={<Lock className="w-4 h-4" />}
          variant="amber"
        />

        <StatCard
          title="Audit Logs Recorded"
          value={auditLogs.length}
          subtitle="Real-time security trail"
          icon={<Clock className="w-4 h-4" />}
          variant="purple"
        />

        <StatCard
          title="Encryption Standard"
          value="Argon2id"
          subtitle="Salted password hashing"
          icon={<ShieldCheck className="w-4 h-4" />}
          variant="sky"
        />
      </div>

      {resetNotice && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{resetNotice}</span>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center justify-between flex-wrap gap-4 border-b border-emerald-500/20 pb-3">
            <div className="flex items-center gap-2 bg-slate-200/70 dark:bg-[#021810] p-1 rounded-2xl border border-slate-300 dark:border-emerald-500/20 text-xs font-bold">
              <button
                onClick={() => setActiveTab('audit')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'audit'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-gray-400 hover:text-emerald-500'
                }`}
              >
                System Audit Logs
              </button>
              <button
                onClick={() => setActiveTab('sessions')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'sessions'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-gray-400 hover:text-emerald-500'
                }`}
              >
                Active Sessions ({activeSessions.length})
              </button>
              <button
                onClick={() => setActiveTab('accounts')}
                className={`px-4 py-2 rounded-xl transition-all ${
                  activeTab === 'accounts'
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'text-slate-600 dark:text-gray-400 hover:text-emerald-500'
                }`}
              >
                User Account Security
              </button>
            </div>
          </div>

          {/* TAB 1: SYSTEM AUDIT LOGS */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              {/* Search & Filter Bar */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3.5 text-slate-400 dark:text-emerald-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by user, action, IP, or details..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#062c1e] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="relative">
                  <Filter className="w-4 h-4 absolute left-3 top-3.5 text-slate-400 dark:text-emerald-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#062c1e] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="SUCCESS">SUCCESS</option>
                    <option value="FAILURE">FAILURE</option>
                    <option value="WARNING">WARNING</option>
                  </select>
                </div>

                <div className="relative">
                  <Filter className="w-4 h-4 absolute left-3 top-3.5 text-slate-400 dark:text-emerald-400" />
                  <select
                    value={actionFilter}
                    onChange={(e) => setActionFilter(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white dark:bg-[#062c1e] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="ALL">All Actions</option>
                    <option value="AUTHENTICATION_SUCCESS">AUTHENTICATION_SUCCESS</option>
                    <option value="FAILED_LOGIN_ATTEMPT">FAILED_LOGIN_ATTEMPT</option>
                    <option value="PASSWORD_CHANGED">PASSWORD_CHANGED</option>
                    <option value="ACCOUNT_CREATED">ACCOUNT_CREATED</option>
                    <option value="ATTENDANCE_RECORDED">ATTENDANCE_RECORDED</option>
                    <option value="TAHFIZ_ENTRY_ADDED">TAHFIZ_ENTRY_ADDED</option>
                  </select>
                </div>
              </div>

              {/* Audit Table */}
              <div className="glass-panel border border-emerald-500/30 rounded-3xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 dark:bg-[#021810] text-slate-700 dark:text-emerald-400 uppercase font-bold border-b border-emerald-500/20">
                      <tr>
                        <th className="p-4">Timestamp</th>
                        <th className="p-4">User & Role</th>
                        <th className="p-4">Action</th>
                        <th className="p-4">Details</th>
                        <th className="p-4">IP & Client</th>
                        <th className="p-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-500/10">
                      {filteredAuditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-emerald-500/5 transition-colors">
                          <td className="p-4 text-slate-500 dark:text-gray-400 whitespace-nowrap">{log.timestamp}</td>
                          <td className="p-4">
                            <p className="font-bold text-slate-900 dark:text-white">{log.performedBy}</p>
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{log.userRole}</span>
                          </td>
                          <td className="p-4 font-mono text-[11px] font-bold text-slate-800 dark:text-emerald-300">{log.action}</td>
                          <td className="p-4 text-slate-600 dark:text-gray-300 max-w-xs truncate" title={log.details}>
                            {log.details}
                          </td>
                          <td className="p-4">
                            <p className="font-mono text-[11px] text-slate-700 dark:text-gray-300">{log.ipAddress}</p>
                            <span className="text-[10px] text-slate-500 dark:text-gray-400">{log.browser || 'Browser'} / {log.os || 'OS'}</span>
                          </td>
                          <td className="p-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                log.status === 'SUCCESS'
                                  ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : log.status === 'FAILURE'
                                  ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30'
                                  : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ACTIVE SESSIONS */}
          {activeTab === 'sessions' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeSessions.map((session) => (
                  <div key={session.sessionId} className="p-5 rounded-2xl glass-panel border border-emerald-500/30 space-y-4 shadow-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                          {session.device === 'Mobile' ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                        </div>
                        <div>
                          <h3 className="font-bold text-sm text-slate-900 dark:text-white">{session.userName}</h3>
                          <p className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">{session.userRole}</p>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase">
                        Active Now
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 dark:text-gray-300">
                      <div>
                        <span className="text-[10px] text-slate-400 block">IP Address</span>
                        <span className="font-mono">{session.ipAddress}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Client Environment</span>
                        <span>{session.browser} ({session.os})</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Session Created</span>
                        <span>{session.createdAt}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Last Activity</span>
                        <span>{session.lastActiveAt}</span>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center gap-2">
                      <button
                        onClick={() => terminateSession(session.sessionId)}
                        className="flex-1 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Force Logout Device</span>
                      </button>

                      <button
                        onClick={() => terminateAllSessions(session.userId)}
                        className="py-2 px-3 rounded-xl bg-slate-200 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-700 dark:text-emerald-300 text-xs font-bold hover:bg-slate-300 dark:hover:bg-emerald-900/40"
                        title="Revoke all sessions for this user"
                      >
                        <UserX className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: USER ACCOUNT SECURITY */}
          {activeTab === 'accounts' && (
            <div className="space-y-4">
              <div className="glass-panel border border-emerald-500/30 rounded-3xl overflow-hidden shadow-xl">
                <div className="p-4 bg-slate-100 dark:bg-[#021810] border-b border-emerald-500/20 flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                    Registered Accounts & Lockout Controls
                  </h3>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                    Total Users: {users.length}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-[#032015] text-slate-700 dark:text-emerald-400 uppercase font-bold border-b border-emerald-500/20">
                      <tr>
                        <th className="p-4">User Name</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Role</th>
                        <th className="p-4">Lockout Status</th>
                        <th className="p-4">First Login State</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-500/10">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-emerald-500/5 transition-colors">
                          <td className="p-4 font-bold text-slate-900 dark:text-white">{u.name}</td>
                          <td className="p-4 font-mono text-slate-600 dark:text-gray-300">{u.email}</td>
                          <td className="p-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              {u.role}
                            </span>
                          </td>
                          <td className="p-4">
                            {u.isLocked || u.status === 'LOCKED' ? (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 uppercase flex items-center gap-1 w-fit">
                                <Lock className="w-3 h-3" /> Locked out
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 uppercase">
                                Normal
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            {u.isFirstLogin ? (
                              <span className="text-amber-500 font-bold">Pending Change</span>
                            ) : (
                              <span className="text-slate-400">Completed</span>
                            )}
                          </td>
                          <td className="p-4 text-right space-x-2">
                            {u.isLocked && (
                              <button
                                onClick={() => unlockAccount(u.id)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-500 transition-all inline-flex items-center gap-1"
                              >
                                <Unlock className="w-3 h-3" />
                                <span>Unlock Account</span>
                              </button>
                            )}

                            <button
                              onClick={() => setSelectedUserForReset(u.id)}
                              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-800 text-slate-800 dark:text-emerald-200 font-bold text-[10px] hover:bg-slate-300 dark:hover:bg-emerald-900 inline-flex items-center gap-1"
                            >
                              <KeyRound className="w-3 h-3" />
                              <span>Reset Password</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Password Reset Modal for Selected User */}
              {selectedUserForReset && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="max-w-md w-full glass-panel border border-emerald-500/30 rounded-3xl p-6 space-y-4 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">Admin Reset Password</h3>
                      <button onClick={() => setSelectedUserForReset(null)} className="text-slate-400 hover:text-white">
                        ✕
                      </button>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-emerald-300/80">
                      Generating a new temporary password for user ID: <span className="font-mono">{selectedUserForReset}</span>. This will force a mandatory password change on their next login.
                    </p>

                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-gray-300">Temporary Password</label>
                      <input
                        type="text"
                        value={newTempPassInput}
                        onChange={(e) => setNewTempPassInput(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#062c1e] border border-slate-300 dark:border-emerald-500/30 text-xs font-mono text-slate-900 dark:text-white"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setSelectedUserForReset(null)}
                        className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-emerald-950 text-slate-700 dark:text-gray-300 text-xs font-bold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleAdminPasswordResetSubmit(selectedUserForReset)}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-md"
                      >
                        Apply Reset & Send Email
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
    </div>
  );
}
