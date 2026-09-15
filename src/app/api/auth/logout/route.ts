import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { revokeSession } from '../../../../lib/security';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const cookieSessionId = req.cookies.get('mssms_session_id')?.value;
    const authHeader = req.headers.get('authorization');
    const headerSessionId = req.headers.get('x-session-id');

    let sessionId = cookieSessionId || headerSessionId;
    if (!sessionId && authHeader && authHeader.startsWith('Bearer ')) {
      sessionId = authHeader.substring(7).trim();
    }

    if (sessionId) {
      const cleanSessionId = sessionId.replace(/^jwt-token-/, '');
      try {
        await prisma.userSession.updateMany({
          where: { sessionId: cleanSessionId },
          data: { revoked: true },
        });
      } catch (dbErr) {
        console.error('[LOGOUT_DB_ERROR] Failed to revoke database session:', dbErr);
      }
      revokeSession(cleanSessionId);
    }

    const response = NextResponse.json({ message: 'Session logged out successfully' });
    response.cookies.set('mssms_session_id', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[LOGOUT_ERROR]', error);
    return NextResponse.json({ error: 'Failed to terminate session' }, { status: 400 });
  }
}
