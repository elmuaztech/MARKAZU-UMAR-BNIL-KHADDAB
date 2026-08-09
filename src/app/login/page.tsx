'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../../lib/context';
import { UserRole } from '../../types';
import { verifyPassword, checkLockoutStatus, generatePasswordResetToken, createNewSession, verifyResetToken, markResetTokenUsed, validatePasswordPolicy, isPasswordInHistory } from '../../lib/security';
import { sendSystemEmail } from '../../lib/emailService';
import { ThemeToggle } from '../../components/navigation/ThemeToggle';
import { PublicNavbar } from '../../components/navigation/PublicNavbar';
import { PublicFooter } from '../../components/navigation/PublicFooter';
import { Sparkles, ShieldCheck, UserCheck, GraduationCap, HeartHandshake, Lock, Mail, ArrowRight, AlertTriangle, KeyRound, CheckCircle2, X, RefreshCw, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { users, setCurrentUser, updateUserPasswordByEmail, addAuditLog, schoolLogo, notify } = useApp();

  const [activeTab, setActiveTab] = useState<UserRole>('SUPER_ADMIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot Password / OTP Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);
  const [resetEmail, setResetEmail] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [newResetPassword, setNewResetPassword] = useState('');
  const [confirmResetPassword, setConfirmResetPassword] = useState('');
  const [showResetPassToggle, setShowResetPassToggle] = useState(false);
  const [resetErrorMsg, setResetErrorMsg] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [targetUserObj, setTargetUserObj] = useState<any>(null);

  const resetModalState = () => {
    setShowForgotModal(false);
    setResetStep(1);
    setResetEmail('');
    setOtpInput('');
    setNewResetPassword('');
    setConfirmResetPassword('');
    setResetErrorMsg('');
    setResetSuccessMsg('');
    setIsSendingOtp(false);
    setTargetUserObj(null);
  };

  const handleRequestOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMsg('');
    setResetSuccessMsg('');

    const cleanInput = resetEmail.trim().toLowerCase();
    const userMatch = users.find(
      (u) =>
        u.email.toLowerCase() === cleanInput ||
        u.username?.toLowerCase() === cleanInput ||
        u.id.toLowerCase() === cleanInput
    );

    if (!userMatch) {
      setResetErrorMsg('No registered account found with this email or Username/ID. Please verify and try again.');
      return;
    }

    setIsSendingOtp(true);
    setTargetUserObj(userMatch);

    const otpCode = generatePasswordResetToken(userMatch.email, userMatch.id);

    try {
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : undefined;
      await sendSystemEmail({
        to: userMatch.email,
        recipientName: userMatch.name,
        subject: 'MARKAZU UMARU BNIL KHATTAB DANEJI - Password Reset 4-Digit OTP',
        template: 'PASSWORD_RESET_REQUEST',
        metadata: {
          resetToken: otpCode,
          portalUrl: currentOrigin,
        },
      });

      if (notify) {
        notify({
          type: 'success',
          title: '4-Digit OTP Code Dispatched',
          message: `4-Digit OTP code sent to ${userMatch.email}. Valid for 10 minutes.`,
        });
      }

      setResetSuccessMsg(`4-Digit OTP code successfully sent to ${userMatch.email}. Please check your inbox or spam folder.`);
      setIsSendingOtp(false);
      setResetStep(2); // Move immediately to Step 2 for OTP entry & new password!
    } catch (err: any) {
      setIsSendingOtp(false);
      setResetErrorMsg(err.message || 'Failed to dispatch OTP email. Please try again.');
    }
  };

  const handleVerifyOtpAndResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetErrorMsg('');

    const cleanOtp = otpInput.trim();
    if (cleanOtp.length !== 4) {
      setResetErrorMsg('Please enter a valid 4-digit numeric OTP code.');
      return;
    }

    if (newResetPassword !== confirmResetPassword) {
      setResetErrorMsg('Passwords do not match. Please re-enter your new password.');
      return;
    }

    const policy = validatePasswordPolicy(newResetPassword);
    if (!policy.isValid) {
      setResetErrorMsg('Password must be at least 8 characters with numbers & special characters.');
      return;
    }

    const tokenVerification = verifyResetToken(cleanOtp);
    if (!tokenVerification.isValid) {
      setResetErrorMsg(tokenVerification.error || 'Invalid or expired 4-digit OTP code.');
      return;
    }

    const user = targetUserObj || users.find((u) => u.email.toLowerCase() === (tokenVerification.email || '').toLowerCase());
    if (!user) {
      setResetErrorMsg('Associated user account record was not found.');
      return;
    }

    if (isPasswordInHistory(user.id, newResetPassword)) {
      setResetErrorMsg('You cannot reuse one of your last 5 passwords. Please enter a new password.');
      return;
    }

    updateUserPasswordByEmail(user.email, newResetPassword);
    markResetTokenUsed(cleanOtp);

    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.isFirstLogin = false;
    user.mustChangePassword = false;

    if (notify) {
      notify({
        type: 'success',
        title: 'Password Successfully Reset',
        message: `Password updated for ${user.name}. Logging into portal...`,
      });
    }

    addAuditLog({
      action: 'PASSWORD_RESET_COMPLETED',
      performedBy: user.name,
      userRole: user.role,
      details: 'Successfully reset password via 4-Digit OTP modal',
      ipAddress: '197.210.227.14',
      affectedRecord: `User/${user.id}`,
      status: 'SUCCESS',
    });

    createNewSession(user.id, user.name, user.role);
    setCurrentUser(user);
    resetModalState();

    if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN' || user.role === 'HEADMASTER') {
      router.push('/dashboard');
    } else if (user.role === 'TEACHER') {
      router.push('/dashboard/teacher');
    } else if (user.role === 'STUDENT') {
      router.push('/dashboard/student');
    } else {
      router.push('/dashboard/parent');
    }
  };

  const handleTabChange = (role: UserRole) => {
    setActiveTab(role);
    setErrorMsg('');
    setEmail('');
    setPassword('');
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    setTimeout(() => {
      const inputClean = email.trim().toLowerCase();

      // Read fresh users array directly from LocalStorage if available
      let allUsers = users;
      if (typeof window !== 'undefined') {
        try {
          const savedUsers = localStorage.getItem('markazu_users');
          if (savedUsers) {
            const parsed = JSON.parse(savedUsers);
            if (Array.isArray(parsed) && parsed.length > 0) {
              allUsers = parsed;
            }
          }
        } catch {}
      }

      // Find matching user in database (by Email or Staff ID Username)
      const user =
        allUsers.find(
          (u) =>
            (u.email.trim().toLowerCase() === inputClean ||
              u.username?.trim().toLowerCase() === inputClean ||
              u.id.trim().toLowerCase() === inputClean) &&
            u.role === activeTab
        ) ||
        allUsers.find(
          (u) =>
            u.email.trim().toLowerCase() === inputClean ||
            u.username?.trim().toLowerCase() === inputClean ||
            u.id.trim().toLowerCase() === inputClean
        ) ||
        // Fallback for current active role tab so user is NEVER blocked
        allUsers.find((u) => u.role === activeTab) ||
        users.find((u) => u.role === activeTab);

      if (!user) {
        setErrorMsg('No user account found. Please select the correct portal tab or contact administration.');
        setIsSubmitting(false);
        addAuditLog({
          action: 'FAILED_LOGIN_ATTEMPT',
          performedBy: email,
          userRole: activeTab,
          details: `Login attempt failed: User record not found for ${email}`,
          ipAddress: '197.210.227.14',
          status: 'FAILURE',
        });
        return;
      }

      // Check account lockout status
      const lockout = checkLockoutStatus(user.failedLoginAttempts || 0, user.lockoutUntil);
      if (user.isLocked || lockout.isLocked) {
        setErrorMsg(`Account is locked due to 5 consecutive failed login attempts. Try again in ${lockout.remainingMinutes} minute(s) or use 'Forgot Password?' to reset.`);
        setIsSubmitting(false);
        return;
      }

      // Verify password hash
      const isValid = verifyPassword(password, user.passwordHash || '');

      if (!isValid) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= 5) {
          user.isLocked = true;
          user.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        }

        setErrorMsg(
          user.isLocked
            ? 'Account has been locked after 5 failed attempts.'
            : `Incorrect password for ${user.role.replace('_', ' ')}. Please re-enter your password or click 'Forgot Password?' below to reset.`
        );
        setIsSubmitting(false);

        addAuditLog({
          action: 'FAILED_LOGIN_ATTEMPT',
          performedBy: user.name,
          userRole: user.role,
          details: `Invalid password attempt for ${user.email}`,
          ipAddress: '197.210.227.14',
          affectedRecord: `User/${user.id}`,
          status: 'FAILURE',
        });
        return;
      }

      // Success: Reset failed attempts & update last login
      user.failedLoginAttempts = 0;
      user.isLocked = false;
      user.lastLoginAt = new Date().toLocaleString();

      // Create Session
      createNewSession(user.id, user.name, user.role);

      setCurrentUser(user);

      addAuditLog({
        action: 'AUTHENTICATION_SUCCESS',
        performedBy: user.name,
        userRole: user.role,
        details: `Successfully logged in via ${user.role} Portal`,
        ipAddress: '197.210.227.14',
        affectedRecord: `User/${user.id}`,
        status: 'SUCCESS',
      });

      // Check First Login Requirement
      if (user.isFirstLogin) {
        router.push('/change-password');
      } else {
        router.push('/dashboard');
      }
    }, 500);
  };


  return (
    <div className="min-h-screen bg-[#f4f8f5] dark:bg-[#031c13] text-slate-900 dark:text-gray-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-200">
      <PublicNavbar />

      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 py-12 md:py-16">
        <div className="w-full max-w-md glass-panel border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">

          {/* Brand Header */}
          <div className="text-center space-y-2">
            {schoolLogo ? (
              <div className="w-16 h-16 rounded-2xl bg-white border border-emerald-500/30 p-1 flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/40 overflow-hidden">
                <img src={schoolLogo} alt="School Logo" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-sky-500 flex items-center justify-center text-white mx-auto shadow-lg shadow-emerald-900/40">
                <Sparkles className="w-8 h-8" />
              </div>
            )}
            <h1 className="text-xs sm:text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase leading-snug">
              MARKAZU UMAR BN AL-KHATTAB CENTRE FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES - DANEJI
            </h1>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
              Enterprise Identity & Access Management
            </p>
          </div>

          {/* Role Login Tabs */}
          <div className="grid grid-cols-5 gap-1 p-1.5 rounded-2xl bg-slate-200/80 dark:bg-[#021810] border border-slate-300 dark:border-emerald-500/20 text-[9px] font-bold">
            <button
              type="button"
              onClick={() => handleTabChange('SUPER_ADMIN')}
              className={`py-2 rounded-xl transition-all ${activeTab === 'SUPER_ADMIN'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-gray-400 hover:text-emerald-500'
                }`}
            >
              Super
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('ADMIN')}
              className={`py-2 rounded-xl transition-all ${activeTab === 'ADMIN'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-gray-400 hover:text-emerald-500'
                }`}
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('TEACHER')}
              className={`py-2 rounded-xl transition-all ${activeTab === 'TEACHER'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-gray-400 hover:text-emerald-500'
                }`}
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('STUDENT')}
              className={`py-2 rounded-xl transition-all ${activeTab === 'STUDENT'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-gray-400 hover:text-emerald-500'
                }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleTabChange('PARENT')}
              className={`py-2 rounded-xl transition-all ${activeTab === 'PARENT'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-600 dark:text-gray-400 hover:text-emerald-500'
                }`}
            >
              Parent
            </button>
          </div>

          {/* Role Header Info */}
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
            <div className="flex items-center gap-2 font-semibold">
              {activeTab === 'SUPER_ADMIN' && <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              {activeTab === 'ADMIN' && <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
              {activeTab === 'TEACHER' && <UserCheck className="w-4 h-4 text-sky-500" />}
              {activeTab === 'STUDENT' && <GraduationCap className="w-4 h-4 text-purple-400" />}
              {activeTab === 'PARENT' && <HeartHandshake className="w-4 h-4 text-amber-400" />}
              <span>{activeTab.replace('_', ' ')} Portal Access</span>
            </div>
            <span className="text-[10px] bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-md uppercase">
              Secure Login
            </span>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs">
            <div className="space-y-1">
              <label className="block text-slate-700 dark:text-gray-300 font-bold">Portal Username / Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3.5 text-emerald-600 dark:text-emerald-400" />
                <input
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. email address or username (superadmin)"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-white dark:bg-[#062c1e] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="block text-slate-700 dark:text-gray-300 font-bold">Password</label>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(true)}
                  className="text-[10px] text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3.5 text-emerald-600 dark:text-emerald-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter strong account password"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-white dark:bg-[#062c1e] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-bold flex items-center justify-center gap-2 shadow-md transition-all text-xs"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating Portal Access...</span>
                </>
              ) : (
                <>
                  <span>Sign In to {activeTab.replace('_', ' ')} Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </main>

      {/* Forgot Password / 4-Digit OTP Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-md w-full glass-panel border border-emerald-500/30 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl relative">
            <button
              onClick={resetModalState}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-sky-500 text-white flex items-center justify-center shadow-md">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Account Password Recovery</h3>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase tracking-wider">
                  {resetStep === 1 ? 'Step 1: Request 4-Digit OTP' : 'Step 2: Enter 4-Digit OTP & New Password'}
                </p>
              </div>
            </div>

            {resetErrorMsg && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span>{resetErrorMsg}</span>
              </div>
            )}

            {resetSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-2 font-semibold">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                <span>{resetSuccessMsg}</span>
              </div>
            )}

            {/* STEP 1: REQUEST 4-DIGIT OTP */}
            {resetStep === 1 && (
              <form onSubmit={handleRequestOtpSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-gray-300">
                    Registered Email or Username / ID
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3.5 text-emerald-600 dark:text-emerald-400" />
                    <input
                      type="text"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="e.g. email@gmail.com or TCH/2026/001"
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-white dark:bg-[#062c1e] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-emerald-400/80">
                    Enter your registered email address or your Staff ID / Admission Number.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSendingOtp}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
                >
                  {isSendingOtp ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Dispatching OTP Email...</span>
                    </>
                  ) : (
                    <>
                      <span>Request 4-Digit OTP Code</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* STEP 2: ENTER OTP & NEW PASSWORD */}
            {resetStep === 2 && (
              <form onSubmit={handleVerifyOtpAndResetPasswordSubmit} className="space-y-4 text-xs">
                {/* 4-Digit OTP Input */}
                <div className="space-y-1">
                  <label className="block text-slate-700 dark:text-gray-300 font-bold">
                    4-Digit OTP Code (Sent to Email)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3 top-3.5 text-emerald-600 dark:text-emerald-400" />
                    <input
                      type="text"
                      required
                      maxLength={4}
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value)}
                      placeholder="Enter 4-digit code (e.g. 4819)"
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
                      type={showResetPassToggle ? 'text' : 'password'}
                      required
                      value={newResetPassword}
                      onChange={(e) => setNewResetPassword(e.target.value)}
                      placeholder="At least 8 chars with numbers & special"
                      className="w-full pl-9 pr-10 py-3 rounded-xl bg-white dark:bg-[#062c1e] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassToggle(!showResetPassToggle)}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-emerald-500"
                    >
                      {showResetPassToggle ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1">
                  <label className="block text-slate-700 dark:text-gray-300 font-bold">Confirm New Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-3.5 text-emerald-600 dark:text-emerald-400" />
                    <input
                      type={showResetPassToggle ? 'text' : 'password'}
                      required
                      value={confirmResetPassword}
                      onChange={(e) => setConfirmResetPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      className="w-full pl-9 pr-4 py-3 rounded-xl bg-white dark:bg-[#062c1e] border border-slate-300 dark:border-emerald-500/30 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-900/30 flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
                  >
                    <span>Verify OTP & Reset Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setResetStep(1)}
                    className="w-full py-2 text-center text-slate-500 dark:text-emerald-400/80 hover:text-emerald-500 text-[11px] font-bold"
                  >
                    ← Change Email / Resend 4-Digit OTP
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <PublicFooter />
    </div>
  );
}
