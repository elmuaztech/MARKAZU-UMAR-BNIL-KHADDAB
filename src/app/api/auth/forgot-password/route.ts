import { NextRequest, NextResponse } from 'next/server';
import { MOCK_USERS } from '../../../../lib/mockData';
import { generatePasswordResetToken } from '../../../../lib/security';
import { sendSystemEmail } from '../../../../lib/emailService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const email = (body.email || '').trim().toLowerCase();

    if (!email) {
      return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 });
    }

    const user = MOCK_USERS.find((u) => u.email.toLowerCase() === email);

    // Generic response to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email address, a password reset token has been dispatched.',
      });
    }

    const resetToken = generatePasswordResetToken(user.email, user.id);

    await sendSystemEmail({
      to: user.email,
      recipientName: user.name,
      subject: 'Password Reset Token - Markazu Umar School Management Portal',
      template: 'PASSWORD_RESET_REQUEST',
      metadata: {
        resetToken,
      },
    });

    return NextResponse.json({
      message: 'Password reset token dispatched to your email. Valid for 5 minutes.',
      token: resetToken, // For convenience during testing
      resetUrl: `/reset-password?token=${resetToken}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to process forgot password request' }, { status: 400 });
  }
}
