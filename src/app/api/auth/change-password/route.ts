import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser } from '../../../../lib/auth';
import { verifyPassword, validatePasswordPolicy, hashPassword } from '../../../../lib/security';
import { sendSystemEmail } from '../../../../lib/emailService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // 1. Authoritative session authentication (proves identity of the caller)
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: 'Authentication required. Please log in to change your password.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const currentPassword = body.currentPassword || '';
    const newPassword = body.newPassword || '';

    if (!currentPassword) {
      return NextResponse.json({ error: 'Current password is required.' }, { status: 400 });
    }

    if (!newPassword) {
      return NextResponse.json({ error: 'New password is required.' }, { status: 400 });
    }

    // 2. Fetch authoritative user record strictly from PostgreSQL
    const user = await prisma.user.findFirst({
      where: {
        id: authUser.id,
        deletedAt: null,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'User account not found or deactivated.' }, { status: 404 });
    }

    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Account is deactivated or suspended.' }, { status: 403 });
    }

    // 3. Verify current password against stored hash
    const isCurrentValid = verifyPassword(currentPassword, user.password);
    if (!isCurrentValid) {
      return NextResponse.json({ error: 'Current password is incorrect.' }, { status: 401 });
    }

    // 4. Validate new password policy
    const policyResult = validatePasswordPolicy(newPassword);
    if (!policyResult.isValid) {
      return NextResponse.json(
        { error: 'Please choose a stronger password with at least 6 characters', details: policyResult.errors },
        { status: 400 }
      );
    }

    const newHash = hashPassword(newPassword);

    // 5. Update user password in PostgreSQL
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

    // 6. Record password in PostgreSQL password history
    try {
      await prisma.passwordHistory.create({
        data: {
          userId: user.id,
          passwordHash: newHash,
        },
      });
    } catch (historyErr) {
      console.warn('[CHANGE_PASSWORD] Password history recording error:', historyErr);
    }

    // 7. Revoke other active sessions for this user, keeping the current session valid
    const cookieSessionId = req.cookies.get('mssms_session_id')?.value;
    const authHeader = req.headers.get('authorization');
    const headerSessionId = req.headers.get('x-session-id');
    let rawSession = cookieSessionId || headerSessionId;
    if (!rawSession && authHeader && authHeader.startsWith('Bearer ')) {
      rawSession = authHeader.substring(7).trim();
    }
    const currentCleanSessionId = rawSession ? rawSession.replace(/^jwt-token-/, '').trim() : '';

    try {
      await prisma.userSession.updateMany({
        where: {
          userId: user.id,
          ...(currentCleanSessionId ? { sessionId: { not: currentCleanSessionId } } : {}),
        },
        data: { revoked: true },
      });
    } catch (sessionErr) {
      console.warn('[CHANGE_PASSWORD] Session revocation error:', sessionErr);
    }

    // 8. Dispatch confirmation email
    sendSystemEmail({
      to: updatedUser.email,
      recipientName: updatedUser.name,
      subject: 'Security Notice: Password Updated - Markazu Umar Portal',
      template: 'PASSWORD_CHANGED_CONFIRMATION',
    }).catch(() => {});

    return NextResponse.json({
      message: 'Password changed successfully. Other active sessions have been invalidated.',
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
