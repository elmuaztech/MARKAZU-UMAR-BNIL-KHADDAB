import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyPassword, validatePasswordPolicy, hashPassword } from '../../../../lib/security';
import { sendSystemEmail } from '../../../../lib/emailService';
import { findServerUser, updateServerUser } from '../../../../lib/serverDb';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId;
    const userEmail = (body.email || '').trim().toLowerCase();
    const currentPassword = body.currentPassword || '';
    const newPassword = body.newPassword || '';

    if (!userId && !userEmail) {
      return NextResponse.json({ error: 'User identifier or email required' }, { status: 400 });
    }

    let user: any = null;

    // 1. Try Prisma DB query
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            userId ? { id: userId } : {},
            userEmail ? { email: userEmail } : {},
            userId ? { username: userId } : {},
          ],
          deletedAt: null,
        },
      });
    } catch (dbErr) {
      console.warn('[CHANGE_PASSWORD] Postgres query skipped, using serverDb:', dbErr);
    }

    // 2. Fallback to serverDb
    if (!user) {
      const serverUser = findServerUser(userId || userEmail);
      if (serverUser) {
        user = {
          id: serverUser.id,
          username: serverUser.username || serverUser.id,
          name: serverUser.name,
          email: serverUser.email,
          password: serverUser.password || hashPassword('@Aa123456789'),
          role: serverUser.role,
          isFirstLogin: serverUser.isFirstLogin,
          mustChangePassword: serverUser.mustChangePassword,
        };
      }
    }

    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // 2. Verify current/temporary password
    const isCurrentValid = verifyPassword(currentPassword, user.password);
    if (!isCurrentValid && !user.isFirstLogin && !user.mustChangePassword) {
      return NextResponse.json({ error: 'Current password verified incorrect' }, { status: 401 });
    }

    // 3. Validate Password Policy
    const policyResult = validatePasswordPolicy(newPassword);
    if (!policyResult.isValid) {
      return NextResponse.json(
        { error: 'New password does not meet security policy requirements', details: policyResult.errors },
        { status: 400 }
      );
    }

    const newHash = hashPassword(newPassword);

    // 4. Update persistent serverDb
    updateServerUser(user.id || user.email, {
      password: newHash,
      isFirstLogin: false,
      mustChangePassword: false,
      failedLoginAttempts: 0,
      isLocked: false,
    });

    // 5. Update Prisma Record if connected
    let updatedUser: any = null;
    try {
      updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          password: newHash,
          isFirstLogin: false,
          mustChangePassword: false,
          failedLoginAttempts: 0,
          isLocked: false,
          lockoutUntil: null,
        },
      });

      await prisma.passwordHistory.create({
        data: {
          userId: user.id,
          passwordHash: newHash,
        },
      });
    } catch (dbErr) {
      console.warn('[CHANGE_PASSWORD] Postgres write warning, updated in serverDb:', dbErr);
    }

    const finalUser = updatedUser || user;

    // 6. Dispatch Confirmation Email
    sendSystemEmail({
      to: finalUser.email,
      recipientName: finalUser.name,
      subject: 'Security Notice: Password Updated - Markazu Umar Portal',
      template: 'PASSWORD_CHANGED_CONFIRMATION',
    }).catch(() => {});

    return NextResponse.json({
      message: 'Password changed successfully. Your temporary password has been revoked forever.',
      user: {
        id: finalUser.id,
        username: finalUser.username || finalUser.id,
        name: finalUser.name,
        email: finalUser.email,
        role: finalUser.role,
        isFirstLogin: false,
        mustChangePassword: false,
      },
    });
  } catch (error: any) {
    console.error('[CHANGE_PASSWORD_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to change password' }, { status: 400 });
  }
}
