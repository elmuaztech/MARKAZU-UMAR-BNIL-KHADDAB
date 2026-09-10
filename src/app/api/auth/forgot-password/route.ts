import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { sendSystemEmail } from '../../../../lib/emailService';
import { findServerUser, saveServerOtpToken } from '../../../../lib/serverDb';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = (body.email || body.username || '').trim().toLowerCase();

    if (!input) {
      return NextResponse.json({ error: 'Please enter your email address or Username.' }, { status: 400 });
    }

    let user: any = null;

    // 1. Try PostgreSQL Prisma first
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: input, mode: 'insensitive' } },
            { username: { equals: input, mode: 'insensitive' } },
            { id: { equals: input, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
      });
    } catch (dbErr) {
      console.warn('[FORGOT_PASSWORD] Postgres query skipped, using serverDb:', dbErr);
    }

    // 2. Persistent serverDb Fallback
    if (!user) {
      const serverUser = findServerUser(input);
      if (serverUser) {
        user = {
          id: serverUser.id,
          name: serverUser.name,
          email: serverUser.email,
          username: serverUser.username || serverUser.id,
        };
      }
    }

    if (!user) {
      return NextResponse.json({
        message: 'If an account exists with this email/username, a 4-digit OTP has been sent.',
      });
    }

    // Generate 4-Digit Numeric OTP Code (e.g., "4819")
    const otpCode = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // 3. Store OTP in serverDb memory/file
    saveServerOtpToken(user.id, user.email, otpCode, expiresAt);

    // 4. Try storing in Prisma DB if available
    try {
      await prisma.passwordResetToken.create({
        data: {
          tokenHash: otpCode,
          userId: user.id,
          email: user.email,
          expiresAt,
          used: false,
        },
      });
    } catch (dbErr) {
      console.warn('[FORGOT_PASSWORD] Postgres token save warning:', dbErr);
    }

    const origin = req.headers.get('origin');
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || (host && /^(localhost|\d+\.\d+\.\d+\.\d+)/.test(host) ? 'http' : 'https');
    let portalUrl = origin || (host ? `${proto}://${host}` : undefined);
    if (!portalUrl || portalUrl.includes('vercel.app')) {
      portalUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    }
    portalUrl = portalUrl ? portalUrl.replace(/\/+$/, '') : '';

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
    });
  } catch (error: any) {
    console.error('[FORGOT_PASSWORD_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to process forgot password request' }, { status: 400 });
  }
}
