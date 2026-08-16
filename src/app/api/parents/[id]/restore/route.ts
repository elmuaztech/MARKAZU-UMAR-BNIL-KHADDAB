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

    const parentId = params.id;
    const parent = await prisma.parent.findUnique({
      where: { id: parentId },
    });

    if (!parent) {
      return NextResponse.json({ error: 'Parent profile not found' }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.parent.update({
        where: { id: parentId },
        data: {
          deletedAt: null,
        },
      });

      if (parent.userId) {
        await tx.user.update({
          where: { id: parent.userId },
          data: {
            deletedAt: null,
            status: 'ACTIVE',
          },
        });

        await tx.userSession.updateMany({
          where: { userId: parent.userId },
          data: { revoked: true },
        });
      }
    });

    return NextResponse.json({
      message: 'Parent profile restored successfully and is now ACTIVE.',
      id: parentId,
    });
  } catch (error: any) {
    console.error('[RESTORE_PARENT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to restore parent' }, { status: 400 });
  }
}
