import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyPassword, validatePasswordPolicy, hashPassword } from '../../../../lib/security';
import { sendSystemEmail } from '../../../../lib/emailService';

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

    // 1. Query user from database
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          userId ? { id: userId } : {},
          userEmail ? { email: userEmail } : {},
          userId ? { username: userId } : {},
        ],
        deletedAt: null,
      },
    });

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

    // 4. Check Password History Reuse in database
    const recentHistory = await prisma.passwordHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    const isReused = recentHistory.some((record) => verifyPassword(newPassword, record.passwordHash));
    if (isReused) {
      return NextResponse.json(
        { error: 'You cannot reuse a recently used password. Please enter a different password.' },
        { status: 400 }
      );
    }

    const newHash = hashPassword(newPassword);

    // 5. Update Database Record Permanently
    const updatedUser = await prisma.user.update({
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

    // Record Password History in DB
    await prisma.passwordHistory.create({
      data: {
        userId: user.id,
        passwordHash: newHash,
      },
    });

    // 6. Dispatch Confirmation Email
    sendSystemEmail({
      to: updatedUser.email,
      recipientName: updatedUser.name,
      subject: 'Security Notice: Password Updated - Markazu Umar Portal',
      template: 'PASSWORD_CHANGED_CONFIRMATION',
    }).catch(() => {});

    return NextResponse.json({
      message: 'Password changed successfully. Your temporary password has been revoked forever.',
      user: {
        id: updatedUser.id,
        username: updatedUser.username || updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isFirstLogin: false,
        mustChangePassword: false,
      },
    });
  } catch (error: any) {
    console.error('[CHANGE_PASSWORD_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to change password' }, { status: 400 });
  }
}
