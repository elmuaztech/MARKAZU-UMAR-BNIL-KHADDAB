import { NextRequest, NextResponse } from 'next/server';
import prisma from '../../../../lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '../../../../lib/auth';

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

    const prismaSubject = await prisma.subject.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Subject updated successfully',
      subject: prismaSubject,
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

    await prisma.subject.delete({
      where: { id },
    });

    return NextResponse.json({
      message: 'Subject deleted successfully',
    });
  } catch (error: any) {
    console.error('[DELETE_SUBJECT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete subject' }, { status: 400 });
  }
}

