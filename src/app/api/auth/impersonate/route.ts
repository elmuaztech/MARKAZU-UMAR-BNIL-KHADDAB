import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, signImpersonationToken, verifyImpersonationToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/auth/impersonate
 * Returns the current impersonation status for the active session.
 */
export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json({ authenticated: false, isImpersonated: false }, { status: 401 });
    }

    if (authUser.isImpersonated) {
      return NextResponse.json({
        authenticated: true,
        isImpersonated: true,
        user: {
          id: authUser.id,
          name: authUser.name,
          email: authUser.email,
          role: authUser.role,
          assignedProgrammeName: authUser.assignedProgrammeName,
        },
        impersonatedBy: authUser.impersonatedBy,
      });
    }

    return NextResponse.json({
      authenticated: true,
      isImpersonated: false,
      user: {
        id: authUser.id,
        name: authUser.name,
        email: authUser.email,
        role: authUser.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to check impersonation status' }, { status: 500 });
  }
}

/**
 * POST /api/auth/impersonate
 * Initiates secure Super Admin impersonation of a target user.
 * Body: { targetUserId: string, portal?: string }
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Authorize caller - MUST be a real Super Admin (check raw db session)
    const cookieSessionId = req.cookies.get('mssms_session_id')?.value;
    const authHeader = req.headers.get('authorization');
    const headerSessionId = req.headers.get('x-session-id');

    let sessionId = cookieSessionId || headerSessionId;
    if (!sessionId && authHeader && authHeader.startsWith('Bearer ')) {
      sessionId = authHeader.substring(7).trim();
    }

    if (!sessionId) {
      return NextResponse.json({ error: 'Authentication required. No active session found.' }, { status: 401 });
    }

    const cleanSessionId = sessionId.replace(/^jwt-token-/, '');
    const realSession = await prisma.userSession.findFirst({
      where: {
        sessionId: cleanSessionId,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      include: { user: true },
    });

    if (!realSession || !realSession.user || realSession.user.status !== 'ACTIVE' || realSession.user.deletedAt) {
      return NextResponse.json({ error: 'Valid session required.' }, { status: 401 });
    }

    if (realSession.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({
        error: 'Privilege escalation rejected: Only authorized Super Administrators can initiate user impersonation.',
      }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const { targetUserId } = body;

    if (!targetUserId) {
      return NextResponse.json({ error: 'Target user ID is required for impersonation.' }, { status: 400 });
    }

    // Prevent Super Admin from impersonating themselves
    if (targetUserId === realSession.user.id) {
      return NextResponse.json({ error: 'Cannot impersonate your own Super Administrator account.' }, { status: 400 });
    }

    // 2. Query target user from PostgreSQL
    const targetUser = await prisma.user.findFirst({
      where: {
        id: targetUserId,
        deletedAt: null,
      },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'Target user account not found.' }, { status: 404 });
    }

    if (targetUser.status !== 'ACTIVE') {
      return NextResponse.json({ error: `Cannot impersonate inactive or suspended account (${targetUser.status}).` }, { status: 403 });
    }

    if (targetUser.role === 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Security restriction: Impersonation of other Super Administrators is not permitted.' }, { status: 403 });
    }

    // 3. Create signed HMAC impersonation token (valid for 2 hours)
    const tokenPayload = {
      superAdminId: realSession.user.id,
      superAdminName: realSession.user.name,
      superAdminEmail: realSession.user.email,
      targetUserId: targetUser.id,
      targetUserRole: targetUser.role,
      startedAt: Date.now(),
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
    };

    const token = signImpersonationToken(tokenPayload);

    // 4. Record security audit log
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    try {
      await prisma.auditLog.create({
        data: {
          action: 'IMPERSONATION_STARTED',
          targetRecord: `User/${targetUser.id}`,
          performedBy: realSession.user.name,
          userRole: realSession.user.role,
          details: `Super Admin ${realSession.user.name} (${realSession.user.email}) initiated impersonation of user ${targetUser.name} (${targetUser.role}, ID: ${targetUser.id})`,
          ipAddress: clientIp,
          status: 'SUCCESS',
        },
      });
    } catch (auditErr) {
      console.warn('[IMPERSONATION_AUDIT_WARNING]', auditErr);
    }

    // 5. Construct response with HTTP-Only Cookie
    const response = NextResponse.json({
      success: true,
      message: `Now impersonating ${targetUser.name} (${targetUser.role}).`,
      targetUser: {
        id: targetUser.id,
        name: targetUser.name,
        email: targetUser.email,
        role: targetUser.role,
        assignedProgrammeId: targetUser.assignedProgrammeId,
        assignedProgrammeName: targetUser.assignedProgrammeName,
      },
      impersonatedBy: {
        id: realSession.user.id,
        name: realSession.user.name,
        email: realSession.user.email,
        role: realSession.user.role,
      },
    });

    response.cookies.set('mssms_impersonation', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7200, // 2 hours
    });

    return response;
  } catch (error: any) {
    console.error('[IMPERSONATE_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to start impersonation.' }, { status: 500 });
  }
}
