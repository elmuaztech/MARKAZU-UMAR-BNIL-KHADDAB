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

    const rawEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : undefined;
    let userCreated = false;
    const tempPassword = body.tempPassword || 'student123';

    const updatedStudent = await prisma.$transaction(async (tx) => {
      let student = await tx.student.update({
        where: { id: studentId },
        data: updateData,
        include: {
          parent: true,
          schoolClass: true,
          user: true,
        },
      });

      // Update Parent / Guardian details if provided
      const guardianPhone = body.guardianPhone || body.parentPhone || body.phone;
      const guardianName = body.guardianName || body.parentName;

      if (student.guardianId && (guardianPhone !== undefined || guardianName !== undefined)) {
        await tx.parent.update({
          where: { id: student.guardianId },
          data: {
            ...(guardianPhone !== undefined ? { phone: guardianPhone.trim() } : {}),
            ...(guardianName !== undefined ? { fullName: guardianName.trim() } : {}),
          },
        }).catch((err) => console.warn('[UPDATE_STUDENT_GUARDIAN_WARN]', err));
      }

      // Handle Student Email & User Account Provisioning
      if (rawEmail !== undefined) {
        if (rawEmail.length > 0) {
          if (student.userId) {
            // Already has a user account: update user details
            await tx.user.update({
              where: { id: student.userId },
              data: {
                email: rawEmail,
                ...(body.fullName ? { name: body.fullName.trim() } : {}),
              },
            }).catch((err) => console.warn('[UPDATE_STUDENT_USER_EMAIL_WARN]', err));
          } else {
            // Student was offline without a user account: create user account now!
            const existingUser = await tx.user.findFirst({
              where: {
                OR: [
                  { email: rawEmail },
                  { username: student.admissionNo },
                ],
              },
            });

            if (existingUser) {
              await tx.student.update({
                where: { id: student.id },
                data: { userId: existingUser.id },
              });
            } else {
              const passHash = body.passwordHash || '$2a$10$wT.L6G2cQkG6K1hK.zYy.O6qQ1.Q2.Q3.Q4';
              const newUser = await tx.user.create({
                data: {
                  username: student.admissionNo,
                  name: body.fullName ? body.fullName.trim() : student.fullName,
                  email: rawEmail,
                  password: passHash,
                  role: 'STUDENT',
                  status: 'ACTIVE',
                  mustChangePassword: true,
                },
              });

              await tx.student.update({
                where: { id: student.id },
                data: { userId: newUser.id },
              });
              userCreated = true;
            }
          }
        }
      } else if (student.userId && body.fullName !== undefined) {
        // Update user name if student is linked to a user account
        await tx.user.update({
          where: { id: student.userId },
          data: { name: body.fullName.trim() },
        }).catch((err) => console.warn('[UPDATE_STUDENT_USER_WARN]', err));
      }

      return await tx.student.findUnique({
        where: { id: studentId },
        include: {
          parent: true,
          schoolClass: true,
          user: true,
        },
      });
    });

    return NextResponse.json({
      message: 'Student updated successfully',
      student: updatedStudent,
      userCreated,
      credentials: userCreated ? { username: updatedStudent?.admissionNo, email: rawEmail, tempPassword } : null,
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
