import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyImpersonationToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/impersonate/exit
 * Securely terminates an active impersonation session and restores the Super Admin context.
 */
export async function POST(req: NextRequest) {
  try {
    const impersonationCookie = req.cookies.get('mssms_impersonation')?.value;

    if (impersonationCookie) {
      const impPayload = verifyImpersonationToken(impersonationCookie);
      const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

      if (impPayload) {
        try {
          await prisma.auditLog.create({
            data: {
              action: 'IMPERSONATION_ENDED',
              targetRecord: `User/${impPayload.targetUserId || 'unknown'}`,
              performedBy: impPayload.superAdminName || 'Super Admin',
              userRole: 'SUPER_ADMIN',
              details: `Super Admin ${impPayload.superAdminName} ended impersonation session for target user ${impPayload.targetUserId}. Restored Super Admin context.`,
              ipAddress: clientIp,
              status: 'SUCCESS',
            },
          });
        } catch (auditErr) {
          console.warn('[IMPERSONATION_EXIT_AUDIT_WARNING]', auditErr);
        }
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Impersonation ended successfully. Returned to Super Administrator context.',
    });

    // Invalidate and delete the impersonation cookie
    response.cookies.set('mssms_impersonation', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    });

    return response;
  } catch (error: any) {
    console.error('[IMPERSONATE_EXIT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to exit impersonation.' }, { status: 500 });
  }
}
