import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getAuthenticatedUser, enforceRoleAndProgramme } from '@/lib/auth';

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const studentId = params.id;
    const body = await req.json();

    // Headmaster Programme Scoping Check
    if (authUser?.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { schoolClass: true },
      });
      if (student && student.schoolClass.programmeId && assignedProg && student.schoolClass.programmeId !== assignedProg) {
        return NextResponse.json(
          { error: `Access Forbidden (HTTP 403): Headmaster cannot modify students in another programme section.` },
          { status: 403 }
        );
      }
    }

    // Prepare update data
    const updateData: any = {};
    if (body.admissionNo !== undefined) updateData.admissionNo = body.admissionNo;
    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.gender !== undefined) updateData.gender = body.gender;
    if (body.dob !== undefined) updateData.dob = new Date(body.dob);
    if (body.classId !== undefined) updateData.classId = body.classId;
    if (body.guardianId !== undefined) updateData.guardianId = body.guardianId;
    if (body.status !== undefined) updateData.status = body.status;

    // Tahfiz Progress Updates
    if (body.currentJuz !== undefined) updateData.currentJuz = Number(body.currentJuz);
    if (body.juzCompleted !== undefined) updateData.juzCompleted = Number(body.juzCompleted);
    if (body.currentSurah !== undefined) updateData.currentSurah = body.currentSurah;
    if (body.currentAyah !== undefined) updateData.currentAyah = Number(body.currentAyah);
    if (body.completedSurahsCount !== undefined) updateData.completedSurahsCount = Number(body.completedSurahsCount);
    if (body.tajweedRating !== undefined) updateData.tajweedRating = Number(body.tajweedRating);
    if (body.sabkiRating !== undefined) updateData.sabkiRating = Number(body.sabkiRating);
    if (body.manzilRating !== undefined) updateData.manzilRating = Number(body.manzilRating);
    if (body.akhlaqRating !== undefined) updateData.akhlaqRating = body.akhlaqRating;

    const updatedStudent = await prisma.student.update({
      where: { id: studentId },
      data: updateData,
    });

    return NextResponse.json({
      message: 'Student updated successfully',
      student: updatedStudent,
    });
  } catch (error: any) {
    console.error('[UPDATE_STUDENT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to update student' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authUser = await getAuthenticatedUser(req);
    const authCheck = enforceRoleAndProgramme(authUser, ['SUPER_ADMIN', 'ADMIN', 'HEADMASTER']);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.reason }, { status: authCheck.status });
    }

    const studentId = params.id;

    // Headmaster Programme Scoping Check
    if (authUser?.role === 'HEADMASTER') {
      const assignedProg = authUser.assignedProgrammeId;
      const student = await prisma.student.findUnique({
        where: { id: studentId },
        include: { schoolClass: true },
      });
      if (student && student.schoolClass.programmeId && assignedProg && student.schoolClass.programmeId !== assignedProg) {
        return NextResponse.json(
          { error: `Access Forbidden (HTTP 403): Headmaster cannot delete students in another programme section.` },
          { status: 403 }
        );
      }
    }

    // Soft delete student by setting deletedAt
    const deletedStudent = await prisma.student.update({
      where: { id: studentId },
      data: {
        deletedAt: new Date(),
        status: 'SUSPENDED',
      },
    });

    // Also deactivate the user account if linked
    if (deletedStudent.userId) {
      await prisma.user.updateMany({
        where: { id: deletedStudent.userId, deletedAt: null },
        data: {
          deletedAt: new Date(),
          status: 'DEACTIVATED',
        },
      });

      await prisma.userSession.updateMany({
        where: { userId: deletedStudent.userId },
        data: { revoked: true },
      });
    }

    return NextResponse.json({
      message: 'Student deleted successfully',
      student: deletedStudent,
    });
  } catch (error: any) {
    console.error('[DELETE_STUDENT_ERROR]', error);
    return NextResponse.json({ error: error.message || 'Failed to delete student' }, { status: 400 });
  }
}
