import { NextRequest, NextResponse } from 'next/server';
import { MOCK_USERS } from '../../../../lib/mockData';
import { verifyResetToken, markResetTokenUsed, validatePasswordPolicy, isPasswordInHistory, recordPasswordInHistory, hashPassword } from '../../../../lib/security';
import { sendSystemEmail } from '../../../../lib/emailService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = (body.token || '').trim();
    const newPassword = body.newPassword || '';

    // Verify token
    const tokenVerification = verifyResetToken(token);
    if (!tokenVerification.isValid || !tokenVerification.userId) {
      return NextResponse.json({ error: tokenVerification.error || 'Invalid or expired reset token' }, { status: 400 });
    }

    // Validate Password Policy
    const policyResult = validatePasswordPolicy(newPassword);
    if (!policyResult.isValid) {
      return NextResponse.json(
        { error: 'Password does not meet enterprise security policy rules', details: policyResult.errors },
        { status: 400 }
      );
    }

    // Check Password History Reuse
    if (isPasswordInHistory(tokenVerification.userId, newPassword)) {
      return NextResponse.json(
        { error: 'You cannot reuse one of your last 5 passwords. Please choose a new password.' },
        { status: 400 }
      );
    }

    const targetEmail = (tokenVerification.email || 'markazuumarbnkhaddabdaneji@gmail.com').toLowerCase();
    const primaryUser = MOCK_USERS.find((u) => u.id === tokenVerification.userId || u.email.toLowerCase() === targetEmail);

    if (!primaryUser) {
      return NextResponse.json({ error: 'User record not found' }, { status: 404 });
    }

    const newHash = hashPassword(newPassword);

    // Update all matching accounts sharing this email or userId
    MOCK_USERS.forEach((u) => {
      if (u.id === tokenVerification.userId || u.email.toLowerCase() === targetEmail) {
        u.passwordHash = newHash;
        u.isFirstLogin = false;
        u.mustChangePassword = false;
        u.failedLoginAttempts = 0;
        u.isLocked = false;
        recordPasswordInHistory(u.id, newHash);
      }
    });

    markResetTokenUsed(token);

    // Send confirmation email
    await sendSystemEmail({
      to: primaryUser.email,
      recipientName: primaryUser.name,
      subject: 'Password Changed Successfully - Markazu Umar Portal',
      template: 'PASSWORD_CHANGED_CONFIRMATION',
    });

    return NextResponse.json({
      message: 'Your password has been successfully reset. You can now log in with your new password.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 400 });
  }
}
