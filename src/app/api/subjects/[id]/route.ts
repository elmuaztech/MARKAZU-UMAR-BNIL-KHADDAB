import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';
import { updateServerSubject, deleteServerSubject } from '@/lib/serverDb';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const subjectId = params.id;
    const body = await req.json();

    // Headmaster Programme Scoping Check
    if (authUser?.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
      }).catch(() => null);
      if (subject && subject.programmeId && assignedProg && subject.programmeId !== assignedProg) {
        return NextResponse.json(
          { error: `Access Forbidden (HTTP 403): Headmaster cannot modify subjects in another programme section.` },
          { status: 403 }
        );
      }
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.arabicName !== undefined) updateData.arabicName = body.arabicName;
    if (body.code !== undefined) updateData.code = body.code;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.programmeId !== undefined) updateData.programmeId = body.programmeId;
    if (body.classId !== undefined) updateData.classId = body.classId;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.displayOrder !== undefined) updateData.displayOrder = Number(body.displayOrder);

    // 1. Update in serverDb
    const serverSubj = updateServerSubject(subjectId, updateData);

    // 2. Update in Postgres Prisma if connected
    let prismaSubject: any = null;
    try {
      prismaSubject = await prisma.subject.update({
        where: { id: subjectId },
        data: updateData,
      });
    } catch (dbErr) {
      console.warn('[UPDATE_SUBJECT] Postgres update warning, saved to serverDb:', dbErr);
    }

    const result = prismaSubject || serverSubj || { id: subjectId, ...updateData };

    return NextResponse.json({
      message: 'Subject updated successfully',
      subject: result,
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

    const subjectId = params.id;

    // Headmaster Programme Scoping Check
    if (authUser?.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      const subject = await prisma.subject.findUnique({
        where: { id: subjectId },
      }).catch(() => null);
      if (subject && subject.programmeId && assignedProg && subject.programmeId !== assignedProg) {
        return NextResponse.json(
          { error: `Access Forbidden (HTTP 403): Headmaster cannot delete subjects in another programme section.` },
          { status: 403 }
        );
      }
    }

    // 1. Delete from serverDb
    deleteServerSubject(subjectId);

    // 2. Delete from Postgres Prisma if connected
    try {
      await prisma.subject.delete({
        where: { id: subjectId },
      });
    } catch (dbErr) {
      console.warn('[DELETE_SUBJECT] Postgres delete warning, deleted from serverDb:', dbErr);
    }

    return NextResponse.json({
      message: 'Subject deleted successfully',
      subject: { id: subjectId },
    });
  } catch (error: any) {
    console.error('[DELETE_SUBJECT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete subject' }, { status: 400 });
  }
}
