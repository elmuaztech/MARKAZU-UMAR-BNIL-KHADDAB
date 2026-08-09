import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';
import { generateEmailHtml, EmailPayload } from '@/lib/emailService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // API Authorization Security Guard
    const authKey = req.headers.get('x-system-api-key') || req.headers.get('authorization');
    const expectedKey = process.env.SYSTEM_API_SECRET || 'MARKAZU_UMAR_INTERNAL_SECRET_2026';
    if (!authKey || !authKey.includes(expectedKey)) {
      return NextResponse.json({ success: false, error: 'Unauthorized email dispatch request.' }, { status: 401 });
    }

    const payload: EmailPayload = await req.json();

    if (!payload.to || !payload.subject) {
      return NextResponse.json({ success: false, error: 'Recipient email and subject are required.' }, { status: 400 });
    }

    const htmlContent = generateEmailHtml(payload);
    const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Retrieve SMTP configurations from environment
    const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || 587);
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER || 'markazuumarbnkhaddabdaneji@gmail.com';
    const rawPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_SERVER_PASSWORD || '';
    // Remove spaces from Gmail App Password if any exist
    const smtpPass = rawPass.replace(/\s+/g, '');

    if (!smtpPass) {
      return NextResponse.json({ success: false, error: 'SMTP credentials missing from environment configuration.' }, { status: 500 });
    }

    console.log(`[EMAIL API] Attempting SMTP dispatch to ${payload.to} via ${smtpHost}:${smtpPort} as ${smtpUser}...`);

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      },
    });

    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const logoExists = fs.existsSync(logoPath);

    const info = await transporter.sendMail({
      from: `"MARKAZU UMAR ISLAMIYYAH" <${smtpUser}>`,
      replyTo: 'markazuumarbndaneji@gmail.com',
      to: payload.to,
      subject: payload.subject,
      html: htmlContent,
      attachments: logoExists
        ? [
            {
              filename: 'logo.png',
              path: logoPath,
              cid: 'school_logo_header',
            },
          ]
        : [],
    });

    console.log(`[EMAIL DISPATCH SUCCESS] Real email sent to ${payload.to}. MessageId: ${info.messageId || messageId}`);

    return NextResponse.json({
      success: true,
      messageId: info.messageId || messageId,
      recipient: payload.to,
    });
  } catch (error: any) {
    console.error('[EMAIL DISPATCH ERROR]', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to dispatch email via SMTP.',
      },
      { status: 500 }
    );
  }
}
