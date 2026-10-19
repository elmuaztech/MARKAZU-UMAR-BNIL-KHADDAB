import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { sendSystemEmail } from '../../../../lib/emailService';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const identifier = (body.identifier || body.email || '').trim().toLowerCase();
    const role = (body.role || 'USER').trim();
    const reason = (body.reason || 'Not specified').trim();
    const confirmed = Boolean(body.confirmed);

    if (!identifier) {
      return NextResponse.json(
        { error: 'Please provide your registered Email Address, Username, or Student Admission Number.' },
        { status: 400 }
      );
    }

    if (!confirmed) {
      return NextResponse.json(
        { error: 'You must confirm that you understand the terms of account and data erasure.' },
        { status: 400 }
      );
    }

    // Attempt to lookup user in database
    let user: any = null;
    try {
      user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: { equals: identifier, mode: 'insensitive' } },
            { username: { equals: identifier, mode: 'insensitive' } },
          ],
          deletedAt: null,
        },
      });
    } catch (dbErr) {
      console.warn('[DELETE_ACCOUNT_REQUEST] User lookup warning:', dbErr);
    }

    const ticketId = `DEL-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const ipAddress = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'Unknown IP';
    const userAgent = req.headers.get('user-agent') || 'Unknown Agent';

    // Log the erasure request in AuditLog for official compliance and record keeping
    try {
      await prisma.auditLog.create({
        data: {
          action: 'ACCOUNT_DELETION_REQUESTED',
          performedBy: user ? user.name : identifier,
          userRole: user ? user.role : role,
          userId: user ? user.id : null,
          details: `Account deletion requested via Google Play Compliance portal. Ticket: ${ticketId}. Reason: ${reason}. Target: ${identifier}`,
          ipAddress: ipAddress.slice(0, 45),
          browser: userAgent.slice(0, 100),
          targetRecord: user ? user.id : identifier,
          status: 'SUCCESS',
        },
      });
    } catch (auditErr) {
      console.error('[DELETE_ACCOUNT_REQUEST] Audit log creation failed:', auditErr);
    }

    // Send notification to school administration
    try {
      const adminEmail = process.env.ADMIN_NOTIFICATIONS_EMAIL || 'markazuumarbnkhaddabdaneji@gmail.com';
      await sendSystemEmail({
        to: adminEmail,
        subject: `[ACTION REQUIRED] Account Deletion Request - ${ticketId}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #065f46; margin-top: 0;">Account Deletion Request (Google Play Compliance)</h2>
            <p>A formal request to delete an account and associated personal data has been submitted.</p>
            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Ticket ID:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${ticketId}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Identifier Provided:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${identifier}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">User Found in DB:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${user ? `${user.name} (${user.role})` : 'Unmatched / Guest'}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Declared Role:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${role}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">Reason:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${reason}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; border-bottom: 1px solid #f1f5f9;">IP Address:</td><td style="padding: 8px; border-bottom: 1px solid #f1f5f9;">${ipAddress}</td></tr>
            </table>
            <p style="font-size: 13px; color: #64748b;">
              Please review this request in accordance with the Nigeria Data Protection Act (NDPA 2023) and statutory educational record retention policies.
            </p>
          </div>
        `,
      });
    } catch (emailErr) {
      console.warn('[DELETE_ACCOUNT_REQUEST] Admin notification email warning:', emailErr);
    }

    return NextResponse.json({
      success: true,
      ticketId,
      message:
        'Your account and data erasure request has been successfully recorded. Our Data Protection team will process your request within 30 days as mandated by privacy regulations.',
    });
  } catch (error: any) {
    console.error('[DELETE_ACCOUNT_REQUEST_ERROR]', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred while submitting your request. Please try again or contact administration.' },
      { status: 500 }
    );
  }
}
