import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '../../../../lib/auth';
import { updateServerSubject, deleteServerSubject } from '../../../../lib/serverDb';

export const dynamic = 'force-dynamic';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const { id } = params;
    const body = await req.json();

    // 1. Update in persistent serverDb
    const serverSubject = updateServerSubject(id, body);

    // 2. Update in Postgres Prisma if connected
    let prismaSubject: any = null;
    try {
      const updateData: any = {};
      if (body.name) updateData.name = body.name;
      if (body.arabicName !== undefined) updateData.arabicName = body.arabicName || null;
      if (body.code) updateData.code = body.code;
      if (body.category) updateData.category = body.category;
      if (body.description !== undefined) updateData.description = body.description || null;
      if (body.programmeId !== undefined) updateData.programmeId = body.programmeId || null;
      if (body.classId !== undefined) updateData.classId = body.classId || null;
      if (body.status) updateData.status = body.status;
      if (body.displayOrder !== undefined) updateData.displayOrder = Number(body.displayOrder);

      prismaSubject = await prisma.subject.update({
        where: { id },
        data: updateData,
      });
    } catch (dbErr) {
      console.warn('[UPDATE_SUBJECT] Postgres write warning, updated in serverDb:', dbErr);
    }

    const updated = prismaSubject || serverSubject;

    return NextResponse.json({
      message: 'Subject updated successfully in database',
      subject: updated,
    });
  } catch (error: any) {
    console.error('[UPDATE_SUBJECT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to update subject' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const { id } = params;

    // 1. Delete from persistent serverDb
    deleteServerSubject(id);

    // 2. Delete from Postgres Prisma if connected
    try {
      await prisma.subject.delete({
        where: { id },
      });
    } catch (dbErr) {
      console.warn('[DELETE_SUBJECT] Postgres write warning, deleted from serverDb:', dbErr);
    }

    return NextResponse.json({
      message: 'Subject deleted successfully from database',
    });
  } catch (error: any) {
    console.error('[DELETE_SUBJECT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete subject' }, { status: 400 });
  }
}
