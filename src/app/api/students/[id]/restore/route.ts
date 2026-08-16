import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../../lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '../../../../../lib/auth';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const studentId = params.id;
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return NextResponse.json({ error: 'Student record not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id: studentId },
        data: {
          deletedAt: null,
          status: 'ACTIVE',
        },
      });

      if (student.userId) {
        await tx.user.update({
          where: { id: student.userId },
          data: {
            deletedAt: null,
            status: 'ACTIVE',
          },
        });

        await tx.userSession.updateMany({
          where: { userId: student.userId },
          data: { revoked: true },
        });
      }
    });

    return NextResponse.json({
      message: 'Student account restored successfully and is now ACTIVE.',
      id: studentId,
    });
  } catch (error: any) {
    console.error('[RESTORE_STUDENT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to restore student' }, { status: 400 });
  }
}
