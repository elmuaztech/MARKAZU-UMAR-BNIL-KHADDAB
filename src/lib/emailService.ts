// Enterprise Email Notification Service
// Markazu Umar bn Khattab Tahfizul Qur'an & Islamic Studies School (Kano, Nigeria)

export interface EmailPayload {
  to: string;
  recipientName: string;
  subject: string;
  template: 'WELCOME_NEW_ACCOUNT' | 'PASSWORD_RESET_REQUEST' | 'PASSWORD_CHANGED_CONFIRMATION' | 'ACCOUNT_LOCKOUT_ALERT' | 'ACCOUNT_UNLOCKED';
  metadata?: {
    username?: string;
    tempPassword?: string;
    resetToken?: string;
    portalUrl?: string;
    supportContact?: string;
    lockoutDurationMinutes?: number;
    role?: string;
    assignedProgramme?: string;
    email?: string;
    loginUrl?: string;
  };
}

export function getAppBaseUrl(req?: Request): string {
  // 1. In browser environment: dynamically use current window location origin
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }

  // 2. If Request headers are available: dynamically extract incoming host and protocol
  if (req) {
    const origin = req.headers.get('origin');
    if (origin && !origin.includes('null')) {
      return origin.replace(/\/+$/, '');
    }
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host');
    if (host) {
      const forwardedProto = req.headers.get('x-forwarded-proto');
      const proto = forwardedProto || (/^(localhost|\d+\.\d+\.\d+\.\d+)/.test(host) ? 'http' : 'https');
      return `${proto}://${host}`.replace(/\/+$/, '');
    }
  }

  // 3. User configured environment variable from .env (if provided)
  if (process.env.NEXT_PUBLIC_APP_URL) {
    let url = process.env.NEXT_PUBLIC_APP_URL.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }
    return url.replace(/\/+$/, '');
  }

  return '';
}

