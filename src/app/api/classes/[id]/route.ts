import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '../../../../lib/auth';
import { updateServerClass, deleteServerClass } from '../../../../lib/serverDb';

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
    const serverClass = updateServerClass(id, body);

    // 2. Update in Postgres Prisma if connected
    let prismaClass: any = null;
    try {
      const updateData: any = {};
      if (body.name || body.class_name_english) updateData.name = body.name || body.class_name_english;
      if (body.category) updateData.category = body.category;
      if (body.section) updateData.section = body.section;
      if (body.subcategory !== undefined) updateData.subcategory = body.subcategory || null;
      if (body.capacity !== undefined) updateData.capacity = Number(body.capacity);
      if (body.programmeId !== undefined) updateData.programmeId = body.programmeId || null;
      if (body.classTeacherId !== undefined) updateData.classTeacherId = body.classTeacherId || null;

      prismaClass = await prisma.schoolClass.update({
        where: { id },
        data: updateData,
      });
    } catch (dbErr) {
      console.warn('[UPDATE_CLASS] Postgres write warning, updated in serverDb:', dbErr);
    }

    const updated = prismaClass || serverClass;

    return NextResponse.json({
      message: 'Class updated successfully in database',
      class: updated,
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

    const { id } = params;

    // 1. Delete from persistent serverDb
    deleteServerClass(id);

    // 2. Delete from Postgres Prisma if connected
    try {
      await prisma.schoolClass.delete({
        where: { id },
      });
    } catch (dbErr) {
      console.warn('[DELETE_CLASS] Postgres write warning, deleted from serverDb:', dbErr);
    }

    return NextResponse.json({
      message: 'Class deleted successfully from database',
    });
  } catch (error: any) {
    console.error('[DELETE_CLASS_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete class' }, { status: 400 });
  }
}
