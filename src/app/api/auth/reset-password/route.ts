import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { validatePasswordPolicy, hashPassword, verifyPassword } from '../../../../lib/security';
import { sendSystemEmail } from '../../../../lib/emailService';
import { findServerOtpToken, markServerOtpTokenUsed, findServerUser, updateServerUser } from '../../../../lib/serverDb';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const otp = (body.token || body.otp || '').trim();
    const newPassword = body.newPassword || '';

    if (!otp) {
      return NextResponse.json({ error: 'Please enter the 4-digit OTP code sent to your email.' }, { status: 400 });
    }

    if (!newPassword) {
      return NextResponse.json({ error: 'Please enter a new password.' }, { status: 400 });
    }

    let tokenRecord: any = null;
    let targetUser: any = null;

    // 1. Try Prisma DB first
    try {
      tokenRecord = await prisma.passwordResetToken.findFirst({
        where: {
          tokenHash: otp,
          used: false,
          expiresAt: {
            gt: new Date(),
          },
        },
        include: {
          user: true,
        },
      });

      if (tokenRecord?.user) {
        targetUser = tokenRecord.user;
      }
    } catch (dbErr) {
      console.warn('[RESET_PASSWORD] Postgres query skipped, using serverDb:', dbErr);
    }

    // 2. Fallback to serverDb OTP verification
    if (!targetUser) {
      const serverToken = findServerOtpToken(otp);
      if (serverToken) {
        const sUser = findServerUser(serverToken.email) || findServerUser(serverToken.userId);
        if (sUser) {
          targetUser = sUser;
          markServerOtpTokenUsed(otp);
        }
      }
    }

    if (!targetUser) {
      return NextResponse.json({ error: 'Invalid or expired 4-digit OTP code. Please request a new OTP.' }, { status: 400 });
    }

    // 2. Validate Password Policy
    const policyResult = validatePasswordPolicy(newPassword);
    if (!policyResult.isValid) {
      return NextResponse.json(
        { error: 'Password does not meet enterprise security requirements', details: policyResult.errors },
        { status: 400 }
      );
    }

    const newHash = hashPassword(newPassword);

    // 3. Update persistent serverDb
    updateServerUser(targetUser.id || targetUser.email, {
      password: newHash,
      isFirstLogin: false,
      mustChangePassword: false,
      failedLoginAttempts: 0,
      isLocked: false,
    });

    // 4. Update Database User Password Hash in Prisma if connected
    let updatedUser: any = null;
    try {
      updatedUser = await prisma.user.update({
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

      if (tokenRecord) {
        await prisma.passwordResetToken.update({
          where: { id: tokenRecord.id },
          data: { used: true },
        });
      }

      await prisma.passwordHistory.create({
        data: {
          userId: targetUser.id,
          passwordHash: newHash,
        },
      });
    } catch (dbErr) {
      console.warn('[RESET_PASSWORD] Postgres write warning, updated in serverDb:', dbErr);
    }

    const finalUser = updatedUser || targetUser;

    // 5. Send Password Changed Confirmation Email
    sendSystemEmail({
      to: finalUser.email,
      recipientName: finalUser.name,
      subject: 'Password Reset Successfully - Markazu Umar Portal',
      template: 'PASSWORD_CHANGED_CONFIRMATION',
    }).catch(() => {});

    return NextResponse.json({
      message: 'Your password has been successfully reset in the database. You can now log in with your new password.',
      user: {
        id: finalUser.id,
        username: finalUser.username || finalUser.id,
        name: finalUser.name,
        email: finalUser.email,
        role: finalUser.role,
      },
    });
  } catch (error: any) {
    console.error('[RESET_PASSWORD_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to reset password' }, { status: 400 });
  }
}
