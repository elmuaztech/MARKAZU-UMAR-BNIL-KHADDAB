import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const { id } = params;
    const body = await req.json();

    const existing = await prisma.schoolSession.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Academic session not found.' }, { status: 404 });
    }

    const updateData: any = {};
    if (body.sessionName !== undefined) updateData.sessionName = body.sessionName.trim();
    if (body.activeTerm !== undefined) updateData.activeTerm = body.activeTerm.trim();
    if (body.isCurrent !== undefined) {
      updateData.isCurrent = body.isCurrent;
      if (body.isCurrent === true) {
        // Deactivate all other sessions
        await prisma.schoolSession.updateMany({
          where: { id: { not: id } },
          data: { isCurrent: false },
        });
      }
    }

    const updated = await prisma.schoolSession.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Academic session updated successfully.',
      session: updated,
    });
  } catch (error: any) {
    console.error('[PUT_SESSION_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to update academic session' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const { id } = params;

    const existing = await prisma.schoolSession.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Academic session not found.' }, { status: 404 });
    }

    await prisma.schoolSession.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Academic session deleted successfully.',
    });
  } catch (error: any) {
    console.error('[DELETE_SESSION_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete academic session' }, { status: 500 });
  }
}
