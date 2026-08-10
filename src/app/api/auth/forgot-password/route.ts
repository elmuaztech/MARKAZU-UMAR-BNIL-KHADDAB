import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { sendSystemEmail } from '../../../../lib/emailService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = (body.email || body.username || '').trim().toLowerCase();

    if (!input) {
      return NextResponse.json({ error: 'Please enter your email address or Username.' }, { status: 400 });
    }

    // Query user from PostgreSQL database
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: input },
          { username: input },
          { id: input },
        ],
        deletedAt: null,
      },
    });

    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email/username, a 4-digit OTP has been sent.',
      });
    }

    // Generate 4-Digit Numeric OTP Code (e.g., "4819")
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store in Prisma database
    await prisma.passwordResetToken.create({
      data: {
        tokenHash: otpCode,
        userId: user.id,
        email: user.email,
        expiresAt,
        used: false,
      },
    });

    const origin = req.headers.get('origin');
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || 'https';
    let portalUrl = origin || (host ? `${proto}://${host}` : undefined);
    if (!portalUrl || portalUrl.includes('localhost')) {
      portalUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://markazu-umar-bnil-khaddab-.vercel.app');
    }

    // Send 4-digit OTP email using central email service
    await sendSystemEmail({
      to: user.email,
      recipientName: user.name,
      subject: 'MARKAZU UMAR - Password Reset 4-Digit OTP Code',
      template: 'PASSWORD_RESET_REQUEST',
      metadata: {
        resetToken: otpCode,
        portalUrl,
      },
    });

    return NextResponse.json({
      message: `4-Digit OTP dispatched to ${user.email}. Valid for 10 minutes.`,
      email: user.email,
      otp: otpCode, // For testing convenience
    });
  } catch (error: any) {
    console.error('[FORGOT_PASSWORD_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to process forgot password request' }, { status: 400 });
  }
}
