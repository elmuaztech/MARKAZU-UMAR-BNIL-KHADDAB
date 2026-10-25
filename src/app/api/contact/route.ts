import { NextResponse } from 'next/server';
import { sendSystemEmail } from '@/lib/emailService';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, phone, subject, message } = body;

    if (!name || !message) {
      return NextResponse.json(
        { success: false, error: 'Name and message are required fields.' },
        { status: 400 }
      );
    }

    const schoolDestinationEmail = 'info@mubkdaneji.com';
    const senderEmail = email && email.trim() ? email.trim() : 'info@mubkdaneji.com';
    const senderName = name.trim();
    const inquirySubject = subject ? subject.trim() : 'Website Visitor Inquiry';
    const senderPhone = phone ? phone.trim() : 'Not provided';

    const emailHtml = `
      <div style="font-family: Arial, Helvetica, sans-serif; max-width: 650px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff;">
        <div style="border-bottom: 3px solid #10b981; padding-bottom: 16px; margin-bottom: 20px;">
          <h2 style="color: #064e3b; margin: 0 0 6px 0; font-size: 22px;">New Contact Message Received</h2>
          <p style="color: #64748b; margin: 0; font-size: 13px;">Official Contact Form • Markazu Umar bn Al-Khattab</p>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 14px;">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px 14px; font-weight: bold; width: 140px; color: #334155; border: 1px solid #e2e8f0;">Sender Name:</td>
            <td style="padding: 10px 14px; color: #0f172a; border: 1px solid #e2e8f0; font-weight: 600;">${senderName}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-weight: bold; color: #334155; border: 1px solid #e2e8f0;">Email Address:</td>
            <td style="padding: 10px 14px; color: #0f172a; border: 1px solid #e2e8f0;">
              ${email ? `<a href="mailto:${senderEmail}" style="color: #059669; font-weight: bold;">${senderEmail}</a>` : '<span style="color: #94a3b8;">Not provided</span>'}
            </td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 10px 14px; font-weight: bold; color: #334155; border: 1px solid #e2e8f0;">Phone Number:</td>
            <td style="padding: 10px 14px; color: #0f172a; border: 1px solid #e2e8f0; font-family: monospace;">${senderPhone}</td>
          </tr>
          <tr>
            <td style="padding: 10px 14px; font-weight: bold; color: #334155; border: 1px solid #e2e8f0;">Inquiry Topic:</td>
            <td style="padding: 10px 14px; color: #0f172a; border: 1px solid #e2e8f0; font-weight: 600;">${inquirySubject}</td>
          </tr>
        </table>

        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-left: 5px solid #10b981; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
          <h4 style="margin: 0 0 10px 0; color: #065f46; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">Message Content:</h4>
          <p style="white-space: pre-wrap; margin: 0; color: #1e293b; font-size: 14px; line-height: 1.6;">${message.trim()}</p>
        </div>

        <div style="padding: 14px; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 8px; font-size: 13px; color: #854d0e;">
          💡 <strong>How to Reply:</strong> Simply hit <strong>Reply</strong> in your email client to send an email directly to <strong>${senderName}</strong> at <strong>${senderEmail}</strong>.
        </div>
      </div>
    `;

    const dispatchResult = await sendSystemEmail({
      to: schoolDestinationEmail,
      replyTo: email && email.trim() ? email.trim() : undefined,
      recipientName: 'Markazu Umar Administration',
      subject: `[Website Message] ${inquirySubject} — from ${senderName}`,
      template: 'CUSTOM',
      html: emailHtml,
    });

    if (!dispatchResult.success) {
      console.warn('[CONTACT FORM EMAIL WARNING]', dispatchResult.error);
    }

    return NextResponse.json({
      success: true,
      message: 'Your message has been delivered to Markazu Umar administration.',
    });
  } catch (error: any) {
    console.error('[CONTACT_API_ERROR]', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to dispatch contact message' },
      { status: 500 }
    );
  }
}
