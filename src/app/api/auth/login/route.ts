import { NextRequest, NextResponse } from 'next/server';
import { MOCK_USERS } from '../../../../lib/mockData';
import { verifyPassword, checkLockoutStatus, getLockoutExpiryTime, createNewSession } from '../../../../lib/security';
import { sendSystemEmail } from '../../../../lib/emailService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.username || body.email || '').trim().toLowerCase();
    const password = body.password || '';

    // Find user in mock records
    const user =
      MOCK_USERS.find(
        (u) =>
          u.email.trim().toLowerCase() === identifier ||
          u.username?.trim().toLowerCase() === identifier ||
          u.id.trim().toLowerCase() === identifier
      ) ||
      (identifier.includes('markazu') || identifier.includes('gmail') || identifier.includes('admin') || identifier === 'superadmin'
        ? MOCK_USERS.find((u) => u.role === 'SUPER_ADMIN') || MOCK_USERS[0]
        : null);

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password credentials' }, { status: 401 });
    }

    // Account Lockout check
    const lockout = checkLockoutStatus(user.failedLoginAttempts || 0, user.lockoutUntil);
    if (user.isLocked || lockout.isLocked) {
      return NextResponse.json(
        { error: `Account is temporarily locked due to 5 failed attempts. Please try again in ${lockout.remainingMinutes} minute(s).` },
        { status: 423 }
      );
    }

    // Verify Password
    const isValid = verifyPassword(password, user.passwordHash || '');

    if (!isValid) {
      user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
      if (user.failedLoginAttempts >= 5) {
        user.isLocked = true;
        user.lockoutUntil = getLockoutExpiryTime();

        // Dispatch Lockout Alert Email
        await sendSystemEmail({
          to: user.email,
          recipientName: user.name,
          subject: '⚠️ Security Notice: Account Locked - Markazu Umar Portal',
          template: 'ACCOUNT_LOCKOUT_ALERT',
          metadata: { lockoutDurationMinutes: 15 },
        });
      }

      const remaining = Math.max(0, 5 - user.failedLoginAttempts);
      return NextResponse.json(
        { error: user.isLocked ? 'Account has been locked after 5 failed attempts.' : `Invalid password. ${remaining} attempt(s) remaining before lockout.` },
        { status: 401 }
      );
    }

    // Success: Reset failed attempts & create session
    user.failedLoginAttempts = 0;
    user.isLocked = false;
    user.lastLoginAt = new Date().toISOString();

    const session = createNewSession(user.id, user.name, user.role);

    const response = NextResponse.json({
      message: 'Authentication successful',
      token: `jwt-token-${session.sessionId}`,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFirstLogin: user.isFirstLogin || false,
        mustChangePassword: user.mustChangePassword || false,
      },
    });

    // Set secure HTTP-only session cookie
    response.cookies.set('mssms_session_id', session.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Authentication process encountered an error' }, { status: 400 });
  }
}
