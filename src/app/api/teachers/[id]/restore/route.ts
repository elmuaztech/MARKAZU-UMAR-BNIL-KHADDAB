import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const teacherId = params.id;
    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher profile not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.teacher.update({
        where: { id: teacherId },
        data: {
          deletedAt: null,
          status: 'ACTIVE',
        },
      });

      if (teacher.userId) {
        await tx.user.update({
          where: { id: teacher.userId },
          data: {
            deletedAt: null,
            status: 'ACTIVE',
          },
        });

        await tx.userSession.updateMany({
          where: { userId: teacher.userId },
          data: { revoked: true },
        });
      }
    });

    return NextResponse.json({
      message: 'Teacher profile restored successfully and is now ACTIVE.',
      id: teacherId,
    });
  } catch (error: any) {
    console.error('[RESTORE_TEACHER_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to restore teacher' }, { status: 400 });
  }
}
