import { NextRequest, NextResponse } from 'next/server';
import { MOCK_USERS } from '../../../../lib/mockData';
import { verifyPassword, validatePasswordPolicy, isPasswordInHistory, recordPasswordInHistory, hashPassword } from '../../../../lib/security';
import { sendSystemEmail } from '../../../../lib/emailService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = body.userId;
    const currentPassword = body.currentPassword || '';
    const newPassword = body.newPassword || '';

    const user = MOCK_USERS.find((u) => u.id === userId || u.email.toLowerCase() === (body.email || '').toLowerCase());
    if (!user) {
      return NextResponse.json({ error: 'User account not found' }, { status: 404 });
    }

    // Verify current/temporary password
    const isCurrentValid = verifyPassword(currentPassword, user.passwordHash || '');
    if (!isCurrentValid && !user.isFirstLogin) {
      return NextResponse.json({ error: 'Current password verified incorrect' }, { status: 401 });
    }

    // Validate Password Policy (min 12 chars, upper, lower, num, spec)
    const policyResult = validatePasswordPolicy(newPassword);
    if (!policyResult.isValid) {
      return NextResponse.json(
        { error: 'New password does not meet enterprise security requirements', details: policyResult.errors },
        { status: 400 }
      );
    }

    // Check Password History Reuse
    if (isPasswordInHistory(user.id, newPassword)) {
      return NextResponse.json(
        { error: 'You cannot reuse a recently used password. Please enter a different password.' },
        { status: 400 }
      );
    }

    const newHash = hashPassword(newPassword);
    user.passwordHash = newHash;
    user.isFirstLogin = false;
    user.mustChangePassword = false;
    user.failedLoginAttempts = 0;
    user.isLocked = false;

    recordPasswordInHistory(user.id, newHash);

    // Dispatch Confirmation Email
    await sendSystemEmail({
      to: user.email,
      recipientName: user.name,
      subject: 'Security Notice: Password Updated - Markazu Umar Portal',
      template: 'PASSWORD_CHANGED_CONFIRMATION',
    });

    return NextResponse.json({
      message: 'Password changed successfully. Your temporary password has been revoked forever.',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isFirstLogin: false,
        mustChangePassword: false,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to change password' }, { status: 400 });
  }
}