export function generateEmailHtml(payload: EmailPayload): string {
  const schoolNameEng = "MARKAZU UMAR BN AL-KHATTAB CENTRE FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES - DANEJI";
  const schoolNameArab = "مركز عمر بن الخطاب لتحفيظ القرآن والدراسات الإسلامية - دنيج";
  const schoolMotto = "Knowledge and Discipline (العلم والتربية)";
  const schoolAddress = "NO. 32 DANEJI QTR., KANO, NIGERIA";

  const rawPortalUrl = payload.metadata?.portalUrl || getAppBaseUrl();
  let portalUrl = rawPortalUrl ? rawPortalUrl.replace(/\/+$/, '') : '';
  if (portalUrl.includes('vercel.app')) {
    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== 'undefined' && window.location?.origin ? window.location.origin : '');
    portalUrl = configuredUrl.replace(/\/+$/, '');
  }
  const supportEmail = 'markazuumarbnkhaddabdaneji@gmail.com';
  const logoUrl = `${portalUrl}/logo.png`;

  const headerHtml = `
    <div style="background: linear-gradient(135deg, #022c1e 0%, #064e3b 100%); padding: 32px 24px; text-align: center; border-top-left-radius: 12px; border-top-right-radius: 12px; border-bottom: 4px solid #f59e0b;">
      <!-- Official School Crest Logo (CID embedded with HTTP fallback) -->
      <div style="text-align: center; margin-bottom: 14px;">
        <img src="cid:school_logo_header" onerror="this.onerror=null; this.src='${logoUrl}';" width="110" height="110" alt="Markazu Umar bn Al-Khattab School Logo" style="display: block; margin: 0 auto; border-radius: 50%; border: 4px solid #f59e0b; background-color: #ffffff; padding: 4px; box-shadow: 0 4px 14px rgba(0,0,0,0.35);" />
      </div>

      <!-- Full English School Title -->
      <h1 style="color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 8px 0 4px 0; font-size: 15px; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.4;">
        ${schoolNameEng}
      </h1>
      
      <!-- Full Arabic School Title -->
      <h2 style="color: #fef08a; font-family: 'Amiri', 'Traditional Arabic', 'Segoe UI', sans-serif; margin: 6px 0 8px 0; font-size: 19px; font-weight: bold; direction: rtl; text-align: center;">
        ${schoolNameArab}
      </h2>

      <!-- School Motto & Address -->
      <p style="color: #a7f3d0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 6px 0 0 0; font-size: 13px; font-style: italic; font-weight: 700;">
        Motto: "${schoolMotto}"
      </p>
      <p style="color: #6ee7b7; font-family: sans-serif; margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">
        ${schoolAddress}
      </p>
    </div>
  `;

  const footerHtml = `
    <div style="background-color: #f8fafc; padding: 24px; text-align: center; border-bottom-left-radius: 12px; border-bottom-right-radius: 12px; border-top: 1px solid #e2e8f0;">
      <p style="color: #064e3b; font-family: sans-serif; font-size: 12px; font-weight: bold; margin: 0 0 4px 0; text-transform: uppercase;">
        ${schoolNameEng}
      </p>
      <p style="color: #d97706; font-family: 'Amiri', 'Traditional Arabic', sans-serif; font-size: 16px; font-weight: bold; margin: 2px 0 6px 0; direction: rtl;">
        ${schoolNameArab}
      </p>
      <p style="color: #64748b; font-family: sans-serif; font-size: 11px; margin: 0;">
        <em>Motto: "${schoolMotto}"</em>
      </p>
      <p style="color: #94a3b8; font-family: sans-serif; font-size: 11px; margin: 10px 0 0 0;">
        Official School Support Email: <a href="mailto:${supportEmail}" style="color: #059669; font-weight: bold; text-decoration: underline;">${supportEmail}</a>
      </p>
    </div>
  `;

  let bodyHtml = '';

  switch (payload.template) {
    case 'WELCOME_NEW_ACCOUNT':
      bodyHtml = `
        <div style="padding: 30px; font-family: sans-serif; color: #1e293b;">
          <h2 style="color: #064e3b; margin-top: 0;">Assalamu Alaikum, ${payload.recipientName}</h2>
          <p>Welcome to the official portal for <strong>${schoolNameEng} (${schoolNameArab})</strong>. Your user account has been successfully created by the school administration.</p>

          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 18px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #065f46; font-size: 14px;">Your Official Login Credentials & User ID:</p>
            <p style="margin: 6px 0;"><strong>Username / Staff / Admission ID:</strong> <code style="background-color: #d1fae5; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 14px; font-weight: bold; color: #065f46;">${payload.metadata?.username || payload.to}</code></p>
            <p style="margin: 6px 0;"><strong>Registered Email Address:</strong> ${payload.to}</p>
            <p style="margin: 6px 0;"><strong>Initial Temporary Password:</strong> <code style="background-color: #d1fae5; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 14px; font-weight: bold; color: #065f46;">${payload.metadata?.tempPassword}</code></p>
            <p style="margin: 10px 0 0 0; font-size: 11px; color: #047857; font-weight: 600;">
              ℹ️ Note: You can log into your portal using either your <strong>Username (Staff ID / Admission No)</strong> or your <strong>Email address</strong>.
            </p>
          </div>

          <p style="color: #b91c1c; font-size: 13px; font-weight: bold;">
            ⚠️ Mandatory Action Required: Upon your first login, you will be prompted to create your own new secure password. Your temporary password will expire after first use.
          </p>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${portalUrl.endsWith('/login') ? portalUrl : `${portalUrl}/login`}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">
              Access Portal Now
            </a>
          </div>
        </div>
      `;
      break;

    case 'PASSWORD_RESET_REQUEST':
      const resetLink = payload.metadata?.resetToken
        ? `${portalUrl.replace('/login', '')}/reset-password?token=${payload.metadata.resetToken}`
        : `${portalUrl.replace('/login', '')}/reset-password`;

      bodyHtml = `
        <div style="padding: 30px; font-family: sans-serif; color: #1e293b;">
          <h2 style="color: #064e3b; margin-top: 0; font-size: 18px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">
            🔐 Account Password Reset — 4-Digit OTP Code
          </h2>
          <p style="font-size: 14px; line-height: 1.6;">Dear <strong>${payload.recipientName}</strong>,</p>
          <p style="font-size: 14px; line-height: 1.6;">
            We received a request to reset the password for your account at <strong>${schoolNameEng} (${schoolNameArab})</strong>.
          </p>

          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 12px; padding: 20px; margin: 24px 0; text-align: center;">
            <p style="margin: 0 0 8px 0; font-weight: bold; color: #065f46; font-size: 13px; text-transform: uppercase; letter-spacing: 1px;">Your 4-Digit Password Reset OTP:</p>
            <p style="margin: 6px 0; font-family: monospace; font-size: 34px; font-weight: 900; color: #047857; letter-spacing: 8px; background-color: #d1fae5; padding: 10px 24px; border-radius: 8px; display: inline-block; border: 1px solid #6ee7b7;">
              ${payload.metadata?.resetToken}
            </p>
            <p style="margin: 12px 0 0 0; font-size: 12px; color: #047857; font-weight: 600;">
              ⏱️ <strong>Strict Expiry:</strong> This 4-Digit OTP is valid for <strong>10 minutes</strong> only.
            </p>
          </div>

          <!-- Action Button Link -->
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" target="_blank" style="background-color: #059669; color: #ffffff; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 15px; text-decoration: none; display: inline-block; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.25);">
              Click Here to Reset Your Password
            </a>
          </div>

          <!-- Direct URL Link Backup -->
          <div style="background-color: #f1f5f9; border-radius: 8px; padding: 14px; margin: 20px 0; font-size: 12px; color: #475569; word-break: break-all;">
            <p style="margin: 0 0 6px 0; font-weight: bold; color: #334155;">Or enter the 4-digit OTP directly on the password reset page:</p>
            <a href="${resetLink}" style="color: #059669; text-decoration: underline;">${resetLink}</a>
          </div>

          <p style="font-size: 12px; color: #64748b; margin-top: 24px; border-top: 1px solid #f1f5f9; padding-top: 12px;">
            If you did not request a password reset, no further action is required. Your account remains completely safe.
          </p>
        </div>
      `;
      break;

    case 'PASSWORD_CHANGED_CONFIRMATION':
      bodyHtml = `
        <div style="padding: 30px; font-family: sans-serif; color: #1e293b;">
          <h2 style="color: #064e3b; margin-top: 0;">Password Changed Successfully</h2>
          <p>Dear ${payload.recipientName},</p>
          <p>Your password for the <strong>${schoolNameEng} (${schoolNameArab})</strong> portal was successfully updated on <strong>${new Date().toLocaleString()}</strong>.</p>

          <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 14px; margin: 20px 0; color: #065f46; font-size: 13px;">
            ✓ Your account is secure. If you initiated this password change, no further action is required.
          </div>

          <p style="font-size: 13px; color: #b91c1c;">
            If you did NOT change your password, please contact the IT Administrator immediately to lock your account and restore access.
          </p>
        </div>
      `;
      break;

    case 'ACCOUNT_LOCKOUT_ALERT':
      bodyHtml = `
        <div style="padding: 30px; font-family: sans-serif; color: #1e293b;">
          <h2 style="color: #991b1b; margin-top: 0;">⚠️ Security Notice: Account Locked</h2>
          <p>Dear ${payload.recipientName},</p>
          <p>Your portal account at <strong>${schoolNameEng} (${schoolNameArab})</strong> has been automatically locked due to <strong>5 consecutive failed login attempts</strong>.</p>

          <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 20px 0; color: #991b1b;">
            <p style="margin: 0; font-weight: bold;">Lockout Duration:</p>
            <p style="margin: 4px 0 0 0; font-size: 14px;">
              Your account will remain locked for <strong>${payload.metadata?.lockoutDurationMinutes || 15} minutes</strong> to protect against brute-force attacks.
            </p>
          </div>

          <p style="font-size: 13px; color: #475569;">
            You can try logging in again after the duration expires, or contact the school administrator to unlock your account immediately.
          </p>
        </div>
      `;
      break;

    case 'ACCOUNT_UNLOCKED':
      bodyHtml = `
        <div style="padding: 30px; font-family: sans-serif; color: #1e293b;">
          <h2 style="color: #064e3b; margin-top: 0;">Account Unlocked</h2>
          <p>Dear ${payload.recipientName},</p>
          <p>Your account at <strong>${schoolNameEng} (${schoolNameArab})</strong> has been unlocked by the school administrator. You may now log in to the portal.</p>

          <div style="text-align: center; margin: 24px 0;">
            <a href="${portalUrl}" style="background-color: #059669; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-weight: bold; text-decoration: none; display: inline-block;">
              Log In to Portal
            </a>
          </div>
        </div>
      `;
      break;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${payload.subject}</title>
      </head>
      <body style="background-color: #f1f5f9; margin: 0; padding: 20px; font-family: sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden;">
          ${headerHtml}
          ${bodyHtml}
          ${footerHtml}
        </div>
      </body>
    </html>
  `;
}

export const SYSTEM_EMAIL_FROM =
  process.env.SYSTEM_EMAIL_FROM ||
  process.env.SMTP_FROM ||
  `"MARKAZU UMAR BN AL-KHATTAB CENTRE FOR QUR'AN MEMORIZATION & ISLAMIC STUDIES - DANEJI" <${process.env.SMTP_USER || process.env.EMAIL_SERVER_USER || 'markazuumarbnkhaddabdaneji@gmail.com'}>`;

export async function sendSystemEmail(payload: EmailPayload): Promise<{ success: boolean; messageId: string; error?: string }> {
  const messageId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  // If running in browser (client-side), dispatch via Next.js backend API route /api/email/send
  if (typeof window !== 'undefined') {
    try {
      if (!payload.metadata) payload.metadata = {};
      if (!payload.metadata.portalUrl || payload.metadata.portalUrl.includes('vercel.app')) {
        payload.metadata.portalUrl = window.location.origin;
      }
      const response = await fetch('/api/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-system-api-key': 'MARKAZU_UMAR_INTERNAL_SECRET_2026',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      if (result.success) {
        console.log(`[REAL EMAIL SENT via API] Delivered to ${payload.to}`);
        return { success: true, messageId: result.messageId || messageId };
      } else {
        console.warn(`[EMAIL API WARNING] ${result.error}`);
        return { success: false, messageId, error: result.error };
      }
    } catch (err: any) {
      console.error(`[EMAIL API FETCH ERROR] ${err.message}`);
      return { success: false, messageId, error: err.message };
    }
  }

  // If running on server side (Node.js context)
  const htmlContent = generateEmailHtml(payload);
  const smtpHost = process.env.SMTP_HOST || process.env.EMAIL_SERVER_HOST || 'smtp.gmail.com';
  const smtpPort = Number(process.env.SMTP_PORT || process.env.EMAIL_SERVER_PORT || 587);
  const smtpUser = process.env.SMTP_USER || process.env.EMAIL_SERVER_USER || 'elmuaztechnologiesltd@gmail.com';
  const rawPass = process.env.SMTP_PASS || process.env.SMTP_PASSWORD || process.env.EMAIL_SERVER_PASSWORD || '';
  const smtpPass = rawPass.replace(/\s+/g, '');

  let targetRecipient = payload.to.trim().toLowerCase();
  const emailMode = (process.env.EMAIL_MODE || 'production').toLowerCase();

  if (emailMode === 'development' && (targetRecipient.endsWith('@example.com') || targetRecipient.endsWith('@test.com'))) {
    const devRecipient = process.env.DEVELOPMENT_EMAIL_RECIPIENT || process.env.SMTP_USER || 'elmuazdesignservices@gmail.com';
    console.log(`[DEV TEST MODE] Dummy recipient: ${payload.to} -> Redirected to dev test address: ${devRecipient}`);
    targetRecipient = devRecipient;
  }

  try {
    const nodemailer = eval('require')('nodemailer');
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

    await transporter.sendMail({
      from: SYSTEM_EMAIL_FROM,
      to: targetRecipient,
      subject: emailMode === 'development' ? `[DEV TEST -> ${payload.to}] ${payload.subject}` : payload.subject,
      html: htmlContent,
    });

    console.log(`[REAL EMAIL DISPATCH SUCCESS] -> Delivered to ${targetRecipient} (Original: ${payload.to}) via SMTP ${smtpHost}`);
    return { success: true, messageId };
  } catch (err: any) {
    console.error(`[SMTP EMAIL DISPATCH FAILED] -> ${err.message}`);
    return { success: false, messageId, error: err.message };
  }
}
