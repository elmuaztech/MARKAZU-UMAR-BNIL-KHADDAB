import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const teacherId = params.id;
    const body = await req.json();

    const updateData: any = {};
    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.staffNo !== undefined) updateData.staffNo = body.staffNo;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.qualification !== undefined) updateData.qualification = body.qualification;
    if (body.specialization !== undefined) updateData.specialization = body.specialization;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.dateJoined !== undefined) updateData.dateJoined = new Date(body.dateJoined);

    const updatedTeacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Teacher updated successfully',
      teacher: updatedTeacher,
    });
  } catch (error: any) {
    console.error('[UPDATE_TEACHER_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to update teacher' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const teacherId = params.id;

    // Soft delete teacher
    const deletedTeacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: {
        deletedAt: new Date(),
        status: 'ON_LEAVE',
      },
    });

    // Also deactivate the user account if linked
    if (deletedTeacher.userId) {
      await prisma.user.updateMany({
        where: { id: deletedTeacher.userId, deletedAt: null },
        data: {
          deletedAt: new Date(),
          status: 'DEACTIVATED',
        },
      });

      await prisma.userSession.updateMany({
        where: { userId: deletedTeacher.userId },
        data: { revoked: true },
      });
    }

    return NextResponse.json({
      message: 'Teacher deleted successfully',
      teacher: deletedTeacher,
    });
  } catch (error: any) {
    console.error('[DELETE_TEACHER_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete teacher' }, { status: 400 });
  }
}
