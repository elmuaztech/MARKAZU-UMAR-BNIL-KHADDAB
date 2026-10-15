'use client';

import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import {
  Eye,
  Search,
  Filter,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  X,
  ArrowRight,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface ImpersonateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: User[];
  preselectedUser?: User | null;
  onImpersonationSuccess: (targetUser: User) => void;
}

export function ImpersonateUserModal({
  isOpen,
  onClose,
  users,
  preselectedUser,
  onImpersonationSuccess,
}: ImpersonateUserModalProps) {
  const [selectedUser, setSelectedUser] = useState<User | null>(preselectedUser || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    if (preselectedUser) {
      setSelectedUser(preselectedUser);
    }
  }, [preselectedUser]);

  if (!isOpen) return null;

  // Filter out other Super Admins and deactivated accounts
  const eligibleUsers = users.filter((u) => {
    if (u.role === 'SUPER_ADMIN') return false;
    if (u.status !== 'ACTIVE' && (u as any).deletedAt) return false;

    if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.assignedProgrammeName && u.assignedProgrammeName.toLowerCase().includes(q))
    );
  });

  const handleStartImpersonation = async () => {
    if (!selectedUser) return;
    try {
      setIsLoading(true);
      setErrorMessage(null);

      const res = await fetch('/api/auth/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: selectedUser.id }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start impersonation session.');
      }

      onImpersonationSuccess(selectedUser);
      // Hard refresh to reload application session state and active dashboard
      window.location.href = '/dashboard';
    } catch (err: any) {
      setErrorMessage(err.message || 'An unexpected error occurred while initiating impersonation.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
      <div className="max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden bg-white dark:bg-[#042419] border border-amber-500/40 rounded-3xl shadow-2xl text-xs">
        {/* Header */}
        <div className="shrink-0 p-5 sm:p-6 border-b border-slate-200 dark:border-emerald-500/20 flex items-center justify-between bg-amber-500/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                Super Admin Impersonation
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                  Secure Mode
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-emerald-300/70">
                Enter any portal in the selected user's legitimate context without modifying their password.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Security & Isolation Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-1.5 text-[11px] text-amber-900 dark:text-amber-200">
            <div className="flex items-center gap-1.5 font-bold text-amber-700 dark:text-amber-300">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Strict Security & Audit Enforcement</span>
            </div>
            <p>
              While in impersonation mode, you will experience the portal with the target user's exact permissions.
              Super Admin override privileges are suspended for security, and sensitive actions (password resets, role modification, account deletion) are blocked.
              All actions are audited to your Super Admin identity.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2 relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search by name, username, email, or section..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                aria-label="Filter by Portal / Role"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/30 text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              >
                <option value="ALL">All Portals / Roles</option>
                <option value="HEADMASTER">Headmaster Portal</option>
                <option value="TEACHER">Teacher Portal</option>
                <option value="PARENT">Parent Portal</option>
                <option value="STUDENT">Student Portal</option>
                <option value="ADMIN">Admin Portal</option>
              </select>
            </div>
          </div>

          {/* User Selection List */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {eligibleUsers.map((u) => {
              const isChosen = selectedUser?.id === u.id;
              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isChosen
                      ? 'bg-amber-500/15 border-amber-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-[#021810] border-slate-200 dark:border-emerald-500/20 hover:border-amber-400'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white truncate text-xs">{u.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-emerald-950 text-slate-700 dark:text-emerald-300">
                        {u.role}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-slate-500 dark:text-emerald-400/80 mt-0.5">
                      <span>{u.email}</span>
                      {u.username && (
                        <>
                          <span>•</span>
                          <span>ID: {u.username}</span>
                        </>
                      )}
                      {u.assignedProgrammeName && (
                        <>
                          <span>•</span>
                          <span className="text-amber-600 dark:text-amber-400 font-semibold">{u.assignedProgrammeName}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                        isChosen
                          ? 'border-amber-500 bg-amber-500 text-slate-950'
                          : 'border-slate-300 dark:border-emerald-800'
                      }`}
                    >
                      {isChosen && <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                </div>
              );
            })}

            {eligibleUsers.length === 0 && (
              <p className="text-center py-6 text-slate-400 text-xs italic">
                No matching active accounts found.
              </p>
            )}
          </div>

          {/* Selected User Summary Confirmation */}
          {selectedUser && (
            <div className="p-3.5 rounded-2xl bg-slate-100 dark:bg-[#021810] border border-amber-500/30 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-emerald-400">Target Selected:</span>
                <p className="font-bold text-slate-900 dark:text-white text-xs">
                  {selectedUser.name}{' '}
                  <span className="font-normal text-slate-500 dark:text-emerald-400">({selectedUser.role} - {selectedUser.email})</span>
                </p>
              </div>
              <Badge variant="amber">{selectedUser.role}</Badge>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-4 sm:p-5 border-t border-slate-200 dark:border-emerald-500/20 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-[#021810]">
          <Button variant="ghost" size="md" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            disabled={!selectedUser || isLoading}
            onClick={handleStartImpersonation}
            className="bg-amber-600 hover:bg-amber-500 active:bg-amber-700 text-white font-bold"
            leftIcon={<Eye className="w-4 h-4" />}
          >
            {isLoading ? 'Initiating Impersonation...' : 'Confirm & Impersonate'}
          </Button>
        </div>
      </div>
    </div>
  );
}
