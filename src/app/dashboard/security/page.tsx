'use client';

import React, { useState } from 'react';
import { useApp } from '../../../lib/context';
import { User, UserRole } from '../../../types';
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
  UserPlus,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  Activity,
  Plus,
  Building2,
} from 'lucide-react';
import { StatCard } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { PermanentDeleteModal } from '@/components/users/PermanentDeleteModal';

export default function SecurityDashboardPage() {
  const {
    currentUser,
    users,
    deactivatedUsers,
    fetchDeactivatedUsers,
    restoreUserAccount,
    programmes,
    auditLogs,
    activeSessions,
    unlockAccount,
    resetUserPassword,
    terminateSession,
    terminateAllSessions,
    createUserAccount,
    deleteUserAccount,
    notify,
    showConfirm,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'audit' | 'sessions' | 'accounts'>('accounts');
  const [accountSubTab, setAccountSubTab] = useState<'ACTIVE' | 'DEACTIVATED'>('ACTIVE');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SUCCESS' | 'FAILURE' | 'WARNING'>('ALL');
  const [actionFilter, setActionFilter] = useState<string>('ALL');

  const [selectedUserForReset, setSelectedUserForReset] = useState<string | null>(null);
  const [newTempPassInput, setNewTempPassInput] = useState('Markazu@2026!');
  const [resetNotice, setResetNotice] = useState('');
  const [deactivatedCollisionUser, setDeactivatedCollisionUser] = useState<any | null>(null);
  const [permanentDeleteTarget, setPermanentDeleteTarget] = useState<User | null>(null);

  // Create User Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newRole, setNewRole] = useState<UserRole>('ADMIN');
  const [newProgrammeId, setNewProgrammeId] = useState('prog-01');
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);

  React.useEffect(() => {
    fetchDeactivatedUsers();
  }, []);

  // Check RBAC - Strictly Super Admin Only
  if (currentUser.role !== 'SUPER_ADMIN') {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-[#042419] border border-rose-500/30 text-center space-y-4 font-sans">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold uppercase text-slate-900 dark:text-white">Access Restricted</h2>
        <p className="text-xs text-rose-600 dark:text-rose-300 max-w-md mx-auto">
          User Account Management & System Security Controls are strictly restricted to the Super Administrator.
        </p>
      </div>
    );
  }

  const handleAdminPasswordResetSubmit = (userId: string) => {
    resetUserPassword(userId, newTempPassInput);
    setResetNotice(`Password reset successfully for user ID ${userId}. Temporary password set to: ${newTempPassInput}`);
    setTimeout(() => setResetNotice(''), 4000);
    setSelectedUserForReset(null);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newEmail.trim()) {
      notify({ type: 'error', title: 'Form Incomplete', message: 'Please enter both full name and email address.' });
      return;
    }

    setIsSubmittingCreate(true);
    setDeactivatedCollisionUser(null);

    try {
      const selectedProg = programmes.find((p) => p.id === newProgrammeId);
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          email: newEmail.trim().toLowerCase(),
          phone: newPhone.trim(),
          role: newRole,
          assignedProgrammeId: newRole === 'HEADMASTER' ? newProgrammeId : undefined,
          assignedProgrammeName: newRole === 'HEADMASTER' ? (selectedProg?.programme_name_english || selectedProg?.programme_name) : undefined,
        }),
      });

      const resData = await res.json();
      if (!res.ok) {
        if (res.status === 409 && resData.isDeactivated) {
          setDeactivatedCollisionUser(resData.deactivatedUser);
          notify({
            type: 'warning',
            title: 'Deactivated Account Found',
            message: 'This email belongs to a previously deactivated account.',
          });
          return;
        }
        throw new Error(resData.error || 'Failed to create user account');
      }

      notify({
        type: 'success',
        title: 'User Account Created',
        message: `System account created for ${newName} (${newRole}). Login credentials configured successfully.`,
      });

      setShowCreateModal(false);
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      setNewRole('ADMIN');
      setNewProgrammeId(programmes[0]?.id || 'prog-01');
      fetchDeactivatedUsers();
    } catch (err: any) {
      notify({
        type: 'error',
        title: 'Account Creation Failed',
        message: err.message || 'Could not create user account.',
      });
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  // Audit Filtered Data & Locked Accounts
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
              {/* Account Sub-Tabs Header */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2 bg-slate-200/70 dark:bg-[#021810] p-1 rounded-2xl border border-slate-300 dark:border-emerald-500/20 text-xs font-bold">
                  <button
                    onClick={() => setAccountSubTab('ACTIVE')}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                      accountSubTab === 'ACTIVE'
                        ? 'bg-emerald-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-gray-400 hover:text-emerald-500'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Active Accounts ({users.length})</span>
                  </button>
                  <button
                    onClick={() => {
                      setAccountSubTab('DEACTIVATED');
                      fetchDeactivatedUsers();
                    }}
                    className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 ${
                      accountSubTab === 'DEACTIVATED'
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'text-slate-600 dark:text-gray-400 hover:text-rose-400'
                    }`}
                  >
                    <UserX className="w-3.5 h-3.5" />
                    <span>Deactivated Accounts ({deactivatedUsers.length})</span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-900/30 transition-all"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Create User Account</span>
                  </button>
                </div>
              </div>

              {/* Sub-Tab 1: ACTIVE ACCOUNTS */}
              {accountSubTab === 'ACTIVE' && (
                <div className="glass-panel border border-emerald-500/30 rounded-3xl overflow-hidden shadow-xl">
                  <div className="p-4 bg-slate-100 dark:bg-[#021810] border-b border-emerald-500/20 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white">
                        Active System User Accounts
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-emerald-400/80">
                        Active login credentials for School Admins, Section Headmasters, Teachers, Parents, and Students.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 dark:bg-[#032015] text-slate-700 dark:text-emerald-400 uppercase font-bold border-b border-emerald-500/20">
                        <tr>
                          <th className="p-4">User Name</th>
                          <th className="p-4">Email / Username</th>
                          <th className="p-4">Role</th>
                          <th className="p-4">Assigned Section</th>
                          <th className="p-4">Lockout Status</th>
                          <th className="p-4">Password Status</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-emerald-500/10">
                        {users.map((u) => (
                          <tr key={u.id} className="hover:bg-emerald-500/5 transition-colors">
                            <td className="p-4 font-bold text-slate-900 dark:text-white">{u.name}</td>
                            <td className="p-4 font-mono text-slate-600 dark:text-gray-300">
                              <div>{u.email}</div>
                              {u.username && (
                                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                                  @{u.username}
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                                u.role === 'SUPER_ADMIN'
                                  ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30'
                                  : u.role === 'ADMIN'
                                  ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/30'
                                  : u.role === 'HEADMASTER'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="p-4 text-slate-600 dark:text-gray-300 font-medium">
                              {u.assignedProgrammeName ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-500/20">
                                  {u.assignedProgrammeName}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[10px]">All Programs</span>
                              )}
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
                              {u.isFirstLogin || u.mustChangePassword ? (
                                <span className="text-amber-500 font-bold text-[10px] flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Mandatory Change Pending
                                </span>
                              ) : (
                                <span className="text-emerald-500 text-[10px] font-semibold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Verified
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right space-x-2">
                              {u.isLocked && (
                                <button
                                  onClick={() => unlockAccount(u.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-500 transition-all inline-flex items-center gap-1"
                                >
                                  <Unlock className="w-3 h-3" />
                                  <span>Unlock</span>
                                </button>
                              )}

                              <button
                                onClick={() => setSelectedUserForReset(u.id)}
                                className="px-2.5 py-1.5 rounded-lg bg-slate-200 dark:bg-emerald-950 border border-slate-300 dark:border-emerald-800 text-slate-800 dark:text-emerald-200 font-bold text-[10px] hover:bg-slate-300 dark:hover:bg-emerald-900 inline-flex items-center gap-1"
                              >
                                <KeyRound className="w-3 h-3" />
                                <span>Reset Pass</span>
                              </button>

                              {u.role !== 'SUPER_ADMIN' && (
                                <button
                                  onClick={() =>
                                    showConfirm({
                                      title: 'Confirm Account Deactivation',
                                      message: `Are you sure you want to deactivate the account for "${u.name}" (${u.role})? The account will be soft-deactivated and login access revoked, while all historical attendance, grades, and records are preserved.`,
                                      confirmText: 'Yes, Deactivate Account',
                                      cancelText: 'Cancel',
                                      variant: 'danger',
                                      onConfirm: () => deleteUserAccount(u.id),
                                    })
                                  }
                                  className="px-2.5 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 font-bold text-[10px] transition-all inline-flex items-center gap-1"
                                  title="Deactivate user account"
                                >
                                  <UserX className="w-3 h-3" />
                                  <span>Deactivate</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Sub-Tab 2: DEACTIVATED ACCOUNTS */}
              {accountSubTab === 'DEACTIVATED' && (
                <div className="glass-panel border border-rose-500/30 rounded-3xl overflow-hidden shadow-xl">
                  <div className="p-4 bg-slate-100 dark:bg-[#021810] border-b border-rose-500/20 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-xs uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        Deactivated System Accounts Archive
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-emerald-400/80">
                        Deactivated user accounts. Restoring an account reactivates login eligibility and directory visibility while retaining 100% of historical records.
                      </p>
                    </div>
                  </div>

                  {deactivatedUsers.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 dark:text-emerald-300/70">
                      No deactivated accounts found.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-[#032015] text-slate-700 dark:text-rose-400 uppercase font-bold border-b border-rose-500/20">
                          <tr>
                            <th className="p-4">User Name</th>
                            <th className="p-4">Email / Username</th>
                            <th className="p-4">Role</th>
                            <th className="p-4">Deactivation Status</th>
                            <th className="p-4 text-right">Restore Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-rose-500/10">
                          {deactivatedUsers.map((u) => (
                            <tr key={u.id} className="hover:bg-rose-500/5 transition-colors">
                              <td className="p-4 font-bold text-slate-900 dark:text-white">{u.name}</td>
                              <td className="p-4 font-mono text-slate-600 dark:text-gray-300">
                                <div>{u.email}</div>
                                {u.username && (
                                  <span className="text-[10px] text-rose-400 font-semibold block">
                                    @{u.username}
                                  </span>
                                )}
                              </td>
                              <td className="p-4">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold border bg-rose-500/10 text-rose-500 border-rose-500/30">
                                  {u.role}
                                </span>
                              </td>
                              <td className="p-4">
                                <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 uppercase flex items-center gap-1 w-fit">
                                  <UserX className="w-3 h-3" /> Deactivated
                                </span>
                              </td>
                              <td className="p-4 text-right space-x-2">
                                <button
                                  onClick={() =>
                                    showConfirm({
                                      title: 'Confirm Account Restoration',
                                      message: `Are you sure you want to restore the account for "${u.name}" (${u.role})? This will reactivate login eligibility and restore directory access without modifying any historical records.`,
                                      confirmText: 'Yes, Restore Account',
                                      cancelText: 'Cancel',
                                      variant: 'info',
                                      onConfirm: async () => {
                                        await restoreUserAccount(u.id);
                                      },
                                    })
                                  }
                                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] shadow transition-all inline-flex items-center gap-1.5"
                                >
                                  <RefreshCw className="w-3.5 h-3.5" />
                                  <span>Restore Account</span>
                                </button>

                                <button
                                  onClick={() => setPermanentDeleteTarget(u)}
                                  className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-[11px] shadow transition-all inline-flex items-center gap-1.5"
                                  title="Permanently remove user account and dependencies from system"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Permanent Delete</span>
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Create User Modal */}
              {showCreateModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
                  <div className="max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden bg-white dark:bg-[#042419] border border-emerald-500/30 rounded-3xl shadow-2xl text-xs">
                    {/* Header (Fixed) */}
                    <div className="shrink-0 p-5 sm:p-6 border-b border-emerald-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
                        <UserPlus className="w-5 h-5 text-emerald-500" />
                        <span>Create New System Account (Super Admin)</span>
                      </div>
                      <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                        ✕
                      </button>
                    </div>

                    {/* Body (Scrollable) */}
                    <form onSubmit={handleCreateUserSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                      <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-4 text-xs">
                        {deactivatedCollisionUser && (
                          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-300 space-y-3">
                            <div className="flex items-center gap-2 font-bold text-xs">
                              <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
                              <span>This email belongs to a previously deactivated account.</span>
                            </div>
                            <div className="text-[11px] text-slate-600 dark:text-gray-300 space-y-0.5 font-mono">
                              <div>Account Name: <strong className="text-slate-900 dark:text-white">{deactivatedCollisionUser.name}</strong></div>
                              <div>Role: <strong>{deactivatedCollisionUser.role}</strong> • Email: {deactivatedCollisionUser.email}</div>
                            </div>
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={async () => {
                                  await restoreUserAccount(deactivatedCollisionUser.id);
                                  setShowCreateModal(false);
                                  setDeactivatedCollisionUser(null);
                                }}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                                <span>Restore Account</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setDeactivatedCollisionUser(null);
                                  setNewEmail('');
                                }}
                                className="px-3 py-1.5 rounded-xl bg-slate-200 dark:bg-emerald-950 text-slate-700 dark:text-gray-300 font-bold text-xs"
                              >
                                Use Different Email
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="space-y-1">
                          <label className="font-bold text-slate-700 dark:text-gray-300">Full Name *</label>
                          <input
                            type="text"
                            required
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="e.g. Malam Ahmad Kabir"
                            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#062c1e] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700 dark:text-gray-300">Official Email Address *</label>
                            <input
                              type="email"
                              required
                              value={newEmail}
                              onChange={(e) => setNewEmail(e.target.value)}
                              placeholder="user@markazuumar.edu.ng"
                              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#062c1e] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white font-mono"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="font-bold text-slate-700 dark:text-gray-300">Phone Number</label>
                            <input
                              type="text"
                              value={newPhone}
                              onChange={(e) => setNewPhone(e.target.value)}
                              placeholder="+234 803 123 4567"
                              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#062c1e] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-bold text-slate-700 dark:text-gray-300">Account Role *</label>
                            <select
                              value={newRole}
                              onChange={(e) => setNewRole(e.target.value as UserRole)}
                              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#062c1e] border border-slate-300 dark:border-emerald-500/30 text-xs font-bold text-slate-900 dark:text-white"
                            >
                              <option value="SUPER_ADMIN">Super Administrator (SUPER_ADMIN)</option>
                              <option value="ADMIN">School Administrator (ADMIN)</option>
                              <option value="HEADMASTER">Section Headmaster (HEADMASTER)</option>
                              <option value="TEACHER">Teacher (TEACHER)</option>
                              <option value="PARENT">Parent (PARENT)</option>
                              <option value="STUDENT">Student (STUDENT)</option>
                            </select>
                          </div>

                          {newRole === 'HEADMASTER' && (
                            <div className="space-y-1">
                              <label className="font-bold text-amber-500 dark:text-amber-400">Assigned School Section *</label>
                              <select
                                value={newProgrammeId}
                                onChange={(e) => setNewProgrammeId(e.target.value)}
                                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-[#062c1e] border border-amber-500/50 text-xs font-bold text-slate-900 dark:text-white"
                              >
                                {programmes.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.programme_name_english} ({p.programme_code})
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-700 dark:text-emerald-300 space-y-1">
                          <p className="font-bold flex items-center gap-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Credentials & Email Dispatch Notice</span>
                          </p>
                          <p>
                            System will generate a unique Username and Temporary Password. A welcome notification email will be dispatched to <span className="font-mono font-bold">{newEmail || 'the user email'}</span>. Mandatory password change will be enforced on first login.
                          </p>
                        </div>
                      </div>

                      {/* Footer (Fixed) */}
                      <div className="shrink-0 p-4 sm:p-5 border-t border-emerald-500/20 flex justify-end gap-2 bg-slate-50/50 dark:bg-[#021810]">
                        <button
                          type="button"
                          onClick={() => setShowCreateModal(false)}
                          className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-emerald-950 text-slate-700 dark:text-gray-300 text-xs font-bold"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingCreate}
                          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg"
                        >
                          {isSubmittingCreate ? 'Creating Account...' : 'Dispatch & Create Account'}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {/* Password Reset Modal for Selected User */}
              {selectedUserForReset && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
                  <div className="max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden bg-white dark:bg-[#042419] border border-emerald-500/30 rounded-3xl shadow-2xl text-xs">
                    {/* Header (Fixed) */}
                    <div className="shrink-0 p-5 sm:p-6 border-b border-emerald-500/20 flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">Admin Reset Password</h3>
                      <button onClick={() => setSelectedUserForReset(null)} className="text-slate-400 hover:text-white">
                        ✕
                      </button>
                    </div>

                    {/* Body (Scrollable) */}
                    <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-4">
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
                    </div>

                    {/* Footer (Fixed) */}
                    <div className="shrink-0 p-4 sm:p-5 border-t border-emerald-500/20 flex justify-end gap-2 bg-slate-50/50 dark:bg-[#021810]">
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

      <PermanentDeleteModal
        user={permanentDeleteTarget}
        isOpen={Boolean(permanentDeleteTarget)}
        onClose={() => setPermanentDeleteTarget(null)}
        onSuccess={() => {
          fetchDeactivatedUsers();
        }}
      />
    </div>
  );
}
