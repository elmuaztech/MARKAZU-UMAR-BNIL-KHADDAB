import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { verifyPassword, checkLockoutStatus, getLockoutExpiryTime } from '../../../../lib/security';
import { sendSystemEmail } from '../../../../lib/emailService';
import { ensureDefaultDatabaseUsers } from '../../../../lib/dbSeed';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.username || body.email || '').trim().toLowerCase();
    const password = body.password || '';

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Please provide your Username/Email and Password.' }, { status: 400 });
    }

    // Try seeding default core users if DB is brand new
    await ensureDefaultDatabaseUsers();

    // 1. Query user from PostgreSQL database by Email OR Username/ID
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { username: identifier },
          { id: identifier },
        ],
        deletedAt: null,
      },
    });

    // Case-insensitive email fallback
    if (!user) {
      user = await prisma.user.findFirst({
        where: {
          email: { equals: identifier, mode: 'insensitive' },
          deletedAt: null,
        },
      });
    }

    // Fallback for Super Admin aliases during initial dev setup
    if (!user && (identifier === 'superadmin' || identifier === 'markazuumarbnkhaddabdaneji@gmail.com' || identifier.includes('superadmin'))) {
      user = await prisma.user.findFirst({
        where: { role: 'SUPER_ADMIN', deletedAt: null },
      });
    }

    // Distinguish "User not found"
    if (!user) {
      return NextResponse.json({ error: 'Account does not exist. Please check your credentials or contact the school administrator.' }, { status: 401 });
    }

    // Distinguish "Account disabled / suspended"
    if (user.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Account disabled. Please contact the school administrator.' }, { status: 403 });
    }

    // 2. Account Lockout Check
    const lockout = checkLockoutStatus(user.failedLoginAttempts || 0, user.lockoutUntil?.toISOString());
    if (user.isLocked || lockout.isLocked) {
      return NextResponse.json(
        { error: `Account is locked due to 5 consecutive failed login attempts. Please try again in ${lockout.remainingMinutes} minute(s) or reset your password.` },
        { status: 423 }
      );
    }

    // 3. Verify Password against Database Hash
    const isValid = verifyPassword(password, user.password);

    if (!isValid) {
      const failedCount = (user.failedLoginAttempts || 0) + 1;
      const isNowLocked = failedCount >= 5;
      const lockoutTime = isNowLocked ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: failedCount,
          isLocked: isNowLocked,
          lockoutUntil: lockoutTime,
        },
      });

      if (isNowLocked) {
        // Send Lockout Alert Email
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
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: 0,
        isLocked: false,
        lockoutUntil: null,
        lastLoginAt: new Date(),
      },
    });

    // 5. Create Session in Database
    const sessionId = `sess-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

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

    const response = NextResponse.json({
      message: 'Authentication successful',
      token: `jwt-token-${sessionId}`,
      user: {
        id: updatedUser.id,
        username: updatedUser.username || updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        avatar: updatedUser.avatar || null,
        assignedProgrammeId: updatedUser.assignedProgrammeId,
        assignedProgrammeName: updatedUser.assignedProgrammeName,
        isFirstLogin: updatedUser.isFirstLogin,
        mustChangePassword: updatedUser.mustChangePassword,
      },
    });

    // Set HTTP-Only Session Cookie
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
