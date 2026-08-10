'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../lib/context';
import { validatePasswordPolicy, verifyPassword, hashPassword } from '../../lib/security';
import { PublicNavbar } from '../../components/navigation/PublicNavbar';
import { PublicFooter } from '../../components/navigation/PublicFooter';
import { ShieldAlert, KeyRound, CheckCircle2, AlertCircle, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const { currentUser, setCurrentUser, updateUserPasswordByEmail, addAuditLog } = useApp();

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const policy = validatePasswordPolicy(newPass);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!policy.isValid) {
      setErrorMsg('New password does not meet the security policy requirements.');
      return;
    }

    if (newPass !== confirmPass) {
      setErrorMsg('New password and confirmation password do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          email: currentUser.email,
          currentPassword: currentPass,
          newPassword: newPass,
        }),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok || data.error) {
        setErrorMsg(data.error || 'Failed to update password. Please verify current password.');
        return;
      }

      const updatedUser = {
        ...currentUser,
        isFirstLogin: false,
        mustChangePassword: false,
      };
      setCurrentUser(updatedUser);

      addAuditLog({
        action: 'FIRST_LOGIN_PASSWORD_CHANGED',
        performedBy: currentUser.name,
        userRole: currentUser.role,
        details: 'User successfully replaced temporary password in database',
        ipAddress: '197.210.227.14',
        affectedRecord: `User/${currentUser.id}`,
        status: 'SUCCESS',
      });

      setSuccessMsg('Password updated successfully in database! Redirecting...');

      setTimeout(() => {
        if (currentUser.role === 'HEADMASTER') {
          router.push('/headmaster');
        } else {
          router.push('/dashboard');
        }
      }, 1200);
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Network error while updating password.');
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f8f5] dark:bg-[#031c13] text-slate-900 dark:text-gray-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12 md:py-16">
        <div className="max-w-md w-full glass-panel border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">

          {/* Top Banner Alert */}
          <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-semibold">
            <ShieldAlert className="w-6 h-6 flex-shrink-0" />
            <div>
              <p className="font-bold uppercase tracking-wider text-[10px]">Action Required: First Login</p>
              <p>You must replace your temporary password with a strong password before continuing.</p>
            </div>
          </div>

          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/20 mb-2">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">
              Create New Password
            </h1>
            <p className="text-xs text-slate-600 dark:text-emerald-300/80">
              User: <span className="font-bold text-slate-900 dark:text-white">{currentUser.name}</span> ({currentUser.email})
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Current Temporary Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-gray-300">
                Current Temporary Password
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={currentPass}
                onChange={(e) => setCurrentPass(e.target.value)}
                placeholder="Enter initial temporary password"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#062c1e] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* New Password */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 dark:text-gray-300">
                  New Strong Password
                </label>
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                >
                  {showPass ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  <span>{showPass ? 'Hide' : 'Show'}</span>
                </button>
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={newPass}
                onChange={(e) => setNewPass(e.target.value)}
                placeholder="Minimum 12 characters"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#062c1e] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Password Strength Meter */}
            {newPass.length > 0 && (
              <div className="space-y-2 p-3 rounded-xl bg-slate-100 dark:bg-[#021810] border border-slate-200 dark:border-emerald-500/20">
                <div className="flex justify-between items-center text-[10px] font-bold">
                  <span className="text-slate-600 dark:text-gray-400">Password Strength:</span>
                  <span
                    className={
                      policy.score >= 90
                        ? 'text-emerald-500 font-extrabold'
                        : policy.score >= 75
                        ? 'text-emerald-400 font-bold'
                        : policy.score >= 50
                        ? 'text-amber-500'
                        : 'text-red-500'
                    }
                  >
                    {policy.label} ({policy.score}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-gray-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      policy.score >= 90
                        ? 'bg-emerald-500'
                        : policy.score >= 75
                        ? 'bg-emerald-400'
                        : policy.score >= 50
                        ? 'bg-amber-500'
                        : 'bg-red-500'
                    }`}
                    style={{ width: `${policy.score}%` }}
                  />
                </div>

                {policy.errors.length > 0 && (
                  <ul className="text-[10px] text-red-500 dark:text-red-400 space-y-0.5 pt-1">
                    {policy.errors.map((err, i) => (
                      <li key={i} className="flex items-center gap-1">
                        <span>•</span> {err}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Confirm Password */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 dark:text-gray-300">
                Confirm New Password
              </label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={confirmPass}
                onChange={(e) => setConfirmPass(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-[#062c1e] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !policy.isValid}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2 uppercase tracking-wider"
            >
              <span>{isSubmitting ? 'Securing Account...' : 'Update & Continue'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
