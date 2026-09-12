import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const sessionId = params.id;
    const session = await prisma.schoolSession.findUnique({
      where: { id: sessionId },
      include: {
        _count: {
          select: {
            studentEnrollments: true,
            teacherAssignments: true,
            attendanceRecords: true,
            gradeRecords: true,
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    return NextResponse.json({ session });
  } catch (error: any) {
    console.error('[GET_SESSION_BY_ID_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch session' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const sessionId = params.id;
    const body = await req.json();

    const existingSession = await prisma.schoolSession.findUnique({
      where: { id: sessionId },
    });

    if (!existingSession) {
      return NextResponse.json({ error: 'Session not found.' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.sessionName !== undefined) updateData.sessionName = body.sessionName.trim();
    if (body.activeTerm !== undefined) updateData.activeTerm = body.activeTerm.trim();
    if (body.isCurrent !== undefined) updateData.isCurrent = Boolean(body.isCurrent);

    const updated = await prisma.$transaction(async (tx) => {
      // If setting this session to current, deactivate all others safely
      if (updateData.isCurrent === true) {
        await tx.schoolSession.updateMany({
          where: { id: { not: sessionId } },
          data: { isCurrent: false },
        });
      }

      return await tx.schoolSession.update({
        where: { id: sessionId },
        data: updateData,
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Academic session updated successfully.',
      session: updated,
    });
  } catch (error: any) {
    console.error('[UPDATE_SESSION_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to update session' }, { status: 500 });
  }
}
