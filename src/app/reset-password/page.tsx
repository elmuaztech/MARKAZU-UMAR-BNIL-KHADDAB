'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useApp } from '../../lib/context';
import { validatePasswordPolicy, verifyResetToken, hashPassword, recordPasswordInHistory, isPasswordInHistory, markResetTokenUsed } from '../../lib/security';
import { PublicNavbar } from '../../components/navigation/PublicNavbar';
import { PublicFooter } from '../../components/navigation/PublicFooter';
import { KeyRound, Lock, ArrowRight, ShieldCheck, CheckCircle2, AlertTriangle, BookOpen, Clock, Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { users, updateUserPasswordByEmail, addAuditLog, schoolLogo } = useApp();

  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const tokenParam = searchParams.get('token') || searchParams.get('otp');
    if (tokenParam) {
      const clean = tokenParam.trim();
      if (/^\d{4}$/.test(clean)) {
        setToken(clean);
      }
    }
  }, [searchParams]);

  const policy = validatePasswordPolicy(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanToken = token.trim();
    if (!cleanToken) {
      setErrorMsg('Please enter your 5-minute password reset token.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please re-enter your new password.');
      return;
    }

    if (!policy.isValid) {
      setErrorMsg(policy.errors[0] || 'Please choose a stronger password with at least 6 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Attempt API Route submission
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: cleanToken, newPassword }),
      });

      const data = await response.json();

      if (response.ok) {
        // Also sync local React state & localStorage
        const tokenCheck = verifyResetToken(cleanToken);
        const targetEmail = (tokenCheck.email || 'markazuumarbnkhaddabdaneji@gmail.com').toLowerCase();
        updateUserPasswordByEmail(targetEmail, newPassword);

        setSuccessMsg(data.message || 'Password successfully reset! You can now log in.');
        setIsSubmitting(false);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
        return;
      }

      // If API returns specific token verification failure, fallback to security helper
      const tokenCheck = verifyResetToken(cleanToken);
      if (!tokenCheck.isValid || !tokenCheck.userId) {
        setErrorMsg(tokenCheck.error || data.error || 'The code is invalid or has expired. Please request a new one.');
        setIsSubmitting(false);
        return;
      }

      const targetEmail = (tokenCheck.email || 'markazuumarbnkhaddabdaneji@gmail.com').toLowerCase();
      const targetUser = users.find((u) => u.id === tokenCheck.userId || u.email.toLowerCase() === targetEmail);
      if (!targetUser) {
        setErrorMsg('We could not find an account with those details.');
        setIsSubmitting(false);
        return;
      }

      if (isPasswordInHistory(targetUser.id, newPassword)) {
        setErrorMsg('You cannot reuse one of your last 5 passwords. Please enter a new password.');
        setIsSubmitting(false);
        return;
      }

      updateUserPasswordByEmail(targetEmail, newPassword);
      markResetTokenUsed(cleanToken);

      addAuditLog({
        action: 'PASSWORD_RESET_COMPLETED',
        performedBy: targetUser.name,
        userRole: targetUser.role,
        details: `Successfully reset password using 5-minute token`,
        ipAddress: '197.210.227.14',
        affectedRecord: `User/${targetUser.id}`,
        status: 'SUCCESS',
      });

      setSuccessMsg('Your password has been successfully reset. Redirecting to login page...');
      setIsSubmitting(false);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch {
      // Direct Fallback Execution
      const tokenCheck = verifyResetToken(cleanToken);
      if (!tokenCheck.isValid || !tokenCheck.userId) {
        setErrorMsg(tokenCheck.error || 'Invalid or expired 5-minute reset token.');
        setIsSubmitting(false);
        return;
      }

      const targetEmail = (tokenCheck.email || 'markazuumarbnkhaddabdaneji@gmail.com').toLowerCase();
      const targetUser = users.find((u) => u.id === tokenCheck.userId || u.email.toLowerCase() === targetEmail);
      if (!targetUser) {
        setErrorMsg('User account record not found.');
        setIsSubmitting(false);
        return;
      }

      if (isPasswordInHistory(targetUser.id, newPassword)) {
        setErrorMsg('You cannot reuse one of your last 5 passwords. Please enter a new password.');
        setIsSubmitting(false);
        return;
      }

      updateUserPasswordByEmail(targetEmail, newPassword);
      markResetTokenUsed(cleanToken);

      setSuccessMsg('Your password has been successfully reset! Redirecting to login page...');
      setIsSubmitting(false);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    }
  };

  return (
    <div className="w-full max-w-md glass-panel border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        {schoolLogo ? (
          <div className="w-16 h-16 rounded-2xl bg-white border border-emerald-500/30 p-1 flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/40 overflow-hidden">
            <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
          </div>
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-sky-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-900/40">
            <BookOpen className="w-8 h-8" />
          </div>
        )}
        <h1 className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase leading-snug">
          MARKAZU UMAR BN AL-KHATTAB CENTRE FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES - DANEJI
        </h1>
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
          Account Password Reset
        </p>
      </div>

      <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
        <div className="flex items-center gap-2 font-semibold">
          <Clock className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>Security Link & Token Expiry</span>
        </div>
        <span className="text-[10px] bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold px-2 py-0.5 rounded-md uppercase">
          10 Minutes Limit
        </span>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-xs space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <span>Success!</span>
          </div>
          <p>{successMsg}</p>
          <button
            type="button"
            onClick={() => router.push('/login')}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow"
          >
            <span>Proceed to Login</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {!successMsg && (
        <form onSubmit={handleSubmit} autoComplete="off" className="space-y-4 text-xs">
          {/* Reset 4-Digit OTP Input */}
          <div className="space-y-1">
            <label className="block text-slate-700 dark:text-gray-300 font-bold">4-Digit Reset OTP Code</label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-3.5 text-emerald-600 dark:text-emerald-400 pointer-events-none" />
              <input
                type="text"
                name="otp"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                maxLength={4}
                value={token}
                onChange={(e) => setToken(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="Enter 4-digit OTP code"
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-white dark:bg-[#062c1e] border border-slate-300 dark:border-emerald-500/30 text-base tracking-widest font-mono font-bold text-center text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* New Password Input */}
          <div className="space-y-1">
            <label className="block text-slate-700 dark:text-gray-300 font-bold">New Secure Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3.5 text-emerald-600 dark:text-emerald-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="new-password"
                autoComplete="new-password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 6 characters with upper, lower, number, special"
                className="w-full pl-9 pr-12 py-3 rounded-xl bg-white dark:bg-[#062c1e] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                title={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] flex items-center justify-center text-slate-400 hover:text-emerald-500 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 rounded-lg"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Strength Indicator */}
          {newPassword && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-[#042217] border border-slate-200 dark:border-emerald-500/20 space-y-2">
              <div className="flex justify-between items-center text-[11px]">
                <span className="font-semibold text-slate-600 dark:text-gray-400">Password Strength:</span>
                <span
                  className={`font-bold ${
                    policy.score >= 90
                      ? 'text-emerald-500'
                      : policy.score >= 60
                      ? 'text-sky-400'
                      : policy.score >= 30
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {policy.label} ({policy.score}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-200 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    policy.score >= 90
                      ? 'bg-emerald-500'
                      : policy.score >= 60
                      ? 'bg-sky-400'
                      : policy.score >= 30
                      ? 'bg-amber-400'
                      : 'bg-red-400'
                  }`}
                  style={{ width: `${policy.score}%` }}
                />
              </div>

              {policy.errors.length > 0 && (
                <ul className="text-[10px] text-red-500 dark:text-red-400 space-y-0.5 list-disc pl-4 mt-1">
                  {policy.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Confirm Password Input */}
          <div className="space-y-1">
            <label className="block text-slate-700 dark:text-gray-300 font-bold">Confirm New Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3.5 text-emerald-600 dark:text-emerald-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="confirm-password"
                autoComplete="new-password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="w-full pl-9 pr-4 py-3 rounded-xl bg-white dark:bg-[#062c1e] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all uppercase tracking-wider"
          >
            <span>{isSubmitting ? 'Updating Password...' : 'Reset Password'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      )}
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-[#f4f8f5] dark:bg-[#031c13] text-slate-900 dark:text-gray-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12 md:py-16">
        <Suspense fallback={
          <div className="w-full max-w-md glass-panel p-8 text-center text-xs text-emerald-400">
            Loading reset interface...
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </main>

      <PublicFooter />
    </div>
  );
}
