import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '../../../../lib/prisma';
import { validatePasswordPolicy, hashPassword } from '../../../../lib/security';
import { sendSystemEmail } from '../../../../lib/emailService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const otp = (body.token || body.otp || '').trim();
    const newPassword = body.newPassword || '';

    if (!otp) {
      return NextResponse.json({ error: 'Please enter the verification code sent to your email.' }, { status: 400 });
    }

    if (!newPassword) {
      return NextResponse.json({ error: 'Please enter a new password.' }, { status: 400 });
    }

    // 1. Authoritative token verification strictly from PostgreSQL
    const tokenHash = crypto.createHash('sha256').update(otp).digest('hex');

    let tokenRecord: any = null;
    try {
      tokenRecord = await prisma.passwordResetToken.findFirst({
        where: {
          OR: [
            { tokenHash },
            { tokenHash: otp },
          ],
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });
    } catch (dbErr) {
      console.error('[RESET_PASSWORD_DB_ERROR]', dbErr);
      return NextResponse.json({ error: 'Database service error. Please try again.' }, { status: 500 });
    }

    const targetUser = tokenRecord?.user;

    if (!tokenRecord || !targetUser || targetUser.deletedAt || targetUser.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Invalid or expired verification code. Please request a new code.' }, { status: 400 });
    }

    // 2. Validate Password Policy
    const policyResult = validatePasswordPolicy(newPassword);
    if (!policyResult.isValid) {
      return NextResponse.json(
        { error: 'Please choose a stronger password with at least 6 characters', details: policyResult.errors },
        { status: 400 }
      );
    }

    const newHash = hashPassword(newPassword);

    // 3. Atomically update user, mark token as used, record history, and revoke sessions
    try {
      await prisma.user.update({
        where: { id: targetUser.id },
        data: {
          password: newHash,
          isFirstLogin: false,
          mustChangePassword: false,
          failedLoginAttempts: 0,
          isLocked: false,
          lockoutUntil: null,
        },
      });

      await prisma.passwordResetToken.update({
        where: { id: tokenRecord.id },
        data: { used: true },
      });

      try {
        await prisma.passwordHistory.create({
          data: {
            userId: targetUser.id,
            passwordHash: newHash,
          },
        });
      } catch (histErr) {
        console.warn('[RESET_PASSWORD] Password history recording warning:', histErr);
      }

      // Invalidate all existing sessions for this user across all devices
      await prisma.userSession.updateMany({
        where: { userId: targetUser.id },
        data: { revoked: true },
      });
    } catch (updateErr) {
      console.error('[RESET_PASSWORD_UPDATE_ERROR]', updateErr);
      return NextResponse.json({ error: 'Failed to update account credentials.' }, { status: 500 });
    }

    // 4. Send Password Changed Confirmation Email
    sendSystemEmail({
      to: targetUser.email,
      recipientName: targetUser.name,
      subject: 'Password Reset Successfully - Markazu Umar Portal',
      template: 'PASSWORD_CHANGED_CONFIRMATION',
    }).catch(() => {});

    return NextResponse.json({
      message: 'Your password has been successfully reset. All previous sessions have been logged out. You can now log in with your new password.',
      user: {
        id: targetUser.id,
        username: targetUser.username || targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
      },
    });
  } catch (error: any) {
    console.error('[RESET_PASSWORD_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 400 });
  }
}
