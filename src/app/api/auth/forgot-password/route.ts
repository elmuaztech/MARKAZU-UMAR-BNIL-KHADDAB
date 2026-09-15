import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
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

    // 1. Authoritative user lookup strictly from PostgreSQL
    let user: any = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: input, mode: 'insensitive' } },
            { username: { equals: input, mode: 'insensitive' } },
            { id: { equals: input, mode: 'insensitive' } },
          ],
          deletedAt: null,
          status: 'ACTIVE',
        },
      });
    } catch (dbErr) {
      console.error('[FORGOT_PASSWORD_DB_ERROR]', dbErr);
      return NextResponse.json({ error: 'Service temporarily unavailable. Please try again.' }, { status: 500 });
    }

    // Generic response to prevent user enumeration
    if (!user) {
      return NextResponse.json({
        message: 'If an active account exists with this email or username, a verification code has been dispatched.',
      });
    }

    // Disallow password reset for new accounts pending required first-time password change
    if (user.isFirstLogin || user.mustChangePassword) {
      return NextResponse.json(
        {
          error: 'An initial temporary password was already dispatched to your email. Please sign in using your temporary password to complete your required password setup.',
        },
        { status: 403 }
      );
    }

    // 2. Cryptographically secure 6-digit OTP code
    const otpCode = crypto.randomInt(100000, 1000000).toString();
    const tokenHash = crypto.createHash('sha256').update(otpCode).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Invalidate existing unused reset tokens for this user
    try {
      await prisma.passwordResetToken.updateMany({
        where: {
          userId: user.id,
          used: false,
        },
        data: {
          used: true,
        },
      });

      // Persist hashed token in PostgreSQL
      await prisma.passwordResetToken.create({
        data: {
          tokenHash,
          userId: user.id,
          email: user.email,
          expiresAt,
          used: false,
        },
      });
    } catch (dbSaveErr) {
      console.error('[FORGOT_PASSWORD_TOKEN_SAVE_ERROR]', dbSaveErr);
      return NextResponse.json({ error: 'Unable to process reset request at this time.' }, { status: 500 });
    }

    const origin = req.headers.get('origin');
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || (host && /^(localhost|\d+\.\d+\.\d+\.\d+)/.test(host) ? 'http' : 'https');
    let portalUrl = origin || (host ? `${proto}://${host}` : undefined);
    if (!portalUrl || portalUrl.includes('vercel.app')) {
      portalUrl = process.env.NEXT_PUBLIC_APP_URL || '';
    }
    portalUrl = portalUrl ? portalUrl.replace(/\/+$/, '') : '';

    // Dispatch OTP email using central email service
    const emailResult = await sendSystemEmail({
      to: user.email,
      recipientName: user.name,
      subject: 'MARKAZU UMAR - Password Reset Verification Code',
      template: 'PASSWORD_RESET_REQUEST',
      metadata: {
        resetToken: otpCode,
        portalUrl,
      },
    });

    if (!emailResult.success) {
      console.error('[FORGOT_PASSWORD_EMAIL_FAILED]', emailResult.error);
      return NextResponse.json(
        { error: 'Unable to send the code to your email right now. Please try again or contact the school administrator.' },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: `A verification code has been dispatched to your registered email address.`,
      email: user.email,
    });
  } catch (error: any) {
    console.error('[FORGOT_PASSWORD_ERROR]', error);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 400 });
  }
}
