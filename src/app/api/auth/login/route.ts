import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyPassword, checkLockoutStatus } from '../../../../lib/security';
import { sendSystemEmail } from '../../../../lib/emailService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.username || body.email || '').trim().toLowerCase();
    const password = body.password || '';
    const portalRole = (body.portalRole || body.role || '').trim().toUpperCase();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Please provide your Username/Email and Password.' }, { status: 400 });
    }

    // 1. Query user strictly from PostgreSQL database via Prisma
    let user: any = null;

    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: identifier, mode: 'insensitive' } },
            { username: { equals: identifier, mode: 'insensitive' } },
            { id: { equals: identifier, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
      });

      const deletedUser = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: identifier, mode: 'insensitive' } },
            { username: { equals: identifier, mode: 'insensitive' } },
            { id: { equals: identifier, mode: 'insensitive' } },
          ],
          NOT: { deletedAt: null },
        },
      });

      if (deletedUser) {
        return NextResponse.json({ error: 'Account has been deactivated. Please contact the school administrator.' }, { status: 403 });
      }
    } catch (dbErr: any) {
      console.error('[LOGIN_DB_ERROR] Database connection/query failure:', {
        code: dbErr?.code,
        name: dbErr?.name,
        message: dbErr?.message,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        isLocalhost: (process.env.DATABASE_URL || '').includes('localhost') || (process.env.DATABASE_URL || '').includes('127.0.0.1'),
      });
      return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
    }

    // Distinguish "User not found"
    if (!user) {
      return NextResponse.json({ error: 'Account does not exist. Please check your credentials or contact the school administrator.' }, { status: 401 });
    }

    // Distinguish "Account disabled / suspended"
    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Account disabled. Please contact the school administrator.' }, { status: 403 });
    }

    // Portal role is optional metadata; valid credentials always allow authentication and route to user's registered role

    // 2. Account Lockout Check
    const lockout = checkLockoutStatus(user.failedLoginAttempts || 0, user.lockoutUntil ? new Date(user.lockoutUntil).toISOString() : undefined);
    if (user.isLocked || lockout.isLocked) {
      return NextResponse.json(
        { error: `Account is locked due to 5 consecutive failed login attempts. Please try again in ${lockout.remainingMinutes} minute(s) or reset your password.` },
        { status: 423 }
      );
    }

    // 3. Verify Password against Hash
    const isValid = verifyPassword(password, user.password || user.passwordHash || '');

    if (!isValid) {
      const failedCount = (user.failedLoginAttempts || 0) + 1;
      const isNowLocked = failedCount >= 5;
      const lockoutTime = isNowLocked ? new Date(Date.now() + 15 * 60 * 1000) : null;

      try {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            failedLoginAttempts: failedCount,
            isLocked: isNowLocked,
            lockoutUntil: lockoutTime,
          },
        });
      } catch (e) {}

      if (isNowLocked) {
        sendSystemEmail({
          to: user.email,
          recipientName: user.name,
          subject: '⚠️ Security Alert: Account Locked - Markazu Umar Portal',
          template: 'ACCOUNT_LOCKOUT_ALERT',
          metadata: { lockoutDurationMinutes: 15 },
        }).catch(() => {});

        return NextResponse.json(
          { error: 'Account has been locked after 5 consecutive failed login attempts.' },
          { status: 423 }
        );
      }

      const remaining = 5 - failedCount;
      return NextResponse.json(
        { error: `Invalid password. ${remaining} attempt(s) remaining before account lockout.` },
        { status: 401 }
      );
    }

    // 4. Success: Reset failed attempts & record last login
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: 0,
          isLocked: false,
          lockoutUntil: null,
          lastLoginAt: new Date(),
        },
      });
    } catch (e) {}

    // 5. Create Session in PostgreSQL
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    try {
      await prisma.userSession.create({
        data: {
          sessionId,
          userId: user.id,
          ipAddress: req.headers.get('x-forwarded-for') || '197.210.227.14',
          userAgent: req.headers.get('user-agent') || 'NextJS/Client',
          browser: 'Browser',
          operatingSystem: 'OS',
          device: 'Desktop',
          refreshTokenHash: sessionId,
          expiresAt,
        },
      });
    } catch (e) {
      console.warn('[LOGIN] Session persistence warning:', e);
    }

    const response = NextResponse.json({
      message: 'Authentication successful',
      token: `jwt-token-${sessionId}`,
      user: {
        id: user.id,
        username: user.username || user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || null,
        role: user.role,
        avatar: user.avatar || null,
        assignedProgrammeId: user.assignedProgrammeId || null,
        assignedProgrammeName: user.assignedProgrammeName || null,
        isFirstLogin: user.isFirstLogin || false,
        mustChangePassword: user.mustChangePassword || false,
      },
    });

    response.cookies.set('mssms_session_id', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[LOGIN_API_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Authentication process encountered an error' }, { status: 400 });
  }
}
