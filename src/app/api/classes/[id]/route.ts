import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';
import { updateServerClass, deleteServerClass } from '@/lib/serverDb';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const classId = params.id;
    const body = await req.json();

    // Headmaster Programme Scoping Check
    if (authUser?.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      const schoolClass = await prisma.schoolClass.findUnique({
        where: { id: classId },
      }).catch(() => null);
      if (schoolClass && schoolClass.programmeId && assignedProg && schoolClass.programmeId !== assignedProg) {
        return NextResponse.json(
          { error: `Access Forbidden (HTTP 403): Headmaster cannot modify classes in another programme section.` },
          { status: 403 }
        );
      }
    }

    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.category !== undefined) updateData.category = body.category;
    if (body.section !== undefined) updateData.section = body.section;
    if (body.subcategory !== undefined) updateData.subcategory = body.subcategory;
    if (body.capacity !== undefined) updateData.capacity = Number(body.capacity);
    if (body.programmeId !== undefined) updateData.programmeId = body.programmeId;
    if (body.classTeacherId !== undefined) updateData.classTeacherId = body.classTeacherId;

    // 1. Update in serverDb
    const serverClass = updateServerClass(classId, updateData);

    // 2. Update in Postgres Prisma if connected
    let prismaClass: any = null;
    try {
      prismaClass = await prisma.schoolClass.update({
        where: { id: classId },
        data: updateData,
      });
    } catch (dbErr) {
      console.warn('[UPDATE_CLASS] Postgres update warning, saved to serverDb:', dbErr);
    }

    const result = prismaClass || serverClass || { id: classId, ...updateData };

    return NextResponse.json({
      message: 'Class updated successfully',
      class: result,
    });
  } catch (error: any) {
    console.error('[UPDATE_CLASS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to update class' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const classId = params.id;

    // Headmaster Programme Scoping Check
    if (authUser?.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      const schoolClass = await prisma.schoolClass.findUnique({
        where: { id: classId },
      }).catch(() => null);
      if (schoolClass && schoolClass.programmeId && assignedProg && schoolClass.programmeId !== assignedProg) {
        return NextResponse.json(
          { error: `Access Forbidden (HTTP 403): Headmaster cannot delete classes in another programme section.` },
          { status: 403 }
        );
      }
    }

    // 1. Delete from serverDb
    deleteServerClass(classId);

    // 2. Delete from Postgres Prisma if connected
    try {
      await prisma.schoolClass.delete({
        where: { id: classId },
      });
    } catch (dbErr) {
      console.warn('[DELETE_CLASS] Postgres delete warning, deleted from serverDb:', dbErr);
    }

    return NextResponse.json({
      message: 'Class deleted successfully',
      class: { id: classId },
    });
  } catch (error: any) {
    console.error('[DELETE_CLASS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete class' }, { status: 400 });
  }
}
