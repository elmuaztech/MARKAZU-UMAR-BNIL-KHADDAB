import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const sessions = await prisma.schoolSession.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({
      sessions,
      total: sessions.length,
    });
  } catch (error: any) {
    console.error('[GET_SESSIONS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch school sessions' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const body = await req.json();
    const sessionName = (body.sessionName || '').trim();
    const activeTerm = (body.activeTerm || 'Term 1').trim();
    const isCurrent = body.isCurrent === true;

    if (!sessionName) {
      return NextResponse.json({ error: 'Session Name is required (e.g. 1447/1448 AH (2025/2026 AD)).' }, { status: 400 });
    }

    // If marked as current, deactivate all other sessions
    if (isCurrent) {
      await prisma.schoolSession.updateMany({
        data: { isCurrent: false },
      });
    }

    const session = await prisma.schoolSession.create({
      data: {
        sessionName,
        activeTerm,
        isCurrent,
      },
    });

    return NextResponse.json({
      message: 'Academic session created successfully.',
      session,
    }, { status: 201 });
  } catch (error: any) {
    console.error('[POST_SESSIONS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to create school session' }, { status: 500 });
  }
}
