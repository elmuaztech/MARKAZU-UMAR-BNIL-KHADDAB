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

    const existingTeacher = await prisma.teacher.findFirst({
      where: {
        OR: [{ id: teacherId }, { userId: teacherId }, { email: teacherId }],
        deletedAt: null,
      },
    });

    if (!existingTeacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const realTeacherId = existingTeacher.id;

    const updateData: any = {};
    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.staffNo !== undefined) updateData.staffNo = body.staffNo;
    if (body.email !== undefined) updateData.email = body.email;
    if (body.phone !== undefined) updateData.phone = body.phone;
    if (body.qualification !== undefined) updateData.qualification = body.qualification;
    if (body.specialization !== undefined) updateData.specialization = body.specialization;
    if (body.status !== undefined) updateData.status = body.status;
    if (body.dateJoined !== undefined) updateData.dateJoined = new Date(body.dateJoined);

    const updatedTeacher = await prisma.$transaction(async (tx) => {
      const teacher = await tx.teacher.update({
        where: { id: realTeacherId },
        data: updateData,
      });

      // Also update linked user details if name or email changed
      if (teacher.userId) {
        const userUpdate: any = {};
        if (body.fullName) userUpdate.name = body.fullName;
        if (body.email) userUpdate.email = body.email;
        if (body.staffNo) userUpdate.username = body.staffNo;
        if (body.phone) userUpdate.phone = body.phone;
        if (Object.keys(userUpdate).length > 0) {
          await tx.user.update({
            where: { id: teacher.userId },
            data: userUpdate,
          });
        }
      }

      // Handle class reassignments if provided
      if (body.classesAssigned !== undefined) {
        const rawClasses: string[] = Array.isArray(body.classesAssigned)
          ? body.classesAssigned
          : body.classesAssigned
          ? [body.classesAssigned]
          : [];

        // 1. Delete previous teacher assignments
        await tx.teacherAssignment.deleteMany({
          where: { teacherId: realTeacherId },
        });

        // 2. Clear old classTeacherId on classes previously managed by this teacher
        await tx.schoolClass.updateMany({
          where: { classTeacherId: realTeacherId },
          data: { classTeacherId: null },
        });

        let primaryProgrammeId: string | null = null;

        // 3. Re-assign new classes
        for (const classIdentifier of rawClasses) {
          if (!classIdentifier) continue;

          const schoolClass = await tx.schoolClass.findFirst({
            where: {
              OR: [
                { id: classIdentifier },
                { name: { equals: classIdentifier, mode: 'insensitive' } },
              ],
            },
          });

          if (schoolClass) {
            await tx.schoolClass.update({
              where: { id: schoolClass.id },
              data: { classTeacherId: realTeacherId },
            });

            const progId = schoolClass.programmeId || (Array.isArray(body.programmeIds) ? body.programmeIds[0] : body.programmeIds) || null;
            if (progId) {
              primaryProgrammeId = progId;
              await tx.teacherAssignment.upsert({
                where: {
                  teacherId_programmeId_classId: {
                    teacherId: realTeacherId,
                    programmeId: progId,
                    classId: schoolClass.id,
                  },
                },
                create: {
                  teacherId: realTeacherId,
                  programmeId: progId,
                  classId: schoolClass.id,
                },
                update: {},
              });
            }
          }
        }

        if (primaryProgrammeId && teacher.userId) {
          await tx.user.update({
            where: { id: teacher.userId },
            data: { assignedProgrammeId: primaryProgrammeId },
          });
        }
      }

      return await tx.teacher.findUnique({
        where: { id: realTeacherId },
        include: {
          teacherAssignments: {
            include: {
              schoolClass: true,
              programme: true,
            },
          },
          classesManaged: {
            include: {
              programme: true,
            },
          },
        },
      });
    });

    return NextResponse.json({
      message: 'Teacher profile updated successfully',
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
